import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronRight, Eye, EyeOff, Receipt, Target, TrendingUp, UsersRound, Wallet,
} from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import { togglePdHideAmounts, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { MonthPicker } from '@/shared/ui/porest/primitives'
import { BarChart, Donut } from '@/shared/ui/porest/charts'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { useDashboardSummary } from '@/features/dashboard'
import { useAssetSummary } from '@/features/asset'
import { useExpenses, useMonthlySummary } from '@/features/expense'
import type { Expense } from '@/entities/expense'

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

  const dashboardQ = useDashboardSummary()
  const assetSummaryQ = useAssetSummary()
  const monthlyQ = useMonthlySummary(periodY, periodM)
  const recentQ = useExpenses()

  const summary = dashboardQ.data
  const totalAssets = assetSummaryQ.data?.totalBalance ?? 0
  const monthly = monthlyQ.data
  const income = monthly?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0
  const expense = monthly?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0
  const balance = income - expense

  const recentTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 6)

  const donutSegs = useMemo(() => {
    const items = monthly?.categoryBreakdown ?? []
    return items.slice(0, 6).map((c, i) => ({
      value: c.totalAmount,
      color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? 'var(--mossy-500)',
      label: c.categoryName,
    }))
  }, [monthly])
  const donutTotal = donutSegs.reduce((a, b) => a + b.value, 0)

  const barData = useMemo(() => {
    const trend = summary?.expenseTrend ?? []
    return trend.slice(-6).map(t => ({
      label: t.date.slice(5, 10),
      income: t.income,
      expense: t.expense,
    }))
  }, [summary])

  return (
    <div className="dash-grid">
      <div className="dash-grid__left">
        <div className="balance-hero" style={{ padding: '28px 32px 24px' }}>
          <div className="balance-hero__eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
            <Wallet size={14} /> 총 자산
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
            {assetSummaryQ.isLoading ? '—' : hidden ? '••••••' : KRW(totalAssets)}
            <span className="unit">원</span>
          </div>
          <div className="balance-hero__sub">
            {summary?.calendarSummary?.upcomingEventCount != null && (
              <>예정 일정 {summary.calendarSummary.upcomingEventCount}건</>
            )}
          </div>
          <div className="balance-hero__split">
            <div>
              <div className="l">이번 달 수입</div>
              <div className="v num">{hidden ? '••••••' : '+' + KRW(income) + '원'}</div>
            </div>
            <div>
              <div className="l">이번 달 지출</div>
              <div className="v num">{hidden ? '••••••' : '−' + KRW(expense) + '원'}</div>
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
                {monthlyQ.isLoading ? '—' : `+${KRW(income)}원`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>지출</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {monthlyQ.isLoading ? '—' : `−${KRW(expense)}원`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>잔액</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-brand-strong)', letterSpacing: '-0.02em' }}>
                {monthlyQ.isLoading ? '—' : `${balance >= 0 ? '+' : '-'}${KRW(Math.abs(balance))}원`}
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <BarChart data={barData} height={200} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              {dashboardQ.isLoading ? '불러오는 중…' : '데이터가 없습니다'}
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
                <div className="val num">{(donutTotal / 10000).toFixed(1)}만원</div>
              </Donut>
              <div className="cat-legend">
                {donutSegs.map((s, i) => (
                  <div key={i} className="cat-legend__row">
                    <span className="cat-legend__sw" style={{ background: s.color }} />
                    <span className="cat-legend__name">{s.label}</span>
                    <span className="cat-legend__pct num">{((s.value / donutTotal) * 100).toFixed(0)}%</span>
                    <span className="cat-legend__amt num">{KRW(s.value)}</span>
                  </div>
                ))}
              </div>
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
  const assetSummaryQ = useAssetSummary()
  const monthlyQ = useMonthlySummary(year, month)
  const recentQ = useExpenses()

  const summary = dashboardQ.data
  const totalAssets = assetSummaryQ.data?.totalBalance ?? 0
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
          <Wallet size={13} /> 총 자산
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
          {assetSummaryQ.isLoading ? '—' : hidden ? '••••••' : KRW(totalAssets)}
          <span className="unit">원</span>
        </div>
        <div className="balance-hero__split">
          <div>
            <div className="l">수입</div>
            <div className="v num">{hidden ? '••••' : '+' + KRW(income)}</div>
          </div>
          <div>
            <div className="l">지출</div>
            <div className="v num">{hidden ? '••••' : '−' + KRW(expense)}</div>
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
              +{KRW(income)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>지출</div>
            <div className="num" style={{ fontSize: 17, fontWeight: 700 }}>−{KRW(expense)}</div>
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
