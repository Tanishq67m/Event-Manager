import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
} from "./auth.controller";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), registerHandler);

// POST /auth/login
router.post("/login", validate(loginSchema), loginHandler);

// POST /auth/refresh  — get new access+refresh token pair
router.post("/refresh", validate(refreshSchema), refreshHandler);

// POST /auth/logout  — invalidate refresh token
router.post("/logout", validate(refreshSchema), logoutHandler);

// GET /auth/me  — get current user (protected)
router.get("/me", authenticate, getMeHandler);

export default router;
