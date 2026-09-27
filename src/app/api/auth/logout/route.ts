import { NextRequest, NextResponse } from "next/server";
import { applyClearSessionCookie, safeNextPath } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";
  let rawNext: string | null = req.nextUrl.searchParams.get("next");
  try {
    const fd = await req.formData();
    const fromForm = fd.get("next");
    if (typeof fromForm === "string" && fromForm) rawNext = fromForm;
  } catch {
    /* no body */
  }
  const dest = safeNextPath(rawNext, "/");
  const res = NextResponse.redirect(new URL(dest, base), 303);
  return applyClearSessionCookie(res);
}
