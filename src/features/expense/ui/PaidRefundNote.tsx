import { useTranslation } from "react-i18next";
import type { RefundPreview } from "@/entities/expense";
import { KRW } from "@/shared/lib/porest/format";

/**
 * 삭제·수정 확인창의 **환급 안내 한 줄**(설계 13-2).
 *
 * 결제 완료 회차의 카드 거래를 지우거나 줄이면 그만큼 결제계좌로 돌아간다 — 돈이
 * 움직이는데 확인창이 아무 말도 안 하면, 계좌에 출처 모를 입금이 하나 생긴 것으로
 * 보인다(이체 메모에만 남는다).
 *
 * 금액은 서버만 안다. 회차마다 "실제 낸 이체액 − 다시 계산한 청구액" 이라 거래 금액과
 * 다르고, 재료가 전부 서버 테이블에 있다. 그래서 확인창이 열릴 때 미리보기를 부른다.
 *
 * 네 갈래다. **확인 버튼은 이 조회를 기다리지 않는다** — 느린 네트워크가 삭제를 막으면
 * 안 되므로, 아직 모르는 동안에는 자리만 잡아 둔다.
 *
 *   1. 도는 중 — 스켈레톤(줄이 나중에 나타나며 버튼이 밀리지 않게)
 *   2. 돌려줄 돈이 있다 — 금액을 말한다
 *   3. 이미 환불된 거래 — 환급은 그때 끝났다고 말한다
 *   4. 실패·3초 초과 — 카드+결제계좌면 금액 없는 문구, 그 밖이면 줄 없음
 */
export function PaidRefundNote({
  query,
  isCreditCard,
  cardHasPaymentAsset,
}: {
  query: {
    data?: RefundPreview;
    isPending: boolean;
    isError: boolean;
  };
  isCreditCard: boolean;
  cardHasPaymentAsset: boolean;
}) {
  const { t } = useTranslation("expense");

  // 카드가 아니면 어느 갈래도 할 말이 없다 — 조회 중에도 자리를 비운다.
  if (!isCreditCard) return null;

  if (query.isPending) {
    return (
      <span
        aria-hidden
        data-testid="paid-refund-skeleton"
        style={{
          display: "block",
          marginTop: 10,
          height: "1em",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-sunken)",
        }}
      />
    );
  }

  const preview = query.data;
  const note = (text: string) => (
    <span
      style={{
        display: "block",
        marginTop: 10,
        fontSize: "var(--text-body-sm)",
        color: "var(--fg-secondary)",
      }}
    >
      {text}
    </span>
  );

  if (preview?.reason === "ALREADY_REFUNDED") {
    return note(t("txDetail.refundedDeleteNote"));
  }
  if (preview?.applies && preview.refundAmount > 0) {
    return note(
      t("txDetail.paidDeleteNote", { amount: KRW(preview.refundAmount) }),
    );
  }
  // 못 물어봤을 때만 금액 없는 문구로 넘어간다 — 물어봐서 "0" 이면 조용히 둔다.
  if ((query.isError || !preview) && cardHasPaymentAsset) {
    return note(t("txDetail.paidDeleteFallback"));
  }
  return null;
}
