import fs from "fs";
import path from "path";

/** Local file storage stub — document R2/S3 swap for prod */
export function resolveStoragePath(rel: string): string {
  if (rel.startsWith("/") && !rel.startsWith("/storage")) {
    // public asset
    return path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  }
  return path.join(process.cwd(), rel);
}

export function ensureUploadDir() {
  const dir = path.join(process.cwd(), "storage", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveUploadedAudio(filename: string, data: Buffer): string {
  const dir = ensureUploadDir();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(dir, `${Date.now()}-${safe}`);
  fs.writeFileSync(dest, data);
  return path.relative(process.cwd(), dest);
}
