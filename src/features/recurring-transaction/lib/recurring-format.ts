import type { TFunction } from "i18next";

import type { RecurringTransaction } from "@/entities/recurring-transaction";

/*
 * 반복 거래 표시 문구 — 목록 행과 상세가 같은 문장을 써야 한다.
 *
 * 예전엔 RecurringManager(관리 화면) 안에 있었는데, 상세 다이얼로그가 그걸 가져다
 * 쓰느라 "다이얼로그 → 관리 화면" 의존이 생겼다. 관리 화면은 위젯이고 다이얼로그는
 * 이 슬라이스라 방향이 거꾸로다. 순수 함수라 도메인 쪽(lib)이 제자리다.
 */
export function displayTitle(it: RecurringTransaction, t: TFunction): string {
  return it.merchant || it.description || it.categoryName || t("defaultTitle");
}

/** 자정 기준 날짜 — 목록의 "오늘" 판정과 상세가 같은 기준을 쓴다. */
export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** 반복 규칙 한 줄 요약 — 행·상세가 같은 문장을 쓴다. */
export function recurringSummary(
  it: RecurringTransaction,
  t: TFunction,
): string {
  let core = t(`freq.${it.frequency}`);
  if (it.frequency === "WEEKLY" && it.dayOfWeek != null) {
    // 백엔드 ISO 1=월~7=일 → recurring dow 키 매핑
    const isoToDow = ["", "mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const dowKey = isoToDow[it.dayOfWeek];
    core = t("summaryWeekly", { day: dowKey ? t(`dow.${dowKey}`) : "" });
  } else if (it.frequency === "MONTHLY" && it.dayOfMonth != null) {
    core = t("summaryMonthly", { day: it.dayOfMonth });
  }
  const end = it.endDate ? `~${it.endDate}` : t("endNone");
  return `${core} · ${end}${it.notifyDayBefore ? ` · ${t("alarmTag")}` : ""}`;
}
