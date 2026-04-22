import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronRight, Eye, EyeOff, Receipt, Target, TrendingDown, TrendingUp, UsersRound, Wallet,
} from 'lucide-react'
import { Bar, BarChart as RcBarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import { togglePdHideAmounts, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import { Donut } from '@/shared/ui/porest/charts'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { useDashboardSummary } from '@/features/dashboard'
import { useAssetSummary } from '@/features/asset'
import {
  useExpenses,
  useExpenseCategories,
  useMonthlySummary,
  useMonthlyTrend,
  useExpenseBudgets,
} from '@/features/expense'
import { getPaletteByColor } from '@/features/porest/dialogs'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import type { Expense } from '@/entities/expense'

const barChartConfig = {
  income:  { label: '수입', color: 'var(--mossy-500)' },
  expense: { label: '지출', color: 'var(--berry-500)' },
} satisfies ChartConfig

function fmtAxisNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000)      return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

type BarPayloadItem = { dataKey?: string; value?: number; payload?: Record<string, unknown> }
type BarTooltipProps = { active?: boolean; payload?: BarPayloadItem[]; label?: string }

function IncomeExpenseTooltip({ active, payload, label }: BarTooltipProps) {
  const hidden = useHideAmounts()
  if (!active || !payload || payload.length === 0) return null
  const income = Number(payload.find(p => p.dataKey === 'income')?.value ?? 0)
  const expense = Number(payload.find(p => p.dataKey === 'expense')?.value ?? 0)
  const saving = income - expense
  const mask = (n: number) => (hidden ? '••••••' : `${KRW(n)}원`)
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 11.5,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--mossy-500)' }} />
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>수입</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
          {mask(income)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--berry-500)' }} />
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>지출</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
          {mask(expense)}
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>저축</span>
        <span
          className="num"
          style={{
            marginLeft: 'auto', fontSize: 12, fontWeight: 700,
            color: saving >= 0 ? 'var(--mossy-700)' : 'var(--berry-600)',
          }}
        >
          {hidden ? '••••••' : <>{saving >= 0 ? '+' : '−'}{KRW(Math.abs(saving))}원</>}
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
          stroke="var(--mist-200)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtAxisNum}
          tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
          width={48}
        />
        <ChartTooltip cursor={{ fill: 'var(--mossy-500)', fillOpacity: 0.06 }} content={<IncomeExpenseTooltip />} />
        <Bar dataKey="income"  fill="var(--color-income)"  radius={4} barSize={28} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} barSize={28} />
      </RcBarChart>
    </ChartContainer>
  )
}

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const CATEGORY_PALETTE = [
  'oklch(0.55 0.12 55)',
  'oklch(0.50 0.12 340)',
  'oklch(0.50 0.1 140)',
  'oklch(0.50 0.12 290)',
  'oklch(0.50 0.1 230)',
  'oklch(0.55 0.13 25)',
  'oklch(0.52 0.1 215)',
  'oklch(0.50 0.08 50)',
]

function Skeleton({ height = 120, style = {} }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--mist-100), var(--mist-200), var(--mist-100))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
        ...style,
      }}
    />
  )
}

export const DashboardPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
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
  const { key: initialKey } = useCurrentMonthKey()
  const [period, setPeriod] = useState(initialKey)
  const [periodY, periodM] = period.split('-').map(Number) as [number, number]

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const periodStart = `${periodY}-${pad2(periodM)}-01`
  const periodEnd = `${periodY}-${pad2(periodM)}-${pad2(new Date(periodY, periodM, 0).getDate())}`

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary(periodY, periodM)
  const monthlyQ = useMonthlySummary(periodY, periodM)
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

  const recentTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 6)

  const donutSegs = useMemo(() => {
    const items = (monthly?.categoryBreakdown ?? [])
      .filter(c => c.expenseType === 'EXPENSE')
      .slice()
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 6)
    return items.map((c, i) => ({
      value: c.totalAmount,
      color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? 'var(--mossy-500)',
      label: c.categoryName,
    }))
  }, [monthly])
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
    return budgets.slice(0, 4).map(b => {
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
              onClick={togglePdHideAmounts}
              title={hidden ? '금액 표시' : '금액 가리기'}
              style={{
                marginLeft: 'auto',
                background: 'oklch(1 0 0 / 0.12)',
                border: '1px solid oklch(1 0 0 / 0.15)',
                color: 'inherit',
                width: 28,
                height: 28,
                borderRadius: 999,
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
            {assetSummaryQ.isLoading ? '—' : hidden ? '••••••' : KRW(netWorth)}
            <span className="unit">원</span>
          </div>
          <div className="balance-hero__sub">
            지난달 대비
            <span className={`chg ${isUp ? 'up' : 'down'}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {' '}
              {isUp ? '+' : ''}{changePercent.toFixed(1)}%
              {!hidden && changeAmount !== 0 && (
                <>{' '}({isUp ? '+' : '−'}{KRW(Math.abs(changeAmount))}원)</>
              )}
            </span>
          </div>
          <div className="balance-hero__split">
            <div>
              <div className="l">총 자산</div>
              <div className="v num">{hidden ? '••••••' : KRW(totalAssets) + '원'}</div>
            </div>
            <div>
              <div className="l">총 부채</div>
              <div className="v num">{hidden ? '••••••' : '−' + KRW(totalDebt) + '원'}</div>
            </div>
          </div>
        </div>

        <div className="p-card" style={{ padding: 24 }}>
          <div className="sec-head" style={{ marginBottom: 18 }}>
            <h2>{periodM}월 수입·지출</h2>
            <MonthPicker value={period} onChange={setPeriod} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>수입</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--mossy-700)', letterSpacing: '-0.02em' }}>
                {monthlyQ.isLoading ? '—' : hidden ? '••••••' : `+${KRW(income)}원`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>지출</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--berry-700)', letterSpacing: '-0.02em' }}>
                {monthlyQ.isLoading ? '—' : hidden ? '••••••' : `−${KRW(expense)}원`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>잔액</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-brand-strong)', letterSpacing: '-0.02em' }}>
                {monthlyQ.isLoading ? '—' : hidden ? '••••••' : `${balance >= 0 ? '+' : '-'}${KRW(Math.abs(balance))}원`}
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <IncomeExpenseBarChart data={barData} height={280} />
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              {trendQ.isLoading ? '불러오는 중…' : '데이터가 없습니다'}
            </div>
          )}
        </div>

        <div className="p-card" style={{ padding: 24 }}>
          <div className="sec-head">
            <h2>최근 거래</h2>
            <button className="all" onClick={() => navigate('/desk/expense')}>
              전체 보기 <ChevronRight size={14} />
            </button>
          </div>
          <div>
            {recentQ.isLoading && <Skeleton height={60} />}
            {!recentQ.isLoading && recentTx.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
                아직 거래가 없어요
              </div>
            )}
            {recentTx.map(t => (
              <ExpenseRow key={t.rowId} expense={t} onClick={() => navigate('/desk/expense')} />
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid__right">
        <div className="p-card" style={{ padding: 22 }}>
          <div className="sec-head">
            <h2>카테고리</h2>
            <button className="all" onClick={() => navigate('/desk/stats')}>
              자세히 <ChevronRight size={14} />
            </button>
          </div>
          {donutSegs.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              {monthlyQ.isLoading ? '불러오는 중…' : '카테고리 데이터가 없습니다'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <Donut segments={donutSegs} size={160} stroke={22}>
                <div className="lbl">이번 달 지출</div>
                <div className="val num">{hidden ? '••••' : `${(donutTotal / 10000).toFixed(1)}만원`}</div>
              </Donut>
              <div className="cat-legend">
                {donutSegs.map((s, i) => (
                  <div key={i} className="cat-legend__row">
                    <span className="cat-legend__sw" style={{ background: s.color }} />
                    <span className="cat-legend__name">{s.label}</span>
                    <span className="cat-legend__pct num">{((s.value / donutTotal) * 100).toFixed(0)}%</span>
                    <span className="cat-legend__amt num">{hidden ? '••••' : KRW(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-card" style={{ padding: 22 }}>
          <div className="sec-head">
            <h2>예산</h2>
            <button className="all" onClick={() => navigate('/desk/budget')}>
              예산 관리 <ChevronRight size={14} />
            </button>
          </div>
          {budgetItems.length === 0 ? (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
              {budgetsQ.isLoading ? '불러오는 중…' : '등록된 예산이 없어요'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {budgetItems.map(b => {
                const palette = getPaletteByColor(b.color)
                return (
                <div key={b.rowId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: palette.bg, color: palette.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={b.icon} size={16} strokeWidth={1.9} />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{b.categoryName ?? '전체'}</span>
                    <span
                      className="num"
                      style={{
                        marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                        color: b.state === 'over' ? 'var(--berry-700)' : 'var(--fg-secondary)',
                      }}
                    >
                      {hidden ? '••••' : (
                        <>
                          {KRW(b.spent)}
                          <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}> / {KRW(b.budgetAmount)}</span>
                        </>
                      )}
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
        </div>

        <div className="p-card" style={{ padding: 22 }}>
          <div className="sec-head">
            <h2>예정된 결제</h2>
          </div>
          {upcomingPayments.length === 0 ? (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
              {recurringQ.isLoading ? '불러오는 중…' : '예정된 결제가 없어요'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingPayments.map(p => (
                <div key={p.rowId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: p.d <= 7 ? 'var(--sunlit-100)' : 'var(--mist-200)',
                      color: p.d <= 7 ? 'var(--sunlit-700)' : 'var(--fg-secondary)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em',
                      flexShrink: 0,
                    }}
                  >
                    D-{p.d}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {p.dateLabel}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--berry-700)' }}>
                    {hidden ? '••••' : `−${KRW(p.amount)}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-card" style={{ padding: 22 }}>
          <div className="sec-head">
            <h2>할 일</h2>
            <button className="all" onClick={() => navigate('/desk/todo')}>
              관리 <ChevronRight size={14} />
            </button>
          </div>
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
                    borderRadius: 999,
                    background:
                      td.priority === 'HIGH' ? 'var(--berry-500)'
                      : td.priority === 'MEDIUM' ? 'var(--sunlit-500)'
                      : 'var(--mossy-500)',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', flex: 1 }}>
                  {td.title}
                </span>
                {td.dueDate && (
                  <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>
                    {td.dueDate.slice(5, 10)}
                  </span>
                )}
              </div>
            ))}
            {(!summary?.recentTodos || summary.recentTodos.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
                할 일이 없어요
              </div>
            )}
          </div>
        </div>

        <div className="p-card" style={{ padding: 22 }}>
          <div className="sec-head">
            <h2>예정된 일정</h2>
            <button className="all" onClick={() => navigate('/desk/calendar')}>
              캘린더 <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary?.upcomingEvents?.slice(0, 3).map(ev => (
              <div key={ev.rowId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: ev.daysUntil <= 3 ? 'var(--sunlit-100)' : 'var(--mist-200)',
                    color: ev.daysUntil <= 3 ? 'var(--sunlit-700)' : 'var(--fg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '-0.02em',
                    flexShrink: 0,
                  }}
                >
                  D-{ev.daysUntil}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{ev.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {ev.startDate.slice(5, 10)}
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.upcomingEvents || summary.upcomingEvents.length === 0) && (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
                예정 일정이 없어요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeMobile() {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const { year, month } = useCurrentMonthKey()

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary(year, month)
  const monthlyQ = useMonthlySummary(year, month)
  const recentQ = useExpenses()

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

  const recentTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 4)

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
            onClick={togglePdHideAmounts}
            title={hidden ? '금액 표시' : '금액 가리기'}
            style={{
              marginLeft: 'auto',
              background: 'oklch(1 0 0 / 0.12)',
              border: '1px solid oklch(1 0 0 / 0.15)',
              color: 'inherit',
              width: 26,
              height: 26,
              borderRadius: 999,
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
          {assetSummaryQ.isLoading ? '—' : hidden ? '••••••' : KRW(netWorth)}
          <span className="unit">원</span>
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
            <div className="v num">{hidden ? '••••' : KRW(totalAssets)}</div>
          </div>
          <div>
            <div className="l">부채</div>
            <div className="v num">{hidden ? '••••' : '−' + KRW(totalDebt)}</div>
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
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
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
                  borderRadius: 10,
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComp size={18} strokeWidth={1.9} />
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{q.label}</span>
            </button>
          )
        })}
      </div>

      <div className="p-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em' }}>{month}월 가계부</div>
          <TrendingUp size={14} style={{ marginLeft: 'auto', color: 'var(--mossy-700)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>수입</div>
            <div className="num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--mossy-700)' }}>
              {hidden ? '••••••' : `+${KRW(income)}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>지출</div>
            <div className="num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--berry-700)' }}>
              {hidden ? '••••••' : `−${KRW(expense)}`}
            </div>
          </div>
        </div>
      </div>

      <div className="p-card" style={{ padding: 18 }}>
        <div className="sec-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 15 }}>최근 거래</h2>
          <button className="all" onClick={() => navigate('/desk/expense')}>전체</button>
        </div>
        <div>
          {recentTx.map(t => (
            <ExpenseRow key={t.rowId} expense={t} onClick={() => navigate('/desk/expense')} />
          ))}
          {recentTx.length === 0 && (
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
              거래가 없어요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
