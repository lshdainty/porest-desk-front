import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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
import { CategoryChip } from "@/shared/ui/porest/category-chip";
import { ExpenseRow, isRefundedTx } from "@/entities/expense";
import { Button } from "@/shared/ui/button";
import {
  useDeleteExpense,
  useExpenseCategories,
  useSearchExpenses,
  useRefundExpense,
  useRefundPreview,
  useCancelRefund,
} from "@/features/expense";
import { toast } from "sonner";
import { PaidRefundNote } from "@/features/expense/ui/PaidRefundNote";
import { useExpenseSplits } from "@/features/expense-split";
import { useRecurringTransactions } from "@/features/recurring-transaction";
import { useDutchPays } from "@/features/dutch-pay";
import { todayLocalKey } from "@/shared/lib/date";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useAssets } from "@/features/asset";
import type { Expense, ExpenseCategory } from "@/entities/expense";
import type { Asset } from "@/entities/asset";
import { getPaletteByColor } from "@/shared/lib/porest/chart-palette";
import { SplitTxDialog } from "@/features/expense-split/ui/SplitTxDialog";
import { RecurringFromTxDialog } from "@/features/recurring-transaction/ui/RecurringFromTxDialog";
import { DutchPayFromTxDialog } from "@/features/dutch-pay/ui/DutchPayFromTxDialog";
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
  mobile: boolean;
};

export function TxDetailDialog({
  expense: expenseProp,
  onClose,
  onEdit,
  mobile,
}: Props) {
  const { t, i18n } = useTranslation("expense");
  const { t: tc } = useTranslation("common");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  // 환불일 — 기본은 오늘. 며칠 전에 환불한 걸 나중에 적는 경우가 있어 고칠 수 있게 둔다.
  const [refundDate, setRefundDate] = useState("");
  const [confirmCancelRefund, setConfirmCancelRefund] = useState(false);
  const refundMut = useRefundExpense();
  const cancelRefundMut = useCancelRefund();
  // 부모는 목록에서 집은 **스냅샷**을 넘긴다(`ExpensePage` 의 `detail` state) — 무효화가
  // 끝나도 그 객체는 안 바뀐다. 그래서 환불 연결을 끊으면 서버 응답으로 이 자리를 갈아
  // 열려 있는 상세가 그대로 다시 그려지게 한다. 안 그러면 배지가 남아 두 번 누르게 된다.
  // 행이 바뀌면(다이얼로그 재사용) 스냅샷이 새 거래 것이므로 응답은 버린다.
  // 마크·취소 뒤에도 상세는 열어 둔다 — 지우는 게 아니라 표식을 바꾸는 것이라
  // 사용자가 결과(배너가 생기거나 사라지는 것)를 그 자리에서 봐야 한다.
  const [marked, setMarked] = useState<Expense | null>(null);
  const expense = marked?.rowId === expenseProp.rowId ? marked : expenseProp;
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

  // 삭제 확인창이 열린 동안만 미리보기를 돈다 — 상세를 열기만 해도 부르면 목록을
  // 훑는 사이 요청이 쌓인다.
  const previewQ = useRefundPreview(expense.rowId, confirmDelete);
  // 환불도 돈은 삭제와 똑같이 움직인다 — 같은 미리보기를 환불 확인창이 열린 동안 돈다.
  // 결제한 달이 지났으면 "기록만 정리돼요" 로 바뀐다(닫힌 회차 R6).
  const refundPreviewQ = useRefundPreview(expense.rowId, confirmRefund);

  const handleConfirmDelete = () => {
    deleteMut.mutate(expense.rowId, {
      onSuccess: (result) => {
        // 미리보기와 실제가 다를 때만 알린다 — 같으면 확인창에서 이미 읽었다.
        const actual = result?.refundedAmount ?? null;
        if (
          actual != null &&
          actual !== (previewQ.data?.refundAmount ?? null)
        ) {
          toast.success(tc("refundedToast", { amount: KRW(actual) }));
        }
        setConfirmDelete(false);
        onClose();
      },
    });
  };

  const handleConfirmRefund = () => {
    refundMut.mutate(
      // 날짜만 고르므로 시각은 정오로 둔다 — 자정으로 보내면 그날 앞에 찍힌 거래보다
      // 과거가 되어 카드 회차 판정이 하루 밀린다.
      {
        id: expense.rowId,
        refundedAt: refundDate ? `${refundDate}T12:00:00` : undefined,
      },
      {
        onSuccess: (updated) => {
          setMarked(updated);
          setConfirmRefund(false);
        },
      },
    );
  };

  const handleConfirmCancelRefund = () => {
    cancelRefundMut.mutate(expense.rowId, {
      onSuccess: (updated) => {
        setMarked(updated);
        setConfirmCancelRefund(false);
      },
    });
  };

  // 시스템이 만든 거래(매도 실현손익·이체 이자)는 원본을 지워야 사라진다.
  // 버튼을 눌러야 거부 토스트가 뜨는 대신 아예 감춘다.
  const isAutoGenerated = expense.autoSource != null;

  // 빠른 동작 — 원형 아이콘 **한 줄**. 열 수를 박지 않고 실제로 그리는 개수를 센다.
  // 환불은 지출에만 나오므로 개수가 지출 4 · 수입 3 으로 갈린다. 예전엔 `repeat(3, 1fr)`
  // 이 박혀 있어 지출에서 넷째가 다음 줄로 밀렸고(3+1, 사용자 신고 2026-09-09), 그렇다고
  // 4 로 바꿔 박으면 이번엔 수입에서 한 칸이 빈다. 배열로 모아 `length` 를 쓰면 어느 쪽도
  // 아니고, 나중에 버튼이 하나 더 늘어도 따라온다.
  // 앱도 `Row` + `Expanded` 로 한 줄이다(desk-app `tx_detail_dialog.dart`).
  const isRefunded = isRefundedTx(expense);
  // 기록만 — 결제가 끝난 회차에 뒤늦게 적은 카드 지출(닫힌 회차 R2). 할부는 지난 회차분만
  // 기록용이라 금액이 거래보다 작으면 "이 중 N원" 으로 말한다.
  const recordOnlyAmount =
    !isRefunded && expense.cardSettledThrough != null
      ? (expense.recordOnlyAmount ?? Math.abs(expense.amount))
      : null;
  // 카드면 확인창이 한 줄 더 말한다 — 이미 낸 돈이 어디로 가는지가 사용자의 관심사다.
  const isCreditCard = asset?.assetType === "CREDIT_CARD";
  const cardHasPaymentAsset = asset?.paymentAssetRowId != null;
  const quickActions = [
    // 환불 — 지출에만, 아직 환불 안 한 것만. 누르면 확인창이고, 확인하면 원거래에
    // 표식이 찍혀 합계에서 빠진다(수입 행을 만들지 않는다).
    ...(!isIncome && !isRefunded
      ? [
          <DetailQuickAction
            key="refund"
            icon={Undo2}
            label={t("txDetail.refund")}
            onClick={() => {
              setRefundDate(todayLocalKey());
              setConfirmRefund(true);
            }}
          />,
        ]
      : []),
    // 분할도 환불된 거래에는 안 띄운다 — 서버가 EXP_043 으로 막으므로 눌러 봐야
    // 토스트만 뜬다. 열은 배열 길이로 세므로 빠지면 저절로 줄어든다.
    ...(isRefunded
      ? []
      : [
          <DetailQuickAction
            key="split"
            icon={Scissors}
            label={t("splitTitle")}
            active={splitCount > 0}
            badge={
              splitCount > 0
                ? t("txDetail.countItems", { count: splitCount })
                : null
            }
            onClick={() => setOpenSub("split")}
          />,
        ]),
    <DetailQuickAction
      key="recurring"
      icon={Repeat}
      label={t("txDetail.recurring")}
      active={linkedRecurring.length > 0}
      badge={linkedRecurring.length > 0 ? t("txDetail.linked") : null}
      onClick={() => setOpenSub("recurring")}
    />,
    <DetailQuickAction
      key="dutch"
      icon={Users}
      label={t("txDetail.dutchPay")}
      active={linkedDutchPays.length > 0}
      badge={
        linkedDutchPays.length > 0
          ? t("txDetail.countCases", { count: linkedDutchPays.length })
          : null
      }
      onClick={() => setOpenSub("dutch")}
    />,
  ];

  const Footer = (
    <ModalViewFooter
      onDelete={isAutoGenerated ? undefined : () => setConfirmDelete(true)}
      deleting={deleteMut.isPending}
      // 환불된 거래는 고칠 수 없다 — 돈이 이미 자산으로 돌아가 있어 되돌릴 기준이
      // 사라진다(서버도 EXP_043 으로 막는다). 먼저 환불을 취소하게 한다.
      onEdit={
        onEdit && !isAutoGenerated && !isRefunded ? handleEdit : undefined
      }
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

            {/* 환불됨 — 이 거래는 합계에서 빠져 있다. 되돌릴 자리를 함께 준다.
            앱도 같은 자리·같은 문구다(설계서 7절). */}
            {isRefunded && (
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
                  <span style={{ flex: 1 }}>
                    {t("txDetail.refundedAt", {
                      date: (expense.refundedAt ?? "").slice(0, 10),
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={cancelRefundMut.isPending}
                    onClick={() => setConfirmCancelRefund(true)}
                  >
                    {t("txDetail.refundCancel")}
                  </Button>
                </div>
              </DetailSection>
            )}

            {/* 기록만 — 계좌에서는 안 빠졌다는 것을 상세에서 한 번 더 말한다. 앱도 같은
            자리·같은 문구다. */}
            {recordOnlyAmount != null && (
              <DetailSection>
                <div
                  data-testid="record-only-note"
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
                  <span style={{ flex: 1 }}>
                    {recordOnlyAmount < Math.abs(expense.amount) ? (
                      <Trans
                        t={t}
                        i18nKey="txDetail.recordOnlyPartNote"
                        values={{
                          amount: `${wonPre()}${KRW(recordOnlyAmount)}${isEn() ? "" : "원"}`,
                        }}
                        components={{
                          amt: (
                            <MaskAmount card="ledger.txDetail" kind={txKind}>
                              {""}
                            </MaskAmount>
                          ),
                        }}
                      />
                    ) : (
                      t("txDetail.recordOnlyNote")
                    )}
                  </span>
                </div>
              </DetailSection>
            )}

            {/* Quick actions — 원형 아이콘 한 줄. 열 수는 `quickActions.length` 다. */}
            <DetailSection>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${quickActions.length}, 1fr)`,
                  gap: 8,
                }}
              >
                {quickActions}
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
            <>
              {t("txDetail.deleteMessage", { name: displayMerchant })}
              {/* 결제 완료 회차의 카드 거래는 지우는 순간 돈이 결제계좌로 돌아간다 —
                  그 예고를 여기서 한다(설계 13-2). 확인 버튼은 이 조회를 기다리지
                  않는다: 느린 네트워크가 삭제를 막으면 안 된다. */}
              <PaidRefundNote
                query={previewQ}
                isCreditCard={isCreditCard}
                cardHasPaymentAsset={cardHasPaymentAsset}
              />
            </>
          }
          confirmLabel={tc("delete")}
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* 환불 처리 — 되돌릴 수 있으므로 danger 가 아니다. 카드면 무슨 일이
          벌어지는지 한 줄 더 알려 준다(결제계좌가 있으면 환급, 없으면 잔액만 정리). */}
      {confirmRefund && (
        <ConfirmDialog
          title={t("txDetail.refundConfirmTitle")}
          message={
            <>
              {t("txDetail.refundConfirmBody", {
                amount: KRW(Math.abs(expense.amount)),
                asset: expense.assetName ?? tc("none"),
              })}
              {/* 결제계좌가 있으면 얼마가 돌아오는지(또는 기한이 지나 안 돌아오는지)를
                  미리보기로 말한다. 없으면 카드 잔액만 정리된다는 한 줄이다. */}
              {isCreditCard &&
                (cardHasPaymentAsset ? (
                  <PaidRefundNote
                    query={refundPreviewQ}
                    isCreditCard={isCreditCard}
                    cardHasPaymentAsset={cardHasPaymentAsset}
                  />
                ) : (
                  <>
                    <br />
                    <br />
                    {t("txDetail.refundConfirmBodyCardNoAccount")}
                  </>
                ))}
              <Field style={{ marginTop: 14 }}>
                <FieldLabel htmlFor="tx-refund-date">
                  {t("txDetail.refundDate")}
                </FieldLabel>
                <Input
                  id="tx-refund-date"
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                />
              </Field>
            </>
          }
          confirmLabel={t("txDetail.refundConfirm")}
          loading={refundMut.isPending}
          onCancel={() => !refundMut.isPending && setConfirmRefund(false)}
          onConfirm={handleConfirmRefund}
        />
      )}

      {confirmCancelRefund && (
        <ConfirmDialog
          title={t("txDetail.refundCancel")}
          message={t("txDetail.refundCancelConfirm")}
          confirmLabel={t("txDetail.refundCancel")}
          loading={cancelRefundMut.isPending}
          onCancel={() =>
            !cancelRefundMut.isPending && setConfirmCancelRefund(false)
          }
          onConfirm={handleConfirmCancelRefund}
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
