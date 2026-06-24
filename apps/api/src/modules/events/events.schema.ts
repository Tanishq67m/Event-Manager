import { z } from "zod";

const ticketTypeSchema = z.object({
  name: z.string().min(1, "Ticket type name required").max(100),
  description: z.string().max(300).optional(),
  price: z.number().int().min(0, "Price cannot be negative"), // paise
  totalQuantity: z.number().int().min(1, "Must have at least 1 ticket"),
  saleStartsAt: z.string().datetime().optional(),
  saleEndsAt: z.string().datetime().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  venue: z.string().min(3, "Venue is required").max(300),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  startsAt: z.string().datetime("Invalid start date"),
  endsAt: z.string().datetime("Invalid end date"),
  ticketTypes: z
    .array(ticketTypeSchema)
    .min(1, "At least one ticket type is required"),
}).refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
  message: "End date must be after start date",
  path: ["endsAt"],
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  venue: z.string().min(3).max(300).optional(),
  capacity: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ENDED", "CANCELLED"]).optional(),
});

export const listEventsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ENDED", "CANCELLED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsInput = z.infer<typeof listEventsSchema>;
