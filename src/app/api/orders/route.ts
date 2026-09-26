import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createMarketplaceOrder, OrderError } from "@/lib/orders";
import { releaseExpiredExclusiveReserves } from "@/lib/reserves";
import { buyerSafeOrder } from "@/lib/buyer-safe-order";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  beatId: z.string().min(1),
  sku: z.enum(["lease", "wav", "exclusive"]),
  paymentMethod: z.enum(["momo", "vnpay", "ck", "payos", "auto"]).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    await releaseExpiredExclusiveReserves(15);
  } catch (e) {
    console.error("releaseExpiredExclusiveReserves", e);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    const order = await createMarketplaceOrder({
      buyerId: user.id,
      beatId: parsed.data.beatId,
      sku: parsed.data.sku,
      paymentMethod: parsed.data.paymentMethod,
    });
    return NextResponse.json({ order: buyerSafeOrder(order as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (e) {
    const code = e instanceof OrderError ? e.code : e instanceof Error ? e.message : "";
    if (code === "EXCLUSIVE_CONFLICT") {
      return NextResponse.json({ error: "EXCLUSIVE_CONFLICT", code: "EXCLUSIVE_CONFLICT" }, { status: 409 });
    }
    if (code === "BEAT_UNAVAILABLE") {
      return NextResponse.json({ error: "Beat unavailable", code: "BEAT_UNAVAILABLE" }, { status: 409 });
    }
    if (code === "EXCLUSIVE_FORBIDDEN_UNCLEARED") {
      return NextResponse.json(
        { error: "Exclusive forbidden for uncleared samples", code: "EXCLUSIVE_FORBIDDEN_UNCLEARED" },
        { status: 400 },
      );
    }
    throw e;
  }
}
