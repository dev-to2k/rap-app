import { NextRequest, NextResponse } from "next/server";
import { applyClearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";
  const res = NextResponse.redirect(new URL("/", base));
  return applyClearSessionCookie(res);
}
