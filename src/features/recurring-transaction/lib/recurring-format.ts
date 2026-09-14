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

/**
 * 금액의 부호와 색 — 이체는 지출도 수입도 아니다.
 *
 * 이체는 내 돈이 자리를 옮기는 것이라 합계에 ±로 들어가지 않는다. 가계부 목록의 이체
 * 행도 같은 규칙이다(`entities/asset/ui/transfer-row`) — 어느 계좌에서 보느냐가 정해져야
 * 부호가 생기고, 그게 없으면 부호 없이 중립색으로 적는다. 반복 목록에는 볼 기준 계좌가
 * 없으므로 언제나 중립이다.
 */
export function recurringAmountTone(it: RecurringTransaction): {
  sign: string;
  color: string;
} {
  if (it.expenseType === "TRANSFER") {
    return { sign: "", color: "var(--fg-primary)" };
  }
  return it.expenseType === "EXPENSE"
    ? { sign: "−", color: "var(--fg-expense)" }
    : { sign: "+", color: "var(--fg-income)" };
}

/** 행 부제 — 이체는 카테고리가 없으니 "보내는 → 받는" 을 적는다. */
export function recurringSubtitle(
  it: RecurringTransaction,
  fallback: string,
): string {
  if (it.expenseType === "TRANSFER") {
    return `${it.assetName ?? "-"} → ${it.toAssetName ?? "-"}`;
  }
  return fallback;
}
