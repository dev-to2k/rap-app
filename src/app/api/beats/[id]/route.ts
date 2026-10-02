import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSeedCatalogBeat } from "@/lib/seed-catalog";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const beat = await prisma.beat.findUnique({
    where: { id: params.id },
    include: { producer: { select: { id: true, name: true, email: true } } },
  });
  if (!beat || isSeedCatalogBeat(beat)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    beat: {
      ...beat,
      producer: { id: beat.producer.id, name: beat.producer.name },
    },
  });
}
