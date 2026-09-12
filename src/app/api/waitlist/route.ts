import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["buyer", "producer"]).optional().default("buyer"),
  handle: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  await prisma.waitlistSignup.create({
    data: {
      email: parsed.data.email,
      role: parsed.data.role,
      handle: parsed.data.handle || null,
    },
  });
  return NextResponse.json({ ok: true, message: "Da ghi danh waitlist (stub)." });
}
