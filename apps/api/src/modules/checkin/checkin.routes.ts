import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { scanQrSchema } from "./checkin.schema";
import { scanQrHandler, getAnalyticsHandler, exportAttendeesHandler } from "./checkin.controller";

const router = Router();

// All check-in routes are organizer-only
router.use(authenticate, authorize("ORGANIZER", "ADMIN"));

// POST /checkin/scan              — scan a QR code, validate, mark attended
router.post("/scan", validate(scanQrSchema), scanQrHandler);

// GET  /checkin/analytics/:eventId — full dashboard stats for an event
router.get("/analytics/:eventId", getAnalyticsHandler);

// GET  /checkin/export/:eventId    — download attendee CSV
router.get("/export/:eventId", exportAttendeesHandler);

export default router;
