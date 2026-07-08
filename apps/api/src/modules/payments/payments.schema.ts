import { z } from "zod";

export const createOrderSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
});
