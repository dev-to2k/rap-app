import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const beats = await prisma.beat.findMany({
    where: { status: "available" },
    include: { producer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ beats });
}
