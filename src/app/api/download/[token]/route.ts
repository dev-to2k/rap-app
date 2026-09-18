import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/signed-url";
import { prisma } from "@/lib/prisma";
import { generateLicensePdf, resolveLicensePdfPath } from "@/lib/pdf";
import { isR2Configured, parseR2Marker, redactSignedUrl } from "@/lib/r2";
import { resolveR2RedirectUrl } from "@/lib/download-mint";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const parsed = verifyDownloadToken(params.token);
  if (!parsed) {
    return NextResponse.json(
      { error: "Link expired or invalid — renew from Library" },
      { status: 403 },
    );
  }

  const license = await prisma.license.findUnique({
    where: { id: parsed.licenseId },
    include: { order: true, buyer: true },
  });
  // Security: unlocked only (not mere paid); frozen (failed) blocks
  if (!license || license.order.status === "failed") {
    return NextResponse.json({ error: "Download unavailable" }, { status: 403 });
  }
  if (license.order.status !== "unlocked") {
    return NextResponse.json({ error: "Chưa thanh toán — file chưa mở." }, { status: 403 });
  }

  // Prefer private R2 signed URL (no public/raw path to client)
  if (isR2Configured()) {
    const redirect = await resolveR2RedirectUrl(license, parsed.fileKind);
    if (redirect) {
      // Never log full signed query string
      console.info("download_r2_redirect", parsed.fileKind, redactSignedUrl(redirect.url));
      return NextResponse.redirect(redirect.url, 302);
    }
    return NextResponse.json(
      { error: "Download temporarily unavailable — try renew" },
      { status: 503 },
    );
  }

  // Local/dev fallback when R2 env unset
  const beat = await prisma.beat.findUnique({ where: { id: parsed.beatId } });
  if (!beat && parsed.fileKind !== "pdf") {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  let fileRel: string | null = null;
  let contentType = "application/octet-stream";
  let filename = "file";

  if (parsed.fileKind === "pdf") {
    fileRel = license.pdfPath;
    contentType = "application/pdf";
    filename = `license-${license.id}.pdf`;
    if (fileRel && parseR2Marker(fileRel)) {
      return NextResponse.json(
        { error: "R2 required for this file — configure R2 env" },
        { status: 503 },
      );
    }
    if (fileRel) {
      let absPdf = resolveLicensePdfPath(fileRel, license.id);
      if (!fs.existsSync(absPdf)) {
        const fullBeat = await prisma.beat.findUnique({
          where: { id: license.beatId },
          include: { producer: true },
        });
        const buyer = license.buyer;
        if (fullBeat && buyer) {
          const marker = await generateLicensePdf({
            licenseId: license.id,
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            producerName: fullBeat.producer.name,
            beatTitle: fullBeat.title,
            sku: license.sku,
            amountVnd: license.order.amountVnd,
            sampleFlag: fullBeat.sampleFlag,
            orderId: license.orderId,
          });
          await prisma.license.update({ where: { id: license.id }, data: { pdfPath: marker } });
          fileRel = marker;
          if (parseR2Marker(marker)) {
            const redirect = await resolveR2RedirectUrl(
              { ...license, pdfPath: marker },
              "pdf",
            );
            if (redirect) return NextResponse.redirect(redirect.url, 302);
          }
          absPdf = resolveLicensePdfPath(marker, license.id);
        }
      }
    }
  } else if (parsed.fileKind === "mp3") {
    fileRel = beat!.audioUrl;
    contentType = "audio/mpeg";
    filename = `${beat!.title}.mp3`;
  } else if (parsed.fileKind === "wav") {
    if (license.sku === "lease") {
      return NextResponse.json({ error: "SKU không có WAV" }, { status: 403 });
    }
    fileRel = beat!.wavUrl || beat!.audioUrl;
    contentType = "audio/wav";
    filename = `${beat!.title}.wav`;
  } else if (parsed.fileKind === "stems") {
    if (license.sku === "lease") {
      return NextResponse.json({ error: "SKU không có stems" }, { status: 403 });
    }
    fileRel = beat!.stemsUrl || beat!.wavUrl || beat!.audioUrl;
    contentType = "application/zip";
    filename = `${beat!.title}-stems.zip`;
  }

  if (!fileRel) return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  if (parseR2Marker(fileRel)) {
    return NextResponse.json(
      { error: "R2 required for this file — configure R2 env" },
      { status: 503 },
    );
  }

  const abs =
    parsed.fileKind === "pdf"
      ? resolveLicensePdfPath(fileRel, license.id)
      : path.isAbsolute(fileRel)
        ? fileRel
        : path.join(process.cwd(), fileRel);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "File unavailable" }, { status: 404 });

  const data = fs.readFileSync(abs);
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
