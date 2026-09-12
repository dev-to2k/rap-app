import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "rap-app", db: "up" });
  } catch (e) {
    return NextResponse.json({ ok: false, service: "rap-app", db: "down", error: String(e) }, { status: 503 });
  }
}
