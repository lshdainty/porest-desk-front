import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Field } from "@/shared/ds/field";
import { AmountInput } from "@/shared/ui/groo/amount-input";
import { MAX_BALANCE } from "@/shared/lib/groo/amount";
import { formatDay, money } from "@/shared/lib/groo/format";
import { formatOriginalAmount } from "@/shared/lib/groo/currency";
import type { AssetForm } from "./use-asset-form";

/**
 * 금액 칸 하나(I-17 12 · 13) — 입출금 · 예금 · 적금 · 현금 "잔액", 대출 "남은 대출 금액", 마이너스 통장 "사용 중인 금액",
 * 신용카드 "이전 미결제 사용액"(청구분 칸이 있으면 "그 뒤 쓴 금액"), 투자 "예수금"(보유가 없을 때). 단위는 칸 뒤 글자(고른 통화).
 * 쓰는 동안 쉼표 · 부호 키 막기 · 상한(`MAX_BALANCE`)은 AmountInput 이 한다. 체크카드는 잔액이 없어 그리지 않는다.
 * 도움말은 Field 설명이다 — 한도 초과(저장은 막지 않는다 · QA #125)는 맨 위 줄에 경고 아이콘과 함께.
 */
export function BalanceField({ f }: { f: AssetForm }) {
  const {
    t,
    i18n,
    kind,
    editingGroup,
    item,
    balanceStr,
    setBalanceStr,
    unit,
    currency,
    carryoverLocked,
    dueField,
    isExistingCreditCard,
    currentUnpaid,
    overLimitBy,
    newCardBillWindow,
    isOverdraft,
  } = f;
  if (kind === "체크카드") return null;

  const label =
    editingGroup === "card"
      ? dueField
        ? t("editDialog.carryoverAfterLabel")
        : t("editDialog.balanceLabelCard")
      : editingGroup === "invest"
        ? t("editDialog.balanceLabelInvestCash")
        : isOverdraft
          ? // 마이너스 통장은 '잔액' 이 아니라 '쓴 돈' 을 묻는다 — 그래야 양수로 받는다.
            t("editDialog.balanceLabelOverdraft")
          : kind === "대출"
            ? t("editDialog.balanceLabelLoan")
            : t("editDialog.balanceLabelAccount");

  const lines: ReactNode[] = [];
  if (overLimitBy > 0) {
    lines.push(
      t("editDialog.overLimitHelp", {
        amount: formatOriginalAmount(overLimitBy, currency, i18n.language),
      }),
    );
  }
  // 이 칸은 이월 금액이라 지금 갚을 돈과 다르다 — 지금 미결제 잔액을 설명으로 알려 둬서 둘을 헷갈리지 않게 한다(D7).
  if (isExistingCreditCard) {
    lines.push(
      <span key="unpaid" data-testid="current-unpaid" className="num">
        {t("editDialog.currentUnpaid", { balance: money(currentUnpaid) })}
      </span>,
    );
  }
  // 이월 거래가 든 회차가 결제됐으면 그 금액은 이미 청구가 끝났다 — 고치면 끝난 회차의 기록이 흔들린다(D15).
  if (carryoverLocked) {
    lines.push(
      <span key="locked" data-testid="carryover-locked">
        {t("editDialog.carryoverLocked")}
      </span>,
    );
  } else if (editingGroup === "card") {
    lines.push(
      dueField
        ? newCardBillWindow
          ? t("editDialog.carryoverAfterHelp", {
              date: formatDay(newCardBillWindow.afterDate).md,
            })
          : t("editDialog.carryoverAfterHelpNoDate")
        : t("editDialog.cardBalanceHelp"),
    );
  }
  if (isOverdraft) lines.push(t("editDialog.overdraftHelp"));
  if (kind === "대출") lines.push(t("editDialog.loanHelp"));
  // 잔액 수동 수정 = 새 앵커. 그 시각 이전 내역은 이 잔액에 이미 들어 있는 것으로 보고 이후 내역만 더해진다.
  if (item && editingGroup !== "card")
    lines.push(t("editDialog.balanceEditHelp"));

  return (
    <Field
      label={label}
      readOnly={carryoverLocked}
      description={
        lines.length === 0 ? undefined : (
          <span className="flex flex-col gap-x1">
            {lines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </span>
        )
      }
      descriptionIcon={
        overLimitBy > 0 ? <TriangleAlert aria-hidden /> : undefined
      }
    >
      <AmountInput
        max={MAX_BALANCE}
        value={balanceStr}
        onValueChange={setBalanceStr}
        unit={unit}
      />
    </Field>
  );
}
