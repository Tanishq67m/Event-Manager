import crypto from "crypto";
import { env } from "../../config/env";
import { AppError, ValidationError } from "../../utils/AppError";

// Banners are uploaded by the browser straight to Cloudinary. The API only signs the upload,
// so the secret never leaves the server and image bytes never pass through Express.

const FOLDER = "eventpulse/banners";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

export function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/** Cloudinary signature: SHA-1 of the alphabetically sorted params joined with "&", followed by the API secret. */
function sign(params: Record<string, string | number>) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + env.CLOUDINARY_API_SECRET).digest("hex");
}

export function createBannerUploadSignature() {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      "Image uploads aren't configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      503
    );
  }
  const params = {
    allowed_formats: ALLOWED_FORMATS,
    folder: FOLDER,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder: params.folder,
    allowedFormats: params.allowed_formats,
    timestamp: params.timestamp,
    signature: sign(params),
  };
}

/**
 * Only accept banner URLs that point at this account's Cloudinary uploads, so an event page
 * can't be made to load arbitrary third-party images. `null` clears the banner.
 */
export function assertBannerUrl(url: string | null | undefined) {
  if (url === undefined || url === null) return;
  const prefix = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  if (!env.CLOUDINARY_CLOUD_NAME || !url.startsWith(prefix)) {
    throw new ValidationError("Banner image must be uploaded through EventPulse");
  }
}
