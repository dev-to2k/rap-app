import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/signed-url";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const parsed = verifyDownloadToken(params.token);
  if (!parsed) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });

  const license = await prisma.license.findUnique({
    where: { id: parsed.licenseId },
    include: { order: true, buyer: true },
  });
  if (!license || license.order.status !== "unlocked") {
    return NextResponse.json({ error: "Chưa thanh toán — file chưa mở." }, { status: 403 });
  }

  const beat = await prisma.beat.findUnique({ where: { id: parsed.beatId } });
  if (!beat) return NextResponse.json({ error: "Beat missing" }, { status: 404 });

  let fileRel: string | null = null;
  let contentType = "application/octet-stream";
  let filename = "file";

  if (parsed.fileKind === "pdf") {
    fileRel = license.pdfPath;
    contentType = "application/pdf";
    filename = `license-${license.id}.pdf`;
  } else if (parsed.fileKind === "mp3") {
    fileRel = beat.audioUrl;
    contentType = "audio/mpeg";
    filename = `${beat.title}.mp3`;
  } else if (parsed.fileKind === "wav") {
    if (license.sku === "lease") {
      return NextResponse.json({ error: "SKU không có WAV" }, { status: 403 });
    }
    fileRel = beat.wavUrl || beat.audioUrl;
    contentType = "audio/wav";
    filename = `${beat.title}.wav`;
  } else if (parsed.fileKind === "stems") {
    if (license.sku === "lease") {
      return NextResponse.json({ error: "SKU không có stems" }, { status: 403 });
    }
    fileRel = beat.stemsUrl || beat.wavUrl || beat.audioUrl;
    contentType = "application/zip";
    filename = `${beat.title}-stems.zip`;
  }

  if (!fileRel) return NextResponse.json({ error: "File missing" }, { status: 404 });
  const abs = path.isAbsolute(fileRel) ? fileRel : path.join(process.cwd(), fileRel);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "File not on disk" }, { status: 404 });

  const data = fs.readFileSync(abs);
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
