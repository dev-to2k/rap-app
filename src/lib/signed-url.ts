import crypto from "crypto";
import { DOWNLOAD_TTL_SECONDS } from "./config";

function secret() {
  return process.env.DOWNLOAD_HMAC_SECRET || "dev-download-hmac-secret-change-in-prod";
}

export function createDownloadToken(opts: {
  licenseId: string;
  beatId: string;
  sku: string;
  fileKind: "mp3" | "wav" | "stems" | "pdf";
  ttlSeconds?: number;
}): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + (opts.ttlSeconds ?? DOWNLOAD_TTL_SECONDS);
  const payload = [opts.licenseId, opts.beatId, opts.sku, opts.fileKind, String(expiresAt)].join("|");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  return { token, expiresAt };
}

export function verifyDownloadToken(token: string): {
  licenseId: string;
  beatId: string;
  sku: string;
  fileKind: "mp3" | "wav" | "stems" | "pdf";
  expiresAt: number;
} | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    if (parts.length !== 6) return null;
    const [licenseId, beatId, sku, fileKind, expStr, sig] = parts;
    const payload = [licenseId, beatId, sku, fileKind, expStr].join("|");
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
    if (sig !== expected) return null;
    const expiresAt = Number(expStr);
    if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
    if (!["mp3", "wav", "stems", "pdf"].includes(fileKind)) return null;
    return { licenseId, beatId, sku, fileKind: fileKind as "mp3" | "wav" | "stems" | "pdf", expiresAt };
  } catch {
    return null;
  }
}
