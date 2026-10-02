import { describe, expect, it, vi } from "vitest";
import {
  DEMO_USER_EMAILS,
  SEED_BEATS,
  SEED_BUYER_EMAIL,
  SEED_PRODUCER_EMAILS,
  isProductionSeedBlocked,
  isSeedCatalogBeat,
  planSeedBeatCleanup,
  unlistProductionSeedCatalog,
  type SeedCleanupDb,
} from "@/lib/seed-catalog";

describe("seed catalog identities", () => {
  it("matches known ids or demo producer emails, not the audio path", () => {
    const row = SEED_BEATS[0];
    expect(
      isSeedCatalogBeat({
        title: row.title,
        audioUrl: row.audioUrl,
        producerEmail: SEED_PRODUCER_EMAILS[0],
      }),
    ).toBe(true);
    expect(
      isSeedCatalogBeat({
        title: row.title,
        audioUrl: row.audioUrl,
        producerEmail: "real@producer.vn",
      }),
    ).toBe(false);
    // Email alone is enough — r2 (or any other) audio URL still matches.
    expect(
      isSeedCatalogBeat({
        title: row.title,
        audioUrl: "r2:beats/x/mp3/preview.mp3",
        producerEmail: SEED_PRODUCER_EMAILS[0],
      }),
    ).toBe(true);
    expect(
      isSeedCatalogBeat({
        id: "cmuh9wcwj0005ibr4gi9k70zq",
        audioUrl: "r2:beats/cmuh9wcwj0005ibr4gi9k70zq/mp3/preview.mp3",
        producerEmail: "real@producer.vn",
      }),
    ).toBe(true);
    expect(
      isSeedCatalogBeat({
        title: row.title,
        audioUrl: "storage/audio/type-beat-1.mp3",
        producerEmail: "admin@rap.app",
      }),
    ).toBe(false);
  });

  it("blocks seed when VERCEL_ENV or NODE_ENV is production", () => {
    expect(isProductionSeedBlocked({ VERCEL_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(isProductionSeedBlocked({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(
      isProductionSeedBlocked({ VERCEL_ENV: "preview", NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(isProductionSeedBlocked({} as unknown as NodeJS.ProcessEnv)).toBe(false);
  });

  it("delists instead of deleting when a non-demo buyer has an order", () => {
    expect(planSeedBeatCleanup([])).toBe("delete");
    expect(planSeedBeatCleanup([SEED_BUYER_EMAIL])).toBe("delete");
    expect(planSeedBeatCleanup(["buyer@real.vn"])).toBe("delist");
  });

  it("deletes only the seed beat returned for seed producer emails", async () => {
    const deleted: string[] = [];
    const db: SeedCleanupDb = {
      user: {
        findMany: async () => [{ id: "seed-user", email: SEED_PRODUCER_EMAILS[0] }],
        findUnique: async () => null,
        delete: async () => {
          throw new Error("no users in this fixture");
        },
      },
      beat: {
        findMany: async () => [
          {
            id: "seed-beat",
            title: SEED_BEATS[1].title,
            audioUrl: SEED_BEATS[1].audioUrl,
            producerId: "seed-user",
          },
        ],
        update: vi.fn(async () => ({})),
        delete: async (args) => {
          deleted.push(args.where.id);
        },
        count: async () => 0,
      },
      order: {
        findMany: async () => [],
        deleteMany: async () => ({}),
        count: async () => 0,
      },
      license: {
        deleteMany: async () => ({}),
        count: async () => 0,
      },
      auditLog: { deleteMany: async () => ({}) },
    };
    const result = await unlistProductionSeedCatalog(db);
    expect(deleted).toEqual(["seed-beat"]);
    expect(result.deletedBeats).toBe(1);
    expect(result.delistedBeats).toBe(0);
    expect(db.beat.update).not.toHaveBeenCalled();
  });

  it("delists a seed beat that a real buyer ordered and does not delete that order", async () => {
    const deletedOrders: string[][] = [];
    const db: SeedCleanupDb = {
      user: {
        findMany: async () => [{ id: "seed-user", email: SEED_PRODUCER_EMAILS[1] }],
        findUnique: async ({ where }) =>
          where.email === SEED_PRODUCER_EMAILS[1] ? { id: "seed-user" } : null,
        delete: vi.fn(async () => ({})),
      },
      beat: {
        findMany: async () => [
          {
            id: "seed-beat",
            title: SEED_BEATS[2].title,
            audioUrl: SEED_BEATS[2].audioUrl,
            producerId: "seed-user",
          },
        ],
        update: vi.fn(async () => ({})),
        delete: vi.fn(async () => ({})),
        count: async () => 1,
      },
      order: {
        findMany: async () => [{ id: "ord-real", buyer: { email: "buyer@real.vn" } }],
        deleteMany: async (args) => {
          deletedOrders.push(args.where.id.in);
        },
        count: async () => 0,
      },
      license: {
        deleteMany: vi.fn(async () => ({})),
        count: async () => 0,
      },
      auditLog: { deleteMany: vi.fn(async () => ({})) },
    };
    const result = await unlistProductionSeedCatalog(db);
    expect(result.delistedBeats).toBe(1);
    expect(result.deletedBeats).toBe(0);
    expect(db.beat.delete).not.toHaveBeenCalled();
    expect(deletedOrders).toEqual([]);
    expect(db.license.deleteMany).not.toHaveBeenCalled();
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("never treats admin@rap.app as a demo user", () => {
    expect(DEMO_USER_EMAILS).toEqual(["producer@rap.app", "minhprod@rap.app", "buyer@rap.app"]);
    expect(DEMO_USER_EMAILS).not.toContain("admin@rap.app");
  });

  it("deletes a demo user only when beats, orders, and licenses are all zero", async () => {
    const deletedUsers: string[] = [];
    const db: SeedCleanupDb = {
      user: {
        findMany: async () => [],
        findUnique: async ({ where }) =>
          where.email === "producer@rap.app" ? { id: "prod-empty" } : where.email === "buyer@rap.app" ? { id: "buyer-busy" } : null,
        delete: async ({ where }) => {
          deletedUsers.push(where.id);
        },
      },
      beat: {
        findMany: async () => [],
        update: async () => ({}),
        delete: async () => ({}),
        count: async ({ where }) => (where.producerId === "buyer-busy" ? 1 : 0),
      },
      order: {
        findMany: async () => [],
        deleteMany: async () => ({}),
        count: async () => 0,
      },
      license: {
        deleteMany: async () => ({}),
        count: async () => 0,
      },
      auditLog: { deleteMany: async () => ({}) },
    };
    const result = await unlistProductionSeedCatalog(db);
    expect(deletedUsers).toEqual(["prod-empty"]);
    expect(result.deletedUsers).toBe(1);
  });
});
