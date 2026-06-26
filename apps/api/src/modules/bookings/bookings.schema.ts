import { z } from "zod";

export const createBookingSchema = z.object({
  ticketTypeId: z.string().uuid("Invalid ticket type ID"),
  quantity: z.number().int().min(1).max(10, "Maximum 10 tickets per booking"),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
