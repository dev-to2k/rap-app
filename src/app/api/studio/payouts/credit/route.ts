import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { creditOrderPayable, PayoutError } from "@/lib/payouts";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
});

/** Credit one order's payableVnd after payableAt. Idempotent reject if already credited. */
export async function POST(req: NextRequest) {
  const user = await requireUser(["producer"]);
  if (!user) return NextResponse.json({ error: "Cần đăng nhập producer" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const result = await creditOrderPayable(parsed.data.orderId, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const code = e instanceof PayoutError ? e.code : "ERROR";
    const status =
      code === "FORBIDDEN" || code === "ORDER_NOT_FOUND"
        ? 404
        : code === "ALREADY_CREDITED"
          ? 409
          : code === "WITHDRAW_TOO_EARLY" || code === "NOT_PAYABLE"
            ? 400
            : 500;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), code },
      { status },
    );
  }
}
