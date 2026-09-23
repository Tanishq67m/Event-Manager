// Test data for Verdict's browser checks (see .verdict.yml).
//
// Creates, idempotently:
//   - a test attendee (VERDICT_TEST_EMAIL / VERDICT_TEST_PASSWORD)
//   - an organizer + organization that own the test events
//   - "Verdict Demo Night": free, 40 seats, published
//   - "Verdict Sold Out Night": free, 1 seat, already booked by the organizer (sold out)
//
// Intended for the throwaway database in CI. It refuses to run unless VERDICT_SEED=1, so it
// can't be pointed at a real database by accident.
//
//   VERDICT_SEED=1 DATABASE_URL=... VERDICT_TEST_EMAIL=... VERDICT_TEST_PASSWORD=... node scripts/seed-verdict.mjs

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { PrismaClient } = prismaPkg;

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`seed-verdict: ${name} is required`);
    process.exit(1);
  }
  return v;
}

if (process.env.VERDICT_SEED !== "1") {
  console.error("seed-verdict: refusing to run without VERDICT_SEED=1 (this script is for throwaway test databases)");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: required("DATABASE_URL") });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);

const DAY = 24 * 60 * 60 * 1000;
const startsAt = new Date(Date.now() + 30 * DAY);
const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);

async function upsertUser(email, password, name, role) {
  const passwordHash = await bcrypt.hash(password, rounds);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role, emailVerified: true },
    create: { email, passwordHash, name, role, emailVerified: true },
  });
}

async function upsertEvent(organizationId, slug, title, seats) {
  const existing = await prisma.event.findUnique({ where: { slug }, include: { ticketTypes: true } });
  if (existing) return existing;
  return prisma.event.create({
    data: {
      organizationId,
      slug,
      title,
      description: `${title}: test event used by Verdict's browser checks.`,
      venue: "Pune",
      capacity: seats,
      status: "PUBLISHED",
      startsAt,
      endsAt,
      ticketTypes: { create: [{ name: "General Admission", description: "Free entry", price: 0, totalQuantity: seats }] },
    },
    include: { ticketTypes: true },
  });
}

async function main() {
  const attendee = await upsertUser(required("VERDICT_TEST_EMAIL"), required("VERDICT_TEST_PASSWORD"), "Verdict Tester", "ATTENDEE");
  const organizerPassword = process.env.VERDICT_ORGANIZER_PASSWORD || randomBytes(18).toString("base64url");
  const organizer = await upsertUser("verdict-organizer@example.com", organizerPassword, "Verdict Organizer", "ORGANIZER");

  const org = await prisma.organization.upsert({
    where: { ownerId: organizer.id },
    update: {},
    create: { ownerId: organizer.id, name: "Verdict Test Org", slug: "verdict-test-org", description: "Owns Verdict's test events" },
  });

  const demo = await upsertEvent(org.id, "verdict-demo-night", "Verdict Demo Night", 40);
  const soldOut = await upsertEvent(org.id, "verdict-sold-out-night", "Verdict Sold Out Night", 1);

  // Sell the only Sold Out Night seat to the organizer (once).
  const soldOutTicket = soldOut.ticketTypes[0];
  if (soldOutTicket && soldOutTicket.soldQuantity < soldOutTicket.totalQuantity) {
    await prisma.$transaction([
      prisma.booking.create({
        data: {
          userId: organizer.id,
          ticketTypeId: soldOutTicket.id,
          status: "CONFIRMED",
          quantity: 1,
          totalAmount: 0,
          qrCode: `VERDICT-SEED-${randomBytes(6).toString("hex")}`,
        },
      }),
      prisma.ticketType.update({ where: { id: soldOutTicket.id }, data: { soldQuantity: soldOutTicket.totalQuantity } }),
    ]);
  }

  console.log(
    `seed-verdict: attendee ${attendee.email}; events "${demo.title}" (${demo.ticketTypes[0]?.totalQuantity} seats) and "${soldOut.title}" (sold out)`,
  );
}

main()
  .catch((err) => {
    console.error("seed-verdict failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
