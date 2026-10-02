export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  // Preview and local keep demo seed. Production deploy uses the app DATABASE_URL.
  if (process.env.VERCEL_ENV !== "production") return;
  try {
    const { hasDatabaseUrl, prisma } = await import("@/lib/prisma");
    if (!hasDatabaseUrl()) return;
    const { unlistProductionSeedCatalog } = await import("@/lib/seed-catalog");
    await unlistProductionSeedCatalog(prisma as never);
  } catch {
    // Never log the error object — Prisma messages can echo the connection string.
    console.error("seed_catalog_cleanup_failed");
  }
}
