/**
 * Public home / explore catalog.
 *
 * The five demo beats live in prisma/seed.ts (no seed flag on Beat):
 *   Saigon Nights Type Beat, Hanoi Drill, Mekong Melodic,
 *   District 7 Trap, Pho Lo-Fi Loop
 * owned by producer@rap.app (Ocherk Beats) and minhprod@rap.app (Minh Prod),
 * with placeholder audio storage/audio/type-beat-1..5.mp3.
 *
 * Real supply is a producer publish (POST /api/beats → storage/uploads/…).
 * Seed rows stay in the DB (buyer library, direct /beats/[id]) but must not
 * appear on the public catalog. Empty catalog is OK.
 */

export const SEED_PRODUCER_EMAILS = ["producer@rap.app", "minhprod@rap.app"] as const;

export const SEED_AUDIO_URLS = [
  "storage/audio/type-beat-1.mp3",
  "storage/audio/type-beat-2.mp3",
  "storage/audio/type-beat-3.mp3",
  "storage/audio/type-beat-4.mp3",
  "storage/audio/type-beat-5.mp3",
] as const;

const seedEmails = new Set<string>(SEED_PRODUCER_EMAILS);
const seedAudio = new Set<string>(SEED_AUDIO_URLS);

export function isSeedCatalogBeat(beat: { audioUrl: string; producerEmail: string }): boolean {
  return seedEmails.has(beat.producerEmail.toLowerCase()) || seedAudio.has(beat.audioUrl);
}

/** Prisma where for GET /api/beats and the home page listing. */
export function publicCatalogWhere(q?: string) {
  const query = q?.trim() || "";
  return {
    status: "available" as const,
    producer: { email: { notIn: [...SEED_PRODUCER_EMAILS] } },
    audioUrl: { notIn: [...SEED_AUDIO_URLS] },
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { musicalKey: { contains: query } },
            { producer: { name: { contains: query } } },
          ],
        }
      : {}),
  };
}
