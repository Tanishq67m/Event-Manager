import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(res: Response, error: string, statusCode = 400, details?: unknown) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {}),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return res.status(200).json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
