import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredExclusiveReserves } from "@/lib/reserves";
import { expireUnpaidOrders } from "@/lib/payment-ttl";
import { PAYOS_PAYMENT_TTL_MINUTES } from "@/lib/payos";
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
  const reserves = await releaseExpiredExclusiveReserves(15);
  const payments = await expireUnpaidOrders(PAYOS_PAYMENT_TTL_MINUTES);
  return NextResponse.json({
    ok: true,
    exclusiveReserveTtlMinutes: 15,
    paymentTtlMinutes: PAYOS_PAYMENT_TTL_MINUTES,
    ...reserves,
    expiredOrderIds: payments.expiredOrderIds,
    paymentReleasedBeatIds: payments.releasedBeatIds,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
