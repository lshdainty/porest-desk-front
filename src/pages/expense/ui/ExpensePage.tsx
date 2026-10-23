import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  List,
  X,
} from "lucide-react";
import { KRW, formatDay, minusOf } from "@/shared/lib/groo/format";
import {
  readViewMode,
  saveViewMode,
  type ViewMode,
} from "@/pages/expense/lib/view-mode";
import { monthFromQuery } from "@/pages/expense/lib/month-query";
import { formatMonthDayWeekday, formatYearMonth } from "@/shared/lib/date";
import { MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { wonPre } from "@/shared/lib/groo/hide-amounts-core";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { DateGroupHeader } from "@/shared/ui/date-group-header";
import { ExpenseRow } from "@/entities/expense";
import { TransferRow } from "@/entities/asset";
import { TransferDetailDialog } from "@/widgets/expense-detail/ui/TransferDetailDialog";
import { ModalShell } from "@/shared/ui/groo/dialogs";
import { ModalFooter } from "@/shared/ui/groo/modal-footer";
// 기존 캘린더 소스 — 홈 > 캘린더 (CalendarPage) 가 사용하는 CalendarMonthView 를
// 그대로 활용. expense → IEvent 변환은 convertExpenseToIEvent 가 처리 (income/
// expense color 분기 + 금액 title parse 모두 CalendarMonthView 자체 로직).
import { CalendarProvider } from "@/widgets/calendar/model/calendar-provider";
import { CalendarMonthView } from "@/widgets/calendar/ui/month-view/calendar-month-view";
import { convertExpenseToIEvent } from "@/widgets/calendar/lib/helpers";
import {
  useExpenses,
  useRangeSummary,
  useExpenseCategories,
} from "@/features/expense";
import { useAssets } from "@/features/asset";
import type { AssetTransfer } from "@/entities/asset";
import type { Expense } from "@/entities/expense";
import { expenseSum, incomeSum } from "@/entities/expense";
import { FilterDialog } from "@/features/expense/ui/FilterDialog";
import {
  monthPeriodOf,
  type FilterValue,
} from "@/features/expense/model/filter";
import { AddTxSheet } from "@/widgets/add-tx";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { TxDetailDialog } from "@/widgets/expense-detail/ui/TxDetailDialog";
import { PageHead } from "@/shared/ui/groo/page-head";
import {
  filterActiveCount,
  groupLedgerByDay,
  ledgerKey,
  monthRange,
  useAssetFilter,
  useExpenseData,
  type Filter as TxFilter,
} from "@/pages/expense/model/ledger-data";
import { ExpenseDayGroupSkeleton } from "./ExpenseDayGroupSkeleton";
import { ExpenseMobile, ExpenseMobileSkeleton } from "./ExpenseMobile";

type OutletCtx = { onAddTx: () => void; mobile: boolean };
type Filter = TxFilter;

const CHIPS: { id: Filter; labelKey: string }[] = [
  { id: "all", labelKey: "chip.all" },
  { id: "expense", labelKey: "expense" },
  { id: "income", labelKey: "income" },
];

function notifyComing(): void {
  console.log("[expense] 개발 중입니다");
}

/** Expense 페이지 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계. */
function useExpensePageData(month: string) {
  const { startDate, endDate } = monthRange(month);
  const expensesQ = useExpenses({ startDate, endDate });
  const summaryQ = useRangeSummary(startDate, endDate);
  const categoriesQ = useExpenseCategories();
  const assetsQ = useAssets();
  return {
    isLoading:
      expensesQ.isLoading ||
      summaryQ.isLoading ||
      categoriesQ.isLoading ||
      assetsQ.isLoading,
  };
}

function ExpenseSummarySkeleton({ mobile }: { mobile: boolean }) {
  // 실제 Summary(모바일 keep raised / 데스크톱 shadow) 구조 정합: 헤더는 [이전화살표][년 월 텍스트]
  // [다음화살표] + marginLeft auto[ViewModeToggle], 본문은 3-col(수입/지출/합계) 라벨+금액.
  return (
    <Card
      variant={mobile ? "raised" : undefined}
      style={{
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 0 : 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <SkeletonBase className="h-7 w-7 rounded-md" />
        <SkeletonBase className="h-5 w-24" />
        <SkeletonBase className="h-7 w-7 rounded-md" />
        <SkeletonBase
          className="h-7 w-16 rounded-md"
          style={{ marginLeft: "auto" }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <SkeletonBase className="h-3 w-8 mb-1.5" />
            <SkeletonBase className={mobile ? "h-4 w-24" : "h-[18px] w-28"} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Calendar grid skeleton — viewMode='calendar' (default) 의 외곽 카드 모양 + 7-col 요일
 *  헤더 + 6주 cell grid. 부모(flex-1) 가 viewport 의 남은 공간을 잡아주므로
 *  h-full + min-h-0 으로 그 공간을 완전 채움. */
function ExpenseCalendarSkeleton() {
  return (
    <Card
      className="max-w-[430px] md:max-w-none h-full min-h-0"
      style={{ overflow: "hidden" }}
    >
      <div className="flex flex-col h-full">
        {/* 요일 헤더 (일~토) */}
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] px-1 py-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-center">
              <SkeletonBase className="h-3 w-4" />
            </div>
          ))}
        </div>
        {/* 6주 × 7일 cell grid */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-start gap-1 p-1 md:p-2 md:border-l md:border-t border-[var(--border-subtle)]"
            >
              <SkeletonBase className="size-6 rounded-full" />
              <SkeletonBase className="h-2 w-8 mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Expense 페이지 구조에 맞춘 skeleton — Summary 카드 + Calendar grid (default mode).
 *  ExpenseMobile/Desktop 와 동일한 viewport fit 패턴 — AppLayout scroll wrapper 가
 *  flex-col 이므로 페이지 wrapper 는 flex-1 + min-h-0 으로 부모 전체 height 차지. */
function ExpensePageSkeleton({
  mobile,
  month,
}: {
  mobile: boolean;
  month?: string;
}) {
  const { t } = useTranslation("expense");
  if (mobile) return <ExpenseMobileSkeleton month={month} />;

  return (
    <div
      className="page flex flex-col flex-1 min-h-0"
      style={{ paddingBottom: 24 }}
    >
      <PageHead title={t("title")} description={t("subtitle")} />
      <ExpenseSummarySkeleton mobile={false} />
      <div className="flex-1 min-h-0 flex flex-col">
        <ExpenseCalendarSkeleton />
      </div>
    </div>
  );
}

export const ExpensePage = () => {
  const { onAddTx, mobile } = useOutletContext<OutletCtx>();
  const [searchParams] = useSearchParams();
  const initialMonth = monthFromQuery(searchParams.get("month"));
  const { isLoading } = useExpensePageData(initialMonth);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중에 동기 set (React 권장 패턴).
  if (!isLoading && !hasEverLoaded) setHasEverLoaded(true);
  if (isLoading && !hasEverLoaded)
    return <ExpensePageSkeleton mobile={mobile} month={initialMonth} />;
  return mobile ? <ExpenseMobile onAddTx={onAddTx} /> : <ExpenseDesktop />;
};

/**
 * 월 네비 + 수입·지출·합계 세 칸.
 *
 * `export` 는 테스트가 이 카드만 떼어 그리려고 붙였다 — 지출 칸의 부호가 값을 따르는지는
 * 페이지 전체를 세우지 않고도 확인할 수 있어야 한다(`ExpensePage.expenseSign.test.tsx`).
 */
export function Summary({
  month,
  onMonthChange,
  mobile,
  monthIn,
  monthOut,
  isLoading,
  headerRight,
}: {
  month: string;
  onMonthChange: (m: string) => void;
  mobile: boolean;
  monthIn: number;
  monthOut: number;
  isLoading: boolean;
  /** month header row 우측 슬롯 (예: ViewModeToggle). 클로드 디자인 정합. */
  headerRight?: React.ReactNode;
}) {
  const { t } = useTranslation("expense");
  const balance = monthIn - monthOut;
  const [y, m] = month.split("-");
  return (
    // 모바일 = keep 카드(raised + shadow-lg) — 카드 다이어트에서 유지되는 월 네비+요약 (design TxScreen).
    <Card
      variant={mobile ? "raised" : undefined}
      style={{
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 0 : 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <MonthArrowButton dir="prev" month={month} onChange={onMonthChange} />
        <div
          style={{
            fontSize: "var(--text-body-lg)",
            fontWeight: "700",
            letterSpacing: "-0.022em",
          }}
        >
          {formatYearMonth(new Date(Number(y), Number(m) - 1))}
        </div>
        <MonthArrowButton dir="next" month={month} onChange={onMonthChange} />
        {headerRight && <div style={{ marginLeft: "auto" }}>{headerRight}</div>}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {t("income")}
          </div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: "700",
              color: "var(--fg-brand)",
            }}
          >
            {isLoading ? (
              "—"
            ) : (
              <MaskAmount card="ledger.monthSummary" kind="income">
                +{KRW(monthIn)}
              </MaskAmount>
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {t("expense")}
          </div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: "700",
              color: "var(--fg-expense)",
            }}
          >
            {isLoading ? (
              "—"
            ) : (
              <MaskAmount card="ledger.monthSummary" kind="expense">
                {minusOf(monthOut)}
                {KRW(Math.abs(monthOut))}
              </MaskAmount>
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {t("txDetail.sumLabel")}
          </div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: "700",
              color:
                balance >= 0 ? "var(--fg-brand-strong)" : "var(--fg-expense)",
            }}
          >
            {isLoading ? (
              "—"
            ) : (
              <MaskAmount card="ledger.monthSummary" kind="net">
                {balance >= 0 ? "+" : "−"}
                {KRW(Math.abs(balance))}
              </MaskAmount>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/** 가계부 캘린더 view — 홈 > 캘린더의 CalendarMonthView 를 그대로 활용.
 *  expense → IEvent 변환 후 CalendarProvider 안에서 month view 표시.
 *  CalendarMonthView 의 onDayClick prop 으로 셀 클릭 시 그날 거래 내역
 *  DayDetailDialog (mobile drawer / desktop dialog) 표시. onDayClick 이 있으면
 *  drag-select 가 양보하므로 캘린더 화면의 일정 추가 폼은 여기서 안 뜬다. */
function ExpenseCalendar({
  month,
  expenses,
  mobile,
}: {
  month: string;
  expenses: Expense[];
  mobile: boolean;
}) {
  const events = useMemo(() => {
    return expenses.map((e) => {
      const ev = convertExpenseToIEvent(e);
      const dateOnly = (e.expenseDate ?? "").slice(0, 10);
      const localISO = `${dateOnly}T00:00:00`;
      return { ...ev, startDate: localISO, endDate: localISO };
    });
  }, [expenses]);
  const initialDate = useMemo(() => {
    const [ys, ms] = month.split("-");
    return new Date(Number(ys), Number(ms) - 1, 1);
  }, [month]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // row 클릭 → TxDetailDialog → 편집 → AddTxSheet flow (EditableList 와 동일).
  const [detail, setDetail] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  // 일별 drawer '거래 추가' → 그 날짜 seed 로 신규 AddTxSheet.
  const [addSeedDate, setAddSeedDate] = useState<string | null>(null);
  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as Expense[];
    const ymd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return expenses.filter((e) => (e.expenseDate ?? "").slice(0, 10) === ymd);
  }, [selectedDate, expenses]);
  const calInner = (
    <CalendarProvider
      events={events}
      initialView="month"
      initialDate={initialDate}
      key={month}
    >
      <CalendarMonthView
        singleDayEvents={events}
        multiDayEvents={[]}
        onDayClick={(date) => setSelectedDate(date)}
      />
    </CalendarProvider>
  );
  return (
    <>
      {mobile ? (
        // 카드 다이어트 — 모바일 캘린더는 shadow 없는 플랫(design TxCalendar). 셀 구분선도 lg: 전용이라
        // 모바일에선 시원한 무테 그리드가 된다. 월 네비+요약만 keep(raised) 카드로 유지.
        <div className="max-w-[430px] h-full min-h-0 overflow-hidden">
          {calInner}
        </div>
      ) : (
        <Card
          className="md:max-w-none h-full min-h-0"
          style={{ overflow: "hidden" }}
        >
          {calInner}
        </Card>
      )}
      {selectedDate && !detail && !editing && (
        <DayDetailDialog
          date={selectedDate}
          items={dayItems}
          mobile={mobile}
          onClose={() => setSelectedDate(null)}
          onItemClick={(e) => setDetail(e)}
          onAddForDay={() => {
            if (!selectedDate) return;
            const ymd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
            setSelectedDate(null);
            setAddSeedDate(ymd);
          }}
        />
      )}
      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile={mobile}
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
          mobile={mobile}
          onClose={() => setEditing(null)}
        />
      )}
      {addSeedDate && (
        <AddTxSheet
          defaultDate={addSeedDate}
          mobile={mobile}
          onClose={() => setAddSeedDate(null)}
        />
      )}
    </>
  );
}

/** 그날 거래 내역 dialog — App _DayDetailBody 정합. ModalShell 의 mobile=drawer /
 *  desktop=dialog 분기 활용. summary card (지출/수입/건수) + ExpenseRow 리스트. */
function DayDetailDialog({
  date,
  items,
  mobile,
  onClose,
  onItemClick,
  onAddForDay,
}: {
  date: Date;
  items: Expense[];
  mobile: boolean;
  onClose: () => void;
  onItemClick?: (e: Expense) => void;
  onAddForDay?: () => void;
}) {
  const { t } = useTranslation("expense");
  const title = formatMonthDayWeekday(date);
  // 서버 집계와 같은 규칙 — 환불은 수입이 아니라 지출 상계이고, 아직 안 온 건 안 센다.
  const incomeTotal = incomeSum(items);
  const expenseTotal = expenseSum(items);
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      mobile={mobile}
      size="sm"
      mobileMinHeight="85dvh"
      footer={
        onAddForDay && (
          <ModalFooter onSave={onAddForDay} saveLabel={t("addTransaction")} />
        )
      }
    >
      {/* 합계 카드 — muted(채움 bg)로 dark dialog 위에서도 또렷이. App PCard.muted 정합 */}
      <Card variant="muted" className="mb-[var(--spacing-md)]">
        <CardContent className="!py-[var(--spacing-md)] flex items-center gap-[var(--spacing-md)]">
          <div className="flex-1 text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
            {t("dayCount", { count: items.length })}
          </div>
          {/* 수입+지출 같이 있을 때 두 column horizontal (모바일 정합). 단독은 1 column. */}
          <div className="flex items-end gap-[var(--spacing-lg)]">
            {incomeTotal > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
                  {t("income")}
                </span>
                <span className="num text-[length:var(--text-body-sm)] font-bold text-[var(--fg-brand)]">
                  <MaskAmount card="ledger.txList" kind="income">
                    +{wonPre()}
                    {KRW(incomeTotal)}
                  </MaskAmount>
                  <WonUnit card="ledger.txList" kind="income" />
                </span>
              </div>
            )}
            {expenseTotal > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
                  {t("expense")}
                </span>
                <span className="num text-[length:var(--text-body-sm)] font-bold text-[var(--fg-expense)]">
                  <MaskAmount card="ledger.txList" kind="expense">
                    {minusOf(expenseTotal)}
                    {wonPre()}
                    {KRW(Math.abs(expenseTotal))}
                  </MaskAmount>
                  <WonUnit card="ledger.txList" kind="expense" />
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* 거래 row 들 — item 사이 border 없이 자연 spacing (모바일 정합) */}
      {items.length === 0 ? (
        <div className="py-[var(--spacing-xl)] text-center text-[length:var(--text-label-sm)] text-[var(--fg-tertiary)]">
          {t("emptyDay")}
        </div>
      ) : (
        // card 없이 깔끔한 리스트 — 앱 _DayDetailBody 정합(TxDetail/AssetDetail 와 동일 패턴)
        <div>
          {items.map((e) => (
            <ExpenseRow key={e.rowId} expense={e} onClick={onItemClick} />
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  // 단일 toggle button — 현재 mode 의 반대를 보여줌 (calendar 모드면 "목록" 버튼).
  const { t } = useTranslation("expense");
  const isCalendar = value === "calendar";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onChange(isCalendar ? "list" : "calendar")}
      aria-label={isCalendar ? t("listViewLabel") : t("calendarViewLabel")}
    >
      {isCalendar ? <List size={14} /> : <Calendar size={14} />}
      <span style={{ marginLeft: 4 }}>
        {isCalendar ? t("viewList") : t("viewCalendar")}
      </span>
    </Button>
  );
}

function Chips({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (f: Filter) => void;
}) {
  const { t } = useTranslation("expense");
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => v && onChange(v as Filter)}
      style={{ marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}
    >
      <TabsList variant="pills" size="sm">
        {CHIPS.map((c) => (
          <TabsTrigger key={c.id} variant="pills" size="sm" value={c.id}>
            {t(c.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ExpenseList({
  expenses,
  transfers = [],
  mobile,
  isLoading,
  onItemClick,
  onTransferClick,
  focusTxId,
}: {
  expenses: Expense[];
  transfers?: AssetTransfer[];
  mobile: boolean;
  isLoading: boolean;
  onItemClick?: (expense: Expense) => void;
  onTransferClick?: (transfer: AssetTransfer) => void;
  focusTxId?: number | null;
}) {
  const { t } = useTranslation("expense");
  const grouped = useMemo(
    () => groupLedgerByDay(expenses, transfers),
    [expenses, transfers],
  );
  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusTxId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusTxId, expenses.length]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: mobile ? 24 : 18,
        }}
      >
        <ExpenseDayGroupSkeleton rows={3} />
        <ExpenseDayGroupSkeleton rows={2} />
      </div>
    );
  }

  if (grouped.length === 0) {
    if (mobile) {
      // 카드 다이어트 — 빈 상태도 배경 위 플랫.
      return (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            fontSize: "var(--text-body-sm)",
            color: "var(--fg-tertiary)",
            fontWeight: 500,
          }}
        >
          {t("emptyList")}
        </div>
      );
    }
    return (
      <Card>
        <CardContent style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "var(--text-body-sm)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
            }}
          >
            {t("emptyList")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    // 카드 다이어트 — 날짜 그룹은 카드 없이 헤더+행, 그룹 사이 24px (design .tx-list).
    // 데스크톱/태블릿도 동일(사용자 결정) — 카드·divider·행 inset 없이 플랫.
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {grouped.map(([d, items]) => {
        const { md, dow } = formatDay(d);
        // 날짜 헤더의 지출/수입 합계 — 이체는 자산 간 이동이라 어느 쪽에도 넣지 않는다.
        // 합계 규칙은 expenseSum/incomeSum 한곳이다(환불된 것과 예정은 빠진다).
        // 즉석 reduce 는 2755886 이 걷어낸 옛 규칙의 잔재였다 — 환불이 있는 날
        // 이 헤더만 월 요약과 다른 숫자를 냈다(수입 +2,005,000 / 지출 −45,000).
        const dayTxs = items.flatMap((i) =>
          i.kind === "expense" ? [i.expense] : [],
        );
        const out = expenseSum(dayTxs);
        const inn = incomeSum(dayTxs);
        return (
          <div key={d}>
            {/* 날짜 헤더 — 평문 */}
            <DateGroupHeader
              date={md}
              weekday={dow}
              expense={out}
              income={inn}
            />
            {items.map((item) => {
              // 지출·이체가 다른 테이블이라 rowId 가 겹칠 수 있다 — key 와 포커스는 종류까지 합쳐 판별.
              const isFocus =
                item.kind === "expense" && focusTxId === item.expense.rowId;
              return (
                <div
                  key={ledgerKey(item)}
                  ref={isFocus ? focusRef : undefined}
                  style={{
                    background: isFocus ? "var(--bg-brand-subtle)" : undefined,
                    transition: "background 0.4s",
                    borderRadius: 10,
                  }}
                >
                  {item.kind === "expense" ? (
                    <ExpenseRow expense={item.expense} onClick={onItemClick} />
                  ) : (
                    <TransferRow
                      transfer={item.transfer}
                      onClick={onTransferClick}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AssetFilterBadge({
  name,
  onClear,
}: {
  name: string;
  onClear: () => void;
}) {
  const { t } = useTranslation("expense");
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px 6px 12px",
        background: "var(--bg-brand-subtle)",
        color: "var(--fg-brand-strong)",
        border: "1px solid var(--border-brand)",
        borderRadius: "var(--radius-pill)",
        fontSize: "var(--text-label-sm)",
        fontWeight: "600",
        marginBottom: 12,
      }}
    >
      <span>{name}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("clearFilter")}
        style={{
          background: "transparent",
          border: 0,
          padding: 2,
          cursor: "pointer",
          color: "var(--fg-brand)",
          display: "inline-flex",
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

/** 행 클릭 → 상세 TxDetailDialog → 편집 버튼 → AddTxSheet. Desktop/Mobile 공용. */
function EditableList({
  expenses,
  transfers = [],
  isLoading,
  mobile,
  focusTxId,
}: {
  expenses: Expense[];
  transfers?: AssetTransfer[];
  isLoading: boolean;
  mobile: boolean;
  focusTxId?: number | null;
}) {
  // detail: 상세 보기, editing: 편집 폼
  const [detail, setDetail] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  // 지출 상세 → '환불' → 원거래를 승계한 환불 입력(수입 + 원거래 연결).
  // 이체는 지출과 별개 엔티티라 상세도 별도(수정 없이 삭제만).
  const [transferDetail, setTransferDetail] = useState<AssetTransfer | null>(
    null,
  );
  const [editingTransfer, setEditingTransfer] = useState<AssetTransfer | null>(
    null,
  );

  return (
    <>
      <ExpenseList
        expenses={expenses}
        transfers={transfers}
        mobile={mobile}
        isLoading={isLoading}
        onItemClick={(e) => setDetail(e)}
        onTransferClick={(tr) => setTransferDetail(tr)}
        focusTxId={focusTxId}
      />
      {transferDetail && !editingTransfer && (
        <TransferDetailDialog
          transfer={transferDetail}
          mobile={mobile}
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
          mobile={mobile}
          onClose={() => setEditingTransfer(null)}
        />
      )}
      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile={mobile}
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
          mobile={mobile}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ExpenseDesktop() {
  const { t } = useTranslation("expense");
  const [searchParams] = useSearchParams();
  const initialMonth = monthFromQuery(searchParams.get("month"));
  const focusTxId = Number(searchParams.get("txId")) || null;
  const [filter, setFilter] = useState<Filter>("all");
  const [month, setMonth] = useState<string>(initialMonth);
  // 보기 모드는 기기에 기억해 둔다 — 종전엔 새로고침·화면 이동마다 달력으로
  // 되돌아갔다(QA #97).
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const changeViewMode = (v: ViewMode) => {
    setViewMode(v);
    saveViewMode(v);
  };
  const { assetId, asset, clear } = useAssetFilter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null);

  const categoriesQ = useExpenseCategories();
  const assetsQ = useAssets();

  const {
    expenses,
    transfers,
    monthIn,
    monthOut,
    isLoadingList,
    isLoadingSummary,
  } = useExpenseData(
    month,
    filter,
    filterValue,
    assetId,
    categoriesQ.data ?? null,
  );

  const viewPeriod = monthPeriodOf(month);
  const activeCount = filterActiveCount(filterValue, viewPeriod);

  // calendar 모드는 viewport fit (스크롤 없이 캘린더가 남은 공간 fill) — AppLayout 의
  // scroll wrapper 가 flex-col 이므로 페이지를 flex-1 + min-h-0 으로 부모 전체 차지.
  // 그 안에서 Calendar wrap 만 flex-1 로 Summary 아래 남은 공간 grow. list 모드는
  // 기존대로 자연 height (콘텐츠가 길면 부모 scroll wrapper 가 scroll).
  const isCalendarMode = viewMode === "calendar";
  return (
    <div
      className={isCalendarMode ? "page flex flex-col flex-1 min-h-0" : "page"}
      style={isCalendarMode ? { paddingBottom: 24 } : undefined}
    >
      <PageHead
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(true)}
            >
              <Filter size={13} /> {t("filter.title")}
              {activeCount > 0 && ` · ${activeCount}`}
            </Button>
            <Button variant="outline" size="sm" onClick={notifyComing}>
              <Download size={13} /> {t("export")}
            </Button>
          </>
        }
      />
      {asset && (
        <AssetFilterBadge
          name={t("assetFilterBadge", { name: asset.assetName })}
          onClear={clear}
        />
      )}
      {activeCount > 0 && (
        <AssetFilterBadge
          name={t("filterAppliedBadge", { count: activeCount })}
          onClear={() => setFilterValue(null)}
        />
      )}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile={false}
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
        headerRight={
          <ViewModeToggle value={viewMode} onChange={changeViewMode} />
        }
      />
      {isCalendarMode ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {isLoadingList ? (
            <ExpenseCalendarSkeleton />
          ) : (
            <ExpenseCalendar month={month} expenses={expenses} mobile={false} />
          )}
        </div>
      ) : (
        <>
          <Chips filter={filter} onChange={setFilter} />
          <EditableList
            expenses={expenses}
            transfers={transfers}
            isLoading={isLoadingList}
            mobile={false}
            focusTxId={focusTxId}
          />
        </>
      )}
      {filterOpen && (
        <FilterDialog
          initial={filterValue}
          categories={categoriesQ.data ?? []}
          assets={assetsQ.data?.assets ?? []}
          onClose={() => setFilterOpen(false)}
          onApply={(v) => {
            setFilterValue(v);
            setFilterOpen(false);
          }}
          mobile={false}
        />
      )}
    </div>
  );
}

export default ExpensePage;

/**
 * 월 ± 1 이동 화살표 버튼.
 * 멀리 떨어진 월 선택은 상세 필터에서 처리. 여기서는 단순 prev/next.
 */
function MonthArrowButton({
  dir,
  month,
  onChange,
}: {
  dir: "prev" | "next";
  month: string;
  onChange: (m: string) => void;
}) {
  const { t } = useTranslation("expense");
  const handle = () => {
    const [yStr, mStr] = month.split("-");
    let y = Number(yStr);
    let m = Number(mStr) + (dir === "prev" ? -1 : 1);
    if (m < 1) {
      y -= 1;
      m = 12;
    }
    if (m > 12) {
      y += 1;
      m = 1;
    }
    onChange(`${y}-${String(m).padStart(2, "0")}`);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dir === "prev" ? t("prevMonth") : t("nextMonth")}
      onClick={handle}
      className="h-7 w-7 text-text-secondary"
    >
      {dir === "prev" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </Button>
  );
}
