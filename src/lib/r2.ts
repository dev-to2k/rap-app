import { PutObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DOWNLOAD_TTL_SECONDS } from "./config";

const R2_MARKER_PREFIX = "r2:";

let cachedClient: S3Client | null | undefined;

/** True when private R2 bucket credentials are present (prod Seed should set these). */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim(),
  );
}

function r2Endpoint(): string {
  const explicit = process.env.R2_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2_NOT_CONFIGURED");
  }
  if (cachedClient === undefined) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: r2Endpoint(),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
      },
    });
  }
  return cachedClient!;
}

function bucket(): string {
  return process.env.R2_BUCKET!.trim();
}

/** Store marker in DB: `r2:licenses/{id}.pdf` */
export function toR2Marker(key: string): string {
  const k = key.replace(/^\/+/, "");
  return `${R2_MARKER_PREFIX}${k}`;
}

/** Parse `r2:…` marker → object key, or null if not an R2 marker. */
export function parseR2Marker(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(R2_MARKER_PREFIX)) return null;
  const key = stored.slice(R2_MARKER_PREFIX.length).replace(/^\/+/, "");
  return key || null;
}

/** Strip query/hash so logs never contain the full signed URL. */
export function redactSignedUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}?[redacted]`;
  } catch {
    return "[redacted-url]";
  }
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const client = getClient();
  const objectKey = key.replace(/^\/+/, "");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Mint a private GET URL. Default TTL = DOWNLOAD_TTL_SECONDS (15m).
 * Caller must never log the returned url query string — use redactSignedUrl.
 */
export async function getPresignedGetUrl(
  key: string,
  ttlSeconds: number = DOWNLOAD_TTL_SECONDS,
): Promise<{ url: string; expiresAt: number }> {
  const client = getClient();
  const objectKey = key.replace(/^\/+/, "");
  const ttl = Math.max(30, Math.min(ttlSeconds, 3600));
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: objectKey,
  });
  const url = await getSignedUrl(client, command, { expiresIn: ttl });
  return { url, expiresAt };
}


export async function objectExists(key: string): Promise<boolean> {
  const client = getClient();
  const objectKey = key.replace(/^\/+/, "");
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket(), Key: objectKey }));
    return true;
  } catch {
    return false;
  }
}

export function licensePdfKey(licenseId: string): string {
  return `licenses/${licenseId}.pdf`;
}

export function beatAssetKey(beatId: string, fileKind: "mp3" | "wav" | "stems", ext?: string): string {
  const e =
    ext ||
    (fileKind === "mp3" ? "mp3" : fileKind === "wav" ? "wav" : "zip");
  return `beats/${beatId}/${fileKind}.${e}`;
}
