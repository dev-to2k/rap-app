import { describe, expect, it, vi } from "vitest";
import {
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
  it("matches only exact title + audio + seed producer email", () => {
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
    expect(
      isSeedCatalogBeat({
        title: row.title,
        audioUrl: "storage/uploads/real.mp3",
        producerEmail: SEED_PRODUCER_EMAILS[0],
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
});
