import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Serve local storage audio for preview (stub — use CDN/R2 signed URLs in prod) */
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = params.path.join("/");
  if (rel.includes("..")) return NextResponse.json({ error: "bad path" }, { status: 400 });
  const filePath = path.join(process.cwd(), "storage", rel);
  if (!filePath.startsWith(path.join(process.cwd(), "storage"))) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const data = fs.readFileSync(filePath);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
