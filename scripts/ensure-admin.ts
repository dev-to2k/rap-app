/**
 * Upsert demo admin without wiping DB.
 * Usage: bunx tsx scripts/ensure-admin.ts
 * Default: admin@rap.app / password123
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@rap.app";
  const password = process.env.ADMIN_PASSWORD || "password123";
  const name = process.env.ADMIN_NAME || "Rap Admin";
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
