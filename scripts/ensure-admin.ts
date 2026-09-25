/**
 * Upsert admin without wiping DB.
 * Usage: bunx tsx scripts/ensure-admin.ts
 *
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD when NODE_ENV=production
 * or VERCEL_ENV=production (no default secrets in prod).
 * Local/dev may fall back to admin@rap.app / password123.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function isProdRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim() || (isProdRuntime() ? "" : "admin@rap.app");
  const password = process.env.ADMIN_PASSWORD || (isProdRuntime() ? "" : "password123");
  const name = (process.env.ADMIN_NAME || "").trim() || "Rap Admin";

  if (!email || !password) {
    console.error(
      "Refusing to ensure admin: set ADMIN_EMAIL and ADMIN_PASSWORD (required in production).",
    );
    process.exit(1);
  }
  if (isProdRuntime() && password.length < 12) {
    console.error("Refusing weak ADMIN_PASSWORD in production (min 12 chars).");
    process.exit(1);
  }

  const pw = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", password: pw, name },
    create: { email, name, password: pw, role: "admin" },
  });
  console.log(`Admin ready: ${user.email} (${user.id}) role=${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
