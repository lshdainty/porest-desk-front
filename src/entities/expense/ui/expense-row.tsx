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

/** 금액 글자 수(부호 · 쉼표 · 원 포함)가 이 이상이면 값을 설명 아래로 내린다 — "−123,456,789원"(12)은 옆에, "−1,234,567,890원"(15)부터 아래 */
const STACK_AMOUNT_CHARS = 13;

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
  highlighted = false,
}: {
  expense: Expense;
  onClick?: (e: Expense) => void;
  right?: ReactNode;
  /** true 면 day-head 가 없는 컨텍스트(홈 최근거래 등)에서 시각 대신 "M월 D일 (요일)" 표시 */
  showDate?: boolean;
  /** 금액을 가리는 카드 — 기본 가계부 거래 목록, 홈은 `home.todaySpend`(I-06 29) */
  maskCard?: HideCardKey;
  /**
   * **임시 인자 — 호스트가 옛 부품을 걷을 때까지만 둔다.** 줄이 제 좌우 24 를 갖는가(ds List 기본). 기본 false 는 날짜 머리 ·
   * 이체 줄 · 다이얼로그가 아직 옛 부품이라 바깥 24 를 쥐고 있어서다(줄만 24 로 옮기면 한 목록 안에서 글자 자리가 갈린다).
   * 걷는 몫: 가계부는 끝남(I-07 4 — gutter 를 준다) · 검색 = I-08 08-3 · 자산 상세 · 거래 상세 = 아직 지시서 없음. 다 옮겨지면 기본 true 로 바꾸고
   * 이 인자를 지운다. 띠 · 카드 안 목록(홈)은 true.
   */
  gutter?: boolean;
  /** 알림 · 검색에서 들어온 줄 — ds List 강조(brand-weak 바탕 · 누름 brand-weak-pressed · 설명 글 보정). 줄을 누를 수 있을 때만 의미가 있다 */
  highlighted?: boolean;
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
        <TitleBadge label={t("fixed.badge", { ns: "expense" })} tone="brand" />
      )}
      {splitCount > 0 && (
        <span className="ml-x1_5 inline-flex items-center gap-x0_5 align-middle text-t3 font-bold text-fg-brand">
          <Split aria-hidden size={16} />
          {splitCount}
        </span>
      )}
    </>
  );

  // 큰 금액은 설명 줄에서 폭을 다 빼앗아 카테고리 · 자산 · 시각이 한 글자("주…")로 줄어든다(앱에서 확인된 회귀와 같은 값).
  // 줄 안 폭이 16em 미만이면 값을 본문 아래로 내린다는 ds 규칙(CHANGELOG 03-D 결정 1 B)을 줄 폭이 아니라 금액 길이로도 건다 —
  // 금액을 설명 아래 한 줄로 내리고 설명은 제 폭을 갖는다. 호출자가 `right` 를 주면 그대로 오른쪽에 둔다.
  const amountChars =
    (isEn() ? 1 : 0) +
    1 +
    KRW(expense.amount, { abs: true }).length +
    (isEn() ? 0 : 1);
  const stacked = !right && amountChars >= STACK_AMOUNT_CHARS;
  const detail = (
    // 큰 금액 줄은 설명을 한 줄로 자르지 않고 줄을 바꿔 카테고리 · 자산 · 시각이 다 보이게 한다
    <TagGroup size="t3" truncate={!stacked}>
      <TagGroupItem>{expense.categoryName ?? t("others")}</TagGroupItem>
      {/* 줄어드는 차례: 계좌 이름이 먼저 · 가장 많이, 카테고리가 그다음, 시각은 줄지 않는다 — 긴 계좌 이름이 카테고리를 한 글자로 만들지 않게 */}
      {expense.assetName && (
        <TagGroupItem shrink={4}>{expense.assetName}</TagGroupItem>
      )}
      {expense.expenseDate &&
        (showDate ? (
          <TagGroupItem shrink={0}>
            {txDateFull(expense.expenseDate)}
          </TagGroupItem>
        ) : (
          time && <TagGroupItem shrink={0}>{time}</TagGroupItem>
        ))}
    </TagGroup>
  );

  const amountEl = (
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
  const suffix = right ?? (stacked ? undefined : amountEl);
  const detailNode = stacked ? (
    <>
      {detail}
      <span className="mt-x0_5 block">{amountEl}</span>
    </>
  ) : (
    detail
  );

  const prefix = (
    <ListTile
      style={{ background: palette.bg, color: palette.color }}
      aria-hidden
    >
      <Icon name={expense.categoryIcon || "tag"} size={20} />
    </ListTile>
  );

  return (
    <List
      className={cn(
        // 임시 — 호스트가 바깥 24 를 쥔 동안 줄의 좌우 24 를 걷는다(gutter 인자 주석)
        !gutter && "[&_[data-slot=list-content]]:px-0",
      )}
    >
      {onClick ? (
        <ListButtonItem
          title={title}
          detail={detailNode}
          prefix={prefix}
          suffix={suffix}
          align="top"
          highlighted={highlighted}
          onClick={() => onClick(expense)}
        />
      ) : (
        <ListItem
          title={title}
          detail={detailNode}
          prefix={prefix}
          suffix={suffix}
          align="top"
          highlighted={highlighted}
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
