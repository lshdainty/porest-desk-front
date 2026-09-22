import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { editAssetPath } from "@/entities/asset";
import { money } from "@/shared/lib/porest/format";

/**
 * 버튼이 달린 토스트는 기본(4초)보다 오래 둔다 — 누를지 정할 시간이 필요하다
 * (porest-design sonner.md: action 동반 toast 는 6000ms+).
 */
const ACTION_TOAST_MS = 6000;

/** 거래를 바꾼 요청 하나의 응답 — 선결제 환급액만 본다. */
type ChangeResult = { refundedAmount?: number | null } | null | undefined;

type ChangeContext = {
  /** 결제가 끝난 회차의 거래였나 — 그러면 통장은 그대로다(D1). */
  closed?: boolean;
  /** 그 카드의 결제계좌 — [잔액 고치기]가 여는 곳. 없으면 버튼이 없다. */
  paymentAssetRowId?: number | null;
};

/**
 * 거래를 지우거나·환불하거나·고치거나·고쳐 쓴 **뒤**의 토스트 한 곳(D4 · D9).
 *
 * 말하는 것은 둘이다.
 *  - 열린 회차에서 미리 낸 돈이 남아 결제계좌로 돌려줬으면 그 금액(D4). 미리 예고하지
 *    않는다 — 예고하려면 저장 전에 서버에 물어야 했고, 그 조회가 늦거나 실패할 때마다
 *    예고 없이 돈이 움직이거나 거짓 안내가 떴다(QA 23·24차).
 *  - 결제가 끝난 회차의 거래였으면 통장은 그대로라는 것과 [잔액 고치기](D9). 카드사가
 *    실제로 돈을 돌려줬다면 결제계좌 잔액은 사용자가 고친다 — 그 폼으로 바로 보낸다.
 *    결제계좌가 없는 카드는 고칠 통장이 없어 버튼도 없다.
 *
 * 둘 다 아니면 아무 말도 안 한다 — 저장·삭제는 화면이 바뀌는 것으로 충분하다.
 *
 * 토스트는 띄운 화면이 닫힌 뒤에도 남는다. [잔액 고치기]의 `navigate` 는 라우터 것이라
 * 상세가 닫혀도 그대로 움직인다.
 */
export function useLedgerResultToast() {
  const { t } = useTranslation("expense");
  const navigate = useNavigate();
  return (result: ChangeResult, context: ChangeContext = {}) => {
    const refunded = result?.refundedAmount ?? 0;
    const fixTarget = context.closed
      ? (context.paymentAssetRowId ?? null)
      : null;
    const action =
      fixTarget != null
        ? {
            label: t("closedCycle.fixBalance"),
            onClick: () => navigate(editAssetPath(fixTarget)),
          }
        : undefined;
    const message =
      refunded > 0
        ? t("closedCycle.prepaidRefunded", { amount: money(refunded) })
        : action
          ? t("closedCycle.note")
          : null;
    if (!message) return;
    // 돈이 돌아왔으면 성공, 통장이 그대로라는 안내면 안내(sonner.md Kinds — info 는
    // "정보/안내"). 예전엔 둘 다 success 라 안내에 초록 체크가 붙었다 — 앱은 info 였다.
    const show = refunded > 0 ? toast.success : toast.info;
    show(message, action ? { action, duration: ACTION_TOAST_MS } : undefined);
  };
}
