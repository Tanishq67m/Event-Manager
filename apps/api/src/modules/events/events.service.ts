import { prisma } from "../../prisma/client";
import { uniqueSlug } from "../../utils/slug";
import { NotFoundError, ForbiddenError, ValidationError } from "../../utils/AppError";
import { CreateEventInput, UpdateEventInput, ListEventsInput } from "./events.schema";

// ── Public ────────────────────────────────────────────────────────────────────

export async function listPublishedEvents(query: ListEventsInput) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    status: "PUBLISHED" as const,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { venue: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsAt: "asc" },
      include: {
        organization: { select: { name: true, slug: true, logoUrl: true } },
        ticketTypes: {
          select: {
            id: true, name: true, price: true,
            totalQuantity: true, soldQuantity: true,
          },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organization: { select: { name: true, slug: true, logoUrl: true } },
      ticketTypes: true,
    },
  });

  if (!event || event.status !== "PUBLISHED") throw new NotFoundError("Event");
  return event;
}

// ── Organizer ─────────────────────────────────────────────────────────────────

export async function createEvent(userId: string, input: CreateEventInput) {
  // Get this user's organization
  const org = await prisma.organization.findUnique({ where: { ownerId: userId } });
  if (!org) throw new ValidationError("Create an organization before creating events");

  const slug = uniqueSlug(input.title);

  const event = await prisma.event.create({
    data: {
      organizationId: org.id,
      title: input.title,
      slug,
      description: input.description,
      venue: input.venue,
      capacity: input.capacity,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      ticketTypes: {
        create: input.ticketTypes.map((tt) => ({
          name: tt.name,
          description: tt.description ?? null,
          price: tt.price,
          totalQuantity: tt.totalQuantity,
          saleStartsAt: tt.saleStartsAt ? new Date(tt.saleStartsAt) : null,
          saleEndsAt: tt.saleEndsAt ? new Date(tt.saleEndsAt) : null,
        })),
      },
    },
    include: { ticketTypes: true },
  });

  return event;
}

export async function getOrganizerEvents(userId: string) {
  const org = await prisma.organization.findUnique({ where: { ownerId: userId } });
  if (!org) throw new NotFoundError("Organization");

  return prisma.event.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: {
      ticketTypes: {
        select: {
          id: true, name: true, price: true,
          totalQuantity: true, soldQuantity: true,
        },
      },
      _count: { select: { ticketTypes: true } },
    },
  });
}

export async function getOrganizerEventById(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organization: true,
      ticketTypes: true,
      _count: { select: { ticketTypes: true } },
    },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== userId) throw new ForbiddenError();

  return event;
}

export async function updateEvent(userId: string, eventId: string, input: UpdateEventInput) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== userId) throw new ForbiddenError();

  // Can't edit a cancelled event
  if (event.status === "CANCELLED") {
    throw new ValidationError("Cannot edit a cancelled event");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.venue ? { venue: input.venue } : {}),
      ...(input.capacity ? { capacity: input.capacity } : {}),
      ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
      ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    include: { ticketTypes: true },
  });
}

export async function publishEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true, ticketTypes: true },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== userId) throw new ForbiddenError();
  if (event.ticketTypes.length === 0) {
    throw new ValidationError("Add at least one ticket type before publishing");
  }
  if (event.status !== "DRAFT") {
    throw new ValidationError(`Event is already ${event.status.toLowerCase()}`);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status: "PUBLISHED" },
    include: { ticketTypes: true },
  });
}

export async function deleteEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organization: true },
  });

  if (!event) throw new NotFoundError("Event");
  if (event.organization.ownerId !== userId) throw new ForbiddenError();
  if (event.status === "PUBLISHED") {
    throw new ValidationError("Unpublish the event before deleting it");
  }

  await prisma.event.delete({ where: { id: eventId } });
}
