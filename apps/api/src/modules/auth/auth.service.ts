import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../prisma/client";
import { env } from "../../config/env";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../../utils/jwt";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../utils/AppError";
import { RegisterInput, LoginInput } from "./auth.schema";

function sanitizeUser(user: { id: string; email: string; name: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, parseInt(env.BCRYPT_ROUNDS));

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as "ATTENDEE" | "ORGANIZER",
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const tokens = await issueTokens(user.id, user.email, user.role);

  return { user: sanitizeUser(user), tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, createdAt: true },
  });

  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const tokens = await issueTokens(user.id, user.email, user.role);

  return {
    user: sanitizeUser({ ...user }),
    tokens,
  };
}

export async function refresh(token: string) {
  // Verify JWT signature first
  let payload: { userId: string; tokenId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Then check the token exists in DB (rotation check)
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token expired or already used");
  }

  // Rotate: delete old, issue new pair
  await prisma.refreshToken.delete({ where: { token } });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError("User");

  const tokens = await issueTokens(user.id, user.email, user.role);
  return { user: sanitizeUser(user), tokens };
}

export async function logout(token: string) {
  // Silently succeed even if token not found (idempotent logout)
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError("User");
  return sanitizeUser(user);
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function issueTokens(userId: string, email: string, role: string) {
  const tokenId = uuidv4();

  const accessToken = signAccessToken({ userId, email, role });
  const refreshToken = signRefreshToken({ userId, tokenId });

  // Persist refresh token so we can rotate / revoke it
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
}
