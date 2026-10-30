/**
 * 관심 그룹 시세 호출 — 화면에 보이는 그룹의 심볼만 합쳐 한 번에 부른다(I-13 22).
 *
 * 모든 그룹이 한 목록에 보이므로 그룹마다 따로 부르면 같은 종목이 두 번 나간다. 보이는 그룹의 심볼을
 * 합치고 · 겹친 것을 빼고 · 정렬해 한 번에 부르고, 합이 50 을 넘으면 50 씩 나눈다(서버 `/securities/prices` 상한).
 * 안 보이게 된 그룹은 부르기를 멈추되 받은 값은 남긴다.
 */
import type { WatchGroup } from "@/features/stock/api/stockApi";

/** 서버 다건 시세 상한 — 토스는 코드에 상한이 없어 같은 값을 쓴다 */
export const PRICE_BATCH_MAX = 50;

/** 보이는 그룹들의 심볼 — 겹침을 빼고 정렬한다 */
export function visibleSymbols(
  groups: WatchGroup[],
  visibleIds: ReadonlySet<number>,
): string[] {
  const set = new Set<string>();
  for (const g of groups)
    if (visibleIds.has(g.rowId)) for (const i of g.items) set.add(i.symbol);
  return [...set].sort();
}

/** 50 씩 나눈다 */
export function chunkSymbols(
  symbols: string[],
  size = PRICE_BATCH_MAX,
): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < symbols.length; i += size)
    out.push(symbols.slice(i, i + size));
  return out;
}
