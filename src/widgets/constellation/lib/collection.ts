import type { CollectionEntry } from "@/features/constellation";

/** NEW — 모은 별자리 가운데 `lastCollectedDate` 가 가장 늦은 하나(횟수 무관, 웹 기준). */
export function newestKeyOf(entries: CollectionEntry[]): string | null {
  let key: string | null = null;
  let max = "";
  for (const entry of entries) {
    if (
      entry.collectCount > 0 &&
      entry.lastCollectedDate &&
      entry.lastCollectedDate > max
    ) {
      max = entry.lastCollectedDate;
      key = entry.constellation.constellationKey;
    }
  }
  return key;
}
