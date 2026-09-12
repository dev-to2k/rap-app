import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolvePreviewMp3 } from "@/lib/preview-audio";

/** Local preview stream — ONLY .mp3 under storage/audio/ */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path");
  if (!p) return NextResponse.json({ error: "bad path" }, { status: 400 });
  const resolved = resolvePreviewMp3(p);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.reason === "missing" ? "missing" : "bad path" },
      { status: resolved.reason === "missing" ? 404 : 400 }
    );
  }
  const data = fs.readFileSync(resolved.abs);
  return new NextResponse(data, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
  });
}
