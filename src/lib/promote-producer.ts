import { prisma } from "./prisma";
import type { SessionUser, UserRole } from "./auth";

const ROLES: readonly UserRole[] = ["buyer", "producer", "admin"];

/** buyer becomes producer. producer and admin stay as they are. */
export function roleAfterBuyerPromote(role: UserRole): UserRole {
  return role === "buyer" ? "producer" : role;
}

function asRole(role: string): UserRole | null {
  return (ROLES as readonly string[]).includes(role) ? (role as UserRole) : null;
}

function toSession(row: { id: string; email: string; name: string; role: string }): SessionUser | null {
  const role = asRole(row.role);
  if (!role) return null;
  return { id: row.id, email: row.email, name: row.name, role };
}

/**
 * Persist buyer → producer. The update is guarded with role=buyer so admin is never overwritten.
 * producer and admin are returned unchanged. Missing user → null.
 */
export async function promoteBuyerToProducer(userId: string): Promise<SessionUser | null> {
  const db = await prisma.user.findUnique({ where: { id: userId } });
  if (!db) return null;
  const role = asRole(db.role);
  if (!role) return null;
  if (role !== "buyer") {
    return { id: db.id, email: db.email, name: db.name, role };
  }

  const updated = await prisma.user.updateMany({
    where: { id: userId, role: "buyer" },
    data: { role: "producer" },
  });
  if (updated.count === 0) {
    const again = await prisma.user.findUnique({ where: { id: userId } });
    if (!again) return null;
    return toSession(again);
  }
  return { id: db.id, email: db.email, name: db.name, role: "producer" };
}
