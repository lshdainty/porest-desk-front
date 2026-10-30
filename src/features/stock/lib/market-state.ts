import type { TossMarketSession } from "../api/stockApi";

/*
 * 시장 열림 판정 — 장 상태 줄(폰 시장 띠 · 데스크톱 상태 줄)이 같이 쓴다.
 * 캘린더가 준 정규장 시간과 시장 현지 시각을 견준다.
 */

/** 'HH:MM:SS' → 'HH:MM' */
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : null);

/** 시장 현지 시각 'HH:MM' (TZ 무관 — Intl) */
export function nowInTz(tz: string): string {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const h = p.find((x) => x.type === "hour")?.value ?? "00";
  const m = p.find((x) => x.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export type MarketStatus = { open: boolean; labelKey: string; time?: string };

export function marketState(
  session: TossMarketSession | null | undefined,
  tz: string,
): MarketStatus {
  const start = hhmm(session?.startTime);
  const end = hhmm(session?.endTime);
  if (!start || !end) return { open: false, labelKey: "market.holiday" };
  const now = nowInTz(tz);
  if (now >= start && now <= end)
    return { open: true, labelKey: "market.live", time: now };
  if (now < start)
    return { open: false, labelKey: "market.preopen", time: start };
  return { open: false, labelKey: "market.afterClose" };
}
