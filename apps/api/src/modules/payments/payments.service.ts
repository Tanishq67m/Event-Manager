import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { env } from "../../config/env";
import { NotFoundError, ValidationError, ForbiddenError, AppError } from "../../utils/AppError";
import { sendTicketConfirmation, sendOrganizerNotification } from "../emails/email.service";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// ── Step 1: Create Razorpay order for a pending booking ───────────────────────

export async function createOrder(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      ticketType: { include: { event: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!booking) throw new NotFoundError("Booking");
  if (booking.userId !== userId) throw new ForbiddenError();
  if (booking.status !== "PENDING") {
    throw new ValidationError(`Booking is already ${booking.status.toLowerCase()}`);
  }

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: booking.totalAmount, // already in paise
    currency: "INR",
    receipt: booking.id,
    notes: {
      bookingId: booking.id,
      eventTitle: booking.ticketType.event.title,
      attendeeName: booking.user.name,
    },
  });

  // Store the Razorpay order ID on the booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: { razorpayOrderId: order.id },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    bookingId: booking.id,
    prefill: {
      name: booking.user.name,
      email: booking.user.email,
    },
  };
}

// ── Step 2: Verify payment signature after frontend payment completion ─────────
//
// Razorpay sends back three values after payment:
//   razorpay_order_id, razorpay_payment_id, razorpay_signature
//
// The signature is HMAC-SHA256(order_id + "|" + payment_id) using key_secret.
// We recompute it server-side and compare. If they match, payment is legit.

export async function verifyPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // Recompute expected signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new AppError("Payment verification failed: invalid signature", 400);
  }

  // Find the booking
  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId },
    include: {
      ticketType: {
        include: {
          event: {
            include: {
              organization: {
                include: { owner: { select: { email: true, name: true } } },
              },
            },
          },
        },
      },
      user: { select: { email: true, name: true } },
    },
  });

  if (!booking) throw new NotFoundError("Booking");
  if (booking.userId !== userId) throw new ForbiddenError();

  // Idempotency — if already confirmed (webhook beat us here), just return it
  if (booking.status === "CONFIRMED") return booking;

  // Mark confirmed
  const confirmedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      paymentId: razorpayPaymentId,
    },
  });

  // Send ticket email
  const event = booking.ticketType.event;
  await sendTicketConfirmation({
    to: booking.user.email,
    attendeeName: booking.user.name,
    eventTitle: event.title,
    eventVenue: event.venue,
    eventDate: new Date(event.startsAt).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }),
    ticketTypeName: booking.ticketType.name,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
    qrCode: booking.qrCode,
    bookingId: booking.id,
  });

  // Notify organizer
  await sendOrganizerNotification({
    to: event.organization.owner.email,
    organizerName: event.organization.owner.name,
    eventTitle: event.title,
    attendeeName: booking.user.name,
    ticketTypeName: booking.ticketType.name,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
  });

  return confirmedBooking;
}

// ── Step 3: Webhook handler — Razorpay fires this async ───────────────────────
//
// This is the safety net. If the user closes the browser after payment but
// before verifyPayment runs, the webhook still confirms the booking.
//
// IMPORTANT: raw body must be passed in (not parsed JSON) for sig verification.

export async function handleWebhook(rawBody: Buffer, signature: string) {
  // Verify webhook signature
  const expectedSig = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    throw new AppError("Webhook signature mismatch", 400);
  }

  const payload = JSON.parse(rawBody.toString());
  const event = payload.event;

  if (event === "payment.captured") {
    await handlePaymentCaptured(payload.payload.payment.entity);
  } else if (event === "payment.failed") {
    await handlePaymentFailed(payload.payload.payment.entity);
  }

  return { received: true };
}

async function handlePaymentCaptured(payment: {
  id: string;
  order_id: string;
  amount: number;
}) {
  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: payment.order_id },
    include: {
      ticketType: {
        include: {
          event: {
            include: {
              organization: {
                include: { owner: { select: { email: true, name: true } } },
              },
            },
          },
        },
      },
      user: { select: { email: true, name: true } },
    },
  });

  if (!booking) {
    console.error("Webhook: booking not found for order", payment.order_id);
    return;
  }

  // Idempotency — already confirmed (verify endpoint beat us here)
  if (booking.status === "CONFIRMED") return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", paymentId: payment.id },
  });

  // Send ticket email
  const event = booking.ticketType.event;
  await sendTicketConfirmation({
    to: booking.user.email,
    attendeeName: booking.user.name,
    eventTitle: event.title,
    eventVenue: event.venue,
    eventDate: new Date(event.startsAt).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }),
    ticketTypeName: booking.ticketType.name,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
    qrCode: booking.qrCode,
    bookingId: booking.id,
  });

  await sendOrganizerNotification({
    to: event.organization.owner.email,
    organizerName: event.organization.owner.name,
    eventTitle: event.title,
    attendeeName: booking.user.name,
    ticketTypeName: booking.ticketType.name,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
  });
}

async function handlePaymentFailed(payment: { order_id: string }) {
  // On payment failure — cancel booking and release the inventory
  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });

  if (!booking || booking.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });
    await tx.ticketType.update({
      where: { id: booking.ticketTypeId },
      data: { soldQuantity: { decrement: booking.quantity } },
    });
  });
}
