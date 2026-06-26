import { Request, Response, NextFunction } from "express";
import * as bookingService from "./bookings.service";
import * as emailService from "../emails/email.service";
import { sendSuccess } from "../../utils/response";

export async function createBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.createBooking(req.user!.userId, req.body);

    // For free events — confirmed immediately, send ticket right away
    if (booking.status === "CONFIRMED") {
      const event = booking.ticketType.event;
      const org = event.organization;

      await emailService.sendTicketConfirmation({
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
      await emailService.sendOrganizerNotification({
        to: org.owner.email,
        organizerName: org.owner.name,
        eventTitle: event.title,
        attendeeName: booking.user.name,
        ticketTypeName: booking.ticketType.name,
        quantity: booking.quantity,
        totalAmount: booking.totalAmount,
      });
    }

    sendSuccess(res, booking, "Booking created", 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyBookingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bookings = await bookingService.getMyBookings(req.user!.userId);
    sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function getBookingByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.getBookingById(req.user!.userId, req.params.id as string);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

export async function getEventBookingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bookings = await bookingService.getEventBookings(req.user!.userId, req.params.eventId as string);
    sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function cancelBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await bookingService.cancelBooking(req.user!.userId, req.params.id as string);
    sendSuccess(res, booking, "Booking cancelled");
  } catch (err) {
    next(err);
  }
}
