import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { KRW, formatDay, isEn, minusOf } from "@/shared/lib/groo/format";
import {
  INSIGHT_SAME_MAX,
  insightDiffAmount,
} from "@/pages/expense/lib/insight";
import { monthFromQuery } from "@/pages/expense/lib/month-query";
import { useExpenseSwipeActions } from "@/pages/expense/lib/use-expense-swipe-actions";
import { MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import {
  HIDE_AMOUNTS_MASK,
  useHideAmounts,
  wonPre,
} from "@/shared/lib/groo/hide-amounts-core";
import {
  LedgerCalendar,
  LedgerCell,
  LedgerCellAmt,
  LedgerCellNum,
  LedgerCellTip,
  LedgerCollapse,
  LedgerDayDate,
  LedgerDayGroup,
  LedgerDayHead,
  LedgerDayRel,
  LedgerDaySum,
  LedgerDivider,
  LedgerDow,
  LedgerExpand,
  LedgerHead,
  LedgerList,
  LedgerMonthLabel,
  LedgerMonthNav,
  LedgerNavBtn,
  LedgerPin,
  LedgerPrevBtn,
  LedgerShell,
  LedgerSub,
  LedgerSumBtn,
  LedgerSummary,
  LedgerSummaryRow,
  LedgerTotal,
  LedgerWeek,
} from "@/shared/ui/groo/ledger";
import { useLedgerScroll } from "@/shared/ui/groo/use-ledger-scroll";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { ExpenseRow } from "@/entities/expense";
import { TransferRow } from "@/entities/asset";
import { TransferDetailDialog } from "@/widgets/expense-detail/ui/TransferDetailDialog";
import { useRangeSummary, useExpenseCategories } from "@/features/expense";
import { SwipeActions } from "@/shared/ui/swipe-actions";
import type { HideCardKey } from "@/shared/lib/groo/hide-amounts-cards";
import { useAssets } from "@/features/asset";
import type { AssetTransfer } from "@/entities/asset";
import type { Expense, ExpenseCategory } from "@/entities/expense";
import { FilterDialog } from "@/features/expense/ui/FilterDialog";
import {
  activeConditionCount,
  monthPeriodOf,
  type FilterValue,
} from "@/features/expense/model/filter";
import { countableTx, expenseSum, incomeSum } from "@/entities/expense";
import { AddTxSheet } from "@/widgets/add-tx";
import { TxDetailDialog } from "@/widgets/expense-detail/ui/TxDetailDialog";
import {
  dayKey,
  filterActiveCount,
  groupLedgerByDay,
  ledgerKey,
  monthRange,
  useAssetFilter,
  useExpenseData,
} from "@/pages/expense/model/ledger-data";
import { ExpenseDayGroupSkeleton } from "./ExpenseDayGroupSkeleton";

/**
 * 캘린더 셀의 일별 지출·수입은 두 카드에 걸친다 — '캘린더 금액' 이면서 '거래 목록' 의
 * 일별 합계이기도 하다. 한쪽에만 걸면 다른 쪽을 켠 사람에게는 그대로 보인다.
 */
const CALENDAR_CELL_CARDS: HideCardKey[] = ["ledger.calendar", "ledger.txList"];

/**
 * 월 인사이트("지난달보다 N만원 덜 썼어요")는 가려진 월 지출 히어로 **바로 아래**에서
 * 두 달의 차액을 평문으로 말한다 — 히어로를 가려도 여기서 크기가 드러난다.
 * 모바일 히어로는 '거래 목록', 데스크톱 요약은 '월 합계' 카드를 쓰므로 둘 다에 건다.
 */
const INSIGHT_CARDS: HideCardKey[] = ["ledger.monthSummary", "ledger.txList"];

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 모바일 가계부 — 캘린더 스트립 + 리스트 통합 뷰 (design tx-mobile.jsx SoT, 현대카드 모티브).
 *  탭 전환 없음: 월네비 → 총액+인사이트+[소비 요약] → 접이식 캘린더(일별 합계) → 날짜그룹 리스트. */
const TXM_PAD = (n: number) => String(n).padStart(2, "0");

function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split("-");
  let y = Number(yStr);
  let m = Number(mStr) + delta;
  while (m < 1) {
    y -= 1;
    m += 12;
  }
  while (m > 12) {
    y += 1;
    m -= 12;
  }
  return `${y}-${TXM_PAD(m)}`;
}

/** 월 라벨 — ko "7월" / en "Jul" (디자인 monthnav·prevbtn·empty 문구 공용). */
function txmMonthLabel(monthKey: string): string {
  const [y = 0, m = 1] = monthKey.split("-").map(Number);
  return isEn()
    ? new Date(y, m - 1, 1).toLocaleDateString("en", { month: "short" })
    : `${m}월`;
}

/** 필터 활성 시 — 적용 항목별 칩 가로 스크롤(스크롤바 숨김), 개별 ✕ 제거 (사용자 결정). */
function FilterChipsRow({
  filterValue,
  onChange,
  assetName,
  onClearAsset,
  categories,
  assets,
}: {
  filterValue: FilterValue | null;
  onChange: (v: FilterValue | null) => void;
  assetName?: string;
  onClearAsset: () => void;
  categories: ExpenseCategory[];
  assets: { rowId: number; assetName: string }[];
}) {
  const { t } = useTranslation("expense");
  const { t: tStats } = useTranslation("expense");
  const v = filterValue;
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (assetName) {
    chips.push({
      key: "assetQ",
      label: t("assetFilterBadge", { name: assetName }),
      onRemove: onClearAsset,
    });
  }
  if (v) {
    // v2 는 조건이 여러 칸이라 항목마다 칩을 세우면 줄이 넘친다.
    // **칸 단위 요약 칩**으로 줄이고, × 는 그 칸을 통째로 비운다.
    if (activeConditionCount(v) > 1 && v.match === "any") {
      chips.push({
        key: "match",
        label: t("filter.matchAny"),
        onRemove: () => onChange({ ...v, match: "all" }),
      });
    }
    if (v.periods.length > 1) {
      chips.push({
        key: "periods",
        label: t("filter.chipPeriods", { count: v.periods.length }),
        onRemove: () => onChange({ ...v, periods: v.periods.slice(0, 1) }),
      });
    } else if (v.periods.length === 1 && v.periods[0]) {
      const p = v.periods[0];
      chips.push({
        key: "period",
        label:
          p.preset === "week"
            ? t("filter.period.week")
            : p.preset === "month"
              ? t("filter.period.month")
              : p.preset === "3m"
                ? tStats("stats.period3m")
                : `${p.start.slice(5).replace("-", ".")}~${p.end.slice(5).replace("-", ".")}`,
        onRemove: () => onChange({ ...v, periods: [] }),
      });
    }
    if (v.types.length === 1) {
      chips.push({
        key: "type",
        label: v.types[0] === "EXPENSE" ? t("expense") : t("income"),
        onRemove: () => onChange({ ...v, types: ["EXPENSE", "INCOME"] }),
      });
    }
    for (const [key, picked, all, nameOf] of [
      [
        "cat",
        v.categories,
        categories,
        (id: number) =>
          categories.find((c) => c.rowId === id)?.categoryName ?? String(id),
      ],
      [
        "asset",
        v.assets,
        assets,
        (id: number) =>
          assets.find((a) => a.rowId === id)?.assetName ?? String(id),
      ],
    ] as const) {
      void all;
      if (picked.include.length === 1 && picked.include[0] != null) {
        const id = picked.include[0];
        chips.push({
          key: `${key}-in`,
          label: nameOf(id),
          onRemove: () =>
            onChange({
              ...v,
              [key === "cat" ? "categories" : "assets"]: {
                ...picked,
                include: [],
              },
            }),
        });
      } else if (picked.include.length > 1) {
        chips.push({
          key: `${key}-in`,
          label: t(key === "cat" ? "filter.chipCats" : "filter.chipAssets", {
            count: picked.include.length,
          }),
          onRemove: () =>
            onChange({
              ...v,
              [key === "cat" ? "categories" : "assets"]: {
                ...picked,
                include: [],
              },
            }),
        });
      }
      if (picked.exclude.length > 0) {
        chips.push({
          key: `${key}-ex`,
          label:
            picked.exclude.length === 1 && picked.exclude[0] != null
              ? t("filter.chipExcludeOne", { name: nameOf(picked.exclude[0]) })
              : t("filter.excluded", { count: picked.exclude.length }),
          onRemove: () =>
            onChange({
              ...v,
              [key === "cat" ? "categories" : "assets"]: {
                ...picked,
                exclude: [],
              },
            }),
        });
      }
    }
    if (v.amountRanges.length > 0) {
      chips.push({
        key: "amount",
        label: t("filter.chipAmountRanges", { count: v.amountRanges.length }),
        onRemove: () => onChange({ ...v, amountRanges: [] }),
      });
    }
  }
  if (chips.length === 0) return null;
  return (
    <div
      className="scrollbar-hide -mx-[var(--spacing-xl)] px-[var(--spacing-xl)]"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingTop: 8,
        alignItems: "center",
      }}
    >
      {chips.map((c) => (
        <span
          key={c.key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            padding: "6px 8px 6px 12px",
            background: "var(--bg-brand-subtle)",
            color: "var(--fg-brand-strong)",
            border: "1px solid var(--border-brand)",
            borderRadius: "var(--radius-pill)",
            fontSize: "var(--text-label-sm)",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          <span>{c.label}</span>
          <button
            onClick={c.onRemove}
            aria-label={t("filter.reset")}
            style={{
              border: 0,
              background: "transparent",
              color: "var(--fg-brand)",
              cursor: "pointer",
              display: "inline-flex",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </span>
      ))}
    </div>
  );
}

/** 폰 첫 진입 스켈레톤 — 틀(월 이동 · 요일 · 단추)은 그리고 서버 데이터 자리만 스켈레톤이다. */
export function ExpenseMobileSkeleton({ month }: { month?: string }) {
  const { t } = useTranslation("expense");
  // 정적 틀(월네비/소비요약 버튼/요일/expand)은 실제 렌더 — 스켈레톤은 서버 데이터만
  // (총액·인사이트·셀 금액·리스트). feedback_skeleton_server_data_only.
  const mk = month ?? currentMonthKey();
  const now = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (now.getDay() - i));
    return d;
  });
  const [y, m] = mk.split("-").map(Number);
  const inMonth = (d: Date) => d.getFullYear() === y && d.getMonth() + 1 === m;
  const dowLabels = Array.from(
    { length: 7 },
    (_, i) => formatDay(`2026-02-${TXM_PAD(i + 1)}`).dow,
  );
  return (
    <LedgerShell>
      <LedgerPin>
        <LedgerMonthNav>
          <LedgerNavBtn aria-label={t("prevMonth")}>
            <ChevronLeft size={19} />
          </LedgerNavBtn>
          <LedgerMonthLabel>{txmMonthLabel(mk)}</LedgerMonthLabel>
          <LedgerNavBtn aria-label={t("nextMonth")}>
            <ChevronRight size={19} />
          </LedgerNavBtn>
          <LedgerNavBtn className="ml-auto" aria-label={t("filter.title")}>
            <SlidersHorizontal size={18} />
          </LedgerNavBtn>
          <LedgerNavBtn aria-label={t("addTransaction")}>
            <Plus size={19} />
          </LedgerNavBtn>
        </LedgerMonthNav>
        <LedgerCollapse>
          <LedgerHead>
            <div style={{ minWidth: 0, flex: 1 }}>
              <SkeletonBase className="h-8 w-40" />
              <SkeletonBase className="mt-2 h-4 w-52" />
            </div>
            <LedgerSumBtn>{t("txm.spendSummary")}</LedgerSumBtn>
          </LedgerHead>
        </LedgerCollapse>
        <LedgerCalendar>
          <LedgerDow
            labels={dowLabels}
            colorFor={(i) =>
              i === 0
                ? "var(--color-fg-critical)"
                : i === 6
                  ? "var(--fg-brand)"
                  : undefined
            }
          />
          <LedgerWeek>
            {weekDays.map((d, i) => (
              <LedgerCell key={i} empty>
                <LedgerCellNum
                  style={{
                    color: "var(--fg-primary)",
                    opacity: inMonth(d) ? 1 : 0.35,
                  }}
                >
                  {d.getDate()}
                </LedgerCellNum>
                <LedgerCellAmt>
                  <SkeletonBase className="h-2.5 w-8" />
                </LedgerCellAmt>
              </LedgerCell>
            ))}
          </LedgerWeek>
          <LedgerExpand />
        </LedgerCalendar>
        <LedgerDivider />
      </LedgerPin>
      <LedgerList
        style={{
          paddingTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <ExpenseDayGroupSkeleton rows={3} />
        <ExpenseDayGroupSkeleton rows={2} />
      </LedgerList>
    </LedgerShell>
  );
}

export function ExpenseMobile({ onAddTx }: { onAddTx: () => void }) {
  const { t } = useTranslation("expense");
  const [searchParams] = useSearchParams();
  const initialMonth = monthFromQuery(searchParams.get("month"));
  const focusTxId = Number(searchParams.get("txId")) || null;
  const [month, setMonth] = useState<string>(initialMonth);
  const { assetId, asset, clear } = useAssetFilter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${TXM_PAD(now.getMonth() + 1)}-${TXM_PAD(now.getDate())}`;
  // 셀 차트형 툴팁(지출·수입) — hover 셀 기준 좌표 (사용자 결정).
  const [cellTip, setCellTip] = useState<{
    ds: string;
    left: number;
    top: number;
  } | null>(null);
  const calRef = useRef<HTMLDivElement | null>(null);
  // pin compact·스크롤 스파이·lock — 공용 원장 훅 (design txm-pin).
  const {
    rootRef,
    pinRef,
    compact,
    selected,
    setSelected,
    lock,
    scrollToDay,
    scrollToTop,
  } = useLedgerScroll({
    initialSelected: todayStr.startsWith(initialMonth) ? todayStr : null,
    onCompactEnter: () => setExpanded(false),
  });
  // 상세→편집 flow — EditableList 패턴 인라인(dayhead 형식이 달라 리스트 자체 렌더).
  const [detail, setDetail] = useState<Expense | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  // 스와이프 액션 — 상세 다이얼로그와 같은 뮤테이션·같은 확인 문구를 쓴다(아래
  // `useExpenseSwipeActions`). 행의 접근명만 여기서 만든다.
  const { t: tc } = useTranslation("common");

  const rowLabelOf = (e: Expense) =>
    e.merchant ?? e.description ?? e.categoryName ?? tc("transaction");

  // 지출 상세 → '환불' → 원거래를 승계한 환불 입력(수입 + 원거래 연결).
  // 이체는 지출과 별개 엔티티라 상세도 별도(수정 없이 삭제만).
  const [transferDetail, setTransferDetail] = useState<AssetTransfer | null>(
    null,
  );
  const [editingTransfer, setEditingTransfer] = useState<AssetTransfer | null>(
    null,
  );

  const categoriesQ = useExpenseCategories();
  const assetsQ = useAssets();
  // 밀면 [수정, 삭제] — 상세를 닫고 수정으로 가는 것은 상세 footer 의 수정과 같은 목적지.
  const swipeActionsFor = useExpenseSwipeActions({
    assets: assetsQ.data?.assets ?? [],
    onEdit: (e) => {
      setDetail(null);
      setEditing(e);
    },
  });
  const {
    expenses,
    transfers,
    monthIn,
    monthOut,
    isLoadingList,
    isLoadingSummary,
  } = useExpenseData(
    month,
    "all",
    filterValue,
    assetId,
    categoriesQ.data ?? null,
  );
  const viewPeriod = monthPeriodOf(month);
  const activeCount = filterActiveCount(filterValue, viewPeriod);

  // 인사이트 — 지난달 지출 대비 / 없으면 이번 달 최다 지출 카테고리.
  const prevRange = monthRange(shiftMonthKey(month, -1));
  const prevQ = useRangeSummary(prevRange.startDate, prevRange.endDate);
  const curRange = monthRange(month);
  const curSummaryQ = useRangeSummary(curRange.startDate, curRange.endDate);

  const insightHidden = useHideAmounts(INSIGHT_CARDS, "expense");
  const insight = useMemo(() => {
    if (isLoadingList || isLoadingSummary) return null;
    if (expenses.length === 0) return <>{t("txm.insightNone")}</>;
    const prevOut = prevQ.data?.totalExpense ?? 0;
    if (prevOut > 0) {
      const diff = prevOut - monthOut;
      if (Math.abs(diff) < INSIGHT_SAME_MAX) return <>{t("txm.insightSame")}</>;
      // 문장은 남기고 금액만 가린다 — 방향(덜/더)은 크기가 아니라서 그대로 둔다.
      const amount = insightHidden
        ? HIDE_AMOUNTS_MASK
        : insightDiffAmount(diff);
      return (
        <Trans
          t={t}
          i18nKey={diff > 0 ? "txm.insightLess" : "txm.insightMore"}
          values={{ amount }}
          components={{
            hl: (
              <b
                className={
                  diff > 0
                    ? "font-bold text-[var(--fg-brand)]"
                    : "font-bold text-[var(--color-fg-critical)]"
                }
              />
            ),
          }}
        />
      );
    }
    const top = (curSummaryQ.data?.categoryBreakdown ?? [])
      .filter((b) => b.expenseType === "EXPENSE")
      .slice()
      .sort((a, b) => b.totalAmount - a.totalAmount)[0];
    if (top) {
      return (
        <Trans
          t={t}
          i18nKey="txm.insightTopCat"
          values={{ cat: top.categoryName }}
          components={{
            hl: <b className="font-bold text-[var(--fg-brand)]" />,
          }}
        />
      );
    }
    return null;
  }, [
    isLoadingList,
    isLoadingSummary,
    expenses.length,
    prevQ.data,
    curSummaryQ.data,
    monthOut,
    insightHidden,
    t,
  ]);

  // 일별 합계 — 캘린더 셀 밑 금액.
  const byDay = useMemo(() => {
    const m: Record<string, { out: number; inn: number }> = {};
    // 서버 집계와 같은 규칙 — 환불된 것과 아직 안 온 건 `countableTx` 가 이미 뺀다.
    for (const e of countableTx(expenses)) {
      const k = dayKey(e.expenseDate);
      m[k] = m[k] || { out: 0, inn: 0 };
      if (e.expenseType === "EXPENSE") m[k].out += Math.abs(e.amount);
      else m[k].inn += Math.abs(e.amount);
    }
    return m;
  }, [expenses]);

  // 툴팁이 가리키는 날의 합계 — 한 번만 집는다. 값을 자리마다 다시 꺼내면
  // 부호를 붙이는 자리와 숫자를 그리는 자리가 갈려 어긋나기 쉽다.
  const tipDay = cellTip ? byDay[cellTip.ds] : undefined;

  // 캘린더 주(week) 구성.
  const weeks = useMemo(() => {
    const [y = 0, m = 1] = month.split("-").map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const dim = new Date(y, m, 0).getDate();
    const cells: ({ d: number; ds: string } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= dim; d++)
      cells.push({ d, ds: `${month}-${TXM_PAD(d)}` });
    while (cells.length % 7) cells.push(null);
    const out: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [month]);
  let selWeek = weeks.findIndex((w) => w.some((c) => c && c.ds === selected));
  if (selWeek < 0)
    selWeek = weeks.findIndex((w) => w.some((c) => c && c.ds === todayStr));
  if (selWeek < 0) selWeek = 0;

  const goMonth = (dir: -1 | 1) => {
    const next = shiftMonthKey(month, dir);
    setMonth(next);
    setSelected(todayStr.startsWith(next) ? todayStr : null);
    setExpanded(false);
    lock(800);
    scrollToTop();
  };

  const numColor = (ds: string, dow: number): string => {
    if (ds > todayStr) return "var(--fg-tertiary)";
    if (dow === 0) return "var(--color-fg-critical)"; // 캘린더 일요일 정합(사용자 결정)
    if (dow === 6) return "var(--fg-brand)";
    return "var(--fg-primary)";
  };

  const dowLabels = useMemo(() => {
    // 요일 라벨 — formatDay 로케일 반환 재사용(2026-02-01 = 일요일).
    return Array.from(
      { length: 7 },
      (_, i) => formatDay(`2026-02-${TXM_PAD(i + 1)}`).dow,
    );
  }, []);

  const grouped = useMemo(
    () => groupLedgerByDay(expenses, transfers),
    [expenses, transfers],
  );
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${TXM_PAD(yest.getMonth() + 1)}-${TXM_PAD(yest.getDate())}`;
  const relOf = (d: string) =>
    d === todayStr
      ? t("txm.today")
      : d === yesterdayStr
        ? t("txm.yesterday")
        : null;

  const focusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusTxId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusTxId, expenses.length]);

  // 필터 활성 시 — 월선택/총액/캘린더/divider 숨기고 온전히 리스트만(사용자 결정).
  const filterActive = activeCount > 0 || !!asset;

  return (
    <LedgerShell ref={rootRef}>
      {/* 고정 영역 — 월네비 + 총액(스크롤 시 접힘) + 캘린더. 리스트만 스크롤(design txm-pin). */}
      <LedgerPin ref={pinRef} compact={compact}>
        {/* 월 네비 + 필터/추가 */}
        <LedgerMonthNav>
          {!filterActive && (
            <>
              <LedgerNavBtn
                onClick={() => goMonth(-1)}
                aria-label={t("prevMonth")}
              >
                <ChevronLeft size={19} />
              </LedgerNavBtn>
              <LedgerMonthLabel>{txmMonthLabel(month)}</LedgerMonthLabel>
              <LedgerNavBtn
                onClick={() => goMonth(1)}
                aria-label={t("nextMonth")}
              >
                <ChevronRight size={19} />
              </LedgerNavBtn>
            </>
          )}
          <LedgerNavBtn
            className="ml-auto relative"
            active={activeCount > 0}
            onClick={() => setFilterOpen(true)}
            aria-label={t("filter.title")}
          >
            <SlidersHorizontal size={18} />
            {activeCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--bg-brand-hover)] px-1 text-[length:var(--text-badge)] font-bold text-[var(--fg-on-brand)]"
              >
                {activeCount}
              </span>
            )}
          </LedgerNavBtn>
          <LedgerNavBtn onClick={onAddTx} aria-label={t("addTransaction")}>
            <Plus size={19} />
          </LedgerNavBtn>
        </LedgerMonthNav>

        {filterActive && (
          <FilterChipsRow
            filterValue={filterValue}
            onChange={(v) =>
              setFilterValue(
                v && filterActiveCount(v, viewPeriod) > 0 ? v : null,
              )
            }
            assetName={asset?.assetName}
            onClearAsset={clear}
            categories={categoriesQ.data ?? []}
            assets={assetsQ.data?.assets ?? []}
          />
        )}

        {/* 총액 + 인사이트 + 소비 요약 — 스크롤 시 접힘. 필터 활성 시 숨김. */}
        {!filterActive && (
          <LedgerCollapse>
            <LedgerHead>
              <div style={{ minWidth: 0 }}>
                <LedgerTotal className="num">
                  {isLoadingSummary ? (
                    "—"
                  ) : (
                    <>
                      <MaskAmount card="ledger.txList" kind="expense">
                        {wonPre()}
                        {KRW(monthOut)}
                      </MaskAmount>
                      <WonUnit card="ledger.txList" kind="expense" />
                    </>
                  )}
                </LedgerTotal>
                {insight && <LedgerSub>{insight}</LedgerSub>}
              </div>
              <LedgerSumBtn
                active={sumOpen}
                onClick={() => setSumOpen((v) => !v)}
                aria-expanded={sumOpen}
              >
                {t("txm.spendSummary")}
              </LedgerSumBtn>
            </LedgerHead>

            {sumOpen && (
              <LedgerSummary>
                <LedgerSummaryRow>
                  <span>{t("income")}</span>
                  <span className="num" style={{ color: "var(--fg-brand)" }}>
                    <MaskAmount card="ledger.txList" kind="income">
                      +{wonPre()}
                      {KRW(monthIn)}
                    </MaskAmount>
                    <WonUnit card="ledger.txList" kind="income" />
                  </span>
                </LedgerSummaryRow>
                <LedgerSummaryRow>
                  <span>{t("expense")}</span>
                  <span className="num" style={{ color: "var(--fg-expense)" }}>
                    <MaskAmount card="ledger.txList" kind="expense">
                      {minusOf(monthOut)}
                      {wonPre()}
                      {KRW(Math.abs(monthOut))}
                    </MaskAmount>
                    <WonUnit card="ledger.txList" kind="expense" />
                  </span>
                </LedgerSummaryRow>
                <LedgerSummaryRow total>
                  <span>{t("txDetail.sumLabel")}</span>
                  <span className="num">
                    <MaskAmount card="ledger.txList" kind="net">
                      {monthIn - monthOut >= 0 ? "+" : "−"}
                      {wonPre()}
                      {KRW(Math.abs(monthIn - monthOut))}
                    </MaskAmount>
                    <WonUnit card="ledger.txList" kind="net" />
                  </span>
                </LedgerSummaryRow>
              </LedgerSummary>
            )}
          </LedgerCollapse>
        )}

        {/* 캘린더 — 접힘: 선택 주 1줄 / 펼침: 월 전체. 필터 적용 시 숨김(리스트만, 사용자 결정). */}
        {!filterActive && (
          <LedgerCalendar ref={calRef}>
            <LedgerDow
              labels={dowLabels}
              // 일요일은 아래 날짜 숫자와 같은 색이어야 한다(dowColor 도 --fg-expense).
              // 카테고리 팔레트의 빨강(--color-chart-red)을 쓰고 있어 헤더만 톤이 달랐다.
              colorFor={(i) =>
                i === 0
                  ? "var(--color-fg-critical)"
                  : i === 6
                    ? "var(--fg-brand)"
                    : undefined
              }
            />
            {(expanded ? weeks : [weeks[selWeek] ?? []]).map((w, wi) => (
              <LedgerWeek key={wi}>
                {w.map((c, i) => {
                  if (!c) return <LedgerCell key={`e${i}`} empty />;
                  const isSel = c.ds === selected;
                  const data = byDay[c.ds];
                  return (
                    <LedgerCell
                      key={c.ds}
                      selected={isSel}
                      onClick={() => {
                        setSelected(c.ds);
                        if (data) {
                          lock(800);
                          scrollToDay(c.ds);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!data || !calRef.current) return;
                        const cell = e.currentTarget.getBoundingClientRect();
                        const cal = calRef.current.getBoundingClientRect();
                        setCellTip({
                          ds: c.ds,
                          left: cell.left - cal.left + cell.width / 2,
                          top: cell.top - cal.top,
                        });
                      }}
                      onMouseLeave={() => setCellTip(null)}
                    >
                      <LedgerCellNum
                        selected={isSel}
                        style={
                          isSel
                            ? undefined
                            : {
                                color: numColor(c.ds, i % 7),
                                opacity: c.ds > todayStr ? 0.55 : 1,
                              }
                        }
                      >
                        {c.d}
                      </LedgerCellNum>
                      {/* 지출·수입 병기(각 줄) — 색은 아래 리스트와 동일(사용자 결정). */}
                      {data && data.out > 0 && (
                        <LedgerCellAmt
                          className="num"
                          style={{ color: "var(--fg-expense)" }}
                        >
                          <MaskAmount
                            card={CALENDAR_CELL_CARDS}
                            kind="expense"
                            mask="••"
                          >
                            -{KRW(data.out)}
                          </MaskAmount>
                        </LedgerCellAmt>
                      )}
                      {data && data.inn > 0 && (
                        <LedgerCellAmt
                          className="num"
                          style={{ color: "var(--fg-brand)" }}
                        >
                          <MaskAmount
                            card={CALENDAR_CELL_CARDS}
                            kind="income"
                            mask="••"
                          >
                            +{KRW(data.inn)}
                          </MaskAmount>
                        </LedgerCellAmt>
                      )}
                      {!data && <LedgerCellAmt className="num" />}
                    </LedgerCell>
                  );
                })}
              </LedgerWeek>
            ))}
            <LedgerExpand
              expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t("viewCalendar") : t("viewList")}
            />
            {/* 차트형 셀 툴팁 — 통계 GrooChartTooltip 시각 미러(지출·수입 모두, 사용자 결정). */}
            {cellTip && tipDay && (
              <LedgerCellTip
                left={cellTip.left}
                top={cellTip.top}
                title={
                  <>
                    {Number(cellTip.ds.slice(5, 7))}.{" "}
                    {Number(cellTip.ds.slice(8, 10))}
                  </>
                }
                rows={[
                  {
                    label: t("expense"),
                    color: "var(--color-fg-critical)",
                    value: (
                      <>
                        <MaskAmount card="ledger.txList" kind="expense">
                          {minusOf(tipDay.out)}
                          {wonPre()}
                          {KRW(Math.abs(tipDay.out))}
                        </MaskAmount>
                        <WonUnit card="ledger.txList" kind="expense" />
                      </>
                    ),
                  },
                  {
                    label: t("income"),
                    color: "var(--fg-brand)",
                    value: (
                      <>
                        <MaskAmount card="ledger.txList" kind="income">
                          +{wonPre()}
                          {KRW(tipDay.inn)}
                        </MaskAmount>
                        <WonUnit card="ledger.txList" kind="income" />
                      </>
                    ),
                  },
                ]}
              />
            )}
          </LedgerCalendar>
        )}

        {!filterActive && <LedgerDivider />}
      </LedgerPin>

      {/* 거래 리스트 — 날짜 그룹 */}
      <LedgerList>
        {isLoadingList ? (
          <div
            style={{
              paddingTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <ExpenseDayGroupSkeleton rows={3} />
            <ExpenseDayGroupSkeleton rows={2} />
          </div>
        ) : (
          grouped.map(([d, items]) => {
            const [yy, mm, dd] = d.split("-");
            const dow = formatDay(d).dow;
            const rel = relOf(d);
            // 일별 합계 — 이체는 자산 간 이동이라 지출/수입 어느 쪽에도 넣지 않는다.
            const dayExpenses = items.flatMap((i) =>
              i.kind === "expense" ? [i.expense] : [],
            );
            const dOut = expenseSum(dayExpenses);
            const dIn = incomeSum(dayExpenses);
            return (
              <LedgerDayGroup key={d} day={d}>
                <LedgerDayHead>
                  <LedgerDayDate>
                    {(yy ?? "").slice(2)}. {Number(mm)}. {Number(dd)}({dow})
                  </LedgerDayDate>
                  {rel && <LedgerDayRel>&nbsp;· {rel}</LedgerDayRel>}
                  <LedgerDaySum className="num">
                    {dOut > 0 && (
                      <span className="font-semibold text-[var(--fg-expense)]">
                        <MaskAmount card="ledger.txList" kind="expense">
                          -{wonPre()}
                          {KRW(dOut)}
                        </MaskAmount>
                        <WonUnit card="ledger.txList" kind="expense" />
                      </span>
                    )}
                    {dIn > 0 && (
                      <span className="ml-2 font-semibold text-[var(--fg-brand)]">
                        <MaskAmount card="ledger.txList" kind="income">
                          +{wonPre()}
                          {KRW(dIn)}
                        </MaskAmount>
                        <WonUnit card="ledger.txList" kind="income" />
                      </span>
                    )}
                  </LedgerDaySum>
                </LedgerDayHead>
                <div>
                  {items.map((item) => {
                    // 지출·이체는 다른 테이블이라 rowId 가 겹칠 수 있다 — key·포커스는 종류까지 합쳐 판별.
                    const isFocus =
                      item.kind === "expense" &&
                      focusTxId === item.expense.rowId;
                    return item.kind === "expense" ? (
                      <SwipeActions
                        key={ledgerKey(item)}
                        ref={isFocus ? focusRef : undefined}
                        rowId={`expense-${item.expense.rowId}`}
                        groupTag="expense-list"
                        rowLabel={rowLabelOf(item.expense)}
                        // 데스크톱 통과는 spec Platform — 이 브랜치는 이미 모바일 전용이라
                        // 실질 no-op 이지만, 공용 컴포넌트로 옮겨질 때 새지 않게 의미를 남긴다.
                        enabled
                        style={{
                          background: isFocus
                            ? "var(--bg-brand-subtle)"
                            : "var(--bg-surface)",
                          transition: "background 0.4s",
                          borderRadius: 10,
                        }}
                        // 시스템이 만든 거래(매도 실현손익·이체 이자)는 원본을 지워야 사라진다 —
                        // 상세 다이얼로그가 버튼을 감추는 것과 같은 조건으로 액션 자체를 없앤다.
                        actions={
                          item.expense.autoSource != null
                            ? []
                            : swipeActionsFor(item.expense)
                        }
                      >
                        <ExpenseRow
                          expense={item.expense}
                          onClick={(ex) => setDetail(ex)}
                        />
                      </SwipeActions>
                    ) : (
                      // 이체 행은 감싸지 않는다 — 앱도 제외한다.
                      <div key={ledgerKey(item)}>
                        <TransferRow
                          transfer={item.transfer}
                          onClick={(tr) => setTransferDetail(tr)}
                        />
                      </div>
                    );
                  })}
                </div>
              </LedgerDayGroup>
            );
          })
        )}
        {!isLoadingList && expenses.length === 0 && transfers.length === 0 && (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <ReceiptText
              size={36}
              style={{ color: "var(--fg-tertiary)", margin: "0 auto 12px" }}
            />
            <div
              style={{
                fontSize: "var(--text-body-sm)",
                fontWeight: 700,
                color: "var(--fg-primary)",
                marginBottom: 4,
              }}
            >
              {t("txm.emptyMonth", { month: txmMonthLabel(month) })}
            </div>
            <div
              style={{
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-tertiary)",
              }}
            >
              {t("txm.emptyMonthDesc")}
            </div>
          </div>
        )}
      </LedgerList>

      {!filterActive && (
        <LedgerPrevBtn onClick={() => goMonth(-1)}>
          {t("txm.prevMonthBtn", {
            month: txmMonthLabel(shiftMonthKey(month, -1)),
          })}
        </LedgerPrevBtn>
      )}

      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile
          onClose={() => setDetail(null)}
          onEdit={(e) => {
            setDetail(null);
            setEditing(e);
          }}
        />
      )}
      {editing && (
        <AddTxSheet expense={editing} mobile onClose={() => setEditing(null)} />
      )}
      {transferDetail && !editingTransfer && (
        <TransferDetailDialog
          transfer={transferDetail}
          mobile
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
          mobile
          onClose={() => setEditingTransfer(null)}
        />
      )}
      {filterOpen && (
        <FilterDialog
          initial={filterValue}
          defaultPeriod={viewPeriod}
          categories={categoriesQ.data ?? []}
          assets={assetsQ.data?.assets ?? []}
          onClose={() => setFilterOpen(false)}
          onApply={(v) => {
            setFilterValue(v);
            setFilterOpen(false);
          }}
          mobile
        />
      )}
    </LedgerShell>
  );
}
