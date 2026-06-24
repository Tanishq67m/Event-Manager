import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/AppError";
import { prisma } from "../prisma/client";


export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    // Quick check the user still exists (catches deleted accounts)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new UnauthorizedError("User no longer exists");

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
    ) {
      next(new UnauthorizedError("Invalid or expired token"));
    } else {
      next(err);
    }
  }
}
