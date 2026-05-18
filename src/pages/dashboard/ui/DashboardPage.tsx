import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  CalendarClock, CheckCircle2, CheckSquare, ChevronRight, Circle, Eye, EyeOff, Receipt, Target, TrendingDown, TrendingUp, UsersRound, Wallet,
} from 'lucide-react'
import { Bar, BarChart as RcBarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  HideUnit,
  MaskAmount,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import { Donut } from '@/shared/ui/porest/charts'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { useDashboardSummary, type DashboardSummary } from '@/features/dashboard'
import { useAssetSummary } from '@/features/asset'
import {
  useExpenses,
  useExpenseCategories,
  useRangeSummary,
  useMonthlyTrend,
  useExpenseBudgets,
} from '@/features/expense'
import { getPaletteByColor } from '@/features/porest/dialogs'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import type { Expense } from '@/entities/expense'
import { aggregateByParent } from '@/entities/expense'

const barChartConfig = {
  income:  { label: '수입', color: 'var(--bg-brand)' },
  expense: { label: '지출', color: 'var(--fg-expense)' },
} satisfies ChartConfig

function fmtAxisNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000)      return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

type BarPayloadItem = { dataKey?: string; value?: number; payload?: Record<string, unknown> }
type BarTooltipProps = { active?: boolean; payload?: BarPayloadItem[]; label?: string }

function IncomeExpenseTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const income = Number(payload.find(p => p.dataKey === 'income')?.value ?? 0)
  const expense = Number(payload.find(p => p.dataKey === 'expense')?.value ?? 0)
  const saving = income - expense
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 'var(--fs-caption)',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-semi)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-2xs)', background: 'var(--bg-brand)' }} />
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-secondary)' }}>수입</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)' }}>
          <MaskAmount>{KRW(income)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-2xs)', background: 'var(--fg-expense)' }} />
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-secondary)' }}>지출</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)' }}>
          <MaskAmount>{KRW(expense)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-secondary)' }}>저축</span>
        <span
          className="num"
          style={{
            marginLeft: 'auto', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)',
            color: saving >= 0 ? 'var(--fg-brand)' : 'var(--fg-expense)',
          }}
        >
          <MaskAmount>{saving >= 0 ? '+' : '−'}{KRW(Math.abs(saving))}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
    </div>
  )
}

function IncomeExpenseBarChart({ data, height = 200 }: {
  data: { label: string; income: number; expense: number }[]
  height?: number
}) {
  return (
    <ChartContainer
      config={barChartConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <RcBarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }} barGap={8} barCategoryGap="55%">
        <CartesianGrid
          vertical={false}
          stroke="var(--border-subtle)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--fg-tertiary)' }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtAxisNum}
          tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--fg-tertiary)' }}
          width={48}
        />
        <ChartTooltip cursor={{ fill: 'var(--bg-brand)', fillOpacity: 0.06 }} content={<IncomeExpenseTooltip />} />
        <Bar dataKey="income"  fill="var(--color-income)"  radius={4} barSize={28} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} barSize={28} />
      </RcBarChart>
    </ChartContainer>
  )
}

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// porest chart palette 10색 — 카테고리 fallback (카테고리 자체 색이 없을 때만 사용).
// `--color-cat-*` alias 사용 — 라이트/다크에서 base ↔ light variant 자동 swap.
const CATEGORY_PALETTE = [
  'var(--color-cat-blue)',
  'var(--color-cat-green)',
  'var(--color-cat-orange)',
  'var(--color-cat-violet)',
  'var(--color-cat-pink)',
  'var(--color-cat-indigo)',
  'var(--color-cat-red)',
  'var(--color-cat-yellow)',
  'var(--color-cat-brown)',
  'var(--color-cat-gray)',
]

function Skeleton({ height = 120, style = {} }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="animate-pulse bg-surface-input rounded-lg"
      style={{ height, ...style }}
    />
  )
}

/**
 * Dashboard 페이지 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계.
 * desktop/mobile 공통 — 같은 쿼리들이 재호출되어도 캐시 hit.
 */
function useDashboardPageData(year: number, month: number, opts?: { includePrevMonth?: boolean }) {
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const monthStart = `${year}-${pad2(month)}-01`
  const monthEnd = `${year}-${pad2(month)}-${pad2(new Date(year, month, 0).getDate())}`

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary(year, month)
  const monthlyQ = useRangeSummary(monthStart, monthEnd)
  const trendQ = useMonthlyTrend(6)
  const recentQ = useExpenses({ startDate: monthStart, endDate: monthEnd })
  const budgetsQ = useExpenseBudgets({ year, month })
  const categoriesQ = useExpenseCategories()
  const recurringQ = useRecurringTransactions()

  // mobile 전용 — 전월 비교용 range summary
  const prevDate = new Date(year, month - 2, 1)
  const prevY = prevDate.getFullYear()
  const prevM = prevDate.getMonth() + 1
  const prevStart = `${prevY}-${pad2(prevM)}-01`
  const prevEnd = `${prevY}-${pad2(prevM)}-${pad2(new Date(prevY, prevM, 0).getDate())}`
  const prevMonthlyQ = useRangeSummary(
    opts?.includePrevMonth ? prevStart : '',
    opts?.includePrevMonth ? prevEnd : '',
  )

  return {
    isLoading:
      dashboardQ.isLoading || assetSummaryQ.isLoading || monthlyQ.isLoading
      || trendQ.isLoading || recentQ.isLoading || budgetsQ.isLoading
      || categoriesQ.isLoading || recurringQ.isLoading
      || (opts?.includePrevMonth ? prevMonthlyQ.isLoading : false),
  }
}

/** Dashboard 페이지 구조에 맞춘 skeleton. desktop 2-col(좌 hero+수입지출+오늘 / 우 카테고리+예산+예정+할일+일정). */
function DashboardPageSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DashboardHeroSkeleton mobile />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <SkeletonBase className="h-8 w-8 rounded-md" />
              <SkeletonBase className="h-3 w-10" />
            </div>
          ))}
        </div>
        <DashboardSummaryCardSkeleton mobile />
        <DashboardCategoryCardSkeleton mobile />
        <DashboardBudgetCardSkeleton />
        <DashboardListCardSkeleton title rows={3} />
      </div>
    )
  }
  return (
    <div className="dash-grid">
      <div className="dash-grid__left">
        <DashboardHeroSkeleton mobile={false} />
        <DashboardSummaryCardSkeleton mobile={false} />
        <DashboardListCardSkeleton title rows={3} />
      </div>
      <div className="dash-grid__right">
        <DashboardCategoryCardSkeleton mobile={false} />
        <DashboardBudgetCardSkeleton />
        <DashboardListCardSkeleton title rows={3} />
        <DashboardListCardSkeleton title rows={4} />
        <DashboardListCardSkeleton title rows={3} />
      </div>
    </div>
  )
}

function DashboardHeroSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div className="balance-hero" style={mobile ? undefined : { padding: '28px 32px 24px' }}>
      <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
        <SkeletonBase className="h-3 w-24 bg-white/15" />
      </div>
      <div className="balance-hero__amount num">
        <SkeletonBase className={mobile ? 'h-8 w-40 bg-white/15' : 'h-10 w-56 bg-white/15'} />
      </div>
      <div className="balance-hero__sub">
        <SkeletonBase className="h-3 w-32 bg-white/15" />
      </div>
      <div className="balance-hero__split">
        <div>
          <SkeletonBase className="h-3 w-12 mb-1 bg-white/15" />
          <SkeletonBase className="h-5 w-24 bg-white/15" />
        </div>
        <div>
          <SkeletonBase className="h-3 w-12 mb-1 bg-white/15" />
          <SkeletonBase className="h-5 w-24 bg-white/15" />
        </div>
      </div>
    </div>
  )
}

function DashboardSummaryCardSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-28" />
        <SkeletonBase className="h-7 w-24" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <SkeletonBase className="h-3 w-10 mb-2" />
              <SkeletonBase className="h-7 w-24" />
            </div>
          ))}
        </div>
        <SkeletonBase className={mobile ? 'h-[180px] w-full' : 'h-[280px] w-full'} />
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <SkeletonBase className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardCategoryCardSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-20" />
        <SkeletonBase className="h-4 w-12" />
      </CardHeader>
      <CardContent>
        <div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'row' : 'column',
            alignItems: 'center',
            gap: mobile ? 16 : 20,
          }}
        >
          <SkeletonBase
            className={mobile ? 'h-[120px] w-[120px] rounded-full shrink-0' : 'h-[160px] w-[160px] rounded-full shrink-0'}
          />
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SkeletonBase className="h-2.5 w-2.5 rounded-full shrink-0" />
                <SkeletonBase className="h-3 flex-1" />
                <SkeletonBase className="h-3 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardBudgetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-12" />
        <SkeletonBase className="h-4 w-16" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <SkeletonBase className="h-4 w-20" />
                <SkeletonBase className="h-4 w-24 ml-auto" />
              </div>
              <SkeletonBase className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardListCardSkeleton({ title, rows = 3 }: { title?: boolean; rows?: number }) {
  return (
    <Card>
      {title && (
        <CardHeader className="flex-row items-center justify-between">
          <SkeletonBase className="h-5 w-24" />
          <SkeletonBase className="h-4 w-16" />
        </CardHeader>
      )}
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                <SkeletonBase className="h-3 w-1/3" />
              </div>
              <SkeletonBase className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const DashboardPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { key } = useCurrentMonthKey()
  const [year, month] = key.split('-').map(Number) as [number, number]
  const { isLoading } = useDashboardPageData(year, month, { includePrevMonth: mobile })
  if (isLoading) return <DashboardPageSkeleton mobile={mobile} />
  return mobile ? <HomeMobile /> : <HomeDesktop />
}

function useCurrentMonthKey() {
  const now = new Date()
  return {
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

function HomeDesktop() {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const [unlockOpen, setUnlockOpen] = useState(false)
  const handleHideToggle = () => {
    if (hidden) setUnlockOpen(true)
    else enablePdHideAmounts()
  }
  const { key: initialKey } = useCurrentMonthKey()
  const [period, setPeriod] = useState(initialKey)
  const [periodY, periodM] = period.split('-').map(Number) as [number, number]

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const periodStart = `${periodY}-${pad2(periodM)}-01`
  const periodEnd = `${periodY}-${pad2(periodM)}-${pad2(new Date(periodY, periodM, 0).getDate())}`

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary(periodY, periodM)
  const monthlyQ = useRangeSummary(periodStart, periodEnd)
  const trendQ = useMonthlyTrend(6)
  const recentQ = useExpenses({ startDate: periodStart, endDate: periodEnd })
  const budgetsQ = useExpenseBudgets({ year: periodY, month: periodM })
  const categoriesQ = useExpenseCategories()
  const recurringQ = useRecurringTransactions()

  const summary = dashboardQ.data
  const assetSummary = assetSummaryQ.data
  const totalAssets = assetSummary?.totalAssets ?? 0
  const totalDebt = assetSummary?.totalDebt ?? 0
  const netWorth = assetSummary?.netWorth ?? 0
  const changeAmount = assetSummary?.changeAmount ?? 0
  const changePercent = assetSummary?.changePercent ?? 0
  const isUp = changeAmount >= 0
  const monthly = monthlyQ.data
  const income = monthly?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0
  const expense = monthly?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0
  const balance = income - expense

  const todayDStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  // 오늘 쓴 거래만
  const todayTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .filter(t => t.expenseDate?.slice(0, 10) === todayDStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
  const todayTotal = todayTx
    .filter(t => t.expenseType === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0)

  // 일평균 + 전월 대비 — 가계부 카드 요약 라인용
  const _today = new Date()
  const _isCurMonth = _today.getFullYear() === periodY && _today.getMonth() + 1 === periodM
  const _daysInMonth = new Date(periodY, periodM, 0).getDate()
  const _dayOfMonth = _isCurMonth ? _today.getDate() : _daysInMonth
  const dailyAvg = Math.round(expense / Math.max(1, _dayOfMonth))
  const trendArr = trendQ.data ?? []
  const prevExpense = (() => {
    if (trendArr.length < 2) return 0
    const idx = trendArr.findIndex(t => t.year === periodY && t.month === periodM)
    if (idx > 0) return trendArr[idx - 1]?.totalExpense ?? 0
    return trendArr[trendArr.length - 2]?.totalExpense ?? 0
  })()
  const savingsPct = prevExpense > 0 ? ((prevExpense - expense) / prevExpense) * 100 : 0

  const donutSegs = useMemo(() => {
    const expenseOnly = (monthly?.categoryBreakdown ?? []).filter(
      c => c.expenseType === 'EXPENSE',
    )
    const cats = categoriesQ.data ?? []
    const catColorMap = new Map<number, string | null | undefined>()
    for (const cat of cats) catColorMap.set(cat.rowId, cat.color)
    const items = aggregateByParent(expenseOnly)
      .slice()
      .sort((a, b) => b.totalAmount - a.totalAmount)
    return items.map((c, i) => {
      const raw = catColorMap.get(c.categoryRowId)
      const color = raw
        ? getPaletteByColor(raw).color
        : (CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? 'var(--bg-brand)')
      return {
        value: c.totalAmount,
        color,
        label: c.categoryName,
      }
    })
  }, [monthly, categoriesQ.data])
  const donutTotal = donutSegs.reduce((a, b) => a + b.value, 0)

  const barData = useMemo(() => {
    const trend = trendQ.data ?? []
    return trend.map(t => ({
      label: String(t.month).padStart(2, '0'),
      income: t.totalIncome,
      expense: t.totalExpense,
    }))
  }, [trendQ.data])

  const budgetItems = useMemo(() => {
    const budgets = budgetsQ.data ?? []
    const cats = categoriesQ.data ?? []
    const catMap = new Map<number, (typeof cats)[number]>()
    for (const c of cats) catMap.set(c.rowId, c)

    const spentByCat = new Map<number, number>()
    for (const c of monthly?.categoryBreakdown ?? []) {
      if (c.expenseType !== 'EXPENSE' || c.categoryRowId == null) continue
      // 본인에 누적
      spentByCat.set(c.categoryRowId, (spentByCat.get(c.categoryRowId) ?? 0) + c.totalAmount)
      // 예산이 부모(top-level) 에 걸리므로 자식 지출은 부모에도 roll-up.
      if (c.parentCategoryRowId != null) {
        spentByCat.set(
          c.parentCategoryRowId,
          (spentByCat.get(c.parentCategoryRowId) ?? 0) + c.totalAmount,
        )
      }
    }
    const totalExpense = monthly?.totalExpense ?? 0
    return budgets.map(b => {
      // 전체 상한(categoryRowId === null) 은 이번 달 모든 EXPENSE 합계를
      // 사용금액으로 사용 — 카테고리 예산이 없는 지출도 포함.
      const spent = b.categoryRowId == null
        ? totalExpense
        : spentByCat.get(b.categoryRowId) ?? 0
      const pct = b.budgetAmount > 0 ? (spent / b.budgetAmount) * 100 : 0
      const state = pct > 100 ? 'over' : pct > 85 ? 'warn' : ''
      const cat = b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined
      return {
        rowId: b.rowId,
        categoryName: cat?.categoryName ?? b.categoryName ?? '전체',
        icon: cat?.icon ?? 'tag',
        color: cat?.color,
        budgetAmount: b.budgetAmount,
        spent,
        pct,
        state,
      }
    })
  }, [budgetsQ.data, categoriesQ.data, monthly])

  const upcomingPayments = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const recurrings = (recurringQ.data ?? [])
      .filter(r => r.isActive === 'Y' && r.expenseType === 'EXPENSE' && r.nextExecutionDate)
      .map(r => {
        const next = new Date(r.nextExecutionDate as string)
        const d = Math.max(0, Math.round((next.getTime() - today.getTime()) / 86_400_000))
        const mm = next.getMonth() + 1
        const dd = next.getDate()
        return {
          rowId: r.rowId,
          title: r.description || r.merchant || r.categoryName,
          amount: r.amount,
          d,
          dateLabel: `${String(mm).padStart(2, '0')}월 ${String(dd).padStart(2, '0')}일`,
          nextIso: r.nextExecutionDate as string,
        }
      })
      .sort((a, b) => a.nextIso.localeCompare(b.nextIso))
    return recurrings.slice(0, 3)
  }, [recurringQ.data])

  return (
    <div className="dash-grid">
      <div className="dash-grid__left">
        <div className="balance-hero" style={{ padding: '28px 32px 24px' }}>
          <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
            <Wallet size={14} /> 순자산 · {periodY}년 {periodM}월
            <button
              onClick={handleHideToggle}
              title={hidden ? '금액 표시' : '금액 가리기'}
              style={{
                marginLeft: 'auto',
                background: 'oklch(1 0 0 / 0.12)',
                border: '1px solid oklch(1 0 0 / 0.15)',
                color: 'inherit',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="balance-hero__amount num">
            {assetSummaryQ.isLoading ? '—' : <MaskAmount>{KRW(netWorth)}</MaskAmount>}
            <HideUnit><span className="unit">원</span></HideUnit>
          </div>
          <div className="balance-hero__sub">
            지난달 대비
            <span className={`chg ${isUp ? 'up' : 'down'}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {' '}
              {isUp ? '+' : ''}{changePercent.toFixed(1)}%
              {changeAmount !== 0 && (
                <HideUnit>
                  <>{' '}({isUp ? '+' : '−'}{KRW(Math.abs(changeAmount))}원)</>
                </HideUnit>
              )}
            </span>
          </div>
          <div className="balance-hero__split">
            <div>
              <div className="l">총 자산</div>
              <div className="v num">
                <MaskAmount>{KRW(totalAssets)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
            <div>
              <div className="l">총 부채</div>
              <div className="v num">
                <MaskAmount>−{KRW(totalDebt)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{periodM}월 수입·지출</CardTitle>
            <MonthPicker value={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 4 }}>수입</div>
              <div className="num" style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-brand)', letterSpacing: 'var(--tracking-tight)' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <><MaskAmount>+{KRW(income)}</MaskAmount><HideUnit>원</HideUnit></>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 4 }}>지출</div>
              <div className="num" style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-expense)', letterSpacing: 'var(--tracking-tight)' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <><MaskAmount>−{KRW(expense)}</MaskAmount><HideUnit>원</HideUnit></>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 4 }}>잔액</div>
              <div className="num" style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-brand-strong)', letterSpacing: 'var(--tracking-tight)' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <>
                      <MaskAmount>{balance >= 0 ? '+' : '-'}{KRW(Math.abs(balance))}</MaskAmount>
                      <HideUnit>원</HideUnit>
                    </>}
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <IncomeExpenseBarChart data={barData} height={280} />
          ) : trendQ.isLoading ? (
            <SkeletonBase className="h-[280px] w-full rounded-lg" />
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-body-sm)' }}>
              데이터가 없습니다
            </div>
          )}
          <div style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--fg-secondary)',
            lineHeight: 'var(--lh-normal)',
          }}>
            하루 평균{' '}
            <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: 'var(--fw-bold)' }}>
              <MaskAmount>{KRW(dailyAvg)}</MaskAmount>
            </span>
            <HideUnit>원</HideUnit>
            {' 썼어요.'}
            {prevExpense > 0 && (
              <>
                {' 전월 대비 '}
                <span style={{
                  color: savingsPct > 0 ? 'var(--fg-brand-strong)' : 'var(--fg-expense)',
                  fontWeight: 'var(--fw-bold)',
                }}>
                  {Math.abs(savingsPct).toFixed(0)}%
                </span>
                {savingsPct > 0 ? ' 절약 중이에요.' : savingsPct < 0 ? ' 더 썼어요.' : ' 동일해요.'}
              </>
            )}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <CardTitle>오늘 쓴 돈</CardTitle>
              {todayTotal > 0 && (
                <span className="num" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-expense)', fontWeight: 'var(--fw-bold)' }}>
                  <MaskAmount mask="••••">−{KRW(todayTotal)}</MaskAmount>
                  <HideUnit>원</HideUnit>
                </span>
              )}
            </div>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/expense')}>
              전체 보기 <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
          <div>
            {recentQ.isLoading && <Skeleton height={60} />}
            {!recentQ.isLoading && todayTx.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-body-sm)' }}>
                오늘은 아직 쓴 돈이 없어요
              </div>
            )}
            {todayTx.map(t => (
              <ExpenseRow
                key={t.rowId}
                expense={t}
                onClick={() => {
                  const m = t.expenseDate?.slice(0, 7) ?? ''
                  const params = new URLSearchParams()
                  if (m) params.set('month', m)
                  params.set('txId', String(t.rowId))
                  navigate(`/desk/expense?${params.toString()}`)
                }}
              />
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      <div className="dash-grid__right">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>카테고리</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/stats')}>
              자세히 <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
          {donutSegs.length === 0 ? (
            monthlyQ.isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <SkeletonBase className="h-[160px] w-[160px] rounded-full" />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SkeletonBase className="h-2.5 w-2.5 rounded-full shrink-0" />
                      <SkeletonBase className="h-3 flex-1" />
                      <SkeletonBase className="h-3 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-body-sm)' }}>
                카테고리 데이터가 없습니다
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <Donut segments={donutSegs} size={160} stroke={22}>
                <div className="lbl">이번 달 지출</div>
                <div className="val num">
                  <MaskAmount mask="••••">{KRW(donutTotal)}</MaskAmount>
                </div>
              </Donut>
              <div className="cat-legend">
                {donutSegs.map((s, i) => (
                  <div key={i} className="cat-legend__row">
                    <span className="cat-legend__sw" style={{ background: s.color }} />
                    <span className="cat-legend__name">{s.label}</span>
                    <span className="cat-legend__pct num">{((s.value / donutTotal) * 100).toFixed(0)}%</span>
                    <span className="cat-legend__amt num">
                      <MaskAmount mask="••••">{KRW(s.value)}</MaskAmount>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>예산</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/budget')}>
              예산 관리 <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
          {budgetItems.length === 0 ? (
            budgetsQ.isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                      <SkeletonBase className="h-4 w-20" />
                      <SkeletonBase className="h-4 w-24 ml-auto" />
                    </div>
                    <SkeletonBase className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
                등록된 예산이 없어요
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {budgetItems.map(b => {
                const palette = getPaletteByColor(b.color)
                return (
                <div key={b.rowId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-tile)',
                        background: palette.bg, color: palette.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={b.icon} size={16} strokeWidth={1.9} />
                    </span>
                    <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semi)' }}>{b.categoryName ?? '전체'}</span>
                    <span
                      className="num"
                      style={{
                        marginLeft: 'auto', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semi)',
                        color: b.state === 'over' ? 'var(--fg-expense)' : 'var(--fg-secondary)',
                      }}
                    >
                      <MaskAmount mask="••••">
                        {KRW(b.spent)}
                        <span style={{ color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)' }}> / {KRW(b.budgetAmount)}</span>
                      </MaskAmount>
                    </span>
                  </div>
                  <div className="budget-bar">
                    <div
                      className={`budget-bar__fill ${b.state}`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </div>
                )
              })}
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예정된 결제</CardTitle>
          </CardHeader>
          <CardContent>
          {upcomingPayments.length === 0 ? (
            recurringQ.isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SkeletonBase className="h-[38px] w-[38px] rounded-md shrink-0" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                      <SkeletonBase className="h-3 w-1/3" />
                    </div>
                    <SkeletonBase className="h-4 w-16 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
                예정된 결제가 없어요
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingPayments.map(p => (
                <div key={p.rowId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--radius-tile)',
                      background: p.d <= 7 ? 'var(--status-warning-subtle)' : 'var(--bg-sunken)',
                      color: p.d <= 7 ? 'var(--sunlit-700)' : 'var(--fg-secondary)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body)', letterSpacing: 'var(--tracking-tight)',
                      flexShrink: 0,
                    }}
                  >
                    D-{p.d}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semi)', color: 'var(--fg-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {p.dateLabel}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-snug)', color: 'var(--fg-expense)' }}>
                    <MaskAmount mask="••••">−{KRW(p.amount)}</MaskAmount>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>할 일</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/todo')}>
              관리 <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary?.recentTodos?.slice(0, 4).map(td => (
              <div
                key={td.rowId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/desk/todo')}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 'var(--radius-pill)',
                    background:
                      td.priority === 'HIGH' ? 'var(--fg-expense)'
                      : td.priority === 'MEDIUM' ? 'var(--sunlit-500)'
                      : 'var(--bg-brand)',
                  }}
                />
                <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--fg-primary)', flex: 1 }}>
                  {td.title}
                </span>
                {td.dueDate && (
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)' }}>
                    {td.dueDate.slice(5, 10)}
                  </span>
                )}
              </div>
            ))}
            {(!summary?.recentTodos || summary.recentTodos.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
                할 일이 없어요
              </div>
            )}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>예정된 일정</CardTitle>
            <button className="all" onClick={() => navigate('/desk/calendar')}>
              캘린더 <ChevronRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary?.upcomingEvents?.slice(0, 3).map(ev => (
              <div key={ev.rowId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-tile)',
                    background: ev.daysUntil <= 3 ? 'var(--status-warning-subtle)' : 'var(--bg-sunken)',
                    color: ev.daysUntil <= 3 ? 'var(--sunlit-700)' : 'var(--fg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--fw-bold)',
                    fontSize: 'var(--fs-body)',
                    letterSpacing: 'var(--tracking-tight)',
                    flexShrink: 0,
                  }}
                >
                  D-{ev.daysUntil}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semi)', color: 'var(--fg-primary)' }}>{ev.title}</div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {ev.startDate.slice(5, 10)}
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.upcomingEvents || summary.upcomingEvents.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
                예정 일정이 없어요
              </div>
            )}
          </div>
          </CardContent>
        </Card>
      </div>
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </div>
  )
}

function HomeMobile() {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const [unlockOpen, setUnlockOpen] = useState(false)
  const handleHideToggle = () => {
    if (hidden) setUnlockOpen(true)
    else enablePdHideAmounts()
  }
  const { key: initialKey } = useCurrentMonthKey()
  const [period] = useState(initialKey)
  const [year, month] = period.split('-').map(Number) as [number, number]

  const pad2m = (n: number) => String(n).padStart(2, '0')
  const monthStartM = `${year}-${pad2m(month)}-01`
  const monthEndDayM = new Date(year, month, 0).getDate()
  const monthEndM = `${year}-${pad2m(month)}-${pad2m(monthEndDayM)}`

  // 전월 — '전월 대비 N% 절약 중이에요' 계산용
  const prevDate = new Date(year, month - 2, 1)
  const prevY = prevDate.getFullYear()
  const prevM = prevDate.getMonth() + 1
  const prevStart = `${prevY}-${pad2m(prevM)}-01`
  const prevEndDay = new Date(prevY, prevM, 0).getDate()
  const prevEnd = `${prevY}-${pad2m(prevM)}-${pad2m(prevEndDay)}`

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary(year, month)
  const monthlyQ = useRangeSummary(monthStartM, monthEndM)
  const prevMonthlyQ = useRangeSummary(prevStart, prevEnd)
  const recentQ = useExpenses({ startDate: monthStartM, endDate: monthEndM })
  const budgetsQ = useExpenseBudgets({ year, month })
  const categoriesQ = useExpenseCategories()

  const summary = dashboardQ.data
  const assetSummary = assetSummaryQ.data
  const totalAssets = assetSummary?.totalAssets ?? 0
  const totalDebt = assetSummary?.totalDebt ?? 0
  const netWorth = assetSummary?.netWorth ?? 0
  const changeAmount = assetSummary?.changeAmount ?? 0
  const changePercent = assetSummary?.changePercent ?? 0
  const isUp = changeAmount >= 0
  const income = monthlyQ.data?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0
  const expense = monthlyQ.data?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0
  const prevExpense = prevMonthlyQ.data?.totalExpense ?? 0

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2m(today.getMonth() + 1)}-${pad2m(today.getDate())}`
  const isCurMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayOfMonth = isCurMonth ? today.getDate() : daysInMonth
  const dailyAvg = Math.round(expense / Math.max(1, dayOfMonth))
  const savingsPct = prevExpense > 0 ? ((prevExpense - expense) / prevExpense) * 100 : 0

  // 오늘 쓴 거래만
  const todayTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .filter(t => t.expenseDate?.slice(0, 10) === todayStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
  const todayTotal = todayTx
    .filter(t => t.expenseType === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0)

  // 도넛 — 부모 카테고리로 롤업, 전체 표시
  const donutSegs = useMemo(() => {
    const expenseOnly = (monthlyQ.data?.categoryBreakdown ?? []).filter(
      c => c.expenseType === 'EXPENSE',
    )
    const cats = categoriesQ.data ?? []
    const catColorMap = new Map<number, string | null | undefined>()
    for (const cat of cats) catColorMap.set(cat.rowId, cat.color)
    const items = aggregateByParent(expenseOnly)
      .slice()
      .sort((a, b) => b.totalAmount - a.totalAmount)
    return items.map((c, i) => {
      const raw = catColorMap.get(c.categoryRowId)
      const color = raw
        ? getPaletteByColor(raw).color
        : (CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? 'var(--bg-brand)')
      return {
        value: c.totalAmount,
        color,
        label: c.categoryName,
      }
    })
  }, [monthlyQ.data, categoriesQ.data])
  const donutTotal = donutSegs.reduce((a, b) => a + b.value, 0)

  // 예산 — 설정한 전체 표시
  const budgetItems = useMemo(() => {
    const budgets = budgetsQ.data ?? []
    const cats = categoriesQ.data ?? []
    const catMap = new Map<number, (typeof cats)[number]>()
    for (const c of cats) catMap.set(c.rowId, c)

    const spentByCat = new Map<number, number>()
    for (const c of monthlyQ.data?.categoryBreakdown ?? []) {
      if (c.expenseType !== 'EXPENSE' || c.categoryRowId == null) continue
      spentByCat.set(c.categoryRowId, (spentByCat.get(c.categoryRowId) ?? 0) + c.totalAmount)
      if (c.parentCategoryRowId != null) {
        spentByCat.set(c.parentCategoryRowId, (spentByCat.get(c.parentCategoryRowId) ?? 0) + c.totalAmount)
      }
    }
    const totalEx = monthlyQ.data?.totalExpense ?? 0
    return budgets.map(b => {
      const spent = b.categoryRowId == null ? totalEx : spentByCat.get(b.categoryRowId) ?? 0
      const pct = b.budgetAmount > 0 ? (spent / b.budgetAmount) * 100 : 0
      const state = pct > 100 ? 'over' : pct > 85 ? 'warn' : ''
      const cat = b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined
      return {
        rowId: b.rowId,
        categoryName: cat?.categoryName ?? b.categoryName ?? '전체',
        icon: cat?.icon ?? 'tag',
        color: cat?.color,
        budgetAmount: b.budgetAmount,
        spent,
        pct,
        state,
      }
    })
  }, [budgetsQ.data, categoriesQ.data, monthlyQ.data])

  const quick: { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; path: string }[] = [
    { label: '자산', icon: Wallet, path: '/desk/asset' },
    { label: '가계부', icon: Receipt, path: '/desk/expense' },
    { label: '예산', icon: Target, path: '/desk/budget' },
    { label: '더치페이', icon: UsersRound, path: '/desk/dutch-pay' },
  ]

  return (
    <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="balance-hero">
        <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
          <Wallet size={13} /> 순자산
          <button
            onClick={handleHideToggle}
            title={hidden ? '금액 표시' : '금액 가리기'}
            style={{
              marginLeft: 'auto',
              background: 'oklch(1 0 0 / 0.12)',
              border: '1px solid oklch(1 0 0 / 0.15)',
              color: 'inherit',
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <div className="balance-hero__amount num">
          {assetSummaryQ.isLoading ? '—' : <MaskAmount>{KRW(netWorth)}</MaskAmount>}
          <HideUnit><span className="unit">원</span></HideUnit>
        </div>
        <div className="balance-hero__sub">
          지난달 대비
          <span className={`chg ${isUp ? 'up' : 'down'}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {' '}
            {isUp ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <div className="balance-hero__split">
          <div>
            <div className="l">자산</div>
            <div className="v num">
              <MaskAmount mask="••••">{KRW(totalAssets)}</MaskAmount>
            </div>
          </div>
          <div>
            <div className="l">부채</div>
            <div className="v num">
              <MaskAmount mask="••••">−{KRW(totalDebt)}</MaskAmount>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {quick.map(q => {
          const IconComp = q.icon
          return (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              style={{
                background: 'var(--bg-surface)',
                border: 'none',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-sm)',
                padding: '14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-tile)',
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComp size={18} strokeWidth={1.9} />
              </span>
              <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semi)', color: 'var(--fg-primary)' }}>{q.label}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-snug)' }}>{month}월 가계부</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 2 }}>수입</div>
            <div className="num" style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-brand)' }}>
              <MaskAmount>+{KRW(income)}</MaskAmount>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 2 }}>지출</div>
            <div className="num" style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-expense)' }}>
              <MaskAmount>−{KRW(expense)}</MaskAmount>
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--fs-caption)',
          color: 'var(--fg-secondary)',
          lineHeight: 'var(--lh-normal)',
        }}>
          하루 평균{' '}
          <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: 'var(--fw-bold)' }}>
            <MaskAmount>{KRW(dailyAvg)}</MaskAmount>
          </span>
          <HideUnit>원</HideUnit>
          {' 썼어요.'}
          {prevExpense > 0 && (
            <>
              {' 전월 대비 '}
              <span style={{
                color: savingsPct > 0 ? 'var(--fg-brand-strong)' : 'var(--fg-expense)',
                fontWeight: 'var(--fw-bold)',
              }}>
                {Math.abs(savingsPct).toFixed(0)}%
              </span>
              {savingsPct > 0 ? ' 절약 중이에요.' : savingsPct < 0 ? ' 더 썼어요.' : ' 동일해요.'}
            </>
          )}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>카테고리</CardTitle>
          <button className="all" onClick={() => navigate('/desk/stats')}>
            자세히 <ChevronRight size={14} />
          </button>
        </CardHeader>
        <CardContent>
        {donutSegs.length === 0 ? (
          monthlyQ.isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <SkeletonBase className="h-[120px] w-[120px] rounded-full shrink-0" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SkeletonBase className="h-2 w-2 rounded-full shrink-0" />
                    <SkeletonBase className="h-3 flex-1" />
                    <SkeletonBase className="h-3 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
              카테고리 데이터가 없어요
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut segments={donutSegs} size={120} stroke={18}>
              <div className="lbl" style={{ fontSize: 'var(--fs-micro)' }}>지출</div>
              <div className="val num" style={{ fontSize: 'var(--fs-caption)' }}>
                <MaskAmount mask="••••">{KRW(donutTotal)}</MaskAmount>
              </div>
            </Donut>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donutSegs.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  <span className="num" style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-primary)', fontWeight: 'var(--fw-semi)' }}>
                    <MaskAmount mask="••••">{KRW(s.value)}</MaskAmount>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>예산</CardTitle>
          <button className="all" onClick={() => navigate('/desk/budget')}>
            전체 <ChevronRight size={14} />
          </button>
        </CardHeader>
        <CardContent>
        {budgetItems.length === 0 ? (
          budgetsQ.isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2].map(i => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <SkeletonBase className="h-7 w-7 rounded-md shrink-0" />
                    <SkeletonBase className="h-4 w-20 flex-1" />
                    <SkeletonBase className="h-3 w-24 shrink-0" />
                  </div>
                  <SkeletonBase className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
              등록된 예산이 없어요
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {budgetItems.map(b => {
              const palette = getPaletteByColor(b.color)
              return (
                <div key={b.rowId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-tile)',
                      background: palette.bg, color: palette.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={b.icon} size={14} strokeWidth={1.9} />
                    </span>
                    <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-semi)', flex: 1 }}>{b.categoryName}</span>
                    <span className="num" style={{
                      fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semi)',
                      color: b.state === 'over' ? 'var(--fg-expense)' : 'var(--fg-primary)',
                    }}>
                      <MaskAmount mask="••••">{KRW(b.spent)}</MaskAmount>
                      <span style={{ color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)' }}> / {KRW(b.budgetAmount)}</span>
                    </span>
                  </div>
                  <div className="budget-bar" style={{ height: 6 }}>
                    <div className={`budget-bar__fill ${b.state}`} style={{ width: `${Math.min(100, b.pct)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </CardContent>
      </Card>

      <UpcomingMobileCard summary={summary} onCalendar={() => navigate('/desk/calendar')} onTodos={() => navigate('/desk/todo')} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>오늘 쓴 돈</CardTitle>
            {todayTotal > 0 && (
              <span className="num" style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-expense)', fontWeight: 'var(--fw-bold)' }}>
                <MaskAmount mask="••••">−{KRW(todayTotal)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </span>
            )}
          </div>
          <button className="all" onClick={() => navigate('/desk/expense')}>전체</button>
        </CardHeader>
        <CardContent>
        <div>
          {todayTx.map(t => (
            <ExpenseRow
              key={t.rowId}
              expense={t}
              onClick={() => {
                const m = t.expenseDate?.slice(0, 7) ?? ''
                const params = new URLSearchParams()
                if (m) params.set('month', m)
                params.set('txId', String(t.rowId))
                navigate(`/desk/expense?${params.toString()}`)
              }}
            />
          ))}
          {todayTx.length === 0 && (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--fs-caption)' }}>
              오늘은 아직 쓴 돈이 없어요
            </div>
          )}
        </div>
        </CardContent>
      </Card>
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </div>
  )
}

/**
 * 모바일 홈에 끼우는 카드 — 다가오는 일정 + 최근 할 일.
 * Flutter `_UpcomingCard` 미러 (events 3건 + todos 3건, 둘 다 비면 hidden).
 */
function UpcomingMobileCard({
  summary,
  onCalendar,
  onTodos,
}: {
  summary: DashboardSummary | undefined
  onCalendar: () => void
  onTodos: () => void
}) {
  if (!summary) return null
  const events = summary.upcomingEvents.slice(0, 3)
  const todos = summary.recentTodos.slice(0, 3)
  if (events.length === 0 && todos.length === 0) return null

  return (
    <Card>
      <CardContent>
      {events.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <CalendarClock size={16} style={{ color: 'var(--fg-secondary)' }} />
            <span style={{ marginLeft: 6, fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>
              다가오는 일정
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCalendar}
              className="ml-auto size-6 text-text-tertiary"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
          {events.map(ev => (
            <div key={ev.rowId} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: ev.color || 'var(--fg-brand)', marginRight: 8 }} />
              <span style={{ flex: 1, fontSize: 'var(--fs-body-sm)', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.title}
              </span>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)' }}>
                {ev.daysUntil === 0 ? '오늘' : ev.daysUntil === 1 ? '내일' : `D-${ev.daysUntil}`}
              </span>
            </div>
          ))}
          {todos.length > 0 && <div style={{ height: 12 }} />}
        </>
      )}
      {todos.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <CheckSquare size={16} style={{ color: 'var(--fg-secondary)' }} />
            <span style={{ marginLeft: 6, fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>
              최근 할 일
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTodos}
              className="ml-auto size-6 text-text-tertiary"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
          {todos.map(td => {
            const done = td.status === 'COMPLETED'
            return (
              <div key={td.rowId} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                {done ? (
                  <CheckCircle2 size={14} style={{ color: 'var(--status-success-fg)', marginRight: 8 }} />
                ) : (
                  <Circle size={14} style={{ color: 'var(--fg-tertiary)', marginRight: 8 }} />
                )}
                <span style={{ flex: 1, fontSize: 'var(--fs-body-sm)', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {td.title}
                </span>
                {td.dueDate && (
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)' }}>
                    {td.dueDate.slice(5, 10)}
                  </span>
                )}
              </div>
            )
          })}
        </>
      )}
      </CardContent>
    </Card>
  )
}
