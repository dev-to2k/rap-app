import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, getSession, safeNextPath } from "@/lib/auth";
import { promoteBuyerToProducer } from "@/lib/promote-producer";

export const dynamic = "force-dynamic";

/** Logged-in buyer → producer (DB + session cookie), then back to studio upload. */
export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"), "/studio/upload");
  const session = await getSession();
  const login = new URL(`/login?next=${encodeURIComponent(next)}`, req.nextUrl.origin);
  if (!session) return NextResponse.redirect(login);

  const user = await promoteBuyerToProducer(session.id);
  if (!user) return NextResponse.redirect(login);

  const res = NextResponse.redirect(new URL(next, req.nextUrl.origin), 303);
  return applySessionCookie(res, user);
}
