import type { Asset } from "@/entities/asset";

/**
 * 이체 상대가 될 수 있는 자산.
 *
 * 카드는 양쪽 다 뺀다.
 * - **체크카드** — 잔액을 들지 않는다(긁는 즉시 연결 계좌에서 빠진다). 걸면 카드에
 *   있을 수 없는 잔액이 생긴다.
 * - **신용카드** — 대금 결제는 전용 기능(자산 상세 → 결제)이 담당한다. 그쪽은 이체와
 *   함께 card_billing 을 남기고, 자동 결제의 멱등 체크가 그 기록으로 걸린다.
 *   손으로 이체하면 기록이 없어 결제일에 자동 결제가 또 돌아 이중 차감된다.
 *
 * 서버도 같은 규칙을 본다(`RecurringTransferValidator`). 화면에서 못 고르게 하는 것과
 * 서버가 거절하는 것은 별개다 — 옛 화면·API 직접 호출이 남아 있다.
 */
export function transferEligible(assets: Asset[]): Asset[] {
  return assets.filter(
    (a) => a.assetType !== "CHECK_CARD" && a.assetType !== "CREDIT_CARD",
  );
}

/**
 * 이자 칸을 보일지 — **받는 자산이 대출일 때만**.
 *
 * 원금은 부채가 줄어드는 자산 이동이지만 이자는 은행으로 아예 나가는 비용이라,
 * 대출 상환이 아니면 뜻이 없다.
 */
export function isLoanTarget(
  assets: Asset[],
  toAssetRowId: number | null,
): boolean {
  if (toAssetRowId == null) return false;
  return assets.find((a) => a.rowId === toAssetRowId)?.assetType === "LOAN";
}

/** 이체가 성립하는 최소 조건 — 양쪽이 있고 서로 다르다. */
export function transferPartiesReady(
  fromAssetRowId: number | null,
  toAssetRowId: number | null,
): boolean {
  return (
    fromAssetRowId != null &&
    toAssetRowId != null &&
    fromAssetRowId !== toAssetRowId
  );
}

/**
 * 이체 행의 "누구에게서 누구로" 한 줄.
 *
 * 이체는 카테고리가 없다. 그래서 목록·띠·미리보기가 카테고리를 적는 자리에 이걸 적는다 —
 * 안 그러면 "카테고리 없음" 이 뜨는데, 그건 빠진 값이 아니라 **있을 수 없는 값**이다.
 *
 * 같은 데이터를 그리는 자리가 웹에 넷(반복 목록·반복 다가오는 7일 띠·프리셋 목록·
 * 프리셋 저장 미리보기)이다. 넷이 각자 문자열을 만들면 한 곳만 고쳐져 갈라진다 —
 * 실제로 2026-09-15 에 반복 목록만 고쳐져 있었다.
 */
export function transferPartiesLabel(
  fromName: string | null | undefined,
  toName: string | null | undefined,
): string {
  return `${fromName ?? "-"} → ${toName ?? "-"}`;
}
