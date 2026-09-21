import type { ClosedCycleSpan } from "@/entities/expense";

/**
 * 결제가 끝난 회차에 걸린 거래를 바꿀 때의 안내 문장(D1) — 확인창 · 토스트 · 저장 확인이
 * 같은 글자를 쓴다.
 *
 * 할부가 닫힌 회차와 열린 회차에 걸쳤으면 지난 회차분만 기록으로 남는다고 말한다.
 */
export function closedCycleNoteText(
  t: (key: string) => string,
  span: ClosedCycleSpan,
): string {
  return span === "partial"
    ? t("closedCycle.partialNote")
    : t("closedCycle.note");
}
