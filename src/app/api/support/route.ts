import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REASON_CODES = [
  "PAYMENT_ISSUE",
  "DOWNLOAD_FAILED",
  "EXCLUSIVE_CONFLICT",
  "WRONG_SKU",
  "OTHER",
] as const;

const schema = z.object({
  orderId: z.string().min(1),
  reason_code: z.enum(REASON_CODES),
  message: z.string().max(2000).optional(),
});

/** Support ticket — requires login; writes auditLog. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid", reason_codes: REASON_CODES },
      { status: 400 }
    );
  }
  const ticketId = `SUP-${Date.now()}`;
  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  await prisma.auditLog.create({
    data: {
      beatId: order?.beatId ?? null,
      action: "support_ticket",
      meta: JSON.stringify({
        ticketId,
        orderId: parsed.data.orderId,
        reason_code: parsed.data.reason_code,
        userId: user.id,
      }),
    },
  });
  console.log("[support]", ticketId, parsed.data.orderId, parsed.data.reason_code, user.id);
  return NextResponse.json({
    ok: true,
    ticketId,
    orderId: parsed.data.orderId,
    reason_code: parsed.data.reason_code,
    message: "Đã nhận ticket (stub). Team sẽ liên hệ.",
  });
}

export async function GET() {
  return NextResponse.json({ reason_codes: REASON_CODES });
}
