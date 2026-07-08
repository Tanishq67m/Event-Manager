import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    logger.warn({ details: err.flatten().fieldErrors }, "Validation failed");
    return res.status(422).json({
      success: false,
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    logger.warn({ message: err.message, statusCode: err.statusCode }, "AppError");
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Prisma unique constraint violation
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  ) {
    logger.warn("Prisma unique constraint violation");
    return res.status(409).json({
      success: false,
      error: "A record with this value already exists",
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(env.NODE_ENV === "development" ? { stack: (err as Error).stack } : {}),
  });
}
