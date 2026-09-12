import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredExclusiveReserves } from "@/lib/reserves";
import { isProductionRuntime } from "@/lib/security";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // Fail-closed in production/deploy: missing CRON_SECRET → reject
  if (!secret) {
    if (isProductionRuntime()) return false;
    return true; // local/dev only
  }
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await releaseExpiredExclusiveReserves(15);
  return NextResponse.json({ ok: true, ttlMinutes: 15, ...result });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
