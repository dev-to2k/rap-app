/**
 * Exact demo catalog identities from prisma/seed.ts.
 * Match title + audio path + producer email together. Never match by title alone.
 */
export const SEED_PRODUCER_EMAILS = ["producer@rap.app", "minhprod@rap.app"] as const;
/** Demo buyer created by prisma/seed.ts. Not the admin account. */
export const SEED_BUYER_EMAIL = "buyer@rap.app";

export const SEED_BEATS = [
  { title: "Saigon Nights Type Beat", audioUrl: "storage/audio/type-beat-1.mp3" },
  { title: "Hanoi Drill", audioUrl: "storage/audio/type-beat-2.mp3" },
  { title: "Mekong Melodic", audioUrl: "storage/audio/type-beat-3.mp3" },
  { title: "District 7 Trap", audioUrl: "storage/audio/type-beat-4.mp3" },
  { title: "Pho Lo-Fi Loop", audioUrl: "storage/audio/type-beat-5.mp3" },
] as const;

export function isProductionSeedBlocked(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
}

export function isSeedCatalogBeat(beat: {
  title: string;
  audioUrl: string;
  producerEmail?: string | null;
  producer?: { email?: string | null } | null;
}): boolean {
  const email = (beat.producerEmail ?? beat.producer?.email ?? "").trim().toLowerCase();
  if (!(SEED_PRODUCER_EMAILS as readonly string[]).includes(email)) return false;
  return SEED_BEATS.some((row) => row.title === beat.title && row.audioUrl === beat.audioUrl);
}

/** Prisma where fragment: hide exact seed beats from the public catalog. */
export function excludeSeedCatalogWhere() {
  return {
    NOT: {
      OR: SEED_BEATS.map((row) => ({
        title: row.title,
        audioUrl: row.audioUrl,
        producer: { email: { in: [...SEED_PRODUCER_EMAILS] } },
      })),
    },
  };
}

export type SeedCleanupPlan = "delete" | "delist";

/** Delete only when every order buyer is the demo buyer (or there are no orders). */
export function planSeedBeatCleanup(orderBuyerEmails: string[]): SeedCleanupPlan {
  const foreign = orderBuyerEmails.some(
    (email) => email.trim().toLowerCase() !== SEED_BUYER_EMAIL,
  );
  return foreign ? "delist" : "delete";
}

type OrderRow = { id: string; buyer: { email: string } };
type BeatRow = { id: string; title: string; audioUrl: string; producerId: string };

export type SeedCleanupDb = {
  user: {
    findMany: (args: {
      where: { email: { in: string[] } };
      select: { id: true; email: true };
    }) => Promise<Array<{ id: string; email: string }>>;
    findUnique: (args: {
      where: { email: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  beat: {
    findMany: (args: {
      where: {
        producerId: { in: string[] };
        OR: Array<{ title: string; audioUrl: string }>;
      };
      select: { id: true; title: true; audioUrl: true; producerId: true };
    }) => Promise<BeatRow[]>;
    update: (args: { where: { id: string }; data: { status: "delisted" } }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
    count: (args: { where: { producerId: string } }) => Promise<number>;
  };
  order: {
    findMany: (args: {
      where: { beatId: string };
      select: { id: true; buyer: { select: { email: true } } };
    }) => Promise<OrderRow[]>;
    deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>;
    count: (args: { where: { buyerId: string } }) => Promise<number>;
  };
  license: {
    deleteMany: (args: { where: { orderId: { in: string[] } } }) => Promise<unknown>;
    count: (args: { where: { buyerId: string } }) => Promise<number>;
  };
  auditLog: {
    deleteMany: (args: { where: { beatId: string } }) => Promise<unknown>;
  };
};

export type SeedCleanupResult = {
  deletedBeats: number;
  delistedBeats: number;
  deletedUsers: number;
};

const DEMO_USER_EMAILS = [...SEED_PRODUCER_EMAILS, SEED_BUYER_EMAIL];

/**
 * Idempotent. Only beats owned by seed producer emails whose title AND audioUrl
 * match prisma/seed.ts. Real-buyer orders cause unlist, not delete.
 */
export async function unlistProductionSeedCatalog(db: SeedCleanupDb): Promise<SeedCleanupResult> {
  const result: SeedCleanupResult = { deletedBeats: 0, delistedBeats: 0, deletedUsers: 0 };
  const producers = await db.user.findMany({
    where: { email: { in: [...SEED_PRODUCER_EMAILS] } },
    select: { id: true, email: true },
  });

  if (producers.length > 0) {
    const beats = await db.beat.findMany({
      where: {
        producerId: { in: producers.map((p) => p.id) },
        OR: SEED_BEATS.map((row) => ({ title: row.title, audioUrl: row.audioUrl })),
      },
      select: { id: true, title: true, audioUrl: true, producerId: true },
    });

    for (const beat of beats) {
      const owner = producers.find((p) => p.id === beat.producerId);
      if (!owner || !isSeedCatalogBeat({ ...beat, producerEmail: owner.email })) continue;

      const orders = await db.order.findMany({
        where: { beatId: beat.id },
        select: { id: true, buyer: { select: { email: true } } },
      });
      const plan = planSeedBeatCleanup(orders.map((o) => o.buyer.email));
      if (plan === "delist") {
        await db.beat.update({ where: { id: beat.id }, data: { status: "delisted" } });
        result.delistedBeats += 1;
        continue;
      }
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await db.license.deleteMany({ where: { orderId: { in: orderIds } } });
        await db.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await db.auditLog.deleteMany({ where: { beatId: beat.id } });
      await db.beat.delete({ where: { id: beat.id } });
      result.deletedBeats += 1;
    }
  }

  for (const email of DEMO_USER_EMAILS) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) continue;
    const [beatsLeft, ordersLeft, licensesLeft] = await Promise.all([
      db.beat.count({ where: { producerId: user.id } }),
      db.order.count({ where: { buyerId: user.id } }),
      db.license.count({ where: { buyerId: user.id } }),
    ]);
    if (beatsLeft > 0 || ordersLeft > 0 || licensesLeft > 0) continue;
    await db.user.delete({ where: { id: user.id } });
    result.deletedUsers += 1;
  }

  return result;
}
