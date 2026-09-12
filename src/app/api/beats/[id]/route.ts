import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const beat = await prisma.beat.findUnique({
    where: { id: params.id },
    include: { producer: { select: { id: true, name: true } } },
  });
  if (!beat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ beat });
}
