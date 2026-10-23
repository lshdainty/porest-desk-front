import type { HideCardKey } from "@/shared/lib/groo/hide-amounts-cards";

/**
 * 캘린더 셀의 일별 지출·수입은 두 카드에 걸친다 — '캘린더 금액' 이면서 '거래 목록' 의
 * 일별 합계이기도 하다. 한쪽에만 걸면 다른 쪽을 켠 사람에게는 그대로 보인다.
 */
export const CALENDAR_CELL_CARDS: HideCardKey[] = [
  "ledger.calendar",
  "ledger.txList",
];

/**
 * 월 인사이트("지난달보다 N만원 덜 썼어요")는 가려진 월 지출 히어로 **바로 아래**에서
 * 두 달의 차액을 평문으로 말한다 — 히어로를 가려도 여기서 크기가 드러난다.
 * 모바일 히어로는 '거래 목록', 데스크톱 요약은 '월 합계' 카드를 쓰므로 둘 다에 건다.
 */
export const INSIGHT_CARDS: HideCardKey[] = [
  "ledger.monthSummary",
  "ledger.txList",
];

/** 줄 안쪽 좌우 24 를 걷는다 — 호스트(원장 껍데기)가 바깥 24 를 쥐고 있어서다. I-06 머지 뒤 가계부가 걷어 낸다(I-07 4). */
export const GUTTER_OFF = "[&_[data-slot=list-content]]:px-0";
