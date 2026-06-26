import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
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
router.post("/order", authenticate, createOrderHandler);

// POST /payments/verify  — verify payment signature after checkout
router.post("/verify", authenticate, verifyPaymentHandler);

export default router;
