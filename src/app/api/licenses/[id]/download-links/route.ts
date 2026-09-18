import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  assertMintAllowed,
  clientDownloadError,
  mintDownloadLinks,
} from "@/lib/download-mint";
import { DOWNLOAD_TTL_SECONDS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Mint (or renew) signed download links for a license.
 * Gate: order status === unlocked (not mere paid), not frozen, session buyer owner.
 * Unpublished/delisted beat does NOT block renew for already-unlocked orders.
 */
async function mint(req: NextRequest, id: string) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const license = await prisma.license.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!license) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = assertMintAllowed(license, user.id);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const links = await mintDownloadLinks(license);
    const ttlSeconds = DOWNLOAD_TTL_SECONDS;
    return NextResponse.json({
      links,
      ttlSeconds,
      // Convenience: soonest expiry across links (for UI "Hết hạn sau Xm")
      expiresAt: links.length ? Math.min(...links.map((l) => l.expiresAt)) : null,
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "error";
    console.error("download_links_mint_failed", code);
    return NextResponse.json(clientDownloadError(code), { status: 503 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return mint(req, params.id);
}

/** Explicit renew — same mint path (TTL refresh / retry after expiry). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return mint(req, params.id);
}
