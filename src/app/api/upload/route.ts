import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { beatAssetKey, isR2Configured, putObject, toR2Marker } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"]);

function isMp3(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".mp3") || file.type === "audio/mpeg" || file.type === "audio/mp3";
}

function isWav(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".wav") ||
    file.type === "audio/wav" ||
    file.type === "audio/x-wav" ||
    file.type === "audio/wave"
  );
}

function audioOk(file: File): boolean {
  const name = file.name.toLowerCase();
  const okExt = name.endsWith(".mp3") || name.endsWith(".wav");
  return okExt || ALLOWED.has(file.type);
}

function writeLocal(relPosix: string, buf: Buffer) {
  const abs = path.join(process.cwd(), relPosix);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf);
}

/** Catalog preview must be an mp3 the public player can stream (/api/preview). */
async function storeCatalogMp3(beatId: string, buf: Buffer): Promise<string> {
  if (isR2Configured()) {
    const key = beatAssetKey(beatId, "mp3", "mp3");
    await putObject(key, buf, "audio/mpeg");
    return toR2Marker(key);
  }
  // Preview route only serves storage/audio/*.mp3 (not storage/uploads).
  const rel = `storage/audio/${beatId}.mp3`;
  writeLocal(rel, buf);
  return rel;
}

/** WAV master is the unlock file, not the public preview. */
async function storeWavMaster(beatId: string, buf: Buffer): Promise<string> {
  if (isR2Configured()) {
    const key = beatAssetKey(beatId, "wav", "wav");
    await putObject(key, buf, "audio/wav");
    return toR2Marker(key);
  }
  const rel = `storage/uploads/${beatId}.wav`;
  writeLocal(rel, buf);
  return rel;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const user = await requireUser(["producer", "admin"]);
  if (!user) return NextResponse.json({ error: "producer_only" }, { status: 403 });

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const bpm = Number(form.get("bpm") || 120);
  const musicalKey = String(form.get("musicalKey") || "Am");
  const sampleFlag = String(form.get("sampleFlag") || "clean");
  const priceLease = Number(form.get("priceLease") || 199000);
  const priceWav = Number(form.get("priceWav") || 599000);
  const priceExclusive = Number(form.get("priceExclusive") || 3000000);
  const master = form.get("file");
  const preview = form.get("preview");

  if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
  if (!(master instanceof File) || master.size === 0) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!audioOk(master)) {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  const previewFile = preview instanceof File && preview.size > 0 ? preview : null;
  if (previewFile && !isMp3(previewFile)) {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  // Home player only streams mp3 (local storage/audio or r2:*.mp3).
  const catalogFile = previewFile ?? (isMp3(master) ? master : null);
  if (!catalogFile) {
    return NextResponse.json({ error: "need_preview_mp3" }, { status: 400 });
  }

  const catalogBuf = Buffer.from(await catalogFile.arrayBuffer());
  const masterBuf = catalogFile === master ? catalogBuf : Buffer.from(await master.arrayBuffer());

  const beat = await prisma.beat.create({
    data: {
      title,
      audioUrl: "pending",
      wavUrl: null,
      bpm: Number.isFinite(bpm) ? Math.round(bpm) : 120,
      musicalKey,
      sampleFlag: sampleFlag === "uncleared" ? "uncleared" : "clean",
      priceLease: Number.isFinite(priceLease) ? priceLease : 199000,
      priceWav: Number.isFinite(priceWav) ? priceWav : 599000,
      priceExclusive: Number.isFinite(priceExclusive) ? priceExclusive : 3000000,
      // Hidden until the catalog mp3 is stored — home lists status=available only.
      status: "delisted",
      producerId: user.id,
      coverUrl: "/covers/beat1.svg",
    },
  });

  try {
    const audioUrl = await storeCatalogMp3(beat.id, catalogBuf);
    const wavUrl = isWav(master) ? await storeWavMaster(beat.id, masterBuf) : null;
    const published = await prisma.beat.update({
      where: { id: beat.id },
      data: { audioUrl, wavUrl, status: "available" },
    });

    await prisma.auditLog
      .create({
        data: {
          beatId: beat.id,
          action: "beat_uploaded",
          meta: JSON.stringify({ title, catalog: audioUrl.startsWith("r2:") ? "r2" : "local" }),
        },
      })
      .catch(() => undefined);

    return NextResponse.json({ beat: published });
  } catch (err) {
    await prisma.beat.delete({ where: { id: beat.id } }).catch(() => undefined);
    console.error("upload_store_failed", beat.id, err instanceof Error ? err.message : "error");
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}
