/*
 * 전일 종가 — 일봉 몇 개에서 "오늘 봉이 아닌 가장 최근 봉" 의 종가를 집는다(검수 H2).
 *
 * 토스 OpenAPI `/api/v1/candles` 는 **최신순**(배열 첫 요소가 가장 최근 봉)이다. 예전 코드는 "캔들은 최신이 마지막" 이라
 * 가정하고 뒤집어, 문서대로 오면 3봉 중 **가장 오래된 봉**을 집었다(오늘 15,200 · 어제 15,150 · 그제 14,900 →
 * 어제 대신 그제로 "▲ 300원 · 2.01%"). 그래서 순서를 가정하지 않고 시각으로 정렬한 뒤 고른다.
 *
 * 오늘의 기준은 **그 시장의 날짜**다. 1d 봉은 현지 자정 고정이라 미국 종목은 America/New_York 로 가른다 — 한국 날짜로 가르면
 * 한국 새벽(미국 장중)에 오늘 봉이 "오늘 아님" 이 되어 그것을 전일로 집는다(등락률이 0.00% 로 붙는다).
 */

export interface DailyBarLike {
  timestamp: string;
  closePrice: string;
}

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

/** 정렬용 순간(ms) — 오프셋이 없으면 벽시계 그대로(서로 견주기만 한다) */
const instantMs = (ts: string): number => {
  const t = Date.parse(HAS_OFFSET.test(ts) ? ts : `${ts}Z`);
  return Number.isNaN(t) ? 0 : t;
};

/** 그 시각의 tz 날짜 'YYYY-MM-DD' — 오프셋이 있으면 순간을 tz 로, 없으면 쓰인 날짜 그대로 */
export function dateKeyIn(ts: string, tz: string): string {
  if (!HAS_OFFSET.test(ts)) return ts.slice(0, 10);
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10);
  return d.toLocaleDateString("sv-SE", { timeZone: tz });
}

/** 지금 tz 의 오늘 'YYYY-MM-DD' */
export const todayKeyIn = (tz: string, now: Date = new Date()): string =>
  now.toLocaleDateString("sv-SE", { timeZone: tz });

/**
 * 전일 종가. 봉이 없거나 전부 오늘 봉이면(신규 상장 첫날) null — 오늘 봉으로 등락률을 지어내지 않는다.
 * `now` 는 시험용.
 */
export function prevCloseOf(
  candles: DailyBarLike[],
  tz: string,
  now: Date = new Date(),
): number | null {
  const today = todayKeyIn(tz, now);
  const newestFirst = [...candles].sort(
    (a, b) => instantMs(b.timestamp) - instantMs(a.timestamp),
  );
  const prev = newestFirst.find((c) => dateKeyIn(c.timestamp, tz) !== today);
  if (!prev) return null;
  const v = Number.parseFloat(prev.closePrice);
  return Number.isFinite(v) ? v : null;
}
