import { describe, expect, it } from "vitest";
import { SEED_AUDIO_URLS, SEED_BEAT_IDS, SEED_PRODUCER_EMAILS, isSeedCatalogBeat, publicCatalogWhere } from "@/lib/catalog";

const SEED_TITLES = [
  "Saigon Nights Type Beat",
  "Hanoi Drill",
  "Mekong Melodic",
  "District 7 Trap",
  "Pho Lo-Fi Loop",
];

describe("public catalog hides seed demos", () => {
  it("marks the five seed audio paths and both seed producer emails", () => {
    expect(SEED_AUDIO_URLS).toHaveLength(5);
    expect(SEED_PRODUCER_EMAILS).toEqual(["producer@rap.app", "minhprod@rap.app"]);
    for (const audioUrl of SEED_AUDIO_URLS) {
      expect(isSeedCatalogBeat({ audioUrl, producerEmail: "real@example.com" })).toBe(true);
    }
    expect(isSeedCatalogBeat({ audioUrl: "storage/uploads/1-real.mp3", producerEmail: "producer@rap.app" })).toBe(
      true,
    );
    expect(isSeedCatalogBeat({ audioUrl: "storage/uploads/1-real.mp3", producerEmail: "MinhProd@rap.app" })).toBe(
      true,
    );
    expect(
      isSeedCatalogBeat({
        id: SEED_BEAT_IDS[0],
        audioUrl: "r2:beats/cmuh9wcwj0005ibr4gi9k70zq/mp3/preview.mp3",
        producerEmail: "real@example.com",
      }),
    ).toBe(true);
  });

  it("keeps a beat a real producer published", () => {
    expect(
      isSeedCatalogBeat({
        audioUrl: "storage/uploads/1710000000000-night.mp3",
        producerEmail: "producer.real@gmail.com",
      }),
    ).toBe(false);
  });

  it("catalog where excludes seed emails and the five audio stubs", () => {
    const where = publicCatalogWhere();
    expect(where.status).toBe("available");
    expect(where.id.notIn).toEqual([...SEED_BEAT_IDS]);
    expect(where.producer.email.notIn).toEqual([...SEED_PRODUCER_EMAILS]);
    expect(where.audioUrl.notIn).toEqual([...SEED_AUDIO_URLS]);
    expect(where).not.toHaveProperty("OR");
    expect(SEED_TITLES).toHaveLength(5);
  });

  it("search still ANDs with the seed exclusion", () => {
    const where = publicCatalogWhere("  drill ");
    expect(where.producer.email.notIn).toContain("producer@rap.app");
    expect(where.OR).toEqual([
      { title: { contains: "drill" } },
      { musicalKey: { contains: "drill" } },
      { producer: { name: { contains: "drill" } } },
    ]);
  });
});
