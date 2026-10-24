import { isEn } from "@/shared/lib/groo/format";
import { parseServerUtc } from "@/shared/lib/date";

type T = (key: string, opts?: { count: number }) => string;

/**
 * 서버가 준 `[UTC]` 시각 → "방금 전 · 3분 전 · 어제 · 10월 9일 · 2025년 9월 19일"(DESIGN.md "지난 시간").
 *
 * 1분 미만 방금 전 · 1 ~ 59분 n분 전 · 1 ~ 23시간 n시간 전 · 24 ~ 47시간 어제 · 2 ~ 6일 n일 전 ·
 * 7일 이상은 날짜(올해는 연도를 줄이고, 다른 해는 연도를 붙인다).
 *
 * [parseServerUtc] 를 거쳐야 한다 — 시간대 없는 문자열을 `new Date` 로 그대로 읽으면 UTC 가 로컬로 둔갑해 KST 에서 9시간이 어긋난다.
 * 기준점 [now] 를 인자로 받는다(렌더 중 `Date.now()` 는 순수하지 않다) — 호출부는 `useNow()` 의 흐르는 '지금'을 넘긴다.
 */
export function relativeTime(
  t: T,
  iso: string | null,
  now: number,
): string | null {
  const d = parseServerUtc(iso);
  if (!d) return null;

  const minutes = Math.floor((now - d.getTime()) / 60000);
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t("yesterday");
  if (days < 7) return t("daysAgo", { count: days });
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(isEn() ? "en-US" : "ko-KR", {
    ...(sameYear ? {} : { year: "numeric" }),
    month: isEn() ? "short" : "long",
    day: "numeric",
  }).format(d);
}
