import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  verifyEmailSchema 
} from "./auth.schema";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
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

// POST /auth/verify-email
router.post("/verify-email", validate(verifyEmailSchema), verifyEmailHandler);

// POST /auth/forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordHandler);

// POST /auth/reset-password
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

export default router;
