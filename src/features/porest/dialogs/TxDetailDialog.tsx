import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Repeat,
  Scissors,
  Users,
  Undo2,
  Lock,
} from "lucide-react";
import { KRW, money, isEn, formatDay } from "@/shared/lib/porest/format";
import { formatOriginalAmount } from "@/shared/lib/porest/currency";
import { DateGroupHeader } from "@/shared/ui/date-group-header";
import {
  HideUnit,
  MaskAmount,
  WonUnit,
} from "@/shared/lib/porest/hide-amounts";
import { wonPre } from "@/shared/lib/porest/hide-amounts-core";
import { kindOfExpense } from "@/shared/lib/porest/hide-amounts-cards";
import { ConfirmDialog, ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalViewFooter } from "@/shared/ui/porest/modal-footer";
import {
  DetailField,
  DetailFieldGroup,
  DetailHero,
  DetailQuickAction,
  DetailSection,
  DetailStatSplit,
} from "@/shared/ui/porest/detail";
import { CategoryChip, ExpenseRow } from "@/shared/ui/porest/expense-row";
import {
  useDeleteExpense,
  useExpenseCategories,
  useSearchExpenses,
} from "@/features/expense";
import { useExpenseSplits } from "@/features/expense-split";
import { useRecurringTransactions } from "@/features/recurring-transaction";
import { useDutchPays } from "@/features/dutch-pay";
import { useAssets } from "@/features/asset";
import type { Expense, ExpenseCategory } from "@/entities/expense";
import type { Asset } from "@/entities/asset";
import { getPaletteByColor } from "./CategoryEditDialog";
import { SplitTxDialog } from "./SplitTxDialog";
import { RecurringFromTxDialog } from "./RecurringFromTxDialog";
import { DutchPayFromTxDialog } from "./DutchPayFromTxDialog";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";

const toDayKey = (iso?: string | null): string => (iso ? iso.slice(0, 10) : "");
const toTimeKey = (iso?: string | null): string | null => {
  if (!iso || iso.length < 16) return null;
  const t = iso.slice(11, 16);
  return t === "00:00" ? null : t;
};

type Props = {
  expense: Expense;
  onClose: () => void;
  /** 부모가 AddTxSheet 편집 모드를 여는 콜백 */
  onEdit?: (expense: Expense) => void;
  /**
   * 부모가 AddTxSheet 를 환불 모드로 여는 콜백.
   * 지출 거래에만 노출된다 — 수입·환불 자체를 다시 환불할 일은 없다.
   */
  onRefund?: (expense: Expense) => void;
  mobile: boolean;
};

export function TxDetailDialog({
  expense,
  onClose,
  onEdit,
  onRefund,
  mobile,
}: Props) {
  const { t, i18n } = useTranslation("expense");
  const { t: tc } = useTranslation("common");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openSub, setOpenSub] = useState<
    "split" | "recurring" | "dutch" | null
  >(null);
  const [splitExpanded, setSplitExpanded] = useState(true);
  const deleteMut = useDeleteExpense();

  const categoriesQ = useExpenseCategories();
  const assetsQ = useAssets();
  const splitsQ = useExpenseSplits(expense.rowId);
  const recurringsQ = useRecurringTransactions();
  const dutchPaysQ = useDutchPays();

  const isLoading =
    categoriesQ.isLoading ||
    assetsQ.isLoading ||
    splitsQ.isLoading ||
    recurringsQ.isLoading ||
    dutchPaysQ.isLoading;

  const linkedRecurring = (recurringsQ.data ?? []).filter(
    (r) => r.sourceExpenseRowId === expense.rowId,
  );
  const linkedDutchPays = (dutchPaysQ.data ?? []).filter(
    (d) => d.sourceExpenseRowId === expense.rowId,
  );
  const splitCount = splitsQ.data?.length ?? 0;

  const category: ExpenseCategory | undefined = (categoriesQ.data ?? []).find(
    (c) => c.rowId === expense.categoryRowId,
  );
  const palette = getPaletteByColor(category?.color);
  const asset: Asset | undefined = (assetsQ.data?.assets ?? []).find(
    (a) => a.rowId === expense.assetRowId,
  );

  const isIncome = expense.expenseType === "INCOME";
  // 종류는 부호가 아니라 타입으로 — 환불이 음수 지출이라 부호로 가르면 수입으로 샌다.
  const txKind = kindOfExpense(expense.expenseType);

  // 같은 가맹점의 같은 달 거래 (상세 제외)
  const merchantKey = expense.merchant?.trim() ?? "";
  const [yStr, mStr] = (expense.expenseDate ?? "").slice(0, 7).split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startDate = year && month ? `${year}-${pad(month)}-01` : undefined;
  const endDate =
    year && month
      ? `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
      : undefined;

  const historyQ = useSearchExpenses(
    merchantKey ? { merchant: merchantKey, startDate, endDate } : {},
  );

  const history = useMemo(() => {
    if (!historyQ.data) return [];
    return historyQ.data
      .filter((t) => t.rowId !== expense.rowId)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 5);
  }, [historyQ.data, expense.rowId]);

  // 가계부 메인 리스트 미러 — 날짜별 그룹(최신순 유지). 합계는 상단 스탯이 대신.
  const historyGroups = useMemo(() => {
    const m = new Map<string, Expense[]>();
    for (const tx of history) {
      const k = tx.expenseDate.slice(0, 10);
      const arr = m.get(k);
      if (arr) arr.push(tx);
      else m.set(k, [tx]);
    }
    return [...m.entries()];
  }, [history]);

  const merchantMonthCount = historyQ.data?.length ?? 0;
  const merchantMonthTotal = (historyQ.data ?? []).reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  );

  const day = toDayKey(expense.expenseDate);
  const time = toTimeKey(expense.expenseDate);
  const paymentMethodLabel = (() => {
    switch (expense.paymentMethod) {
      case "CASH":
        return t("form.paymentMethod.CASH");
      case "CARD":
        return t("form.paymentMethod.CARD");
      case "TRANSFER":
        return t("paymentTransferFull");
      case "OTHER":
        return t("form.paymentMethod.OTHER");
      default:
        return null;
    }
  })();

  const handleEdit = () => {
    if (!onEdit) return;
    onEdit(expense);
  };

  const handleConfirmDelete = () => {
    deleteMut.mutate(expense.rowId, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
      },
    });
  };

  // 시스템이 만든 거래(매도 실현손익·이체 이자)는 원본을 지워야 사라진다.
  // 버튼을 눌러야 거부 토스트가 뜨는 대신 아예 감춘다.
  const isAutoGenerated = expense.autoSource != null;

  const Footer = (
    <ModalViewFooter
      onDelete={isAutoGenerated ? undefined : () => setConfirmDelete(true)}
      deleting={deleteMut.isPending}
      onEdit={onEdit && !isAutoGenerated ? handleEdit : undefined}
    />
  );

  const title = isIncome
    ? t("txDetail.incomeTitle")
    : t("txDetail.expenseTitle");
  const displayMerchant =
    expense.merchant ??
    expense.description ??
    category?.categoryName ??
    t("transaction");

  return (
    <>
      <ModalShell
        title={title}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {isLoading ? (
          <TxDetailSkeleton />
        ) : (
          <>
            {/* Hero — 플랫 좌측 정렬 (design 신판 토스 톤) */}
            <DetailHero
              icon={
                <CategoryChip
                  name={category?.categoryName}
                  color={category?.color ?? null}
                  icon={category?.icon ?? null}
                  size="sm"
                />
              }
              title={displayMerchant}
              meta={
                (day || time) && (
                  <>
                    {day}
                    {time && ` · ${time}`}
                  </>
                )
              }
            >
              <span style={{ color: "var(--fg-primary)" }}>
                <MaskAmount card="ledger.txDetail" kind={txKind}>
                  {isIncome ? "+" : "−"}
                  {wonPre()}
                  {KRW(expense.amount, { abs: true })}
                </MaskAmount>
                {!isEn() && (
                  <HideUnit>
                    <span className="ml-0.5 text-[length:var(--text-title-md)]">
                      원
                    </span>
                  </HideUnit>
                )}
              </span>
            </DetailHero>

            {/* Fields — 카드 없는 플랫 행 */}
            <DetailFieldGroup>
              <DetailField label={t("category")}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "var(--radius-xs)",
                      background: palette.color,
                    }}
                  />
                  <span style={{ fontWeight: "600" }}>
                    {category?.categoryName ?? t("txDetail.uncategorized")}
                  </span>
                </div>
              </DetailField>
              <DetailField label={t("form.amount")}>
                <span className="num" style={{ fontWeight: "700" }}>
                  <MaskAmount card="ledger.txDetail" kind={txKind}>
                    {isIncome ? "+" : "−"}
                    {wonPre()}
                    {KRW(expense.amount, { abs: true })}
                  </MaskAmount>
                  <WonUnit card="ledger.txDetail" />
                </span>
              </DetailField>
              {expense.originalCurrency && expense.originalAmount != null && (
                <DetailField label={t("txDetail.foreignPayment")}>
                  <span className="num" style={{ fontWeight: "600" }}>
                    {formatOriginalAmount(
                      expense.originalAmount,
                      expense.originalCurrency,
                      i18n.language,
                    )}
                    {expense.exchangeRate != null && (
                      <span
                        style={{
                          color: "var(--fg-tertiary)",
                          fontWeight: "400",
                        }}
                      >
                        {" × "}
                        {expense.exchangeRate.toLocaleString(i18n.language)}
                      </span>
                    )}
                  </span>
                </DetailField>
              )}
              {asset && (
                <DetailField label={t("accountCard")}>
                  <span style={{ fontWeight: "500" }}>
                    {asset.institution
                      ? `${asset.institution} · ${asset.assetName}`
                      : asset.assetName}
                  </span>
                </DetailField>
              )}
              {paymentMethodLabel && (
                <DetailField label={t("paymentMethodLabel")}>
                  <span style={{ fontWeight: "500" }}>
                    {paymentMethodLabel}
                  </span>
                </DetailField>
              )}
              <DetailField label={t("dateTime")}>
                <span style={{ fontWeight: "500" }}>
                  {day}
                  {time && ` ${time}`}
                </span>
              </DetailField>
              <DetailField label={t("memo")}>
                <span
                  style={{
                    fontWeight: "500",
                    color: expense.description
                      ? "var(--fg-primary)"
                      : "var(--fg-tertiary)",
                  }}
                >
                  {expense.description || t("txDetail.empty")}
                </span>
              </DetailField>
            </DetailFieldGroup>

            {/* 시스템이 만든 거래 — 왜 못 고치는지 알려 준다. 버튼만 없으면 고장으로 보인다. */}
            {isAutoGenerated && (
              <DetailSection>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-sunken)",
                    fontSize: "var(--text-caption)",
                    color: "var(--fg-tertiary)",
                    lineHeight: 1.6,
                  }}
                >
                  <Lock size={14} style={{ flexShrink: 0 }} />
                  <span>
                    {t(`addTx.autoSource.${expense.autoSource}`, {
                      defaultValue: t("addTx.autoSource.default"),
                    })}
                  </span>
                </div>
              </DetailSection>
            )}

            {/* 환불 연결 — 이 거래에 달린 환불이 있으면 알린다. 지우면 함께 사라지고,
            지출 총액도 상계된 값으로 잡혀 있다는 걸 여기서만 알 수 있다. */}
            {(expense.refundCount ?? 0) > 0 && (
              <DetailSection>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-sunken)",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--fg-secondary)",
                  }}
                >
                  <Undo2
                    size={15}
                    style={{ flexShrink: 0, color: "var(--fg-tertiary)" }}
                  />
                  <span>
                    {t("txDetail.refundLinked", {
                      count: expense.refundCount,
                      amount: KRW(expense.refundedAmount),
                    })}
                  </span>
                </div>
              </DetailSection>
            )}

            {/* Quick actions — 원형 아이콘 3열 (분할/반복/더치페이 진입) */}
            <DetailSection>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {/* 환불 — 지출에만. 수입으로 기록하되 원거래에 묶여 통계에서 지출을 상계한다
                (수입이 부풀지 않는다). 부분 환불이면 금액만 고치면 된다. */}
                {!isIncome && onRefund && (
                  <DetailQuickAction
                    icon={Undo2}
                    label={t("txDetail.refund")}
                    onClick={() => onRefund(expense)}
                  />
                )}
                <DetailQuickAction
                  icon={Scissors}
                  label={t("splitTitle")}
                  active={splitCount > 0}
                  badge={
                    splitCount > 0
                      ? t("txDetail.countItems", { count: splitCount })
                      : null
                  }
                  onClick={() => setOpenSub("split")}
                />
                <DetailQuickAction
                  icon={Repeat}
                  label={t("txDetail.recurring")}
                  active={linkedRecurring.length > 0}
                  badge={
                    linkedRecurring.length > 0 ? t("txDetail.linked") : null
                  }
                  onClick={() => setOpenSub("recurring")}
                />
                <DetailQuickAction
                  icon={Users}
                  label={t("txDetail.dutchPay")}
                  active={linkedDutchPays.length > 0}
                  badge={
                    linkedDutchPays.length > 0
                      ? t("txDetail.countCases", {
                          count: linkedDutchPays.length,
                        })
                      : null
                  }
                  onClick={() => setOpenSub("dutch")}
                />
              </div>
            </DetailSection>

            {/* 분할 내역 — 플랫 섹션(비율 바 + 행), 접기 토글 */}
            {splitCount > 0 && (
              <DetailSection
                title={
                  <>
                    {t("splitTitle")}{" "}
                    <span className="num">
                      {t("txDetail.countItems", { count: splitCount })}
                    </span>
                  </>
                }
                trailing={
                  // 접기 토글 — 합계 우측 chevron (사용자 결정)
                  <button
                    type="button"
                    onClick={() => setSplitExpanded((v) => !v)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    <span
                      className="num"
                      style={{
                        fontSize: "var(--text-caption)",
                        color: "var(--fg-tertiary)",
                      }}
                    >
                      {t("txDetail.sumLabel")}{" "}
                      <MaskAmount card="ledger.txDetail" kind={txKind}>
                        {money(Math.abs(expense.amount))}
                      </MaskAmount>
                    </span>
                    <span
                      style={{
                        color: "var(--fg-tertiary)",
                        display: "inline-flex",
                      }}
                    >
                      {splitExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </button>
                }
              >
                <div
                  style={{
                    display: "flex",
                    height: 8,
                    borderRadius: "var(--radius-pill)",
                    overflow: "hidden",
                    background: "var(--bg-sunken)",
                  }}
                >
                  {(splitsQ.data ?? []).map((s) => {
                    const total = Math.abs(expense.amount);
                    const ratio = total > 0 ? s.amount / total : 0;
                    const cat = (categoriesQ.data ?? []).find(
                      (c) => c.rowId === s.categoryRowId,
                    );
                    return ratio > 0 ? (
                      <div
                        key={s.rowId}
                        style={{
                          width: `${ratio * 100}%`,
                          background: getPaletteByColor(cat?.color).color,
                        }}
                      />
                    ) : null;
                  })}
                </div>
                {splitExpanded && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {(splitsQ.data ?? []).map((s) => {
                      const total = Math.abs(expense.amount);
                      const pct =
                        total > 0 ? Math.round((s.amount / total) * 100) : 0;
                      const cat = (categoriesQ.data ?? []).find(
                        (c) => c.rowId === s.categoryRowId,
                      );
                      const pal = getPaletteByColor(cat?.color);
                      return (
                        <div
                          key={s.rowId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "var(--radius-xs)",
                              background: pal.color,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "var(--text-label-sm)",
                                fontWeight: "600",
                                color: "var(--fg-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {s.label && s.label.trim()
                                ? s.label
                                : (s.categoryName ?? t("item"))}
                            </div>
                            <div
                              style={{
                                fontSize: "var(--text-caption)",
                                color: "var(--fg-tertiary)",
                              }}
                            >
                              {s.categoryName ?? "-"} · {pct}%
                            </div>
                          </div>
                          {/* 행 금액 중립색 — 가계부 리스트 정합(사용자 결정) */}
                          <div
                            className="num"
                            style={{
                              fontSize: "var(--text-label-sm)",
                              fontWeight: "700",
                              color: "var(--fg-primary)",
                            }}
                          >
                            <MaskAmount card="ledger.txDetail" kind={txKind}>
                              {isIncome ? "+" : "−"}
                              {money(s.amount)}
                            </MaskAmount>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DetailSection>
            )}

            {/* Merchant history — 섹션 제목 + 2열 스플릿 통계 + 플랫 리스트 */}
            {merchantKey && history.length > 0 && (
              <DetailSection
                title={t("txDetail.prevAtMerchant", { merchant: merchantKey })}
              >
                <DetailStatSplit
                  className="mt-3 mb-1"
                  items={[
                    {
                      label: t("txDetail.thisMonth"),
                      value: t("txDetail.countTimes", {
                        count: merchantMonthCount,
                      }),
                    },
                    {
                      label: t("txDetail.sumLabel"),
                      value: (
                        <>
                          <MaskAmount card="ledger.txDetail" kind={txKind}>
                            {isIncome ? "+" : "−"}
                            {wonPre()}
                            {KRW(merchantMonthTotal)}
                          </MaskAmount>
                          <WonUnit card="ledger.txDetail" />
                        </>
                      ),
                    },
                  ]}
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {historyGroups.map(([d, items]) => {
                    const { md, dow } = formatDay(d);
                    return (
                      <div key={d}>
                        <DateGroupHeader date={md} weekday={dow} />
                        {items.map((tx) => (
                          <ExpenseRow key={tx.rowId} expense={tx} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </DetailSection>
            )}
          </>
        )}
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteConfirm.title")}
          message={
            (expense.refundCount ?? 0) > 0
              ? `${t("txDetail.deleteMessage", { name: displayMerchant })}\n\n${t(
                  "addTx.deleteRefundWarn",
                  {
                    count: expense.refundCount,
                    amount: KRW(expense.refundedAmount),
                  },
                )}`
              : t("txDetail.deleteMessage", { name: displayMerchant })
          }
          confirmLabel={tc("delete")}
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {openSub === "split" && (
        <SplitTxDialog
          expense={expense}
          onClose={() => setOpenSub(null)}
          mobile={mobile}
        />
      )}
      {openSub === "recurring" && (
        <RecurringFromTxDialog
          expense={expense}
          onClose={() => setOpenSub(null)}
          mobile={mobile}
        />
      )}
      {openSub === "dutch" && (
        <DutchPayFromTxDialog
          expense={expense}
          onClose={() => setOpenSub(null)}
          mobile={mobile}
        />
      )}
    </>
  );
}

/** TxDetail skeleton — 신판 플랫 미러: hero(아이콘+가맹점+금액+날짜) + 필드 행 + quick 3원. */
function TxDetailSkeleton() {
  return (
    <>
      {/* Hero */}
      <div className="pb-4">
        <div className="flex items-center gap-2">
          <SkeletonBase className="h-8 w-8 rounded-lg" />
          <SkeletonBase className="h-4 w-28" />
        </div>
        <SkeletonBase className="mt-3 h-9 w-44" />
        {/* meta(날짜·시간) — DetailHero 는 mt-1 */}
        <SkeletonBase className="mt-1 h-3 w-28" />
      </div>

      {/* Field rows */}
      <div className="border-t border-[var(--border-subtle)] pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <SkeletonBase className="h-4 w-16" />
            <SkeletonBase className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)] pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-1 py-2">
            <SkeletonBase className="h-11 w-11 rounded-full" />
            <SkeletonBase className="h-3 w-14" />
          </div>
        ))}
      </div>
    </>
  );
}
