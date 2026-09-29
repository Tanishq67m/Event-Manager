import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { bannerSignatureHandler } from "./uploads.controller";

const router = Router();

// POST /uploads/banner-signature — signed params for a direct browser → Cloudinary upload
router.post("/banner-signature", authenticate, authorize("ORGANIZER", "ADMIN"), bannerSignatureHandler);

export default router;
