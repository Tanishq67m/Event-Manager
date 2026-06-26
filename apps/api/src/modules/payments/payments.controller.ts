import { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service";
import { sendSuccess } from "../../utils/response";

export async function createOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, error: "bookingId is required" });
      return;
    }
    const order = await paymentsService.createOrder(req.user!.userId, bookingId);
    sendSuccess(res, order, "Order created", 201);
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const booking = await paymentsService.verifyPayment(
      req.user!.userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    sendSuccess(res, booking, "Payment verified, booking confirmed");
  } catch (err) {
    next(err);
  }
}

// Webhook — no auth middleware, Razorpay signs the payload instead
export async function webhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature) {
      res.status(400).json({ success: false, error: "Missing webhook signature" });
      return;
    }
    // req.body is raw Buffer here (configured in app.ts)
    const result = await paymentsService.handleWebhook(req.body as Buffer, signature);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
