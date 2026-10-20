import { formatMonthDayDow } from "@/shared/lib/date";

/*
 * 원장 한 행의 날짜 표시 규칙 — 지출 행과 이체 행이 같은 목록에 섞여 나온다.
 * 각자 갖고 있으면 한쪽만 고쳤을 때 같은 화면 안에서 형식이 갈린다.
 *
 * 날짜 문자열만 받는다 — 그래서 shared 에 남는다(Expense·AssetTransfer 를 모른다).
 */

/**
 * expenseDate 의 시각 부분만 표시 ("HH:mm").
 * day-head 가 이미 날짜를 보여주므로 행에서는 시각 정보만 (시각이 00:00 이면 표시 안 함).
 */
export function txTimeLabel(raw: string): string | null {
  const time = raw.length >= 16 ? raw.slice(11, 16) : "";
  if (time && time !== "00:00") return time;
  return null;
}

/**
 * "M월 D일 (요일)" — 홈 최근 거래처럼 day-head 가 없는 컨텍스트에서 사용.
 */
export function txDateFull(raw: string): string {
  const day = raw.slice(0, 10);
  if (day.length !== 10) return day;
  return formatMonthDayDow(day);
}

/**
 * 아직 오지 않은 거래인가 — 서버 집계도 이 기준으로 오늘까지만 센다.
 *
 * 서버가 사용자 타임존 기준으로 자르므로 로컬 시각과 비교한다(둘이 같은 지역이다).
 */
export function isScheduledDate(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date.length === 10 ? `${date}T23:59:59` : date) > new Date();
}
