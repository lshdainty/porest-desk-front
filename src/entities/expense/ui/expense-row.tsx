import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { KRW, isEn } from "@/shared/lib/porest/format";
import { HideUnit, MaskAmount } from "@/shared/lib/porest/hide-amounts";
import { kindOfExpense } from "@/shared/lib/porest/hide-amounts-cards";
import {
  isScheduledDate,
  txDateFull,
  txTimeLabel,
} from "@/shared/lib/porest/ledger-format";
import { CategoryChip } from "@/shared/ui/porest/category-chip";
import { Icon } from "@/shared/ui/porest/primitives";
import {
  LedgerRow,
  LedgerRowAmt,
  LedgerRowMain,
  LedgerRowSep,
  LedgerRowSub,
  LedgerRowTitle,
  ScheduledBadge,
} from "@/shared/ui/porest/ledger";
import type { Expense } from "../model/types";

/** 거래 한 건 — 지출/수입. 목록 어디서든 같은 모양이어야 해서 entity 가 소유한다. */
export function ExpenseRow({
  expense,
  onClick,
  right,
  showDate,
}: {
  expense: Expense;
  onClick?: (e: Expense) => void;
  right?: ReactNode;
  /** true 면 day-head 가 없는 컨텍스트(홈 최근거래 등)에서 시각 대신 "M월 D일 (요일)" 표시 */
  showDate?: boolean;
}) {
  const { t } = useTranslation("common");
  const isIncome = expense.expenseType === "INCOME";
  return (
    <LedgerRow
      onClick={onClick ? () => onClick(expense) : undefined}
      dim={isScheduledDate(expense.expenseDate)}
    >
      <CategoryChip
        name={expense.categoryName ?? t("others")}
        color={expense.categoryColor ?? null}
        icon={expense.categoryIcon ?? null}
      />
      <LedgerRowMain as={onClick ? "button" : "div"}>
        <LedgerRowTitle className="flex items-center gap-[5px] overflow-visible">
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {expense.merchant ??
              expense.description ??
              expense.categoryName ??
              t("transaction")}
          </span>
          {/* 아직 오지 않은 거래(반복거래 선생성분) — 합계에는 안 들어간다. */}
          {isScheduledDate(expense.expenseDate) && (
            <ScheduledBadge label={t("scheduled")} />
          )}
          {(expense.splitCategoryRowIds?.length ?? 0) > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                flexShrink: 0,
                color: "var(--fg-brand)",
              }}
            >
              <Icon name="split" size={12} />
              <span
                style={{ fontSize: "var(--text-caption)", fontWeight: 700 }}
              >
                {expense.splitCategoryRowIds!.length}
              </span>
            </span>
          )}
        </LedgerRowTitle>
        <LedgerRowSub>
          <span>{expense.categoryName ?? t("others")}</span>
          {expense.assetName && (
            <>
              <LedgerRowSep />
              <span>{expense.assetName}</span>
            </>
          )}
          {expense.expenseDate &&
            (showDate ? (
              <>
                <LedgerRowSep />
                <span>{txDateFull(expense.expenseDate)}</span>
              </>
            ) : (
              txTimeLabel(expense.expenseDate) && (
                <>
                  <LedgerRowSep />
                  <span>{txTimeLabel(expense.expenseDate)}</span>
                </>
              )
            ))}
        </LedgerRowSub>
      </LedgerRowMain>
      <div>
        {right ?? (
          <LedgerRowAmt>
            <MaskAmount
              card="ledger.txList"
              kind={kindOfExpense(expense.expenseType)}
            >
              {isIncome ? "+" : "-"}
              {isEn() ? "₩" : ""}
              {KRW(expense.amount, { abs: true })}
            </MaskAmount>
            <HideUnit
              card="ledger.txList"
              kind={kindOfExpense(expense.expenseType)}
            >
              {isEn() ? "" : "원"}
            </HideUnit>
          </LedgerRowAmt>
        )}
      </div>
    </LedgerRow>
  );
}
