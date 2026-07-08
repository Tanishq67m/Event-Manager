import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { prisma } from "../../prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
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
  ValidationError,
} from "../../utils/AppError";
import { 
  RegisterInput, 
  LoginInput, 
  ForgotPasswordInput, 
  ResetPasswordInput, 
  VerifyEmailInput 
} from "./auth.schema";

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
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as "ATTENDEE" | "ORGANIZER",
      emailVerificationToken,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  // TODO: Send Verification Email here

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
  let payload: { userId: string; tokenId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token expired or already used");
  }

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

// ── Authentication Completeness Flows ─────────────────────────────────────────

export async function verifyEmail(input: VerifyEmailInput) {
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: input.token },
  });

  if (!user) throw new ValidationError("Invalid or expired verification token");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  });

  return { success: true, message: "Email verified successfully" };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    // Silently return success to prevent email enumeration
    return { success: true, message: "If that email exists, a reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: expiresAt,
    },
  });

  // TODO: Send Password Reset Email here
  logger.info(`[Auth] Password reset token generated for ${user.email}: ${resetToken}`);

  return { success: true, message: "If that email exists, a reset link has been sent." };
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: input.token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) throw new ValidationError("Invalid or expired reset token");

  const passwordHash = await bcrypt.hash(input.newPassword, parseInt(env.BCRYPT_ROUNDS));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  // Invalidate all existing refresh tokens so active sessions are killed
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return { success: true, message: "Password reset successfully" };
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function issueTokens(userId: string, email: string, role: string) {
  const tokenId = uuidv4();

  const accessToken = signAccessToken({ userId, email, role });
  const refreshToken = signRefreshToken({ userId, tokenId });

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
