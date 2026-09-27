import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolvePreviewMp3 } from "@/lib/preview-audio";
import { prisma } from "@/lib/prisma";
import {
  getPresignedGetUrl,
  isR2Configured,
  parseR2Marker,
} from "@/lib/r2";

/** cuid-ish ids from Prisma @default(cuid()) */
const BEAT_ID_RE = /^[a-z0-9]{20,40}$/i;

/**
 * Preview: local storage/audio/*.mp3 OR r2: marker → short-lived signed redirect.
 * Prefer `path` (Beat.audioUrl). Fallback: `beatId` → lookup audioUrl.
 */
export async function GET(req: NextRequest) {
  let p = req.nextUrl.searchParams.get("path");

  if (!p) {
    const beatId = req.nextUrl.searchParams.get("beatId");
    if (!beatId || !BEAT_ID_RE.test(beatId)) {
      return NextResponse.json({ error: "bad path" }, { status: 400 });
    }
    const beat = await prisma.beat.findUnique({
      where: { id: beatId },
      select: { audioUrl: true },
    });
    if (!beat?.audioUrl) {
      return NextResponse.json({ error: "missing" }, { status: 404 });
    }
    p = beat.audioUrl;
  }

  const r2Key = parseR2Marker(p);
  if (r2Key) {
    if (!isR2Configured()) {
      return NextResponse.json({ error: "r2 not configured" }, { status: 503 });
    }
    if (!r2Key.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json({ error: "bad path" }, { status: 400 });
    }
    try {
      const { url } = await getPresignedGetUrl(r2Key, 300);
      return NextResponse.redirect(url, 302);
    } catch {
      return NextResponse.json({ error: "missing" }, { status: 404 });
    }
  }

  const resolved = resolvePreviewMp3(p);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.reason === "missing" ? "missing" : "bad path" },
      { status: resolved.reason === "missing" ? 404 : 400 },
    );
  }
  const data = fs.readFileSync(resolved.abs);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
