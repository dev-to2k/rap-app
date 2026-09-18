import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { createDownloadToken } from "./signed-url";
import { DOWNLOAD_TTL_SECONDS } from "./config";
import { resolveLicensePdfPath, generateLicensePdf } from "./pdf";
import {
  beatAssetKey,
  getPresignedGetUrl,
  isR2Configured,
  licensePdfKey,
  objectExists,
  parseR2Marker,
  putObject,
  redactSignedUrl,
  toR2Marker,
} from "./r2";

export type FileKind = "mp3" | "wav" | "stems" | "pdf";

export type MintLink = {
  fileKind: FileKind;
  url: string;
  expiresAt: number;
};

type LicenseWithOrder = {
  id: string;
  buyerId: string;
  beatId: string;
  sku: string;
  pdfPath: string | null;
  orderId: string;
  order: {
    id: string;
    status: string;
    amountVnd: number;
    buyerId: string;
  };
};

/** Gate: unlocked (not mere paid) AND not frozen AND session is buyer owner. */
export function assertMintAllowed(
  license: LicenseWithOrder,
  userId: string,
): { ok: true } | { ok: false; status: number; error: string } {
  if (license.buyerId !== userId || license.order.buyerId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }
  if (license.order.status === "failed") {
    return { ok: false, status: 403, error: "Order frozen" };
  }
  if (license.order.status !== "unlocked") {
    return { ok: false, status: 403, error: "Not unlocked" };
  }
  return { ok: true };
}

export function kindsForSku(sku: string): FileKind[] {
  if (sku === "lease") return ["mp3", "pdf"];
  if (sku === "wav" || sku === "exclusive") return ["mp3", "wav", "stems", "pdf"];
  return ["pdf"];
}

function contentTypeFor(kind: FileKind): string {
  if (kind === "pdf") return "application/pdf";
  if (kind === "mp3") return "audio/mpeg";
  if (kind === "wav") return "audio/wav";
  return "application/zip";
}

function localAbs(stored: string): string {
  if (path.isAbsolute(stored)) return stored;
  return path.join(process.cwd(), stored);
}

/**
 * Ensure PDF bytes live in R2 when configured; return object key.
 * Regenerates from DB fields if /tmp ephemeral copy is gone.
 * Unpublished beat status must NOT block this (Library renew).
 */
async function ensurePdfInR2(license: LicenseWithOrder): Promise<string> {
  const key = licensePdfKey(license.id);
  const existing = parseR2Marker(license.pdfPath);
  if (existing) return existing;

  let abs: string | null = null;
  if (license.pdfPath && !parseR2Marker(license.pdfPath)) {
    abs = resolveLicensePdfPath(license.pdfPath, license.id);
    if (!fs.existsSync(abs)) abs = null;
  }

  if (!abs) {
    const beat = await prisma.beat.findUnique({
      where: { id: license.beatId },
      include: { producer: true },
    });
    const buyer = await prisma.user.findUnique({ where: { id: license.buyerId } });
    if (!beat || !buyer) throw new Error("ASSET_MISSING");
    const marker = await generateLicensePdf({
      licenseId: license.id,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      producerName: beat.producer.name,
      beatTitle: beat.title,
      sku: license.sku,
      amountVnd: license.order.amountVnd,
      sampleFlag: beat.sampleFlag,
      orderId: license.orderId,
    });
    // generateLicensePdf uploads to R2 when configured
    const parsed = parseR2Marker(marker);
    if (parsed) {
      await prisma.license.update({ where: { id: license.id }, data: { pdfPath: marker } });
      return parsed;
    }
    abs = resolveLicensePdfPath(marker, license.id);
    await prisma.license.update({ where: { id: license.id }, data: { pdfPath: marker } });
  }

  const bytes = fs.readFileSync(abs!);
  await putObject(key, bytes, "application/pdf");
  const marker = toR2Marker(key);
  await prisma.license.update({ where: { id: license.id }, data: { pdfPath: marker } });
  return key;
}

/**
 * Resolve beat asset into R2 (lazy upload from local path).
 * Does not require beat to be published/available.
 */
async function ensureBeatAssetInR2(
  beat: { id: string; audioUrl: string; wavUrl: string | null; stemsUrl: string | null; title: string },
  fileKind: "mp3" | "wav" | "stems",
): Promise<string> {
  let stored: string | null = null;
  if (fileKind === "mp3") stored = beat.audioUrl;
  else if (fileKind === "wav") stored = beat.wavUrl || beat.audioUrl;
  else stored = beat.stemsUrl || beat.wavUrl || beat.audioUrl;

  if (!stored) throw new Error("ASSET_MISSING");

  const existing = parseR2Marker(stored);
  if (existing) return existing;

  // Deterministic private key — keep local audioUrl for watermark preview
  const extGuess = path.extname(stored).replace(/^\./, "") || (fileKind === "stems" ? "zip" : fileKind);
  const key = beatAssetKey(beat.id, fileKind, extGuess);
  if (await objectExists(key)) return key;

  const abs = localAbs(stored);
  if (!fs.existsSync(abs)) throw new Error("ASSET_MISSING");

  const bytes = fs.readFileSync(abs);
  await putObject(key, bytes, contentTypeFor(fileKind));

  // WAV/stems are unlock-only — safe to store R2 marker. MP3 preview stays on local path.
  if (fileKind === "wav") {
    await prisma.beat.update({ where: { id: beat.id }, data: { wavUrl: toR2Marker(key) } });
  } else if (fileKind === "stems") {
    await prisma.beat.update({ where: { id: beat.id }, data: { stemsUrl: toR2Marker(key) } });
  }
  return key;
}

async function mintViaR2(
  license: LicenseWithOrder,
  fileKind: FileKind,
): Promise<MintLink> {
  let key: string;
  if (fileKind === "pdf") {
    key = await ensurePdfInR2(license);
  } else {
    if (fileKind === "wav" || fileKind === "stems") {
      if (license.sku === "lease") throw new Error("SKU_FORBIDDEN");
    }
    const beat = await prisma.beat.findUnique({ where: { id: license.beatId } });
    if (!beat) throw new Error("ASSET_MISSING");
    key = await ensureBeatAssetInR2(beat, fileKind);
  }

  try {
    const { url, expiresAt } = await getPresignedGetUrl(key, DOWNLOAD_TTL_SECONDS);
    return { fileKind, url, expiresAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "mint_failed";
    console.error("r2_presign_failed", msg);
    throw new Error("MINT_FAILED");
  }
}

function mintViaAppToken(license: LicenseWithOrder, fileKind: FileKind): MintLink {
  const { token, expiresAt } = createDownloadToken({
    licenseId: license.id,
    beatId: license.beatId,
    sku: license.sku,
    fileKind,
    ttlSeconds: DOWNLOAD_TTL_SECONDS,
  });
  return {
    fileKind,
    url: `/api/download/${token}`,
    expiresAt,
  };
}

/** Mint one download link — R2 signed URL when configured, else app HMAC token path. */
export async function mintDownloadLink(
  license: LicenseWithOrder,
  fileKind: FileKind,
): Promise<MintLink> {
  if (fileKind === "wav" || fileKind === "stems") {
    if (license.sku === "lease") throw new Error("SKU_FORBIDDEN");
  }
  if (isR2Configured()) {
    return mintViaR2(license, fileKind);
  }
  return mintViaAppToken(license, fileKind);
}

export async function mintDownloadLinks(license: LicenseWithOrder): Promise<MintLink[]> {
  const kinds = kindsForSku(license.sku);
  const links: MintLink[] = [];
  for (const fileKind of kinds) {
    try {
      links.push(await mintDownloadLink(license, fileKind));
    } catch (e) {
      const code = e instanceof Error ? e.message : "error";
      if (code === "SKU_FORBIDDEN") continue;
      console.error("mint_link_failed", fileKind, code === "MINT_FAILED" ? code : "error");
      throw e;
    }
  }
  return links;
}

/** Safe error body for clients — never includes bucket/key/signed query. */
export function clientDownloadError(code: string): { error: string } {
  if (code === "ASSET_MISSING") return { error: "File unavailable" };
  if (code === "SKU_FORBIDDEN") return { error: "SKU does not include this file" };
  if (code === "MINT_FAILED" || code === "R2_NOT_CONFIGURED") {
    return { error: "Download temporarily unavailable — try renew" };
  }
  return { error: "Download failed" };
}

/** For token download route: resolve R2 redirect target without leaking URL to logs. */
export async function resolveR2RedirectUrl(
  license: LicenseWithOrder,
  fileKind: FileKind,
): Promise<{ url: string; expiresAt: number } | null> {
  if (!isR2Configured()) return null;
  try {
    const link = await mintViaR2(license, fileKind);
    return { url: link.url, expiresAt: link.expiresAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("r2_redirect_failed", fileKind, msg);
    return null;
  }
}

export function logRedactedUrl(label: string, url: string) {
  console.info(label, redactSignedUrl(url));
}
