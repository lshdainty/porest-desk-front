import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Filter, Plus, SlidersHorizontal, X } from 'lucide-react'
import { KRW, formatDay } from '@/shared/lib/porest/format'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
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

/** Expense 페이지 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계. */
function useExpensePageData(month: string) {
  const { startDate, endDate } = monthRange(month)
  const expensesQ = useExpenses({ startDate, endDate })
  const summaryQ = useRangeSummary(startDate, endDate)
  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  return {
    isLoading:
      expensesQ.isLoading || summaryQ.isLoading
      || categoriesQ.isLoading || assetsQ.isLoading,
  }
}

function ExpenseSummarySkeleton({ mobile }: { mobile: boolean }) {
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
        <SkeletonBase className="h-5 w-24" />
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          <SkeletonBase className="h-7 w-7 rounded-md" />
          <SkeletonBase className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <SkeletonBase className="h-3 w-10 mb-2" />
            <SkeletonBase className={mobile ? 'h-5 w-24' : 'h-6 w-28'} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpenseChipsSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8, paddingBottom: 4 }}>
      {[0, 1, 2].map(i => (
        <SkeletonBase key={i} className="h-7 w-12 rounded-full" />
      ))}
    </div>
  )
}

function ExpenseDayGroupSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      {/* 날짜 헤더 — 카드 밖 평문 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <SkeletonBase className="h-4 w-12" />
        <SkeletonBase className="h-4 w-6" />
        <SkeletonBase className="h-3 w-16 ml-auto" />
        <SkeletonBase className="h-3 w-16" />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <SkeletonBase className="h-4 w-3/4 mb-1.5" />
              <SkeletonBase className="h-3 w-1/3" />
            </div>
            <SkeletonBase className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </Card>
    </div>
  )
}

/** Expense 페이지 구조에 맞춘 skeleton — Summary 카드 + 칩 + 날짜 그룹별 거래 리스트. */
function ExpensePageSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px' }}>
        <ExpenseSummarySkeleton mobile />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}><ExpenseChipsSkeleton /></div>
          <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
          <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ExpenseDayGroupSkeleton rows={3} />
          <ExpenseDayGroupSkeleton rows={2} />
          <ExpenseDayGroupSkeleton rows={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>가계부</h1>
          <div className="sub">모든 거래 내역</div>
        </div>
      </div>
      <ExpenseSummarySkeleton mobile={false} />
      <ExpenseChipsSkeleton />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ExpenseDayGroupSkeleton rows={3} />
        <ExpenseDayGroupSkeleton rows={2} />
        <ExpenseDayGroupSkeleton rows={2} />
      </div>
    </div>
  )
}

export const ExpensePage = () => {
  const { onAddTx, mobile } = useOutletContext<OutletCtx>()
  const [searchParams] = useSearchParams()
  const initialMonth = searchParams.get('month') || currentMonthKey()
  const { isLoading } = useExpensePageData(initialMonth)
  const [hasEverLoaded, setHasEverLoaded] = useState(false)
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중에 동기 set (React 권장 패턴).
  if (!isLoading && !hasEverLoaded) setHasEverLoaded(true)
  if (isLoading && !hasEverLoaded) return <ExpensePageSkeleton mobile={mobile} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <MonthArrowButton dir="prev" month={month} onChange={onMonthChange} />
        <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.022em' }}>
          {y}년 {Number(m)}월
        </div>
        <MonthArrowButton dir="next" month={month} onChange={onMonthChange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>수입</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: '700', color: 'var(--fg-brand)' }}
          >
            {isLoading ? '—' : <MaskAmount>+{KRW(monthIn)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>지출</div>
          <div className="num" style={{ fontSize: mobile ? 16 : 18, fontWeight: '700', color: 'var(--fg-expense)' }}>
            {isLoading ? '—' : <MaskAmount>−{KRW(monthOut)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>합계</div>
          <div
            className="num"
            style={{
              fontSize: mobile ? 16 : 18,
              fontWeight: '700',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ExpenseDayGroupSkeleton rows={3} />
        <ExpenseDayGroupSkeleton rows={2} />
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <Card>
        <CardContent style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
            내역이 없어요
          </div>
        </CardContent>
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
            <Card style={{ overflow: 'hidden' }}>
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
        fontSize: 'var(--text-label-sm)',
        fontWeight: '600',
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
    <div style={{ padding: 'var(--spacing-xl) 20px' }}>
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterOpen(true)}
          aria-label="필터"
          className="relative shrink-0"
        >
          <SlidersHorizontal size={18} />
          {activeCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--bg-brand-hover)] px-1 text-[var(--text-badge)] font-bold text-[var(--fg-on-brand)]"
            >
              {activeCount}
            </span>
          )}
        </Button>
        <Button
          size="icon"
          onClick={onAddTx}
          aria-label="거래 추가"
          className="shrink-0"
        >
          <Plus size={18} />
        </Button>
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
    <Button
      variant="ghost"
      size="icon"
      aria-label={dir === 'prev' ? '이전 달' : '다음 달'}
      onClick={handle}
      className="h-7 w-7 text-text-secondary"
    >
      {dir === 'prev' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </Button>
  )
}
