import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredExclusiveReserves } from "@/lib/reserves";
import { isProductionRuntime } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Any Vercel deploy (preview/production) or NODE_ENV=production → require CRON_SECRET. */
function isDeployedRuntime(): boolean {
  if (isProductionRuntime()) return true;
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "preview" || vercelEnv === "development") return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Fail-closed on every Vercel/deployed env; local only stays open
    if (isDeployedRuntime()) return false;
    return true;
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
