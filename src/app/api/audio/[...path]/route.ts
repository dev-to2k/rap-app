import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolvePreviewMp3 } from "@/lib/preview-audio";

/** Serve local storage audio for preview — ONLY .mp3 under storage/audio/ */
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = params.path.join("/");
  const resolved = resolvePreviewMp3(rel.startsWith("storage/") ? rel : `storage/${rel}`);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.reason === "missing" ? "not found" : "bad path" },
      { status: resolved.reason === "missing" ? 404 : 400 }
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
