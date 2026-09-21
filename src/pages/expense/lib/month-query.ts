/** `yyyy-MM`, 달은 01~12. */
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 주소의 `?month=` 를 가계부가 보여 줄 달로 푼다 — 못 읽으면 **이번 달**.
 *
 * 그대로 믿으면 `?month=8`(연도 없음)·`?year=2026&month=8` 같은 주소에서 달 계산이
 * `NaN` 이 되어 머리가 "NaN년 NaN월" 로 뜨고 목록이 빈다(QA 24차 9). 알아볼 수 없는
 * 값을 고쳐 읽으려 들지 않는다 — 어느 달을 뜻했는지 추측이 틀리면 엉뚱한 달을 보여
 * 주는 쪽이 빈 화면보다 더 헷갈린다.
 */
export function monthFromQuery(
  raw: string | null | undefined,
  now: Date = new Date(),
): string {
  return raw && MONTH_KEY.test(raw) ? raw : currentMonthKey(now);
}
