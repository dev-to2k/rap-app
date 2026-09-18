import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { beatAssetKey, isR2Configured, putObject, toR2Marker } from "@/lib/r2";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"]);

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const bpm = Number(form.get("bpm") || 120);
  const musicalKey = String(form.get("musicalKey") || "Am");
  const sampleFlag = String(form.get("sampleFlag") || "clean");
  const priceLease = Number(form.get("priceLease") || 199000);
  const priceWav = Number(form.get("priceWav") || 599000);
  const priceExclusive = Number(form.get("priceExclusive") || 3000000);
  const file = form.get("file");

  if (!title) return NextResponse.json({ error: "Thiếu tiêu đề" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

  const name = file.name.toLowerCase();
  const okExt = name.endsWith(".mp3") || name.endsWith(".wav");
  if (!okExt && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "File không hỗ trợ. Thử MP3 hoặc WAV." }, { status: 400 });
  }

  const ext = name.endsWith(".wav") ? ".wav" : ".mp3";
  const id = randomUUID();
  const rel = path.join("storage", "uploads", `${id}${ext}`);
  const abs = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(abs, buf);

  const beat = await prisma.beat.create({
    data: {
      title,
      // Keep local path for restricted watermark preview (/api/preview)
      audioUrl: rel,
      wavUrl: ext === ".wav" ? rel : null,
      bpm: Number.isFinite(bpm) ? bpm : 120,
      musicalKey,
      sampleFlag: sampleFlag === "uncleared" ? "uncleared" : "clean",
      priceLease,
      priceWav,
      priceExclusive,
      status: "available",
      producerId: user.id,
      coverUrl: "/covers/beat1.svg",
    },
  });

  // Mirror unlock assets to private R2 (clients only ever get signed URLs)
  if (isR2Configured()) {
    const kind = ext === ".wav" ? ("wav" as const) : ("mp3" as const);
    const key = beatAssetKey(beat.id, kind, ext.replace(".", ""));
    const contentType = ext === ".wav" ? "audio/wav" : "audio/mpeg";
    await putObject(key, buf, contentType);
    if (ext === ".wav") {
      await prisma.beat.update({
        where: { id: beat.id },
        data: { wavUrl: toR2Marker(key) },
      });
    }
  }

  await prisma.auditLog.create({
    data: { beatId: beat.id, action: "beat_uploaded", meta: JSON.stringify({ title }) },
  });

  return NextResponse.json({ beat });
}
