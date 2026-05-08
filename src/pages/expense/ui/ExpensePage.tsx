import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Filter, Plus, SlidersHorizontal, X } from 'lucide-react'
import { KRW, formatDay } from '@/shared/lib/porest/format'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { DateGroupHeader } from '@/shared/ui/date-group-header'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import {
  useExpenses,
  useRangeSummary,
  useExpenseCategories,
} from '@/features/expense'
import { useAsset, useAssets } from '@/features/asset'
import type { Expense, ExpenseType, ExpenseCategory } from '@/entities/expense'
import { FilterDialog, type FilterValue, DEFAULT_FILTER } from '@/features/porest/dialogs'
import { AddTxSheet } from '@/features/porest/add-tx/AddTxSheet'
import { TxDetailDialog } from '@/features/porest/dialogs/TxDetailDialog'

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
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(90deg, var(--bg-muted), var(--bg-sunken), var(--bg-muted))',
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
  return mobile ? <ExpenseMobile onAddTx={onAddTx} /> : <ExpenseDesktop />
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
  const balance = monthIn - monthOut
  const [y, m] = month.split('-')
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 12 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-tight)' }}>
          {y}년 {Number(m)}월
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MonthArrowButton dir="prev" month={month} onChange={onMonthChange} />
          <MonthArrowButton dir="next" month={month} onChange={onMonthChange} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 2 }}>수입</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: 'var(--fw-bold)', color: 'var(--fg-brand)' }}
          >
            {isLoading ? '—' : <MaskAmount>+{KRW(monthIn)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 2 }}>지출</div>
          <div className="num" style={{ fontSize: mobile ? 16 : 18, fontWeight: 'var(--fw-bold)', color: 'var(--fg-expense)' }}>
            {isLoading ? '—' : <MaskAmount>−{KRW(monthOut)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 2 }}>합계</div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: 'var(--fw-bold)',
              color: balance >= 0 ? 'var(--fg-brand-strong)' : 'var(--fg-expense)',
            }}
          >
            {isLoading
              ? '—'
              : <MaskAmount>{balance >= 0 ? '+' : '−'}{KRW(Math.abs(balance))}</MaskAmount>}
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
  onItemClick,
  focusTxId,
}: {
  expenses: Expense[]
  mobile: boolean
  isLoading: boolean
  onItemClick?: (expense: Expense) => void
  focusTxId?: number | null
}) {
  const grouped = useMemo(() => groupExpensesByDay(expenses), [expenses])
  const focusRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (focusTxId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusTxId, expenses.length])

  if (isLoading) {
    return (
      <Card
        style={{ padding: mobile ? '12px 14px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </Card>
    )
  }

  if (grouped.length === 0) {
    return (
      <Card style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--fs-body)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)' }}>
          내역이 없어요
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 18 }}>
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
            {/* 날짜 헤더 — 카드 밖 평문 */}
            <DateGroupHeader date={md} weekday={dow} expense={out} income={inn} />
            {/* 거래 카드 — divider 로 구분 */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((e, i) => {
                const isFocus = focusTxId === e.rowId
                return (
                  <div
                    key={e.rowId}
                    ref={isFocus ? focusRef : undefined}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                      background: isFocus ? 'var(--bg-brand-subtle)' : undefined,
                      transition: 'background 0.4s',
                      padding: '0 14px',
                    }}
                  >
                    <ExpenseRow expense={e} onClick={onItemClick} />
                  </div>
                )
              })}
            </Card>
          </div>
        )
      })}
    </div>
  )
}

function computeFilterRange(
  period: FilterValue['period'],
  monthKey: string,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } {
  if (period === 'custom') {
    if (customStart && customEnd) return { startDate: customStart, endDate: customEnd }
    return monthRange(monthKey)
  }
  if (period === 'month') return monthRange(monthKey)
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (period === 'week') {
    const dow = today.getDay() // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const start = new Date(today)
    start.setDate(today.getDate() + mondayOffset)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startDate: fmt(start), endDate: fmt(end) }
  }
  // '3m' — 3개월 전 1일 ~ 오늘
  const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  return { startDate: fmt(start), endDate: fmt(today) }
}

function useExpenseData(
  month: string,
  filter: Filter,
  filterValue: FilterValue | null,
  assetId?: number,
  categories?: ExpenseCategory[] | null,
) {
  const { startDate, endDate } = useMemo(() => {
    if (filterValue) {
      return computeFilterRange(
        filterValue.period,
        month,
        filterValue.startDate,
        filterValue.endDate,
      )
    }
    return monthRange(month)
  }, [month, filterValue])

  const [yStr, mStr] = month.split('-')
  const year = Number(yStr)
  const m = Number(mStr)

  const chipType: ExpenseType | undefined =
    filter === 'income' ? 'INCOME' : filter === 'expense' ? 'EXPENSE' : undefined

  // 다이얼로그 필터가 적용된 상태면 types은 클라이언트에서 처리 (다중 타입 가능)
  const serverType = filterValue ? undefined : chipType

  const expensesQ = useExpenses({ startDate, endDate, expenseType: serverType, assetId })
  // 월 헤더용 합계 — 현재 monthKey 의 한 달 범위
  const monthStart = `${year}-${String(m).padStart(2, '0')}-01`
  const monthEndDay = new Date(year, m, 0).getDate()
  const monthEnd = `${year}-${String(m).padStart(2, '0')}-${String(monthEndDay).padStart(2, '0')}`
  const monthlyQ = useRangeSummary(monthStart, monthEnd)

  // 선택한 부모 카테고리의 자식 rowId까지 모두 허용 집합에 추가
  const allowedCatIds = useMemo(() => {
    if (!filterValue || filterValue.categoryIds.length === 0) return null
    const set = new Set<number>(filterValue.categoryIds)
    for (const cat of categories ?? []) {
      if (cat.parentRowId != null && filterValue.categoryIds.includes(cat.parentRowId)) {
        set.add(cat.rowId)
      }
    }
    return set
  }, [filterValue, categories])

  const filtered = useMemo(() => {
    let list = expensesQ.data ?? []
    if (filterValue) {
      if (filterValue.types.length > 0 && filterValue.types.length < 2) {
        list = list.filter(e => filterValue.types.includes(e.expenseType))
      }
      if (allowedCatIds) {
        list = list.filter(e => allowedCatIds.has(e.categoryRowId))
      }
      if (filterValue.assetIds.length > 0) {
        list = list.filter(
          e => e.assetRowId != null && filterValue.assetIds.includes(e.assetRowId),
        )
      }
      const minN = filterValue.min ? Number(filterValue.min) : null
      const maxN = filterValue.max ? Number(filterValue.max) : null
      if (minN != null) list = list.filter(e => e.amount >= minN)
      if (maxN != null) list = list.filter(e => e.amount <= maxN)
    }
    return list
  }, [expensesQ.data, filterValue, allowedCatIds])

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
        background: 'var(--bg-brand-subtle)',
        color: 'var(--fg-brand-strong)',
        border: '1px solid var(--border-brand)',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--fs-body-sm)',
        fontWeight: 'var(--fw-semi)',
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

function filterActiveCount(v: FilterValue | null): number {
  if (!v) return 0
  let n = 0
  if (v.period !== DEFAULT_FILTER.period) n += 1
  if (v.types.length !== DEFAULT_FILTER.types.length) n += 1
  if (v.categoryIds.length > 0) n += 1
  if (v.assetIds.length > 0) n += 1
  if (v.min) n += 1
  if (v.max) n += 1
  return n
}

/** 행 클릭 → 상세 TxDetailDialog → 편집 버튼 → AddTxSheet. Desktop/Mobile 공용. */
function EditableList({
  expenses,
  isLoading,
  mobile,
  focusTxId,
}: {
  expenses: Expense[]
  isLoading: boolean
  mobile: boolean
  focusTxId?: number | null
}) {
  // detail: 상세 보기, editing: 편집 폼
  const [detail, setDetail] = useState<Expense | null>(null)
  const [editing, setEditing] = useState<Expense | null>(null)

  return (
    <>
      <ExpenseList
        expenses={expenses}
        mobile={mobile}
        isLoading={isLoading}
        onItemClick={(e) => setDetail(e)}
        focusTxId={focusTxId}
      />
      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile={mobile}
          onClose={() => setDetail(null)}
          onEdit={(e) => {
            setDetail(null)
            setEditing(e)
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
  )
}

function ExpenseDesktop() {
  const [searchParams] = useSearchParams()
  const initialMonth = searchParams.get('month') || currentMonthKey()
  const focusTxId = Number(searchParams.get('txId')) || null
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(initialMonth)
  const { assetId, asset, clear } = useAssetFilter()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null)

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(
    month, filter, filterValue, assetId, categoriesQ.data ?? null,
  )

  const activeCount = filterActiveCount(filterValue)

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>가계부</h1>
          <div className="sub">모든 거래 내역</div>
        </div>
        <div className="right">
          <Button variant="secondary" size="sm" onClick={() => setFilterOpen(true)}>
            <Filter size={13} /> 필터{activeCount > 0 && ` · ${activeCount}`}
          </Button>
          <Button variant="secondary" size="sm" onClick={notifyComing}>
            <Download size={13} /> 내보내기
          </Button>
        </div>
      </div>
      {asset && <AssetFilterBadge name={`${asset.assetName} 필터 중`} onClear={clear} />}
      {activeCount > 0 && (
        <AssetFilterBadge name={`필터 ${activeCount}개 적용 중`} onClear={() => setFilterValue(null)} />
      )}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile={false}
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
      />
      <Chips filter={filter} onChange={setFilter} />
      <EditableList
        expenses={expenses}
        isLoading={isLoadingList}
        mobile={false}
        focusTxId={focusTxId}
      />
      {filterOpen && (
        <FilterDialog
          initial={filterValue}
          categories={categoriesQ.data ?? []}
          assets={assetsQ.data?.assets ?? []}
          onClose={() => setFilterOpen(false)}
          onApply={(v) => {
            setFilterValue(v)
            setFilterOpen(false)
          }}
          mobile={false}
        />
      )}
    </div>
  )
}

function ExpenseMobile({ onAddTx }: { onAddTx: () => void }) {
  const [searchParams] = useSearchParams()
  const initialMonth = searchParams.get('month') || currentMonthKey()
  const focusTxId = Number(searchParams.get('txId')) || null
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(initialMonth)
  const { assetId, asset, clear } = useAssetFilter()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null)

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(
    month, filter, filterValue, assetId, categoriesQ.data ?? null,
  )

  const activeCount = filterActiveCount(filterValue)

  return (
    <div style={{ padding: '4px 16px 24px' }}>
      {asset && <AssetFilterBadge name={`${asset.assetName} 필터 중`} onClear={clear} />}
      {activeCount > 0 && (
        <AssetFilterBadge name={`필터 ${activeCount}개 적용 중`} onClear={() => setFilterValue(null)} />
      )}
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
          onClick={() => setFilterOpen(true)}
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-tile)',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--fg-secondary)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="필터"
        >
          <SlidersHorizontal size={18} />
          {activeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-brand-hover)',
                color: 'var(--fg-on-brand)',
                fontSize: 'var(--fs-micro)',
                fontWeight: 'var(--fw-bold)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={onAddTx}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-tile)',
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
      <EditableList
        expenses={expenses}
        isLoading={isLoadingList}
        mobile
        focusTxId={focusTxId}
      />
      {filterOpen && (
        <FilterDialog
          initial={filterValue}
          categories={categoriesQ.data ?? []}
          assets={assetsQ.data?.assets ?? []}
          onClose={() => setFilterOpen(false)}
          onApply={(v) => {
            setFilterValue(v)
            setFilterOpen(false)
          }}
          mobile
        />
      )}
    </div>
  )
}

export default ExpensePage

/**
 * 월 ± 1 이동 화살표 버튼.
 * 멀리 떨어진 월 선택은 상세 필터에서 처리. 여기서는 단순 prev/next.
 */
function MonthArrowButton({
  dir,
  month,
  onChange,
}: {
  dir: 'prev' | 'next'
  month: string
  onChange: (m: string) => void
}) {
  const handle = () => {
    const [yStr, mStr] = month.split('-')
    let y = Number(yStr)
    let m = Number(mStr) + (dir === 'prev' ? -1 : 1)
    if (m < 1) { y -= 1; m = 12 }
    if (m > 12) { y += 1; m = 1 }
    onChange(`${y}-${String(m).padStart(2, '0')}`)
  }
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? '이전 달' : '다음 달'}
      onClick={handle}
      style={{
        width: 28,
        height: 28,
        border: 'none',
        background: 'transparent',
        color: 'var(--fg-secondary)',
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {dir === 'prev' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  )
}
