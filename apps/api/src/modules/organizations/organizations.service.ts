import { prisma } from "../../prisma/client";
import { uniqueSlug } from "../../utils/slug";
import { ConflictError, NotFoundError, ForbiddenError } from "../../utils/AppError";
import { CreateOrgInput, UpdateOrgInput } from "./organizations.schema";

export async function createOrganization(userId: string, input: CreateOrgInput) {
  // One organization per organizer account
  const existing = await prisma.organization.findUnique({ where: { ownerId: userId } });
  if (existing) throw new ConflictError("You already have an organization");

  const slug = uniqueSlug(input.name);

  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      ownerId: userId,
    },
  });

  return org;
}

export async function getMyOrganization(userId: string) {
  const org = await prisma.organization.findUnique({
    where: { ownerId: userId },
    include: { _count: { select: { events: true } } },
  });
  if (!org) throw new NotFoundError("Organization");
  return org;
}

export async function getOrganizationBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startsAt: "asc" },
        include: { ticketTypes: true },
      },
    },
  });
  if (!org) throw new NotFoundError("Organization");
  return org;
}

export async function updateOrganization(userId: string, input: UpdateOrgInput) {
  const org = await prisma.organization.findUnique({ where: { ownerId: userId } });
  if (!org) throw new NotFoundError("Organization");
  if (org.ownerId !== userId) throw new ForbiddenError();

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });

  return updated;
}
