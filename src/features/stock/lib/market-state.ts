import { formatTimeValue } from "@/shared/ds/time-picker";
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

/**
 * 'HH:MM' · 'HH:MM:SS' → 오전 · 오후 12시간 글("오후 1:00" · en "1:00 PM"). 초가 있으면 분 뒤에 붙인다.
 * 시각은 모든 화면에서 12시간이다(DESIGN.md International Design). 읽지 못하면 받은 글 그대로.
 */
export function clock12(t: string): string {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (!m) return t;
  const base = formatTimeValue({ hour: Number(m[1]), minute: Number(m[2]) });
  if (!m[3]) return base;
  // "오후 1:00" → "오후 1:00:05" · "1:00 PM" → "1:00:05 PM"
  return base.replace(/(\d{1,2}:\d{2})/, `$1:${m[3]}`);
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
    return { open: true, labelKey: "market.live", time: clock12(now) };
  if (now < start)
    return { open: false, labelKey: "market.preopen", time: clock12(start) };
  return { open: false, labelKey: "market.afterClose" };
}
