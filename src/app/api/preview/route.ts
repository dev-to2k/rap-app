import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Local preview stream for listed beats — path must stay under storage/ */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path");
  if (!p || p.includes("..") || !p.startsWith("storage/")) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const abs = path.join(process.cwd(), p);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "missing" }, { status: 404 });
  const data = fs.readFileSync(abs);
  const type = p.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
  return new NextResponse(data, {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" },
  });
}
