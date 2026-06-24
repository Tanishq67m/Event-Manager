import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Zod validation middleware
 * Usage: router.post("/register", validate(registerSchema), handler)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Pass to global error handler which formats ZodErrors
      return next(result.error);
    }
    req.body = result.data; // replace with parsed+coerced values
    next();
  };
}
