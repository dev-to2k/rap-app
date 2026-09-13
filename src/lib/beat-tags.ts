export const BEAT_TAGS = ["drill", "trap", "melodic", "lofi", "boombap"] as const;
export type BeatTag = (typeof BEAT_TAGS)[number];

export function tagForTitle(title: string): BeatTag {
  const t = title.toLowerCase();
  if (t.includes("drill")) return "drill";
  if (t.includes("lo-fi") || t.includes("lofi") || t.includes("pho")) return "lofi";
  if (t.includes("melodic") || t.includes("mekong")) return "melodic";
  if (t.includes("boom")) return "boombap";
  return "trap";
}

export function mockPlays(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 9000;
  return 120 + n;
}
