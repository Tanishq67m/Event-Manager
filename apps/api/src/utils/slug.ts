import { v4 as uuidv4 } from "uuid";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(text: string): string {
  const base = slugify(text);
  const suffix = uuidv4().split("-")[0]; // short 8-char suffix
  return `${base}-${suffix}`;
}

export function generateQrCode(): string {
  const id = uuidv4().replace(/-/g, "").toUpperCase().slice(0, 10);
  return `EP-${new Date().getFullYear()}-${id}`;
}
