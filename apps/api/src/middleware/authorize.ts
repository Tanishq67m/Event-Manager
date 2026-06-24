import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/AppError";

/**
 * RBAC middleware — use after authenticate
 * Usage: router.get("/admin/stuff", authenticate, authorize("ADMIN"), handler)
 *        router.get("/org/stuff", authenticate, authorize("ORGANIZER", "ADMIN"), handler)
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access restricted to: ${roles.join(", ")}`));
    }
    next();
  };
}
