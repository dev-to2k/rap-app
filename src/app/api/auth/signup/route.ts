import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySessionCookie, hashPassword } from "@/lib/auth";
import { clientIp, durableRateLimit } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const email = parsed.data.email.toLowerCase().trim();
  const name = parsed.data.name.trim();

  const ipOk = await durableRateLimit(`signup:ip:${ip}`, 10, 60_000);
  const emailOk = await durableRateLimit(`signup:email:${email}`, 3, 60_000);
  if (!ipOk || !emailOk) {
    return NextResponse.json(
      { error: "Too many signup attempts" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email đã được dùng" }, { status: 409 });
  }

  const password = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password,
      role: "buyer",
    },
  });

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "buyer" as const,
  };
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  return applySessionCookie(res, sessionUser);
}
