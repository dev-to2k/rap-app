import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveUploadedAudio } from "@/lib/audio-stub";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const beats = await prisma.beat.findMany({
    where: {
      status: "available",
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { musicalKey: { contains: q } },
              { producer: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { producer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ beats });
}

const uploadSchema = z.object({
  title: z.string().min(2),
  bpm: z.coerce.number().int().min(40).max(300),
  musicalKey: z.string().min(1),
  sampleFlag: z.enum(["clean", "uncleared"]),
  priceLease: z.coerce.number().int().min(1000),
  priceWav: z.coerce.number().int().min(1000),
  priceExclusive: z.coerce.number().int().min(1000),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(["producer"]);
  if (!user) return NextResponse.json({ error: "Producer login required" }, { status: 401 });

  const form = await req.formData();
  const parsed = uploadSchema.safeParse({
    title: form.get("title"),
    bpm: form.get("bpm"),
    musicalKey: form.get("musicalKey"),
    sampleFlag: form.get("sampleFlag"),
    priceLease: form.get("priceLease"),
    priceWav: form.get("priceWav"),
    priceExclusive: form.get("priceExclusive"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Audio file required" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const audioUrl = saveUploadedAudio(file.name || "beat.mp3", buf);

  const beat = await prisma.beat.create({
    data: {
      ...parsed.data,
      audioUrl,
      wavUrl: audioUrl,
      stemsUrl: audioUrl,
      coverUrl: "/covers/beat1.svg",
      producerId: user.id,
      status: "available",
    },
  });

  await prisma.auditLog.create({
    data: {
      beatId: beat.id,
      action: "beat_published",
      meta: JSON.stringify({ producerId: user.id, title: beat.title }),
    },
  });

  return NextResponse.json({ beat }, { status: 201 });
}
