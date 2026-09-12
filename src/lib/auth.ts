import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "rap_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-session-secret-change-in-prod-min-32chars";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "producer";
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
  if (sign(body) !== sig) return null;
  try {
    const user = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!user?.id || !user?.email || !user?.role) return null;
    return user as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const token = createSessionToken(user);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function requireUser(roles?: Array<"buyer" | "producer">) {
  const user = await getSession();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  const db = await prisma.user.findUnique({ where: { id: user.id } });
  if (!db) return null;
  return user;
}
