import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock, CheckCircle2, CheckSquare, ChevronRight, Circle, Eye, EyeOff, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react'
import { Bar, BarChart as RcBarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { tileRadius } from '@/shared/lib'
import { KRW, money, formatChartAxis, isEn } from '@/shared/lib/porest/format'
import { formatMonthDay, formatYearMonth } from '@/shared/lib/date'
import { niceAxis } from '@/shared/lib/porest/chartAxis'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  HideUnit,
  MaskAmount,
  WonUnit,
  wonPre,
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
import { useUserPreferences } from '@/features/user'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import type { Expense } from '@/entities/expense'
import { aggregateByParent } from '@/entities/expense'

// income/expense bar 색상·라벨은 IncomeExpenseBarChart 내부에서 t() 로 구성.


type BarPayloadItem = { dataKey?: string; value?: number; payload?: Record<string, unknown> }
type BarTooltipProps = { active?: boolean; payload?: BarPayloadItem[]; label?: string }

function IncomeExpenseTooltip({ active, payload, label }: BarTooltipProps) {
  const { t } = useTranslation('dashboard')
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
        fontSize: 'var(--text-caption)',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '600', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--status-info-fg)' }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{t('chart.income')}</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700' }}>
          <MaskAmount>{wonPre()}{KRW(income)}</MaskAmount>
          <WonUnit />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--fg-expense)' }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{t('chart.expense')}</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700' }}>
          <MaskAmount>{wonPre()}{KRW(expense)}</MaskAmount>
          <WonUnit />
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{t('chart.savings')}</span>
        <span
          className="num"
          style={{
            marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700',
            color: saving >= 0 ? 'var(--fg-brand)' : 'var(--fg-expense)',
          }}
        >
          <MaskAmount>{saving >= 0 ? '+' : '−'}{wonPre()}{KRW(Math.abs(saving))}</MaskAmount>
          <WonUnit />
        </span>
      </div>
    </div>
  )
}

function IncomeExpenseBarChart({ data, height = 200 }: {
  data: { label: string; income: number; expense: number }[]
  height?: number
}) {
  const { t } = useTranslation('dashboard')
  const hidden = useHideAmounts()
  const barChartConfig = {
    income:  { label: t('chart.income'), color: 'var(--status-info-fg)' },
    expense: { label: t('chart.expense'), color: 'var(--fg-expense)' },
  } satisfies ChartConfig
  // Y축: 0기준 nice 눈금 (수입·지출 둘 다 포함, 앱 niceAxis 정합).
  const yAxis = useMemo(() => {
    const vals = data.flatMap(d => [d.income, d.expense])
    return niceAxis(0, Math.max(0, ...vals))
  }, [data])
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
          tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={[yAxis.min, yAxis.max]}
          ticks={yAxis.ticks}
          // 금액 숨기기 시 Y축도 마스킹 ('••••' 4점)
          tickFormatter={(v: number) => (hidden ? '••••' : formatChartAxis(v))}
          tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
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

/**
 * Dashboard 페이지 구조에 맞춘 skeleton. 정적 틀(헤더 타이틀/MonthPicker/링크/hero 라벨)은
 * 실제 렌더하고 서버 데이터 영역만 스켈레톤. desktop 2-col(좌 hero+수입지출+오늘 / 우 카테고리+예산+예정+할일+일정).
 */
function DashboardPageSkeleton({ mobile }: { mobile: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { key: initialKey, year, month } = useCurrentMonthKey()
  const [period, setPeriod] = useState(initialKey)
  if (mobile) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DashboardHeroSkeleton mobile year={year} month={month} />
        <DashboardSummaryCardSkeleton mobile month={month} period={period} onPeriodChange={setPeriod} />
        <DashboardCategoryCardSkeleton mobile onDetail={() => navigate('/desk/stats')} />
        <DashboardBudgetCardSkeleton mobile onManage={() => navigate('/desk/budget')} />
        <DashboardListCardSkeleton title={t('expense.todaySpent')} allLabel={t('all')} onAll={() => navigate('/desk/expense')} rows={3} variant="tx" amount />
      </div>
    )
  }
  return (
    <div className="dash-grid">
      <div className="dash-grid__left">
        <DashboardHeroSkeleton mobile={false} year={year} month={month} />
        <DashboardSummaryCardSkeleton mobile={false} month={month} period={period} onPeriodChange={setPeriod} />
        <DashboardListCardSkeleton title={t('expense.todaySpent')} allLabel={t('viewAll')} onAll={() => navigate('/desk/expense')} rows={3} variant="tx" amount />
      </div>
      <div className="dash-grid__right">
        <DashboardCategoryCardSkeleton mobile={false} onDetail={() => navigate('/desk/stats')} />
        <DashboardBudgetCardSkeleton mobile={false} onManage={() => navigate('/desk/budget')} />
        <DashboardListCardSkeleton title={t('payment.upcoming')} rows={3} variant="badge" amount />
        <DashboardListCardSkeleton title={t('todo.label')} allLabel={t('manage')} onAll={() => navigate('/desk/todo')} rows={4} variant="dot" />
        <DashboardListCardSkeleton title={t('calendar.scheduled')} allLabel={t('calendar.title')} onAll={() => navigate('/desk/calendar')} rows={3} variant="badge" />
      </div>
    </div>
  )
}

function DashboardHeroSkeleton({ mobile, year, month }: { mobile: boolean; year: number; month: number }) {
  // 정적 틀(eyebrow 라벨 + 자산/부채 라벨)은 실제 렌더, 금액(데이터)만 스켈레톤.
  const { t } = useTranslation('dashboard')
  return (
    <div className="balance-hero" style={mobile ? undefined : { padding: '28px 32px 24px' }}>
      <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
        <Wallet size={mobile ? 13 : 14} /> {mobile ? t('asset.netAsset') : <>{t('asset.netAsset')} · {formatYearMonth(new Date(year, month - 1))}</>}
      </div>
      <div className="balance-hero__amount num">
        <SkeletonBase className={mobile ? 'h-8 w-40 bg-white/15' : 'h-10 w-56 bg-white/15'} />
      </div>
      <div className="balance-hero__sub">
        <SkeletonBase className="h-3 w-32 bg-white/15" />
      </div>
      <div className="balance-hero__split">
        <div>
          <div className="l">{mobile ? t('asset.assetTab') : t('asset.totalAsset')}</div>
          <SkeletonBase className="h-5 w-24 bg-white/15" />
        </div>
        <div>
          <div className="l">{mobile ? t('asset.debtTab') : t('asset.totalDebt')}</div>
          <SkeletonBase className="h-5 w-24 bg-white/15" />
        </div>
      </div>
    </div>
  )
}

function DashboardSummaryCardSkeleton({ mobile, month, period, onPeriodChange }: {
  mobile: boolean
  month: number
  period: string
  onPeriodChange: (v: string) => void
}) {
  const { t } = useTranslation('dashboard')
  if (mobile) {
    // 모바일 "{t('summary.monthExpenseBook', { month })}" 카드 — 헤더 텍스트(정적) + 2col 라벨(정적) + 금액(데이터) + 요약 라인.
    return (
      <Card>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em' }}>{t('summary.monthExpenseBook', { month })}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[t('chart.income'), t('chart.expense')].map(lbl => (
              <div key={lbl}>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{lbl}</div>
                <SkeletonBase className="h-6 w-24" />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <SkeletonBase className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }
  // 데스크탑 수입·지출 카드 — 타이틀(정적) + MonthPicker(정적 선택기) + 3col 라벨(정적) + 금액·차트(데이터).
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t('summary.monthIncomeExpense', { month })}</CardTitle>
        <MonthPicker value={period} onChange={onPeriodChange} />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
          {[t('chart.income'), t('chart.expense'), t('balance')].map(lbl => (
            <div key={lbl}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>{lbl}</div>
              <SkeletonBase className="h-7 w-24" />
            </div>
          ))}
        </div>
        <SkeletonBase className="h-[280px] w-full" />
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <SkeletonBase className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardCategoryCardSkeleton({ mobile, onDetail }: { mobile: boolean; onDetail: () => void }) {
  // 타이틀 + '자세히' 링크(정적 틀)는 실제 렌더, 도넛+범례(데이터)만 스켈레톤.
  const { t } = useTranslation('dashboard')
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={mobile ? { fontSize: 'var(--text-body-lg)' } : undefined}>{t('categoryTitle')}</CardTitle>
        {mobile ? (
          <button className="all" onClick={onDetail}>{t('detail')} <ChevronRight size={14} /></button>
        ) : (
          <Button variant="link" className="all h-auto p-0" onClick={onDetail}>{t('detail')} <ChevronRight size={14} /></Button>
        )}
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

function DashboardBudgetCardSkeleton({ mobile, onManage }: { mobile: boolean; onManage: () => void }) {
  // 타이틀 + 링크(정적 틀)는 실제 렌더, 예산 항목(데이터)만 스켈레톤.
  const { t } = useTranslation('dashboard')
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={mobile ? { fontSize: 'var(--text-body-lg)' } : undefined}>{t('expense.budget')}</CardTitle>
        {mobile ? (
          <button className="all" onClick={onManage}>{t('all')} <ChevronRight size={14} /></button>
        ) : (
          <Button variant="link" className="all h-auto p-0" onClick={onManage}>{t('manageBudget')} <ChevronRight size={14} /></Button>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SkeletonBase className={mobile ? 'h-7 w-7 rounded-md shrink-0' : 'h-8 w-8 rounded-md shrink-0'} />
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

/**
 * 리스트형 카드 스켈레톤 — 타이틀+링크(정적 틀)는 실제 렌더, 행(데이터)만 스켈레톤.
 * variant 로 로딩-후 실제 행 구조에 맞춤:
 *  - 'tx'    : ExpenseRow (chip 40 + 2줄 + 금액)            — 오늘 쓴 돈
 *  - 'badge' : D-뱃지 38 + title/date + (금액)              — 예정된 결제 / 예정된 일정
 *  - 'dot'   : 6px 점 + title + date (박스·금액 없음)        — 할 일
 */
function DashboardListCardSkeleton({
  title, allLabel, onAll, rows = 3, variant, amount = false,
}: {
  title: string
  allLabel?: string
  onAll?: () => void
  rows?: number
  variant: 'tx' | 'badge' | 'dot'
  amount?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {allLabel && (
          <Button variant="link" className="all h-auto p-0" onClick={onAll}>
            {allLabel} <ChevronRight size={14} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: variant === 'dot' ? 14 : 12 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: variant === 'dot' ? 10 : variant === 'tx' ? 12 : 10 }}>
              {variant === 'dot' ? (
                <SkeletonBase className="h-1.5 w-1.5 rounded-full shrink-0" />
              ) : (
                <SkeletonBase className={variant === 'tx' ? 'h-10 w-10 rounded-md shrink-0' : 'h-[38px] w-[38px] rounded-md shrink-0'} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className={variant === 'dot' ? 'h-4 w-1/2' : 'h-4 w-1/2 mb-1.5'} />
                {variant !== 'dot' && <SkeletonBase className="h-3 w-1/3" />}
              </div>
              {(amount || variant === 'dot') && (
                <SkeletonBase className={variant === 'dot' ? 'h-3 w-10 shrink-0' : 'h-4 w-16 shrink-0'} />
              )}
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
  const { t } = useTranslation('dashboard')
  const { t: tc } = useTranslation('common')
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
  const preferencesQ = useUserPreferences()
  // 예산 경고 임계값 — 사용자 알람% 설정값(BudgetPage 정합). 미설정 시 85.
  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85

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
      const state = pct > 100 ? 'over' : pct > warnThreshold ? 'warn' : ''
      const cat = b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined
      return {
        rowId: b.rowId,
        categoryName: cat?.categoryName ?? b.categoryName ?? t('all'),
        icon: cat?.icon ?? 'tag',
        color: cat?.color,
        budgetAmount: b.budgetAmount,
        spent,
        pct,
        state,
      }
    })
  }, [budgetsQ.data, categoriesQ.data, monthly, warnThreshold])

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
          dateLabel: formatMonthDay(next, { pad: true }),
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
            <Wallet size={14} /> {t('asset.netAsset')} · {formatYearMonth(new Date(periodY, periodM - 1))}
            <button
              onClick={handleHideToggle}
              title={hidden ? t('showAmount') : t('hideAmount')}
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
            {assetSummaryQ.isLoading ? '—' : <MaskAmount>{wonPre()}{KRW(netWorth)}</MaskAmount>}
            {!isEn() && <HideUnit><span className="unit">원</span></HideUnit>}
          </div>
          <div className="balance-hero__sub">
            {t('vsLastMonth')}
            <span className={`chg ${isUp ? 'up' : 'down'}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {' '}
              {isUp ? '+' : ''}{changePercent.toFixed(1)}%
              {changeAmount !== 0 && (
                <HideUnit>
                  <>{' '}({isUp ? '+' : '−'}{money(Math.abs(changeAmount))})</>
                </HideUnit>
              )}
            </span>
          </div>
          <div className="balance-hero__split">
            <div>
              <div className="l">{t('asset.totalAsset')}</div>
              <div className="v num">
                <MaskAmount>{wonPre()}{KRW(totalAssets)}</MaskAmount>
                <WonUnit />
              </div>
            </div>
            <div>
              <div className="l">{t('asset.totalDebt')}</div>
              <div className="v num">
                <MaskAmount>−{wonPre()}{KRW(totalDebt)}</MaskAmount>
                <WonUnit />
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t('summary.monthIncomeExpense', { month: periodM })}</CardTitle>
            <MonthPicker value={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>{t('chart.income')}</div>
              <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: '700', color: 'var(--fg-brand)', letterSpacing: '-0.022em' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <><MaskAmount>+{wonPre()}{KRW(income)}</MaskAmount><WonUnit /></>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>{t('chart.expense')}</div>
              <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: '700', color: 'var(--fg-expense)', letterSpacing: '-0.022em' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <><MaskAmount>−{wonPre()}{KRW(expense)}</MaskAmount><WonUnit /></>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>{t('balance')}</div>
              <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: '700', color: 'var(--fg-brand-strong)', letterSpacing: '-0.022em' }}>
                {monthlyQ.isLoading
                  ? '—'
                  : <>
                      <MaskAmount>{balance >= 0 ? '+' : '-'}{wonPre()}{KRW(Math.abs(balance))}</MaskAmount>
                      <WonUnit />
                    </>}
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <IncomeExpenseBarChart data={barData} height={280} />
          ) : trendQ.isLoading ? (
            <SkeletonBase className="h-[280px] w-full rounded-lg" />
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              {tc('noData')}
            </div>
          )}
          <div style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-label-sm)',
            color: 'var(--fg-secondary)',
            lineHeight: '1.5',
          }}>
            {t('avg.dailyAverage')}{' '}
            <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: '700' }}>
              <MaskAmount>{wonPre()}{KRW(dailyAvg)}</MaskAmount>
            </span>
            <WonUnit />
            {' '}{t('avg.spent')}
            {prevExpense > 0 && (
              <>
                {' '}{t('avg.vsPrev')}{' '}
                <span style={{
                  color: savingsPct > 0 ? 'var(--fg-brand-strong)' : 'var(--fg-expense)',
                  fontWeight: '700',
                }}>
                  {Math.abs(savingsPct).toFixed(0)}%
                </span>
                {' '}{savingsPct > 0 ? t('avg.saving') : savingsPct < 0 ? t('avg.spentMore') : t('avg.same')}
              </>
            )}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <CardTitle>{t('expense.todaySpent')}</CardTitle>
              {todayTotal > 0 && (
                <span className="num" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-expense)', fontWeight: '700' }}>
                  <MaskAmount mask="••••">−{wonPre()}{KRW(todayTotal)}</MaskAmount>
                  <WonUnit />
                </span>
              )}
            </div>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/expense')}>
              {t('viewAll')} <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
          <div>
            {recentQ.isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SkeletonBase className="h-10 w-10 rounded-md shrink-0" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                      <SkeletonBase className="h-3 w-1/3" />
                    </div>
                    <SkeletonBase className="h-4 w-16 shrink-0" />
                  </div>
                ))}
              </div>
            )}
            {!recentQ.isLoading && todayTx.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
                {t('expense.noTodaySpent')}
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
            <CardTitle>{t('categoryTitle')}</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/stats')}>
              {t('detail')} <ChevronRight size={14} />
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
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
                {t('categoryEmpty')}
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <Donut segments={donutSegs} size={160} stroke={22}>
                <div className="lbl">{t('summary.monthlyExpense')}</div>
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
            <CardTitle>{t('expense.budget')}</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/budget')}>
              {t('manageBudget')} <ChevronRight size={14} />
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
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
                {t('budget.empty')}
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
                        width: 32, height: 32, borderRadius: tileRadius(32),
                        background: palette.bg, color: palette.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={b.icon} size={16} strokeWidth={1.9} />
                    </span>
                    <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600' }}>{b.categoryName ?? t('all')}</span>
                    <span
                      className="num"
                      style={{
                        marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '600',
                        color: b.state === 'over' ? 'var(--fg-expense)' : 'var(--fg-secondary)',
                      }}
                    >
                      <MaskAmount mask="••••">{KRW(b.spent)}</MaskAmount>
                      <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}> / <MaskAmount mask="••••">{KRW(b.budgetAmount)}</MaskAmount></span>
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
            <CardTitle>{t('payment.upcoming')}</CardTitle>
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
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
                {t('payment.empty')}
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
                      color: p.d <= 7 ? 'var(--color-warning)' : 'var(--fg-secondary)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: 'var(--text-body-sm)', letterSpacing: '-0.022em',
                      flexShrink: 0,
                    }}
                  >
                    {t('date:dday', { count: p.d })}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {p.dateLabel}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', letterSpacing: '-0.012em', color: 'var(--fg-expense)' }}>
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
            <CardTitle>{t('todo.label')}</CardTitle>
            <Button variant="link" className="all h-auto p-0" onClick={() => navigate('/desk/todo')}>
              {t('manage')} <ChevronRight size={14} />
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
                      : td.priority === 'MEDIUM' ? 'var(--color-warning-light)'
                      : 'var(--bg-brand)',
                  }}
                />
                <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '500', color: 'var(--fg-primary)', flex: 1 }}>
                  {td.title}
                </span>
                {td.dueDate && (
                  <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
                    {td.dueDate.slice(5, 10)}
                  </span>
                )}
              </div>
            ))}
            {(!summary?.recentTodos || summary.recentTodos.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
                {t('todo.empty')}
              </div>
            )}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t('calendar.scheduled')}</CardTitle>
            <button className="all" onClick={() => navigate('/desk/calendar')}>
              {t('calendar.title')} <ChevronRight size={14} />
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
                    color: ev.daysUntil <= 3 ? 'var(--color-warning)' : 'var(--fg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: 'var(--text-body-sm)',
                    letterSpacing: '-0.022em',
                    flexShrink: 0,
                  }}
                >
                  {t('date:dday', { count: ev.daysUntil })}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-primary)' }}>{ev.title}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {ev.startDate.slice(5, 10)}
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.upcomingEvents || summary.upcomingEvents.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
                {t('calendar.empty')}
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
  const { t } = useTranslation('dashboard')
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
  const preferencesQ = useUserPreferences()
  // 예산 경고 임계값 — 사용자 알람% 설정값(BudgetPage 정합). 미설정 시 85.
  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85

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
      const state = pct > 100 ? 'over' : pct > warnThreshold ? 'warn' : ''
      const cat = b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined
      return {
        rowId: b.rowId,
        categoryName: cat?.categoryName ?? b.categoryName ?? t('all'),
        icon: cat?.icon ?? 'tag',
        color: cat?.color,
        budgetAmount: b.budgetAmount,
        spent,
        pct,
        state,
      }
    })
  }, [budgetsQ.data, categoriesQ.data, monthlyQ.data, warnThreshold])

  return (
    <div style={{ padding: 'var(--spacing-xl) 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="balance-hero">
        <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
          <Wallet size={13} /> {t('asset.netAsset')}
          <button
            onClick={handleHideToggle}
            title={hidden ? t('showAmount') : t('hideAmount')}
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
          {assetSummaryQ.isLoading ? '—' : <MaskAmount>{wonPre()}{KRW(netWorth)}</MaskAmount>}
          {!isEn() && <HideUnit><span className="unit">원</span></HideUnit>}
        </div>
        <div className="balance-hero__sub">
          {t('vsLastMonth')}
          <span className={`chg ${isUp ? 'up' : 'down'}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {' '}
            {isUp ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <div className="balance-hero__split">
          <div>
            <div className="l">{t('asset.assetTab')}</div>
            <div className="v num">
              <MaskAmount mask="••••">{KRW(totalAssets)}</MaskAmount>
            </div>
          </div>
          <div>
            <div className="l">{t('asset.debtTab')}</div>
            <div className="v num">
              <MaskAmount mask="••••">−{KRW(totalDebt)}</MaskAmount>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em' }}>{t('summary.monthExpenseBook', { month })}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('chart.income')}</div>
            <div className="num" style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', color: 'var(--fg-brand)' }}>
              <MaskAmount>+{KRW(income)}</MaskAmount>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('chart.expense')}</div>
            <div className="num" style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', color: 'var(--fg-expense)' }}>
              <MaskAmount>−{KRW(expense)}</MaskAmount>
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--text-caption)',
          color: 'var(--fg-secondary)',
          lineHeight: '1.5',
        }}>
          {t('avg.dailyAverage')}{' '}
          <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: '700' }}>
            <MaskAmount>{wonPre()}{KRW(dailyAvg)}</MaskAmount>
          </span>
          <WonUnit />
          {' '}{t('avg.spent')}
          {prevExpense > 0 && (
            <>
              {' '}{t('avg.vsPrev')}{' '}
              <span style={{
                color: savingsPct > 0 ? 'var(--fg-brand-strong)' : 'var(--fg-expense)',
                fontWeight: '700',
              }}>
                {Math.abs(savingsPct).toFixed(0)}%
              </span>
              {' '}{savingsPct > 0 ? t('avg.saving') : savingsPct < 0 ? t('avg.spentMore') : t('avg.same')}
            </>
          )}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('categoryTitle')}</CardTitle>
          <button className="all" onClick={() => navigate('/desk/stats')}>
            {t('detail')} <ChevronRight size={14} />
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
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
              {t('categoryEmptyMobile')}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut segments={donutSegs} size={120} stroke={18}>
              <div className="lbl" style={{ fontSize: 'var(--text-badge)' }}>{t('chart.expense')}</div>
              <div className="val num" style={{ fontSize: 'var(--text-caption)' }}>
                <MaskAmount mask="••••">{KRW(donutTotal)}</MaskAmount>
              </div>
            </Donut>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donutSegs.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-primary)', fontWeight: '600' }}>
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
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('expense.budget')}</CardTitle>
          <button className="all" onClick={() => navigate('/desk/budget')}>
            {t('all')} <ChevronRight size={14} />
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
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
              {t('budget.empty')}
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
                      width: 28, height: 28, borderRadius: tileRadius(28),
                      background: palette.bg, color: palette.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={b.icon} size={14} strokeWidth={1.9} />
                    </span>
                    <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', flex: 1 }}>{b.categoryName}</span>
                    <span className="num" style={{
                      fontSize: 'var(--text-caption)', fontWeight: '600',
                      color: b.state === 'over' ? 'var(--fg-expense)' : 'var(--fg-primary)',
                    }}>
                      <MaskAmount mask="••••">{KRW(b.spent)}</MaskAmount>
                      <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}> / <MaskAmount mask="••••">{KRW(b.budgetAmount)}</MaskAmount></span>
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
            <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('expense.todaySpent')}</CardTitle>
            {todayTotal > 0 && (
              <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-expense)', fontWeight: '700' }}>
                <MaskAmount mask="••••">−{wonPre()}{KRW(todayTotal)}</MaskAmount>
                <WonUnit />
              </span>
            )}
          </div>
          <button className="all" onClick={() => navigate('/desk/expense')}>{t('all')}</button>
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
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
              {t('expense.noTodaySpent')}
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
  const { t } = useTranslation('dashboard')
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
            <span style={{ marginLeft: 6, fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
              {t('schedule.title')}
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
              <span style={{ flex: 1, fontSize: 'var(--text-label-sm)', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.title}
              </span>
              <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
                {ev.daysUntil === 0 ? t('schedule.today') : ev.daysUntil === 1 ? t('schedule.tomorrow') : t('date:dday', { count: ev.daysUntil })}
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
            <span style={{ marginLeft: 6, fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
              {t('todo.recent')}
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
                <span style={{ flex: 1, fontSize: 'var(--text-label-sm)', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {td.title}
                </span>
                {td.dueDate && (
                  <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
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
