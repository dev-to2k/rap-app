import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession, verifyPassword } from "@/lib/auth";
import { clientIp, durableRateLimit } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const email = parsed.data.email.toLowerCase().trim();

  // Durable (Neon) — in-memory Map fails on Vercel serverless isolates
  const ipOk = await durableRateLimit(`login:ip:${ip}`, 30, 60_000);
  const pairOk = await durableRateLimit(`login:ipemail:${ip}:${email}`, 5, 60_000);
  if (!ipOk || !pairOk) {
    return NextResponse.json(
      { error: "Too many login attempts" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 401 });
  }
  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "buyer" | "producer" | "admin",
  });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
