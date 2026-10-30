import { formatTimeValue } from "@/shared/ds/time-picker";
import type { TossMarketSession } from "../api/stockApi";

/*
 * 시장 열림 판정 — 장 상태 줄(폰 시장 띠 · 데스크톱 상태 줄)이 같이 쓴다.
 * 캘린더가 준 정규장 시각을 **한 순간**으로 읽어 지금과 견준다.
 *
 * 토스 market-calendar 의 시각은 `+09:00` 오프셋이 붙은 ISO date-time 이다(국내 `2026-03-25T09:00:00+09:00`,
 * 미국 정규장 `2026-03-25T22:30:00+09:00` ~ `2026-03-26T05:00:00+09:00` — 자정을 넘는다. 근거: 토스 OpenAPI
 * `UsRegularMarketSession` · 백엔드 `TossMarketInfoDto.UsSession(String, String)` 은 문자열을 그대로 넘긴다).
 * 이미 한국 시각이므로 **시간대 변환도 서머타임 계산도 하지 않는다** — 순간끼리 비교하면 자정 넘김도 저절로 맞다.
 * 예전엔 "HH:MM:SS" 로 읽고 앞 5글자를 잘라 실제 응답이면 "2026-" 이 되어 늘 휴장이었다(검수 M6).
 * 오프셋 없는 옛 "HH:MM:SS" 글이 오면 `date`(달력의 그날) 한국 시각으로 읽는다(폴백).
 */

/**
 * 'HH:MM' → 오전 · 오후 12시간 글("오후 1:00" · en "1:00 PM"). 시각은 모든 화면에서 12시간이고 초는 쓰지 않는다
 * (DESIGN.md International Design — 체결 시각도 분까지, 같은 분 체결은 줄 차례가 순서다). 읽지 못하면 받은 글 그대로.
 */
export function clock12(t: string): string {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
  if (!m) return t;
  return formatTimeValue({ hour: Number(m[1]), minute: Number(m[2]) });
}

/** 보이는 시각의 기준 — 이 제품의 사용자는 한국에 있고 토스 달력도 한국 시각이다 */
export const DISPLAY_TZ = "Asia/Seoul";

/** 어느 순간의 tz 시각 'HH:MM' */
export function clockAt(at: Date, tz: string = DISPLAY_TZ): string {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const h = p.find((x) => x.type === "hour")?.value ?? "00";
  const m = p.find((x) => x.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

/**
 * 세션 시각 글 → 순간. 오프셋 붙은 ISO(`…T22:30:00+09:00`)는 그대로, 옛 "HH:MM(:SS)" 는 `date` 한국 시각으로 읽는다.
 * 읽지 못하면 null.
 */
export function sessionInstant(
  value: string | null | undefined,
  date?: string | null,
): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m || !date) return null;
  const d = new Date(
    `${date}T${m[1]!.padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}+09:00`,
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export type MarketStatus = { open: boolean; labelKey: string; time?: string };

/**
 * 시장 상태. 열림은 시작 ~ 끝 순간 안(경계 포함), 보이는 시각은 한국 시각이다.
 * `date` 는 옛 "HH:MM:SS" 폴백용(달력의 그날), `now` 는 시험용.
 */
export function marketState(
  session: TossMarketSession | null | undefined,
  date?: string | null,
  now: Date = new Date(),
): MarketStatus {
  const start = sessionInstant(session?.startTime, date);
  let end = sessionInstant(session?.endTime, date);
  if (!start || !end) return { open: false, labelKey: "market.holiday" };
  // 옛 "HH:MM:SS" 폴백에서 끝이 시작보다 이르면 자정을 넘은 것이다
  if (end < start) end = new Date(end.getTime() + 86_400_000);
  if (now >= start && now <= end)
    return {
      open: true,
      labelKey: "market.live",
      time: clock12(clockAt(now)),
    };
  if (now < start)
    return {
      open: false,
      labelKey: "market.preopen",
      time: clock12(clockAt(start)),
    };
  return { open: false, labelKey: "market.afterClose" };
}

/** 장 상태 줄 한 칸 — 달력을 아직 못 받았거나(pending) 못 받았으면(null) 상태를 지어내지 않는다 */
export type MarketLookup =
  (MarketStatus & { pending?: false }) | { pending: true } | null;

/**
 * 달력 질의 하나 → 장 상태 줄 한 칸.
 * - 받았다 → 판정(달력이 "세션 없음" 을 줬을 때만 휴장)
 * - 아직이다 → pending (자리에 Skeleton)
 * - 실패했고 받아 둔 값도 없다 → null (그 시장만 줄에서 뺀다 — "휴장" 으로 지어내지 않는다)
 */
export function marketLookup<T>(
  q: { data?: T; isError: boolean },
  pick: (d: T) => {
    session: TossMarketSession | null | undefined;
    date: string;
  },
): MarketLookup {
  if (q.data !== undefined) {
    const { session, date } = pick(q.data);
    return marketState(session, date);
  }
  return q.isError ? null : { pending: true };
}
