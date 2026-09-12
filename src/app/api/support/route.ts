import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

/** Stub support ticket — logs and returns ticket id */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid", reason_codes: REASON_CODES },
      { status: 400 }
    );
  }
  const ticketId = `SUP-${Date.now()}`;
  console.log("[support stub]", ticketId, parsed.data);
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
