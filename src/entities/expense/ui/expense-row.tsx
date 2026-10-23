import type { ReactNode } from "react";
import { Split } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ds/badge";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { TagGroup, TagGroupItem } from "@/shared/ds/tag-group";
import { cn } from "@/shared/lib/cn";
import { KRW, MINUS, isEn } from "@/shared/lib/groo/format";
import { HideUnit, MaskAmount } from "@/shared/lib/groo/hide-amounts";
import {
  kindOfExpense,
  type HideCardKey,
} from "@/shared/lib/groo/hide-amounts-cards";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import {
  isScheduledDate,
  txDateFull,
  txTimeLabel,
} from "@/shared/lib/groo/ledger-format";
import { Icon } from "@/shared/ui/groo/primitives";
import type { Expense } from "../model/types";
import { isRefundedTx } from "../lib/expense-aggregate";

/**
 * 거래 한 건 — 지출/수입. 목록 어디서든 같은 모양이어야 해서 entity 가 소유한다.
 *
 * ds List 줄이다(I-06 28 — list.md:124 · :128 · :156): 제목 t5 · 400 줄바꿈, 설명 t3 한 줄 말줄임(Tag Group),
 * 앞 타일 40 · 모서리 12, 뒤 금액 t5 · 700 · 원까지 한 줄(수입만 fg-brand + "+"). 예정 · 환불 줄은 흐리게 하지 않고
 * 금액만 fg-neutral-subtle — 배지가 말한다.
 */
export function ExpenseRow({
  expense,
  onClick,
  right,
  showDate,
  maskCard = "ledger.txList",
  gutter = false,
}: {
  expense: Expense;
  onClick?: (e: Expense) => void;
  right?: ReactNode;
  /** true 면 day-head 가 없는 컨텍스트(홈 최근거래 등)에서 시각 대신 "M월 D일 (요일)" 표시 */
  showDate?: boolean;
  /** 금액을 가리는 카드 — 기본 가계부 거래 목록, 홈은 `home.todaySpend`(I-06 29) */
  maskCard?: HideCardKey;
  /**
   * 줄이 제 좌우 24 를 갖는가(ds List 기본). 기본 false — 날짜 머리 · 이체 줄 · 다이얼로그가 좌우 24 를 쥔 목록에서
   * 글자 자리가 어긋나지 않게 한다(이체 줄 · 날짜 머리가 ds 로 옮겨지면 true 로 바꾼다). 띠 · 카드 안 목록(홈)은 true.
   */
  gutter?: boolean;
}) {
  const { t } = useTranslation("common");
  const isIncome = expense.expenseType === "INCOME";
  // 환불된 거래 — 합계에서 빠져 있다. 흐리게 두지 않고 배지로 갈라 준다. 금액은 원래 부호 그대로
  // 두고 취소선으로 "없는 것으로 셌다" 를 말한다.
  const refunded = isRefundedTx(expense);
  // 기록만 — 결제가 끝난 회차에 뒤늦게 적은 카드 지출. 합계에는 들어가므로 흐리지 않고
  // 배지로만 "계좌에서는 안 빠졌다" 를 알린다(닫힌 회차 규칙 R2).
  //
  // **통째로 기록용인 거래에만** 단다(D10). 할부가 닫힌 회차와 열린 회차에 걸치면 지난
  // 회차분만 기록용이라 행 배지는 거짓이 된다 — 그 몫은 상세가 "이 중 N원" 으로 말한다.
  // 옛 서버는 금액을 안 주는데, 그때는 표식이 곧 통째로 기록용이었다.
  const recordOnly =
    !refunded &&
    expense.cardSettledThrough != null &&
    (expense.recordOnlyAmount ?? Math.abs(expense.amount)) ===
      Math.abs(expense.amount);
  const scheduled = isScheduledDate(expense.expenseDate);
  // 합계에 안 드는 줄(예정 · 환불) — 금액만 옅게
  const outOfSum = scheduled || refunded;
  const palette = getPaletteByColor(expense.categoryColor ?? null);
  const splitCount = expense.splitCategoryRowIds?.length ?? 0;
  const time = expense.expenseDate ? txTimeLabel(expense.expenseDate) : "";

  const title = (
    <>
      {expense.merchant ??
        expense.description ??
        expense.categoryName ??
        t("transaction")}
      {/* 제목 뒤 배지 — 제목 글 뒤에 이어 붙어 함께 줄을 바꾼다 */}
      {scheduled && <TitleBadge label={t("scheduled")} />}
      {refunded && <TitleBadge label={t("refunded")} />}
      {recordOnly && <TitleBadge label={t("recordOnly")} />}
      {/* 고정 수입·지출 — 환불된 거래는 합계에서 빠져 있어 표시할 이유가 없다. */}
      {expense.isFixed && !refunded && (
        <TitleBadge label={t("fixed.badge")} tone="brand" />
      )}
      {splitCount > 0 && (
        <span className="ml-x1_5 inline-flex items-center gap-x0_5 align-middle text-t3 font-bold text-fg-brand">
          <Split aria-hidden size={14} />
          {splitCount}
        </span>
      )}
    </>
  );

  const detail = (
    <TagGroup size="t3" truncate>
      <TagGroupItem>{expense.categoryName ?? t("others")}</TagGroupItem>
      {expense.assetName && <TagGroupItem>{expense.assetName}</TagGroupItem>}
      {expense.expenseDate &&
        (showDate ? (
          <TagGroupItem>{txDateFull(expense.expenseDate)}</TagGroupItem>
        ) : (
          time && <TagGroupItem>{time}</TagGroupItem>
        ))}
    </TagGroup>
  );

  const suffix = right ?? (
    <span
      className={cn(
        "whitespace-nowrap font-bold tabular-nums",
        outOfSum
          ? "text-fg-neutral-subtle"
          : isIncome
            ? "text-fg-brand"
            : "text-fg-neutral",
      )}
    >
      <MaskAmount card={maskCard} kind={kindOfExpense(expense.expenseType)}>
        <span className={refunded ? "line-through" : undefined}>
          {isIncome ? "+" : MINUS}
          {isEn() ? "₩" : ""}
          {KRW(expense.amount, { abs: true })}
        </span>
      </MaskAmount>
      <HideUnit card={maskCard} kind={kindOfExpense(expense.expenseType)}>
        {isEn() ? "" : "원"}
      </HideUnit>
    </span>
  );

  const prefix = (
    <ListTile
      style={{ background: palette.bg, color: palette.color }}
      aria-hidden
    >
      <Icon name={expense.categoryIcon || "tag"} size={20} strokeWidth={1.9} />
    </ListTile>
  );

  return (
    <List
      className={cn(
        // 한 줄만 든 목록 — 줄의 좌우 24 는 쓰는 자리가 정한다(gutter)
        !gutter && "[&_[data-slot=list-content]]:px-0",
      )}
    >
      {onClick ? (
        <ListButtonItem
          title={title}
          detail={detail}
          prefix={prefix}
          suffix={suffix}
          align="top"
          onClick={() => onClick(expense)}
        />
      ) : (
        <ListItem
          title={title}
          detail={detail}
          prefix={prefix}
          suffix={suffix}
          align="top"
        />
      )}
    </List>
  );
}

// 제목 뒤 배지 — ds Badge weak medium(badge.md "작은 손 배지 → medium"). 예정 · 기록만 · 환불은 중립, 고정은 브랜드
function TitleBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "brand";
}) {
  return (
    <Badge
      variant="weak"
      tone={tone}
      size="medium"
      className="ml-x1_5 align-middle"
    >
      {label}
    </Badge>
  );
}
