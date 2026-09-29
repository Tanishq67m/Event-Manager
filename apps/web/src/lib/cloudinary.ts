/**
 * Add a Cloudinary delivery transformation to an uploaded image URL, e.g.
 * cld(url, "c_fill,g_auto,w_800,h_450,f_auto,q_auto"). Non-Cloudinary URLs are returned unchanged.
 */
export function cld(url: string, transform: string): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const [head, tail] = url.split(marker);
  return `${head}${marker}${transform}/${tail}`;
}

export const BANNER_CARD = "c_fill,g_auto,w_800,h_450,f_auto,q_auto";
export const BANNER_HERO = "c_fill,g_auto,w_1600,h_686,f_auto,q_auto";
