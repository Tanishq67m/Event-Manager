import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createOrgSchema, updateOrgSchema } from "./organizations.schema";
import {
  createOrgHandler,
  getMyOrgHandler,
  getOrgBySlugHandler,
  updateOrgHandler,
} from "./organizations.controller";

const router = Router();

// Public
router.get("/:slug", getOrgBySlugHandler);

// Protected — organizer only
router.post("/", authenticate, authorize("ORGANIZER", "ADMIN"), validate(createOrgSchema), createOrgHandler);
router.get("/me/profile", authenticate, authorize("ORGANIZER", "ADMIN"), getMyOrgHandler);
router.patch("/me/profile", authenticate, authorize("ORGANIZER", "ADMIN"), validate(updateOrgSchema), updateOrgHandler);

export default router;
