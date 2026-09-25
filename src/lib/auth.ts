import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSessionSecret, sessionCookieSecure, timingSafeEqualStr } from "./security";

export const SESSION_COOKIE = "rap_session";
const COOKIE = SESSION_COOKIE;
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function secret() {
  return getSessionSecret();
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type UserRole = "buyer" | "producer" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: SessionUser): string {
  const body = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!timingSafeEqualStr(sign(body), sig)) return null;
  try {
    const user = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!user?.id || !user?.email || !user?.role) return null;
    return user as SessionUser;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: sessionCookieSecure(),
    maxAge,
  };
}

function cookieBase() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: sessionCookieSecure(),
  };
}

/** Attach session Set-Cookie on a Route Handler response (reliable on Next 14). */
export function applySessionCookie(res: NextResponse, user: SessionUser): NextResponse {
  res.cookies.set(COOKIE, createSessionToken(user), sessionCookieOptions(SESSION_MAX_AGE));
  return res;
}

export function applyClearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}

export async function setSession(user: SessionUser) {
  const token = createSessionToken(user);
  cookies().set(COOKIE, token, {
    ...cookieBase(),
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  cookies().set(COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function requireUser(roles?: UserRole[]) {
  const session = await getSession();
  if (!session) return null;
  const db = await prisma.user.findUnique({ where: { id: session.id } });
  if (!db) return null;
  const role = db.role as UserRole;
  if (roles && !roles.includes(role)) return null;
  return {
    id: db.id,
    email: db.email,
    name: db.name,
    role,
  };
}

/**
 * Same-origin relative path only — blocks open redirects after login/signup.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
