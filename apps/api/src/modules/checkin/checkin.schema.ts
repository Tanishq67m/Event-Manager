import { z } from "zod";

export const scanQrSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  eventId: z.string().uuid("Invalid event ID"),
});
