/**
 * Demo catalog identities from prisma/seed.ts.
 * Match known beat ids or demo producer emails. Never match by title or audio path alone.
 * admin@rap.app is not a demo account and must never be deleted.
 */
export const SEED_PRODUCER_EMAILS = ["producer@rap.app", "minhprod@rap.app"] as const;
/** Demo buyer created by prisma/seed.ts. Not the admin account. */
export const SEED_BUYER_EMAIL = "buyer@rap.app";
/** Demo accounts removed only when they have zero beats, orders, and licenses. */
export const DEMO_USER_EMAILS = [...SEED_PRODUCER_EMAILS, SEED_BUYER_EMAIL] as const;

/** Known production seed beat ids. Titles are documentation only. */
export const SEED_BEAT_IDS = [
  "cmuh9wcwj0005ibr4gi9k70zq", // Saigon Nights Type Beat
  "cmuh9wcxh0007ibr42k7fdonw", // Hanoi Drill
  "cmuh9wcxx0009ibr414bat0gh", // Mekong Melodic
  "cmuh9wcye000bibr4u0pvky52", // District 7 Trap
  "cmuh9wcyt000dibr4u2n7m6e5", // Pho Lo-Fi Loop
] as const;

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
  id?: string | null;
  title?: string;
  audioUrl?: string;
  producerEmail?: string | null;
  producer?: { email?: string | null } | null;
}): boolean {
  if (beat.id && (SEED_BEAT_IDS as readonly string[]).includes(beat.id)) return true;
  const email = (beat.producerEmail ?? beat.producer?.email ?? "").trim().toLowerCase();
  return (SEED_PRODUCER_EMAILS as readonly string[]).includes(email);
}

/** Prisma where fragment: hide seed beats (known ids or demo producer emails). */
export function excludeSeedCatalogWhere() {
  return {
    NOT: {
      OR: [
        { id: { in: [...SEED_BEAT_IDS] } },
        { producer: { email: { in: [...SEED_PRODUCER_EMAILS] } } },
      ],
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
        OR: Array<{ id: { in: string[] } } | { producerId: { in: string[] } }>;
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

/**
 * Idempotent. Seed beats are known ids or rows owned by demo producer emails,
 * regardless of audioUrl (r2 markers included). Real-buyer orders cause unlist, not delete.
 * Demo users are deleted only when they have no beats, orders, or licenses.
 */
export async function unlistProductionSeedCatalog(db: SeedCleanupDb): Promise<SeedCleanupResult> {
  const result: SeedCleanupResult = { deletedBeats: 0, delistedBeats: 0, deletedUsers: 0 };
  const producers = await db.user.findMany({
    where: { email: { in: [...SEED_PRODUCER_EMAILS] } },
    select: { id: true, email: true },
  });

  const or: Array<{ id: { in: string[] } } | { producerId: { in: string[] } }> = [
    { id: { in: [...SEED_BEAT_IDS] } },
  ];
  if (producers.length > 0) {
    or.push({ producerId: { in: producers.map((p) => p.id) } });
  }

  const beats = await db.beat.findMany({
    where: { OR: or },
    select: { id: true, title: true, audioUrl: true, producerId: true },
  });

  for (const beat of beats) {
    const owner = producers.find((p) => p.id === beat.producerId);
    if (!isSeedCatalogBeat({ ...beat, producerEmail: owner?.email })) continue;

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
