
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import orgRoutes from "./modules/organizations/organizations.routes";
import eventRoutes from "./modules/events/events.routes";
import bookingRoutes from "./modules/bookings/bookings.routes";
import paymentRoutes from "./modules/payments/payments.routes";
import checkinRoutes from "./modules/checkin/checkin.routes";

const app = express();

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many auth attempts, please try again later" },
});

app.use(limiter);

// ── Body parsing ───────────────────────────────────────────────────────────────
// Webhook MUST receive raw body for Razorpay HMAC verification — mount before json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "EventPulse API running",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/checkin", checkinRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global error handler — must be last ───────────────────────────────────────
app.use(errorHandler);

export default app;
