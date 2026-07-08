import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createOrderSchema, verifyPaymentSchema } from "./payments.schema";
import {
  createOrderHandler,
  verifyPaymentHandler,
  webhookHandler,
} from "./payments.controller";

const router = Router();

// POST /payments/webhook
// Must come BEFORE any json body-parser middleware touches it.
// Raw body is preserved in app.ts via express.raw() for this path.
router.post("/webhook", webhookHandler);

// POST /payments/order   — create Razorpay order for a pending booking
router.post("/order", authenticate, validate(createOrderSchema), createOrderHandler);

// POST /payments/verify  — verify payment signature after checkout
router.post("/verify", authenticate, validate(verifyPaymentSchema), verifyPaymentHandler);

export default router;
