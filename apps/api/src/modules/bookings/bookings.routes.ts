import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createBookingSchema } from "./bookings.schema";
import {
  createBookingHandler,
  getMyBookingsHandler,
  getBookingByIdHandler,
  getEventBookingsHandler,
  cancelBookingHandler,
} from "./bookings.controller";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// POST   /bookings              — create a booking (triggers SELECT FOR UPDATE)
router.post("/", validate(createBookingSchema), createBookingHandler);

// GET    /bookings/my           — attendee's own bookings
router.get("/my", getMyBookingsHandler);

// GET    /bookings/:id          — single booking detail
router.get("/:id", getBookingByIdHandler);

// DELETE /bookings/:id/cancel   — cancel a booking + release inventory
router.delete("/:id/cancel", cancelBookingHandler);

// GET    /bookings/event/:eventId — organizer view: all confirmed bookings for an event
router.get(
  "/event/:eventId",
  authorize("ORGANIZER", "ADMIN"),
  getEventBookingsHandler
);

export default router;
