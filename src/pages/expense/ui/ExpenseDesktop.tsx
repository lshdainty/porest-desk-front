import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ds/card";
import { useWideSurface } from "@/shared/ds/overlay";
import { Skeleton } from "@/shared/ds/skeleton";
import { PageHead } from "@/shared/ui/groo/page-head";
import { formatMonthShort } from "@/shared/lib/date";
import type { Expense } from "@/entities/expense";
import type { AssetTransfer } from "@/entities/asset";
import { useExpenseCategories } from "@/features/expense";
import { useAssets } from "@/features/asset";
import { FilterBar } from "@/features/expense/ui/FilterBar";
import {
  hasActiveFilter,
  monthPeriodOf,
  periodMonthBounds,
  type FilterValue,
} from "@/features/expense/model/filter";
import { AddTxSheet } from "@/widgets/add-tx";
import { TxDetailDialog } from "@/widgets/expense-detail/ui/TxDetailDialog";
import { TransferDetailDialog } from "@/widgets/expense-detail/ui/TransferDetailDialog";
import { monthFromQuery } from "@/pages/expense/lib/month-query";
import {
  clampMonth,
  dailyTotals,
  shiftMonth,
  todayKey,
} from "@/pages/expense/model/calendar-model";
import {
  groupLedgerByDay,
  useAssetFilter,
  useExpenseData,
} from "@/pages/expense/model/ledger-data";
import { ListCard } from "./desktop/ListCard";
import { MiniCalendar } from "./desktop/MiniCalendar";
import { SummaryCard } from "./desktop/SummaryCard";

/** 화면 틀 — 제목 줄(h1 "가계부") 아래 24, 좌우 여백 32, 본문 폭은 768 ~ 1279 최대 720 · 1280 이상 최대 1040 가운데(4A, medium 밀도) */
function Frame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("expense");
  return (
    <div
      data-slot="expense-desktop"
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)] lg:max-w-[var(--layout-max-medium)]">
        <PageHead
          title={t("title")}
          style={{ marginBottom: "var(--spacing-x6)" }}
        />
        {children}
      </div>
    </div>
  );
}

/** 첫 진입 스켈레톤 — 화면 틀(제목 · 카드 둘)은 그리고 서버 데이터 자리만 스켈레톤이다 */
export function ExpenseDesktopSkeleton() {
  const wide = useWideSurface();
  const side = (
    <Card aria-hidden className="p-x6">
      <Skeleton text="t6" className="w-40" />
      <Skeleton text="t4" className="mt-x4 w-full" />
      <Skeleton text="t4" className="mt-x2 w-full" />
    </Card>
  );
  const list = (
    <Card aria-hidden className="p-x6">
      <Skeleton text="t5" className="w-32" />
      <Skeleton text="t4" className="mt-x4 w-full" />
      <Skeleton text="t4" className="mt-x2 w-full" />
    </Card>
  );
  return (
    <Frame>
      {wide ? (
        <div className="grid grid-cols-[336px_minmax(0,1fr)] gap-x6">
          {side}
          {list}
        </div>
      ) : (
        <div className="flex flex-col gap-x4">
          {side}
          {list}
        </div>
      )}
    </Frame>
  );
}

/**
 * 가계부 — 데스크톱(1280 이상: 왼쪽 작은 달력 + 오른쪽 날짜 묶음 목록) · 태블릿(768 ~ 1279: 위 요약 카드 + 아래 목록).
 * 같은 트리에서 폭만 다르다(짝 2 — I-07 24 ~ 39). 달 하나 = 한 쪽: 달 이동이 쪽 넘김이고 주소의 `?month=` 에 적는다(뒤로 가기로 앞 달).
 * 필터 기간이 걸리면(Q5-C) 작은 달력은 기간의 첫 달을 보이고 ‹ › 는 기간 안에서만 — 목록 · 요약은 기간 전체다.
 */
export function ExpenseDesktop() {
  const wide = useWideSurface();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonth = monthFromQuery(searchParams.get("month"));
  const focusTxId = Number(searchParams.get("txId")) || null;
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null);
  const { assetId, asset, clear: clearAsset } = useAssetFilter();
  const categoriesQ = useExpenseCategories();
  const assetsQ = useAssets();

  // 기간이 걸렸으면 달력은 그 기간 안의 달만 본다
  const bounds = periodMonthBounds(filterValue);
  const month = clampMonth(urlMonth, bounds);
  const data = useExpenseData(
    month,
    "all",
    filterValue,
    assetId,
    categoriesQ.data ?? null,
  );
  const grouped = useMemo(
    () => groupLedgerByDay(data.expenses, data.transfers),
    [data.expenses, data.transfers],
  );
  const lineCount = grouped.reduce((n, [, items]) => n + items.length, 0);
  const byDay = useMemo(
    () => dailyTotals(data.monthExpenses),
    [data.monthExpenses],
  );
  const today = todayKey();
  const filtered = hasActiveFilter(filterValue) || assetId != null;

  // ── 달 ──
  const goMonth = (m: string) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("month", m);
      n.delete("txId");
      return n;
    });
    document.getElementById("main")?.scrollTo?.({ top: 0 });
  };
  const moveMonth = (delta: -1 | 1) =>
    goMonth(clampMonth(shiftMonth(month, delta), bounds));
  const canPrev = !bounds || month > bounds.first;
  const canNext = !bounds || month < bounds.last;
  const changeFilter = (next: FilterValue | null) => {
    setFilterValue(next);
    const nb = periodMonthBounds(next);
    // 기간을 새로 걸면 작은 달력은 기간의 첫 달로
    if (nb && (nb.first !== bounds?.first || nb.last !== bounds?.last))
      goMonth(nb.first);
  };
  const firstChip = useRef<HTMLButtonElement | null>(null);
  const clearAll = () => {
    setFilterValue(null);
    clearAsset();
    requestAnimationFrame(() => firstChip.current?.focus());
  };

  // ── 날 누르기 · 들어온 거래로 옮기기 ──
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollToDay = (ds: string) => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-day-group="${ds}"]`,
    );
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    el.scrollIntoView({
      block: "start",
      behavior: reduce?.matches ? "auto" : "smooth",
    });
  };
  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusTxId && !data.isLoadingList && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusTxId, data.isLoadingList, data.expenses.length]);

  // ── 상세 · 수정 · 이체 상세 (여는 자리만 — 시트 안 모양은 거래 시트 몫) ──
  const [detail, setDetail] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [transferDetail, setTransferDetail] = useState<AssetTransfer | null>(
    null,
  );
  const [editingTransfer, setEditingTransfer] = useState<AssetTransfer | null>(
    null,
  );

  const assets = useMemo(() => assetsQ.data?.assets ?? [], [assetsQ.data]);

  const [y = 1970, m = 1] = month.split("-").map(Number);
  const monthLabel = formatMonthShort(new Date(y, m - 1, 1));
  const calendarProps = {
    month,
    onMove: moveMonth,
    canPrev,
    canNext,
    today,
    byDay,
    loading: data.isLoadingMonthExpenses,
    monthIn: data.monthTotalIn,
    monthOut: data.monthTotalOut,
    summaryLoading: data.isLoadingSummary,
    onPickDay: scrollToDay,
  };
  const filterBar = (
    <FilterBar
      value={filterValue}
      onChange={changeFilter}
      categories={categoriesQ.data ?? []}
      assets={assets}
      wide={wide}
      viewPeriod={monthPeriodOf(month)}
      assetName={asset?.assetName}
      onClearAsset={clearAsset}
      onClearAll={clearAll}
      firstChipRef={firstChip}
    />
  );
  const listCard = (
    <div ref={listRef}>
      <ListCard
        groups={grouped}
        count={lineCount}
        out={data.monthOut}
        inn={data.monthIn}
        loading={data.isLoadingList}
        failed={data.isError}
        onRetry={data.retry}
        filtered={filtered}
        monthLabel={monthLabel}
        today={today}
        focusTxId={focusTxId}
        focusRef={focusRef}
        onOpenExpense={setDetail}
        onOpenTransfer={setTransferDetail}
      />
    </div>
  );

  return (
    <Frame>
      {wide ? (
        <div className="grid grid-cols-[336px_minmax(0,1fr)] items-start gap-x-x6">
          <div className="[@media(min-height:720px)]:sticky [@media(min-height:720px)]:top-x5">
            <MiniCalendar {...calendarProps} />
          </div>
          <div className="flex min-w-0 flex-col gap-y-x3">
            {filterBar}
            {listCard}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-x4">
          <SummaryCard {...calendarProps} />
          <div className="flex flex-col gap-y-x3">
            {filterBar}
            {listCard}
          </div>
        </div>
      )}

      {transferDetail && !editingTransfer && (
        <TransferDetailDialog
          transfer={transferDetail}
          mobile={false}
          onClose={() => setTransferDetail(null)}
          onEdit={(tr) => {
            setTransferDetail(null);
            setEditingTransfer(tr);
          }}
        />
      )}
      {editingTransfer && (
        <AddTxSheet
          editTransfer={editingTransfer}
          mobile={false}
          onClose={() => setEditingTransfer(null)}
        />
      )}
      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile={false}
          onClose={() => setDetail(null)}
          onEdit={(e) => {
            setDetail(null);
            setEditing(e);
          }}
        />
      )}
      {editing && (
        <AddTxSheet
          expense={editing}
          mobile={false}
          onClose={() => setEditing(null)}
        />
      )}
    </Frame>
  );
}
