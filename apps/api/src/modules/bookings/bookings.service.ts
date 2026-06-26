import { prisma } from "../../prisma/client";
import { generateQrCode } from "../../utils/slug";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  AppError,
} from "../../utils/AppError";
import { CreateBookingInput } from "./bookings.schema";

export async function createBooking(userId: string, input: CreateBookingInput) {
  const booking = await prisma.$transaction(async (tx) => {
    
    const ticketType = await tx.$queryRaw<
      Array<{
        id: string;
        event_id: string;
        name: string;
        price: number;
        total_quantity: number;
        sold_quantity: number;
        sale_starts_at: Date | null;
        sale_ends_at: Date | null;
      }>
    >`
      SELECT
        id,
        "eventId" AS event_id,
        name,
        price,
        "totalQuantity" AS total_quantity,
        "soldQuantity" AS sold_quantity,
        "saleStartsAt" AS sale_starts_at,
        "saleEndsAt" AS sale_ends_at
      FROM "TicketType"
      WHERE id = ${input.ticketTypeId}
      FOR UPDATE
    `;

    if (ticketType.length === 0) throw new NotFoundError("Ticket type");

    const tt = ticketType[0];
    const now = new Date();

    // STEP 2: Validate sale window
    if (tt.sale_starts_at && now < tt.sale_starts_at) {
      throw new ValidationError("Ticket sales haven't started yet");
    }
    if (tt.sale_ends_at && now > tt.sale_ends_at) {
      throw new ValidationError("Ticket sales have ended");
    }

    // STEP 3: Check availability INSIDE the lock
    const remainingSeats = tt.total_quantity - tt.sold_quantity;
    if (remainingSeats < input.quantity) {
      throw new AppError(
        remainingSeats === 0
          ? "This ticket type is sold out"
          : `Only ${remainingSeats} ticket(s) remaining`,
        409
      );
    }

    // STEP 4: Verify the event is still published
    const event = await tx.event.findUnique({
      where: { id: tt.event_id },
      select: { id: true, status: true, endsAt: true },
    });
    if (!event || event.status !== "PUBLISHED") {
      throw new ValidationError("This event is no longer accepting registrations");
    }
    if (new Date(event.endsAt) < now) {
      throw new ValidationError("This event has already ended");
    }

    // STEP 5: Check user doesn't already have a confirmed booking for this ticket type
    const existingBooking = await tx.booking.findFirst({
      where: {
        userId,
        ticketTypeId: input.ticketTypeId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existingBooking) {
      throw new ConflictError("You already have a booking for this ticket type");
    }

    const totalAmount = tt.price * input.quantity;
    const qrCode = generateQrCode();

    // STEP 6: Create the booking record
    const newBooking = await tx.booking.create({
      data: {
        userId,
        ticketTypeId: input.ticketTypeId,
        quantity: input.quantity,
        totalAmount,
        qrCode,
        status: tt.price === 0 ? "CONFIRMED" : "PENDING",
        // Free tickets are confirmed immediately; paid tickets await payment
      },
      include: {
        ticketType: {
          include: {
            event: {
              include: {
                organization: { include: { owner: { select: { email: true, name: true } } } },
              },
            },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    // STEP 7: Increment soldQuantity atomically inside the same transaction
    await tx.ticketType.update({
      where: { id: input.ticketTypeId },
      data: { soldQuantity: { increment: input.quantity } },
    });

    return newBooking;
  });

  return booking;
}

// ── Get bookings for logged-in attendee ───────────────────────────────────────

export async function getMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      ticketType: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              venue: true,
              bannerUrl: true,
              startsAt: true,
              endsAt: true,
              status: true,
              organization: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });
}

// ── Get single booking ────────────────────────────────────────────────────────

export async function getBookingById(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      ticketType: {
        include: {
          event: {
            include: {
              organization: { select: { name: true, slug: true } },
            },
          },
        },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!booking) throw new NotFoundError("Booking");
  if (booking.userId !== userId) throw new ForbiddenError();

  return booking;
}

// ── Organizer: get all bookings for an event ──────────────────────────────────

export async function getEventBookings(userId: string, eventId: string) {
  // Verify ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true },
  });
  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== userId) throw new ForbiddenError();

  return prisma.booking.findMany({
    where: {
      ticketType: { eventId },
      status: { in: ["CONFIRMED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ticketType: { select: { id: true, name: true, price: true } },
    },
  });
}

// ── Cancel booking ────────────────────────────────────────────────────────────

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { ticketType: true },
  });

  if (!booking) throw new NotFoundError("Booking");
  if (booking.userId !== userId) throw new ForbiddenError();
  if (booking.status === "CANCELLED") {
    throw new ValidationError("Booking is already cancelled");
  }
  if (booking.status === "REFUNDED") {
    throw new ValidationError("Booking has already been refunded");
  }
  if (booking.checkedIn) {
    throw new ValidationError("Cannot cancel a booking that has already been checked in");
  }

  // Use a transaction to cancel + release inventory atomically
  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    await tx.ticketType.update({
      where: { id: booking.ticketTypeId },
      data: { soldQuantity: { decrement: booking.quantity } },
    });

    return cancelled;
  });

  return updated;
}

