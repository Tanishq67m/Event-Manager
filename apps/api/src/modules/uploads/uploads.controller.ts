import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { createBannerUploadSignature } from "./uploads.service";

export async function bannerSignatureHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, createBannerUploadSignature());
  } catch (err) {
    next(err);
  }
}
