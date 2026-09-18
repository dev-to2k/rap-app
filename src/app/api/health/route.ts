import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        service: "rap-app",
        db: "down",
        r2: isR2Configured(),
        error: "DATABASE_URL empty — set Neon URL on Vercel Production+Preview and redeploy",
      },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "rap-app",
      db: "up",
      r2: isR2Configured(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, service: "rap-app", db: "down", error: String(e) },
      { status: 503 }
    );
  }
}
