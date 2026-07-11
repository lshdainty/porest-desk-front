import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, List, Plus, SlidersHorizontal, X } from 'lucide-react'
import { KRW, formatDay } from '@/shared/lib/porest/format'
import { formatMonthDayWeekday, formatYearMonth } from '@/shared/lib/date'
import { MaskAmount, WonUnit, wonPre } from '@/shared/lib/porest/hide-amounts'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { DateGroupHeader } from '@/shared/ui/date-group-header'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { ModalShell } from '@/shared/ui/porest/dialogs'
// 기존 캘린더 소스 — 홈 > 캘린더 (CalendarPage) 가 사용하는 CalendarMonthView 를
// 그대로 활용. expense → IEvent 변환은 convertExpenseToIEvent 가 처리 (income/
// expense color 분기 + 금액 title parse 모두 CalendarMonthView 자체 로직).
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { CalendarMonthView } from '@/features/calendar/ui/month-view/calendar-month-view'
import { convertExpenseToIEvent } from '@/features/calendar/lib/helpers'
import {
  useExpenses,
  useRangeSummary,
  useExpenseCategories,
} from '@/features/expense'
import { useAsset, useAssets } from '@/features/asset'
import type { Expense, ExpenseType, ExpenseCategory } from '@/entities/expense'
import { FilterDialog, type FilterValue, DEFAULT_FILTER } from '@/features/porest/dialogs'
import { AddTxSheet } from '@/features/porest/add-tx/AddTxSheet'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { TxDetailDialog } from '@/features/porest/dialogs/TxDetailDialog'

type OutletCtx = { onAddTx: () => void; mobile: boolean }
type Filter = 'all' | 'income' | 'expense'

const CHIPS: { id: Filter; labelKey: string }[] = [
  { id: 'all', labelKey: 'chip.all' },
  { id: 'expense', labelKey: 'expense' },
  { id: 'income', labelKey: 'income' },
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
  // 실제 Summary(모바일 keep raised / 데스크톱 shadow) 구조 정합: 헤더는 [이전화살표][년 월 텍스트]
  // [다음화살표] + marginLeft auto[ViewModeToggle], 본문은 3-col(수입/지출/합계) 라벨+금액.
  return (
    <Card
      variant={mobile ? 'raised' : undefined}
      style={{
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 12 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <SkeletonBase className="h-7 w-7 rounded-md" />
        <SkeletonBase className="h-5 w-24" />
        <SkeletonBase className="h-7 w-7 rounded-md" />
        <SkeletonBase className="h-7 w-16 rounded-md" style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <SkeletonBase className="h-3 w-8 mb-1.5" />
            <SkeletonBase className={mobile ? 'h-4 w-24' : 'h-[18px] w-28'} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function ExpenseDayGroupSkeleton({ rows, mobile = false }: { rows: number; mobile?: boolean }) {
  // 날짜 헤더 = DateGroupHeader 정합. row = ExpenseRow 정합: CategoryChip 40px(md) +
  // gap-3(12px) + title 14px / sub 12px + 우측 금액.
  // 모바일 = 카드 다이어트(행만 나열) / 데스크톱 = 카드 + divider.
  const rowNodes = Array.from({ length: rows }).map((_, i) => (
    <div
      key={i}
      style={{
        borderTop: mobile || i === 0 ? 'none' : '1px solid var(--border-subtle)',
        padding: mobile ? '12px 4px' : '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <SkeletonBase className="h-10 w-10 rounded-[12px] shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBase className="h-3.5 w-3/4 mb-2" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="h-3.5 w-20 shrink-0" />
    </div>
  ))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 8px' }}>
        <SkeletonBase className="h-4 w-12" />
        <SkeletonBase className="h-4 w-5" />
        <SkeletonBase className="h-3.5 w-16 ml-auto" />
      </div>
      {mobile ? rowNodes : <Card style={{ overflow: 'hidden' }}>{rowNodes}</Card>}
    </div>
  )
}

/** Calendar grid skeleton — viewMode='calendar' (default) 의 외곽 카드 모양 + 7-col 요일
 *  헤더 + 6주 cell grid. 부모(flex-1) 가 viewport 의 남은 공간을 잡아주므로
 *  h-full + min-h-0 으로 그 공간을 완전 채움. */
function ExpenseCalendarSkeleton() {
  return (
    <Card
      className="max-w-[430px] lg:max-w-none h-full min-h-0"
      style={{ overflow: 'hidden' }}
    >
      <div className="flex flex-col h-full">
        {/* 요일 헤더 (일~토) */}
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] px-1 py-2">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
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
              className="flex flex-col items-start gap-1 p-1 lg:p-2 lg:border-l lg:border-t border-[var(--border-subtle)]"
            >
              <SkeletonBase className="size-6 rounded-full" />
              <SkeletonBase className="h-2 w-8 mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

/** Expense 페이지 구조에 맞춘 skeleton — Summary 카드 + Calendar grid (default mode).
 *  ExpenseMobile/Desktop 와 동일한 viewport fit 패턴 — AppLayout scroll wrapper 가
 *  flex-col 이므로 페이지 wrapper 는 flex-1 + min-h-0 으로 부모 전체 height 차지. */
function ExpensePageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('expense')
  if (mobile) {
    return (
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{ padding: '16px 20px 24px' }}
      >
        <ExpenseSummarySkeleton mobile />
        <div className="flex-1 min-h-0 flex flex-col">
          <ExpenseCalendarSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="page flex flex-col flex-1 min-h-0" style={{ paddingBottom: 24 }}>
      <div className="page__head">
        <div>
          <h1>{t('title')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
      </div>
      <ExpenseSummarySkeleton mobile={false} />
      <div className="flex-1 min-h-0 flex flex-col">
        <ExpenseCalendarSkeleton />
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
  headerRight,
}: {
  month: string
  onMonthChange: (m: string) => void
  mobile: boolean
  monthIn: number
  monthOut: number
  isLoading: boolean
  /** month header row 우측 슬롯 (예: ViewModeToggle). 클로드 디자인 정합. */
  headerRight?: React.ReactNode
}) {
  const { t } = useTranslation('expense')
  const balance = monthIn - monthOut
  const [y, m] = month.split('-')
  return (
    // 모바일 = keep 카드(raised + shadow-lg) — 카드 다이어트에서 유지되는 월 네비+요약 (design TxScreen).
    <Card
      variant={mobile ? 'raised' : undefined}
      style={{
        padding: mobile ? 16 : 20,
        marginBottom: mobile ? 12 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <MonthArrowButton dir="prev" month={month} onChange={onMonthChange} />
        <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.022em' }}>
          {formatYearMonth(new Date(Number(y), Number(m) - 1))}
        </div>
        <MonthArrowButton dir="next" month={month} onChange={onMonthChange} />
        {headerRight && <div style={{ marginLeft: 'auto' }}>{headerRight}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('income')}</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: '700', color: 'var(--fg-brand)' }}
          >
            {isLoading ? '—' : <MaskAmount>+{KRW(monthIn)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('expense')}</div>
          <div className="num" style={{ fontSize: mobile ? 16 : 18, fontWeight: '700', color: 'var(--fg-expense)' }}>
            {isLoading ? '—' : <MaskAmount>−{KRW(monthOut)}</MaskAmount>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('txDetail.sumLabel')}</div>
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
    </Card>
  )
}

type ViewMode = 'calendar' | 'list'

/** 가계부 캘린더 view — 홈 > 캘린더의 CalendarMonthView 를 그대로 활용.
 *  expense → IEvent 변환 후 CalendarProvider 안에서 month view 표시.
 *  CalendarMonthView 의 onDayClick prop 으로 셀 클릭 시 그날 거래 내역
 *  DayDetailDialog (mobile drawer / desktop dialog) 표시. drag-select 의
 *  quickAdd dialog 는 onDayClick 있으면 자동 양보. */
function ExpenseCalendar({
  month,
  expenses,
  mobile,
}: {
  month: string
  expenses: Expense[]
  mobile: boolean
}) {
  const events = useMemo(() => {
    return expenses.map(e => {
      const ev = convertExpenseToIEvent(e)
      const dateOnly = (e.expenseDate ?? '').slice(0, 10)
      const localISO = `${dateOnly}T00:00:00`
      return { ...ev, startDate: localISO, endDate: localISO }
    })
  }, [expenses])
  const initialDate = useMemo(() => {
    const [ys, ms] = month.split('-')
    return new Date(Number(ys), Number(ms) - 1, 1)
  }, [month])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // row 클릭 → TxDetailDialog → 편집 → AddTxSheet flow (EditableList 와 동일).
  const [detail, setDetail] = useState<Expense | null>(null)
  const [editing, setEditing] = useState<Expense | null>(null)
  // 일별 drawer '거래 추가' → 그 날짜 seed 로 신규 AddTxSheet.
  const [addSeedDate, setAddSeedDate] = useState<string | null>(null)
  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as Expense[]
    const ymd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    return expenses.filter(e => (e.expenseDate ?? '').slice(0, 10) === ymd)
  }, [selectedDate, expenses])
  const calInner = (
    <CalendarProvider events={events} initialView="month" initialDate={initialDate} key={month}>
      <CalendarMonthView
        singleDayEvents={events}
        multiDayEvents={[]}
        onDayClick={(date) => setSelectedDate(date)}
      />
    </CalendarProvider>
  )
  return (
    <>
      {mobile ? (
        // 카드 다이어트 — 모바일 캘린더는 shadow 없는 플랫(design TxCalendar). 셀 구분선도 lg: 전용이라
        // 모바일에선 시원한 무테 그리드가 된다. 월 네비+요약만 keep(raised) 카드로 유지.
        <div className="max-w-[430px] h-full min-h-0 overflow-hidden">{calInner}</div>
      ) : (
        <Card className="lg:max-w-none h-full min-h-0" style={{ overflow: 'hidden' }}>
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
            if (!selectedDate) return
            const ymd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
            setSelectedDate(null)
            setAddSeedDate(ymd)
          }}
        />
      )}
      {detail && !editing && (
        <TxDetailDialog
          expense={detail}
          mobile={mobile}
          onClose={() => setDetail(null)}
          onEdit={(e) => { setDetail(null); setEditing(e) }}
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
  )
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
  date: Date
  items: Expense[]
  mobile: boolean
  onClose: () => void
  onItemClick?: (e: Expense) => void
  onAddForDay?: () => void
}) {
  const { t } = useTranslation('expense')
  const title = formatMonthDayWeekday(date)
  const incomeSum = items.filter(e => e.expenseType === 'INCOME').reduce((s, e) => s + Math.abs(e.amount), 0)
  const expenseSum = items.filter(e => e.expenseType === 'EXPENSE').reduce((s, e) => s + Math.abs(e.amount), 0)
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      mobile={mobile}
      size="sm"
      mobileMinHeight="85dvh"
      footer={
        <Button size="md" className="w-full" onClick={onAddForDay}>
          <Plus size={16} /> {t('addTransaction')}
        </Button>
      }
    >
      {/* 합계 카드 — muted(채움 bg)로 dark dialog 위에서도 또렷이. App PCard.muted 정합 */}
      <Card variant="muted" className="mb-[var(--spacing-md)]">
        <CardContent className="!py-[var(--spacing-md)] flex items-center gap-[var(--spacing-md)]">
          <div className="flex-1 text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">
            {t('dayCount', { count: items.length })}
          </div>
          {/* 수입+지출 같이 있을 때 두 column horizontal (모바일 정합). 단독은 1 column. */}
          <div className="flex items-end gap-[var(--spacing-lg)]">
            {incomeSum > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">{t('income')}</span>
                <span className="num text-[length:var(--text-body-sm)] font-bold text-[var(--fg-brand)]">
                  <MaskAmount>+{wonPre()}{KRW(incomeSum)}</MaskAmount><WonUnit />
                </span>
              </div>
            )}
            {expenseSum > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[length:var(--text-caption)] text-[var(--fg-tertiary)]">{t('expense')}</span>
                <span className="num text-[length:var(--text-body-sm)] font-bold text-[var(--fg-expense)]">
                  <MaskAmount>−{wonPre()}{KRW(expenseSum)}</MaskAmount><WonUnit />
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* 거래 row 들 — item 사이 border 없이 자연 spacing (모바일 정합) */}
      {items.length === 0 ? (
        <div className="py-[var(--spacing-xl)] text-center text-[length:var(--text-label-sm)] text-[var(--fg-tertiary)]">
          {t('emptyDay')}
        </div>
      ) : (
        // card 없이 깔끔한 리스트 — 앱 _DayDetailBody 정합(TxDetail/AssetDetail 와 동일 패턴)
        <div>
          {items.map((e) => (
            <ExpenseRow key={e.rowId} expense={e} onClick={(ex) => onItemClick?.(ex)} />
          ))}
        </div>
      )}
    </ModalShell>
  )
}

function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  // 단일 toggle button — 현재 mode 의 반대를 보여줌 (calendar 모드면 "목록" 버튼).
  const { t } = useTranslation('expense')
  const isCalendar = value === 'calendar'
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onChange(isCalendar ? 'list' : 'calendar')}
      aria-label={isCalendar ? t('listViewLabel') : t('calendarViewLabel')}
    >
      {isCalendar ? <List size={14} /> : <Calendar size={14} />}
      <span style={{ marginLeft: 4 }}>{isCalendar ? t('viewList') : t('viewCalendar')}</span>
    </Button>
  )
}


function Chips({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  const { t } = useTranslation('expense')
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => v && onChange(v as Filter)}
      style={{ marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}
    >
      <TabsList variant="pills" size="sm">
        {CHIPS.map(c => (
          <TabsTrigger key={c.id} variant="pills" size="sm" value={c.id}>
            {t(c.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
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
  const { t } = useTranslation('expense')
  const grouped = useMemo(() => groupExpensesByDay(expenses), [expenses])
  const focusRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (focusTxId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusTxId, expenses.length])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 24 : 18 }}>
        <ExpenseDayGroupSkeleton rows={3} mobile={mobile} />
        <ExpenseDayGroupSkeleton rows={2} mobile={mobile} />
      </div>
    )
  }

  if (grouped.length === 0) {
    if (mobile) {
      // 카드 다이어트 — 빈 상태도 배경 위 플랫.
      return (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', fontWeight: 500 }}>
          {t('emptyList')}
        </div>
      )
    }
    return (
      <Card>
        <CardContent style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
            {t('emptyList')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    // 모바일 — 카드 다이어트: 날짜 그룹은 카드 없이 헤더+행, 그룹 사이 24px (design .tx-list).
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 24 : 18 }}>
      {grouped.map(([d, items]) => {
        const { md, dow } = formatDay(d)
        const out = items
          .filter(t => t.expenseType === 'EXPENSE')
          .reduce((s, t) => s + Math.abs(t.amount), 0)
        const inn = items
          .filter(t => t.expenseType === 'INCOME')
          .reduce((s, t) => s + Math.abs(t.amount), 0)
        const rows = items.map(e => {
          const isFocus = focusTxId === e.rowId
          return (
            <div
              key={e.rowId}
              ref={isFocus ? focusRef : undefined}
              style={{
                borderTop: mobile || items.indexOf(e) === 0 ? 'none' : '1px solid var(--border-subtle)',
                background: isFocus ? 'var(--bg-brand-subtle)' : undefined,
                transition: 'background 0.4s',
                padding: mobile ? undefined : '0 14px',
                borderRadius: mobile ? 10 : undefined,
              }}
            >
              <ExpenseRow expense={e} onClick={onItemClick} />
            </div>
          )
        })
        return (
          <div key={d}>
            {/* 날짜 헤더 — 카드 밖 평문 */}
            <DateGroupHeader date={md} weekday={dow} expense={out} income={inn} />
            {mobile ? (
              rows
            ) : (
              /* 데스크톱 — 거래 카드, divider 로 구분 */
              <Card style={{ overflow: 'hidden' }}>{rows}</Card>
            )}
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
        // split-aware: 거래 카테고리 또는 분할 항목 카테고리 중 하나라도 선택 집합에 들면 노출(전액).
        list = list.filter(e =>
          allowedCatIds.has(e.categoryRowId)
          || (e.splitCategoryRowIds ?? []).some(id => allowedCatIds.has(id)),
        )
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
  const { t } = useTranslation('expense')
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
        aria-label={t('clearFilter')}
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
  const { t } = useTranslation('expense')
  const [searchParams] = useSearchParams()
  const initialMonth = searchParams.get('month') || currentMonthKey()
  const focusTxId = Number(searchParams.get('txId')) || null
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(initialMonth)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const { assetId, asset, clear } = useAssetFilter()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null)

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(
    month, filter, filterValue, assetId, categoriesQ.data ?? null,
  )

  const activeCount = filterActiveCount(filterValue)

  // calendar 모드는 viewport fit (스크롤 없이 캘린더가 남은 공간 fill) — AppLayout 의
  // scroll wrapper 가 flex-col 이므로 페이지를 flex-1 + min-h-0 으로 부모 전체 차지.
  // 그 안에서 Calendar wrap 만 flex-1 로 Summary 아래 남은 공간 grow. list 모드는
  // 기존대로 자연 height (콘텐츠가 길면 부모 scroll wrapper 가 scroll).
  const isCalendarMode = viewMode === 'calendar'
  return (
    <div
      className={isCalendarMode ? 'page flex flex-col flex-1 min-h-0' : 'page'}
      style={isCalendarMode ? { paddingBottom: 24 } : undefined}
    >
      <div className="page__head">
        <div>
          <h1>{t('title')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">
          <Button variant="secondary" size="sm" onClick={() => setFilterOpen(true)}>
            <Filter size={13} /> {t('filter.title')}{activeCount > 0 && ` · ${activeCount}`}
          </Button>
          <Button variant="secondary" size="sm" onClick={notifyComing}>
            <Download size={13} /> {t('export')}
          </Button>
        </div>
      </div>
      {asset && <AssetFilterBadge name={t('assetFilterBadge', { name: asset.assetName })} onClear={clear} />}
      {activeCount > 0 && (
        <AssetFilterBadge name={t('filterAppliedBadge', { count: activeCount })} onClear={() => setFilterValue(null)} />
      )}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile={false}
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
        headerRight={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
      />
      {isCalendarMode ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {isLoadingList ? <ExpenseCalendarSkeleton /> : <ExpenseCalendar month={month} expenses={expenses} mobile={false} />}
        </div>
      ) : (
        <>
          <Chips filter={filter} onChange={setFilter} />
          <EditableList
            expenses={expenses}
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
  const { t } = useTranslation('expense')
  const [searchParams] = useSearchParams()
  const initialMonth = searchParams.get('month') || currentMonthKey()
  const focusTxId = Number(searchParams.get('txId')) || null
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(initialMonth)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const { assetId, asset, clear } = useAssetFilter()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<FilterValue | null>(null)

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()

  const { expenses, monthIn, monthOut, isLoadingList, isLoadingSummary } = useExpenseData(
    month, filter, filterValue, assetId, categoriesQ.data ?? null,
  )

  const activeCount = filterActiveCount(filterValue)

  // calendar 모드는 viewport fit (스크롤 없이) — AppLayout 의 .m-scroll 이 flex-col
  // 이므로 페이지를 flex-1 + min-h-0 으로 그 안에서 부모 전체 차지. Calendar wrap 만
  // flex-1 로 Summary 아래 남은 공간 grow. list 모드는 자연 height (.m-scroll scroll).
  const isCalendarMode = viewMode === 'calendar'
  return (
    <div
      className={isCalendarMode ? 'flex flex-col flex-1 min-h-0' : undefined}
      // 카드 다이어트 — design TxScreen 모바일 컨테이너 정합.
      style={{ padding: '16px 20px 24px' }}
    >
      {asset && <AssetFilterBadge name={t('assetFilterBadge', { name: asset.assetName })} onClear={clear} />}
      {activeCount > 0 && (
        <AssetFilterBadge name={t('filterAppliedBadge', { count: activeCount })} onClear={() => setFilterValue(null)} />
      )}
      <Summary
        month={month}
        onMonthChange={setMonth}
        mobile
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={isLoadingSummary}
        headerRight={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
      />
      {isCalendarMode ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {isLoadingList ? <ExpenseCalendarSkeleton /> : <ExpenseCalendar month={month} expenses={expenses} mobile={true} />}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Chips filter={filter} onChange={setFilter} />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilterOpen(true)}
              aria-label={t('filter.title')}
              // 앱 정합 — 가계부 필터/추가 버튼은 radius-sm(4px). icon size 기본 rounded-md(8px) override.
              className="relative shrink-0 rounded-[var(--radius-sm)]"
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
              aria-label={t('addTransaction')}
              className="shrink-0 rounded-[var(--radius-sm)]"
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
        </>
      )}
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
  const { t } = useTranslation('expense')
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
      aria-label={dir === 'prev' ? t('prevMonth') : t('nextMonth')}
      onClick={handle}
      className="h-7 w-7 text-text-secondary"
    >
      {dir === 'prev' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </Button>
  )
}
