import { useMemo, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Download, Filter, Plus, SlidersHorizontal, X } from 'lucide-react'
import { KRW, formatDay } from '@/shared/lib/porest/format'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { MonthPicker } from '@/shared/ui/porest/primitives'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { useExpenses, useMonthlySummary } from '@/features/expense'
import { useAsset } from '@/features/asset'
import type { Expense, ExpenseType } from '@/entities/expense'

type OutletCtx = { onAddTx: () => void; mobile: boolean }
type Filter = 'all' | 'income' | 'expense'

const CHIPS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'expense', label: '지출' },
  { id: 'income', label: '수입' },
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

function notifyComing(): void {
  console.log('[expense] 개발 중입니다')
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(monthKey: string): { startDate: string; endDate: string } {
  const [ys, ms] = monthKey.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const lastDay = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return {
    startDate: `${y}-${mm}-01`,
    endDate: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

function dayKey(expenseDate: string): string {
  // supports "YYYY-MM-DD" or ISO datetime; take first 10 chars
  return expenseDate.slice(0, 10)
}

function groupExpensesByDay(expenses: Expense[]): [string, Expense[]][] {
  const map = new Map<string, Expense[]>()
  for (const e of expenses) {
    const k = dayKey(e.expenseDate)
    const arr = map.get(k) ?? []
    arr.push(e)
    map.set(k, arr)
  }
  // sort days descending
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a))
  return sortedKeys.map(k => {
    const items = (map.get(k) ?? []).slice().sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    return [k, items] as [string, Expense[]]
  })
}

export const ExpensePage = () => {
  const { onAddTx, mobile } = useOutletContext<OutletCtx>()
  return mobile ? <ExpenseMobile onAddTx={onAddTx} /> : <ExpenseDesktop onAddTx={onAddTx} />
}

function Summary({
  month,
  onMonthChange,
  mobile,
  monthIn,
  monthOut,
  isLoading,
}: {
  month: string
  onMonthChange: (m: string) => void
  mobile: boolean
  monthIn: number
  monthOut: number
  isLoading: boolean
}) {
  const hidden = useHideAmounts()
  const balance = monthIn - monthOut
  const [y, m] = month.split('-')
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 12 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {y}년 {Number(m)}월
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <MonthPicker value={month} onChange={onMonthChange} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>수입</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: 700, color: 'var(--mossy-700)' }}
          >
            {isLoading ? '—' : hidden ? '••••••' : `+${KRW(monthIn)}`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>지출</div>
          <div className="num" style={{ fontSize: mobile ? 16 : 18, fontWeight: 700, color: 'var(--berry-700)' }}>
            {isLoading ? '—' : hidden ? '••••••' : `−${KRW(monthOut)}`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>합계</div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: 700,
              color: balance >= 0 ? 'var(--fg-brand-strong)' : 'var(--berry-700)',
            }}
          >
            {isLoading
              ? '—'
              : hidden
                ? '••••••'
                : `${balance >= 0 ? '+' : '−'}${KRW(Math.abs(balance))}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chips({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {CHIPS.map(c => (
        <button
          key={c.id}
          className={`chip ${filter === c.id ? 'active' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

function ExpenseList({
  expenses,
  mobile,
  isLoading,
}: {
  expenses: Expense[]
  mobile: boolean
  isLoading: boolean
}) {
  const hidden = useHideAmounts()
  const grouped = useMemo(() => groupExpensesByDay(expenses), [expenses])

  if (isLoading) {
    return (
      <div
        className="p-card"
        style={{ padding: mobile ? '12px 14px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <div className="p-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--fg-tertiary)', fontWeight: 500 }}>
          내역이 없어요
        </div>
      </div>
    )
  }

  return (
    <div className="p-card" style={{ padding: mobile ? '4px 18px 8px' : '4px 24px 8px' }}>
      {grouped.map(([d, items]) => {
        const { md, dow } = formatDay(d)
        const out = items
          .filter(t => t.expenseType === 'EXPENSE')
          .reduce((s, t) => s + Math.abs(t.amount), 0)
        const inn = items
          .filter(t => t.expenseType === 'INCOME')
          .reduce((s, t) => s + Math.abs(t.amount), 0)
        return (
          <div key={d}>
            <div className="day-head">
              <span className="date">{md}</span>
              <span>{dow}요일</span>
              <span className="sum num">
                {out > 0 && <span className="out">{hidden ? '••••••' : `−${KRW(out)}`}</span>}
                {inn > 0 && <span className="in">{hidden ? '••••••' : `+${KRW(inn)}`}</span>}
              </span>
            </div>
            <div>
              {items.map(e => (
                <ExpenseRow key={e.rowId} expense={e} onClick={notifyComing} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function useExpenseData(month: string, filter: Filter, assetId?: number) {
  const { startDate, endDate } = useMemo(() => monthRange(month), [month])
  const [yStr, mStr] = month.split('-')
  const year = Number(yStr)
  const m = Number(mStr)

  const expenseType: ExpenseType | undefined =
    filter === 'income' ? 'INCOME' : filter === 'expense' ? 'EXPENSE' : undefined

  const expensesQ = useExpenses({ startDate, endDate, expenseType, assetId })
  const monthlyQ = useMonthlySummary(year, m)

  const filtered = expensesQ.data ?? []

  const monthIn = monthlyQ.data?.totalIncome ?? 0
  const monthOut = monthlyQ.data?.totalExpense ?? 0

  return {
    expenses: filtered,
    monthIn,
    monthOut,
    isLoadingList: expensesQ.isLoading,
    isLoadingSummary: monthlyQ.isLoading,
  }
}

function useAssetFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('assetId')
  const assetId = raw ? Number(raw) : undefined
  const enabled = !!assetId && !Number.isNaN(assetId)
  const { data: asset } = useAsset(enabled ? assetId! : 0)
  const clear = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('assetId')
    setSearchParams(next, { replace: true })
  }
  return { assetId: enabled ? assetId : undefined, asset: enabled ? asset : undefined, clear }
}

function AssetFilterBadge({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 10px 6px 12px',
        background: 'var(--mossy-100)',
        color: 'var(--fg-brand-strong)',
        border: '1px solid var(--mossy-200)',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        marginBottom: 12,
      }}
    >
      <span>{name}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="필터 해제"
        style={{
          background: 'transparent', border: 0, padding: 2, cursor: 'pointer',
          color: 'var(--fg-brand)', display: 'inline-flex',
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function ExpenseDesktop({ onAddTx }: { onAddTx: () => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(currentMonthKey())
  const { assetId, asset, clear } = useAssetFilter()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(month, filter, assetId)

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>가계부</h1>
          <div className="sub">모든 거래 내역</div>
        </div>
        <div className="right">
          <button className="p-btn p-btn--secondary p-btn--sm" onClick={notifyComing}>
            <Filter size={13} /> 필터
          </button>
          <button className="p-btn p-btn--secondary p-btn--sm" onClick={notifyComing}>
            <Download size={13} /> 내보내기
          </button>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={onAddTx}>
            <Plus size={14} /> 내역 추가
          </button>
        </div>
      </div>
      {asset && <AssetFilterBadge name={`${asset.assetName} 필터 중`} onClear={clear} />}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile={false}
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
      />
      <Chips filter={filter} onChange={setFilter} />
      <ExpenseList expenses={expenses} mobile={false} isLoading={isLoadingList} />
    </div>
  )
}

function ExpenseMobile({ onAddTx }: { onAddTx: () => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(currentMonthKey())
  const { assetId, asset, clear } = useAssetFilter()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(month, filter, assetId)

  return (
    <div style={{ padding: '4px 16px 24px' }}>
      {asset && <AssetFilterBadge name={`${asset.assetName} 필터 중`} onClear={clear} />}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Chips filter={filter} onChange={setFilter} />
        </div>
        <button
          onClick={notifyComing}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--fg-secondary)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={18} />
        </button>
        <button
          onClick={onAddTx}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 0,
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
        </button>
      </div>
      <ExpenseList expenses={expenses} mobile isLoading={isLoadingList} />
    </div>
  )
}

export default ExpensePage
