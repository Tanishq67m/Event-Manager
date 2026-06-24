import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
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
    return res.status(409).json({
      success: false,
      error: "A record with this value already exists",
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(env.NODE_ENV === "development" ? { stack: (err as Error).stack } : {}),
  });
}
