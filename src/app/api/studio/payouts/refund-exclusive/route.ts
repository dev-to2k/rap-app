import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { refundExclusiveWithinDisputeWindow, RefundError } from "@/lib/refunds";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
});

/** Exclusive refund within 48h dispute → freeze (failed), payableAt null — not payable. */
export async function POST(req: NextRequest) {
  const user = await requireUser(["producer", "buyer"]);
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const order = await refundExclusiveWithinDisputeWindow(parsed.data.orderId, {
      id: user.id,
      role: user.role,
    });
    return NextResponse.json({ ok: true, order, code: "EXCLUSIVE_REFUNDED_FROZEN" });
  } catch (e) {
    const code = e instanceof RefundError ? e.code : "ERROR";
    const status =
      code === "ORDER_NOT_FOUND" || code === "FORBIDDEN"
        ? 404
        : code === "DISPUTE_WINDOW_CLOSED" ||
            code === "NOT_REFUNDABLE" ||
            code === "NOT_EXCLUSIVE" ||
            code === "ALREADY_CREDITED"
          ? 400
          : 500;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), code },
      { status },
    );
  }
}
