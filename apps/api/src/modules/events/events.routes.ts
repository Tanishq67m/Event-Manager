import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createEventSchema, updateEventSchema } from "./events.schema";
import {
  listEventsHandler,
  getPublicEventHandler,
  createEventHandler,
  getOrganizerEventsHandler,
  getOrganizerEventByIdHandler,
  updateEventHandler,
  publishEventHandler,
  deleteEventHandler,
} from "./events.controller";

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────────
// GET /events               — browse all published events (paginated, searchable)
router.get("/", listEventsHandler);

// GET /events/:slug         — public event detail page
router.get("/:slug", getPublicEventHandler);

// ── Organizer routes ───────────────────────────────────────────────────────────
// GET    /events/manage/all         — list organizer's own events
router.get(
  "/manage/all",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  getOrganizerEventsHandler
);

// GET    /events/manage/:id         — get one event (organizer view, full detail)
router.get(
  "/manage/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  getOrganizerEventByIdHandler
);

// POST   /events                    — create event + ticket types
router.post(
  "/",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validate(createEventSchema),
  createEventHandler
);

// PATCH  /events/manage/:id         — edit event fields
router.patch(
  "/manage/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validate(updateEventSchema),
  updateEventHandler
);

// POST   /events/manage/:id/publish — publish a draft
router.post(
  "/manage/:id/publish",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  publishEventHandler
);

// DELETE /events/manage/:id         — delete a draft event
router.delete(
  "/manage/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  deleteEventHandler
);

export default router;
