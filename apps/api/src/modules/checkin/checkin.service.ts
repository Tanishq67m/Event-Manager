import { prisma } from "../../prisma/client";
import { NotFoundError, ForbiddenError, ValidationError } from "../../utils/AppError";

// ── Scan QR code at event entry ───────────────────────────────────────────────

export async function scanQrCode(organizerUserId: string, qrCode: string) {
  // 1. Find the booking by QR
  const booking = await prisma.booking.findUnique({
    where: { qrCode },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ticketType: {
        include: {
          event: {
            include: { organization: true },
          },
        },
      },
    },
  });

  if (!booking) {
    return {
      valid: false,
      reason: "QR code not found",
      qrCode,
    };
  }

  // 2. Verify the scanner is the organizer of this event
  const event = booking.ticketType.event;
  if (event.organization.ownerId !== organizerUserId) {
    throw new ForbiddenError("You are not the organizer of this event");
  }

  // 3. Check booking status
  if (booking.status !== "CONFIRMED") {
    return {
      valid: false,
      reason: `Booking is ${booking.status.toLowerCase()} — not confirmed`,
      attendee: booking.user.name,
      ticketType: booking.ticketType.name,
      qrCode,
    };
  }

  // 4. Duplicate scan check
  if (booking.checkedIn) {
    return {
      valid: false,
      reason: "Already checked in",
      attendee: booking.user.name,
      ticketType: booking.ticketType.name,
      checkedInAt: booking.checkedInAt,
      qrCode,
    };
  }

  // 5. Mark as checked in
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  return {
    valid: true,
    message: "Check-in successful",
    attendee: booking.user.name,
    email: booking.user.email,
    ticketType: booking.ticketType.name,
    quantity: booking.quantity,
    checkedInAt: updated.checkedInAt,
    qrCode,
  };
}

// ── Organizer dashboard analytics ─────────────────────────────────────────────

export async function getEventAnalytics(organizerUserId: string, eventId: string) {
  // Verify ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organization: true,
      ticketTypes: true,
    },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== organizerUserId) throw new ForbiddenError();

  // Aggregate bookings
  const bookings = await prisma.booking.findMany({
    where: { ticketType: { eventId } },
    include: {
      ticketType: { select: { id: true, name: true, price: true } },
    },
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const checkedIn = confirmed.filter((b) => b.checkedIn);
  const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);

  // Per-ticket breakdown
  const ticketBreakdown = event.ticketTypes.map((tt) => {
    const ttBookings = confirmed.filter((b) => b.ticketTypeId === tt.id);
    const ttRevenue = ttBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    return {
      ticketTypeId: tt.id,
      name: tt.name,
      price: tt.price,
      sold: tt.soldQuantity,
      total: tt.totalQuantity,
      remaining: tt.totalQuantity - tt.soldQuantity,
      revenue: ttRevenue,
      checkedIn: ttBookings.filter((b) => b.checkedIn).length,
    };
  });

  // Recent check-ins (last 10)
  const recentCheckIns = await prisma.booking.findMany({
    where: {
      ticketType: { eventId },
      checkedIn: true,
    },
    orderBy: { checkedInAt: "desc" },
    take: 10,
    include: {
      user: { select: { name: true, email: true } },
      ticketType: { select: { name: true } },
    },
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue,
      startsAt: event.startsAt,
      status: event.status,
      capacity: event.capacity,
    },
    summary: {
      totalRegistrations: confirmed.length,
      checkedInCount: checkedIn.length,
      totalRevenue, // paise
      totalRevenueFormatted: `₹${(totalRevenue / 100).toFixed(2)}`,
      checkInRate:
        confirmed.length > 0
          ? Math.round((checkedIn.length / confirmed.length) * 100)
          : 0,
      capacityUsed:
        event.capacity > 0
          ? Math.round((confirmed.length / event.capacity) * 100)
          : 0,
    },
    ticketBreakdown,
    recentCheckIns: recentCheckIns.map((b) => ({
      attendeeName: b.user.name,
      email: b.user.email,
      ticketType: b.ticketType.name,
      checkedInAt: b.checkedInAt,
    })),
  };
}

// ── Get attendee list (for CSV export) ───────────────────────────────────────

export async function getAttendeeList(organizerUserId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== organizerUserId) throw new ForbiddenError();

  const bookings = await prisma.booking.findMany({
    where: {
      ticketType: { eventId },
      status: "CONFIRMED",
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      ticketType: { select: { name: true, price: true } },
    },
  });

  return bookings.map((b, i) => ({
    "#": i + 1,
    name: b.user.name,
    email: b.user.email,
    ticketType: b.ticketType.name,
    quantity: b.quantity,
    amountPaid: `₹${(b.totalAmount / 100).toFixed(2)}`,
    qrCode: b.qrCode,
    checkedIn: b.checkedIn ? "Yes" : "No",
    checkedInAt: b.checkedInAt
      ? new Date(b.checkedInAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "",
    bookedAt: new Date(b.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  }));
}
