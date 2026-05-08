import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { SegPicker } from '@/shared/ui/porest/primitives'
import { Donut } from '@/shared/ui/porest/charts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Calendar } from '@/shared/ui/calendar'
import {
  useRangeSummary,
  useMerchantSummary,
  useExpenseHeatmap,
  useExpenseCategories,
  useExpenses,
} from '@/features/expense'
import type { CategoryBreakdown, HeatmapCell, ExpenseCategory } from '@/entities/expense'
import { renderIcon } from '@/shared/lib'

type OutletCtx = { mobile: boolean }
type TabKey = 'cat' | 'trend' | 'compare'
type SegMode = 'm' | 'q' | 'y' | 'custom'
type RangeState = { from: Date; to: Date; segMode: SegMode }

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const monthRangeOf = (now: Date): RangeState => ({
  from: new Date(now.getFullYear(), now.getMonth(), 1),
  to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  segMode: 'm',
})
const quarterRangeOf = (now: Date): RangeState => {
  const q = Math.floor(now.getMonth() / 3)
  return {
    from: new Date(now.getFullYear(), q * 3, 1),
    to: new Date(now.getFullYear(), q * 3 + 3, 0),
    segMode: 'q',
  }
}
const yearRangeOf = (now: Date): RangeState => ({
  from: new Date(now.getFullYear(), 0, 1),
  to: new Date(now.getFullYear(), 11, 31),
  segMode: 'y',
})

const previousRange = ({ from, to, segMode }: RangeState): { from: Date; to: Date } => {
  if (segMode === 'm') {
    return {
      from: new Date(from.getFullYear(), from.getMonth() - 1, 1),
      to: new Date(from.getFullYear(), from.getMonth(), 0),
    }
  }
  if (segMode === 'q') {
    return {
      from: new Date(from.getFullYear(), from.getMonth() - 3, 1),
      to: new Date(from.getFullYear(), from.getMonth(), 0),
    }
  }
  if (segMode === 'y') {
    return {
      from: new Date(from.getFullYear() - 1, 0, 1),
      to: new Date(from.getFullYear() - 1, 11, 31),
    }
  }
  // custom: 같은 길이 직전 윈도우
  const days = Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000) + 1
  const t = new Date(from); t.setDate(t.getDate() - 1)
  const f = new Date(t); f.setDate(f.getDate() - days + 1)
  return { from: f, to: t }
}

const periodLabel = ({ from, to, segMode }: RangeState): string => {
  if (segMode === 'm') return `${from.getFullYear()}년 ${from.getMonth() + 1}월`
  if (segMode === 'q') return `${from.getFullYear()}년 ${Math.floor(from.getMonth() / 3) + 1}분기`
  if (segMode === 'y') return `${from.getFullYear()}년`
  const sameYear = from.getFullYear() === to.getFullYear()
  return sameYear
    ? `${from.getMonth() + 1}/${from.getDate()} ~ ${to.getMonth() + 1}/${to.getDate()}`
    : `${fmt(from)} ~ ${fmt(to)}`
}

const labelsOf = ({ segMode }: RangeState) =>
  segMode === 'm'
    ? { now: '이번 달', prev: '지난 달', mom: '전월 대비', noPrev: '전월 데이터 없음', avg: '하루 평균' }
    : segMode === 'q'
      ? { now: '이번 분기', prev: '지난 분기', mom: '전분기 대비', noPrev: '전분기 데이터 없음', avg: '월 평균' }
      : segMode === 'y'
        ? { now: '이번 해', prev: '지난 해', mom: '전년 대비', noPrev: '전년 데이터 없음', avg: '월 평균' }
        : { now: '선택 기간', prev: '이전 기간', mom: '이전 기간 대비', noPrev: '이전 기간 데이터 없음', avg: '일 평균' }

const DONUT_COLORS = [
  'oklch(0.55 0.12 55)',
  'oklch(0.50 0.12 340)',
  'oklch(0.50 0.1 140)',
  'oklch(0.50 0.12 290)',
  'oklch(0.48 0.012 195)',
  'oklch(0.50 0.08 50)',
  'oklch(0.52 0.1 215)',
  'oklch(0.50 0.1 230)',
  'oklch(0.55 0.13 25)',
  'var(--bark-700)',
  'var(--fg-income)',
]

// 6-step heatmap palette (empty → deep mossy).
// color-mix 로 --mossy-500 을 투명도 다르게 섞어 라이트/다크 양쪽에서 자동 적응.
// 레벨 0 은 semantic muted bg 로 두어 "빈 셀" 구분 명확.
const HEAT_PALETTE: { bg: string; fg: string }[] = [
  { bg: 'var(--bg-muted)',                                                 fg: 'var(--fg-tertiary)' },    // 0 empty
  { bg: 'color-mix(in oklch, var(--border-brand) 18%, transparent)',          fg: 'var(--fg-primary)' },     // 1
  { bg: 'color-mix(in oklch, var(--border-brand) 35%, transparent)',          fg: 'var(--fg-primary)' },     // 2
  { bg: 'color-mix(in oklch, var(--border-brand) 55%, transparent)',          fg: 'var(--fg-on-brand)' },    // 3
  { bg: 'color-mix(in oklch, var(--border-brand) 75%, transparent)',          fg: 'var(--fg-on-brand)' },    // 4
  { bg: 'var(--border-brand)',                                                fg: 'var(--fg-on-brand)' },    // 5 peak
]

// 행(시간대 구간) 정의 — 각 구간은 4시간 범위
// 하루 흐름: 아침 → 점심 → 오후 → 저녁 → 심야 → 새벽
const HEAT_ROWS: { label: string; sub: string; hours: number[] }[] = [
  { label: '아침', sub: '06–10시', hours: [6, 7, 8, 9] },
  { label: '점심', sub: '10–14시', hours: [10, 11, 12, 13] },
  { label: '오후', sub: '14–18시', hours: [14, 15, 16, 17] },
  { label: '저녁', sub: '18–22시', hours: [18, 19, 20, 21] },
  { label: '심야', sub: '22–02시', hours: [22, 23, 0, 1] },
  { label: '새벽', sub: '02–06시', hours: [2, 3, 4, 5] },
]

// 열(요일) — Java DayOfWeek: 1=월 ~ 7=일
const HEAT_COLS: { label: string; dow: number }[] = [
  { label: '월', dow: 1 },
  { label: '화', dow: 2 },
  { label: '수', dow: 3 },
  { label: '목', dow: 4 },
  { label: '금', dow: 5 },
  { label: '토', dow: 6 },
  { label: '일', dow: 7 },
]

const colorFor = (idx: number) => DONUT_COLORS[idx % DONUT_COLORS.length]!

type TrendTooltipPayload = {
  dataKey?: string | number
  value?: number
  color?: string
  payload?: { month?: string }
}
type TrendTooltipProps = { active?: boolean; payload?: TrendTooltipPayload[]; label?: string }

function PorestChartTooltip({
  active,
  payload,
  label,
  rows,
}: TrendTooltipProps & {
  rows: { dataKey: string; label: string; color: string; format?: (v: number) => string }[]
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-md)',
        padding: '10px 12px',
        fontSize: 'var(--fs-caption)',
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-micro)',
          color: 'var(--fg-tertiary)',
          fontWeight: 'var(--fw-semi)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {rows.map(row => {
        const item = payload.find(p => p.dataKey === row.dataKey)
        if (!item) return null
        const v = Number(item.value ?? 0)
        return (
          <div
            key={row.dataKey}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 'var(--radius-2xs)',
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-secondary)' }}>{row.label}</span>
            <span
              className="num"
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--fg-primary)',
              }}
            >
              {row.format ? (
                <MaskAmount>{row.format(v)}</MaskAmount>
              ) : (
                <>
                  <MaskAmount>{KRW(v)}</MaskAmount>
                  <HideUnit>원</HideUnit>
                </>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const StatsPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const hidden = useHideAmounts()
  const [tab, setTab] = useState<TabKey>('cat')
  const [period, setPeriod] = useState<RangeState>(() => monthRangeOf(new Date()))
  const [activeParentId, setActiveParentId] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // 기간·탭 변경 시 드릴다운 해제
  useEffect(() => setActiveParentId(null), [period.from, period.to, period.segMode, tab])

  const startDate = fmt(period.from)
  const endDate = fmt(period.to)
  const prevR = useMemo(() => previousRange(period), [period])
  const prevStart = fmt(prevR.from)
  const prevEnd = fmt(prevR.to)

  const rangeQ = useRangeSummary(startDate, endDate)
  // 비교 탭에서만 이전 기간 호출 (다른 탭에선 dummy disabled query)
  const prevRangeQ = useRangeSummary(tab === 'compare' ? prevStart : '', tab === 'compare' ? prevEnd : '')
  const categoriesQ = useExpenseCategories()
  const merchantQ = useMerchantSummary(startDate, endDate)
  // 추이 탭 'month' 모드에서 일별 시리즈를 그리려면 해당 기간의 raw 거래 목록이 필요.
  const monthExpensesQ = useExpenses({ startDate, endDate })
  const heatmapQ = useExpenseHeatmap(startDate, endDate)

  const periodLbl = periodLabel(period)
  const labels = labelsOf(period)

  const categoryBreakdown: CategoryBreakdown[] = useMemo(
    () => rangeQ.data?.categoryBreakdown ?? [],
    [rangeQ.data],
  )
  const totalExpense = rangeQ.data?.totalExpense ?? 0
  const totalIncome = rangeQ.data?.totalIncome ?? 0
  const monthlyBuckets = useMemo(
    () => rangeQ.data?.monthlyBuckets ?? [],
    [rangeQ.data],
  )

  // 카테고리 메타(rowId → 아이콘/색/이름) 룩업
  const categoryById = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    for (const c of categoriesQ.data ?? []) map.set(c.rowId, c)
    return map
  }, [categoriesQ.data])

  // 지출(EXPENSE) 카테고리만 필터
  const periodBreakdown = useMemo<CategoryBreakdown[]>(
    () => categoryBreakdown.filter(c => c.expenseType === 'EXPENSE'),
    [categoryBreakdown],
  )

  type DonutRow = {
    rowId: number
    name: string
    amount: number
    icon: string | null
    color: string | null
    hasChildren: boolean
  }

  // 부모 카테고리 집계 (드릴 전)
  const donutBreakdown = useMemo<DonutRow[]>(() => {
    const map = new Map<number, DonutRow>()
    for (const c of periodBreakdown) {
      const groupRowId = c.parentCategoryRowId ?? c.categoryRowId
      const groupName = c.parentCategoryName ?? c.categoryName
      let row = map.get(groupRowId)
      if (!row) {
        const cat = categoryById.get(groupRowId)
        row = {
          rowId: groupRowId,
          name: groupName,
          amount: 0,
          icon: cat?.icon ?? null,
          color: cat?.color ?? null,
          hasChildren: false,
        }
        map.set(groupRowId, row)
      }
      row.amount += c.totalAmount
      if (c.parentCategoryRowId != null) row.hasChildren = true
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [periodBreakdown, categoryById])

  // 드릴 모드: 활성 부모의 자식 leaf 집계
  const drillBreakdown = useMemo<DonutRow[]>(() => {
    if (activeParentId == null) return []
    const map = new Map<number, DonutRow>()
    for (const c of periodBreakdown) {
      if (c.parentCategoryRowId !== activeParentId) continue
      let row = map.get(c.categoryRowId)
      if (!row) {
        const cat = categoryById.get(c.categoryRowId)
        row = {
          rowId: c.categoryRowId,
          name: c.categoryName,
          amount: 0,
          icon: cat?.icon ?? null,
          color: cat?.color ?? null,
          hasChildren: false,
        }
        map.set(c.categoryRowId, row)
      }
      row.amount += c.totalAmount
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [activeParentId, periodBreakdown, categoryById])

  const activeParent = activeParentId != null
    ? donutBreakdown.find(r => r.rowId === activeParentId) ?? null
    : null
  const isDrilled = activeParentId != null && drillBreakdown.length > 0
  const donutView = isDrilled ? drillBreakdown : donutBreakdown

  // 기간 총 지출
  const periodTotalExpense = totalExpense
  const donutLoading = rangeQ.isLoading

  const StatsTabs = (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabKey)}
      style={{ marginBottom: mobile ? 14 : 20 }}
    >
      <TabsList variant="underline">
        {([
          { v: 'cat', l: '카테고리' },
          { v: 'trend', l: '추이' },
          { v: 'compare', l: '비교' },
        ] as { v: TabKey; l: string }[]).map(t => (
          <TabsTrigger key={t.v} value={t.v} variant="underline">
            {t.l}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  // '사용자 지정' 활성 시 라벨에 실제 기간 표시. 다른 모드면 '사용자 지정' 그대로.
  const customLabel =
    period.segMode === 'custom'
      ? (period.from.getFullYear() === period.to.getFullYear()
          ? `${period.from.getMonth() + 1}/${period.from.getDate()} ~ ${period.to.getMonth() + 1}/${period.to.getDate()}`
          : `${fmt(period.from)} ~ ${fmt(period.to)}`)
      : '사용자 지정'

  const PeriodSeg = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <SegPicker
        options={[
          { value: 'm', label: '월' },
          { value: 'q', label: '분기' },
          { value: 'y', label: '년' },
          { value: 'custom', label: customLabel },
        ]}
        value={period.segMode}
        onChange={(v) => {
          if (v === 'm') setPeriod(monthRangeOf(new Date()))
          else if (v === 'q') setPeriod(quarterRangeOf(new Date()))
          else if (v === 'y') setPeriod(yearRangeOf(new Date()))
          // 'custom' 클릭: 피커 오픈만 — 확정 시점에 segMode 변경
          else setPickerOpen(true)
        }}
      />
      {pickerOpen && (
        <RangePickerPopover
          initial={{ from: period.from, to: period.to }}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(r) => {
            setPeriod({ from: r.from, to: r.to, segMode: 'custom' })
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )

  // ---------- LOADING / EMPTY HELPERS ----------
  const EmptyBox = ({ text }: { text: string }) => (
    <div
      style={{
        padding: '32px 0',
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 'var(--fs-body-sm)',
      }}
    >
      {text}
    </div>
  )

  // ---------- CATEGORY TAB ----------
  const donutTotal = donutView.reduce((s, x) => s + x.amount, 0)
  // 도넛 센터 라벨은 항상 짧게 유지 — custom 모드의 full date range 가 도넛 안으로 침범하지 않도록.
  const centerPeriodLbl = period.segMode === 'custom' ? '선택 기간' : periodLbl
  const donutCenterLbl = isDrilled
    ? `${activeParent?.name ?? ''} 세부`
    : `${centerPeriodLbl} 지출`

  const DonutCard = (
    <Card style={{ padding: mobile ? 18 : 24 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDrilled ? (
            <>
              <button
                type="button"
                onClick={() => setActiveParentId(null)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--fg-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-medium)',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                카테고리별 지출
              </button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)' }}>›</span>
              <span>{activeParent?.name}</span>
            </>
          ) : (
            '카테고리별 지출'
          )}
        </CardTitle>
        <div style={{ marginLeft: 'auto' }}>{PeriodSeg}</div>
      </CardHeader>
      {donutLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : donutView.length === 0 ? (
        <EmptyBox text="카테고리 데이터가 없습니다" />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 20 : 32,
            alignItems: 'center',
          }}
        >
          <Donut
            segments={donutView.map((s, i) => ({ value: s.amount, color: colorFor(i) }))}
            size={mobile ? 180 : 200}
            stroke={28}
          >
            <div className="lbl">{donutCenterLbl}</div>
            <div className="val num" style={{ fontSize: 'var(--fs-h3)' }}>
              <MaskAmount>{KRW(donutTotal)}</MaskAmount>
              <HideUnit>원</HideUnit>
            </div>
          </Donut>
          <div className="cat-legend" style={{ width: '100%' }}>
            {donutView.map((s, i) => {
              const clickable = !isDrilled && s.hasChildren
              return (
                <div
                  key={s.rowId}
                  className="cat-legend__row"
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => setActiveParentId(s.rowId) : undefined}
                  onKeyDown={clickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveParentId(s.rowId)
                    }
                  } : undefined}
                  style={{
                    cursor: clickable ? 'pointer' : 'default',
                    borderRadius: 'var(--radius-md)',
                    padding: clickable ? '4px 6px' : undefined,
                    margin: clickable ? '0 -6px' : undefined,
                    transition: 'background var(--dur-fast) var(--ease-standard)',
                  }}
                  onMouseEnter={clickable ? (e) => { e.currentTarget.style.background = 'var(--pd-hover-bg)' } : undefined}
                  onMouseLeave={clickable ? (e) => { e.currentTarget.style.background = 'transparent' } : undefined}
                  title={clickable ? '클릭하여 하위 카테고리 보기' : undefined}
                >
                  <span className="cat-legend__sw" style={{ background: colorFor(i) }} />
                  <span className="cat-legend__name">{s.name}</span>
                  <span className="cat-legend__pct num">
                    {donutTotal > 0 ? ((s.amount / donutTotal) * 100).toFixed(1) : '0.0'}%
                  </span>
                  <span className="cat-legend__amt num">
                    <MaskAmount mask="••••">{KRW(s.amount)}</MaskAmount>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )

  const merchants = merchantQ.data?.merchants ?? []
  const topMerchants = merchants.slice(0, 5)
  const maxMerchantAmt = Math.max(1, ...topMerchants.map(m => m.totalAmount))

  const TopMerchantsCard = (
    <Card
      style={{
        padding: mobile ? 18 : 22,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>많이 쓴 가맹점 TOP 5</CardTitle>
      </CardHeader>
      {merchantQ.isLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : topMerchants.length === 0 ? (
        <EmptyBox text="가맹점 데이터가 없습니다" />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {topMerchants.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 24,
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-bold)',
                  color: i < 3 ? 'var(--fg-income)' : 'var(--fg-tertiary)',
                  textAlign: 'center',
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semi)' }}>{m.merchant}</span>
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', marginLeft: 6 }}>
                    {m.count}회
                  </span>
                  <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)' }}>
                    <MaskAmount>{KRW(m.totalAmount)}</MaskAmount>
                    <HideUnit>원</HideUnit>
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--pd-surface-inset)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(m.totalAmount / maxMerchantAmt) * 100}%`,
                      height: '100%',
                      background: colorFor(i),
                      borderRadius: 'var(--radius-pill)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  // ---------- HEATMAP (요일 × 시간대 구간) ----------
  const heatmapCells: HeatmapCell[] = heatmapQ.data ?? []
  const heatmapMatrix = useMemo(() => {
    // rows: 6 시간대 × cols: 7 요일, value = sum of totalAmount
    const matrix: number[][] = HEAT_ROWS.map(() => HEAT_COLS.map(() => 0))
    for (const cell of heatmapCells) {
      const colIdx = HEAT_COLS.findIndex(c => c.dow === cell.dayOfWeek)
      const rowIdx = HEAT_ROWS.findIndex(r => r.hours.includes(cell.hour))
      if (colIdx < 0 || rowIdx < 0) continue
      matrix[rowIdx]![colIdx]! += cell.totalAmount
    }
    return matrix
  }, [heatmapCells])

  const heatmapMax = useMemo(
    () => heatmapMatrix.reduce((m, row) => Math.max(m, ...row), 0),
    [heatmapMatrix]
  )

  const heatmapTotal = useMemo(
    () => heatmapMatrix.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0),
    [heatmapMatrix]
  )

  /** 비선형 bucket (디자인 spec) — 상위값에 더 큰 대비 */
  const heatBucket = (value: number): number => {
    if (heatmapMax <= 0 || value <= 0) return 0
    const ratio = value / heatmapMax
    if (ratio < 0.08) return 1
    if (ratio < 0.22) return 2
    if (ratio < 0.45) return 3
    if (ratio < 0.75) return 4
    return 5
  }

  /**
   * 셀 내부에 표시할 금액 약식 — 디자인 spec
   *   0        → "—"
   *   < 10000  → "X천"    (천 단위 정수)
   *   >= 10000 → "X.X만"  (만 단위, 소수 1자리)
   */
  const shortAmount = (v: number): string => {
    if (v <= 0) return '—'
    if (v < 10_000) return `${Math.round(v / 1000)}천`
    return `${(v / 10_000).toFixed(1)}만`
  }

  const HeatmapCard = (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <CardHeader style={{ marginBottom: 6 }}>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>요일·시간대 지출 패턴</CardTitle>
      </CardHeader>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginBottom: 16 }}>
        색이 진할수록 지출이 많은 시간대예요 (단위: 원)
      </div>
      {heatmapQ.isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${HEAT_ROWS.length}, 1fr)`,
            gap: 6,
          }}
        >
          {HEAT_ROWS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 28,
                background: 'var(--pd-surface-inset)',
                borderRadius: 'var(--radius-md)',
                opacity: 0.6 + (i % 2) * 0.2,
              }}
            />
          ))}
        </div>
      ) : heatmapTotal === 0 ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 'var(--fs-body-sm)',
            background: 'var(--pd-surface-inset)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          이번 달 거래가 아직 적어요
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `72px repeat(${HEAT_COLS.length}, 1fr)`,
              gap: mobile ? 6 : 8,
              alignItems: 'center',
            }}
          >
            {/* 헤더 행: 빈 코너 + 요일 라벨 */}
            <span />
            {HEAT_COLS.map(col => (
              <span
                key={col.dow}
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-semi)',
                  color: 'var(--fg-tertiary)',
                  textAlign: 'center',
                  paddingBottom: 4,
                }}
              >
                {col.label}
              </span>
            ))}

            {/* 데이터 행들 */}
            {HEAT_ROWS.map((row, rIdx) => (
              <Fragment key={row.label}>
                <div
                  style={{
                    fontSize: 'var(--fs-caption)',
                    color: 'var(--fg-tertiary)',
                    lineHeight: 'var(--lh-snug)',
                    paddingRight: 6,
                  }}
                >
                  <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)', fontSize: 'var(--fs-body-sm)' }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {row.sub}
                  </div>
                </div>
                {HEAT_COLS.map((col, cIdx) => {
                  const value = heatmapMatrix[rIdx]?.[cIdx] ?? 0
                  const bucket = heatBucket(value)
                  const pal = HEAT_PALETTE[bucket]!
                  const isPeak = value > 0 && value === heatmapMax
                  return (
                    <div
                      key={`${row.label}-${col.dow}`}
                      title={hidden ? `${row.label}·${col.label}` : `${row.label}·${col.label} ${KRW(value)}원`}
                      style={{
                        aspectRatio: mobile ? '0.9' : '1.1',
                        borderRadius: 'var(--radius-sm)',
                        background: pal.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: mobile ? 10 : 11.5,
                        fontWeight: 'var(--fw-bold)',
                        color: pal.fg,
                        fontVariantNumeric: 'tabular-nums',
                        boxShadow: isPeak
                          ? '0 0 0 2px var(--mossy-900), 0 0 0 4px oklch(0.385 0.05 110 / 0.25)'
                          : 'none',
                        transition: 'background var(--dur-fast) var(--ease-standard)',
                      }}
                    >
                      <MaskAmount mask={value > 0 ? '••' : '—'}>{shortAmount(value)}</MaskAmount>
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>

          {/* 범례 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              fontSize: 'var(--fs-micro)',
              color: 'var(--fg-tertiary)',
            }}
          >
            <span>적음</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {HEAT_PALETTE.slice(1).map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 10,
                    borderRadius: 'var(--radius-2xs)',
                    background: c.bg,
                    border: '1px solid oklch(0.90 0.01 110)',
                  }}
                />
              ))}
            </div>
            <span>많음</span>
            <span style={{ marginLeft: 'auto' }}>
              총 <MaskAmount>{KRW(heatmapTotal)}</MaskAmount>
              <HideUnit>원</HideUnit>
            </span>
          </div>
        </>
      )}
    </Card>
  )

  const topMerchant = topMerchants[0]
  const categoryTop = donutBreakdown[0]
  // 기간 일수
  const rangeDays =
    Math.round((startOfDay(period.to).getTime() - startOfDay(period.from).getTime()) / 86400000) + 1

  // 평균 계산 — 단일 월 모드는 일평균, 그 외는 월평균. custom 은 일평균.
  const useDailyAvg = period.segMode === 'm' || period.segMode === 'custom'
  const avgDivisor = useDailyAvg ? rangeDays : Math.max(1, monthlyBuckets.length)
  const avgValue = avgDivisor > 0 ? Math.round(periodTotalExpense / avgDivisor) : 0
  const avgLabel = labels.avg

  // 이전 동등 기간 총지출 (Compare 탭 미사용 시 0 — query가 disabled)
  const prevTotalExpense = prevRangeQ.data?.totalExpense ?? 0
  const dayPct = prevTotalExpense > 0
    ? Math.round(((totalExpense - prevTotalExpense) / prevTotalExpense) * 100)
    : 0
  const avgSub: React.ReactNode = period.segMode !== 'm'
    ? <>{rangeDays}일 합계 <MaskAmount>{KRW(periodTotalExpense)}</MaskAmount><HideUnit>원</HideUnit></>
    : prevTotalExpense > 0
      ? `전월 대비 ${dayPct >= 0 ? '↑' : '↓'}${Math.abs(dayPct)}%`
      : '전월 비교 불가'

  const highlights: { lbl: string; val: React.ReactNode; sub: React.ReactNode }[] = [
    {
      lbl: '가장 많이 쓴 카테고리',
      val: categoryTop?.name ?? '—',
      sub: categoryTop
        ? <><MaskAmount>{KRW(categoryTop.amount)}</MaskAmount><HideUnit>원</HideUnit></>
        : '데이터 없음',
    },
    {
      lbl: '가장 많이 쓴 가맹점',
      val: topMerchant?.merchant ?? '—',
      sub: topMerchant
        ? <>{topMerchant.count}회 · <MaskAmount>{KRW(topMerchant.totalAmount)}</MaskAmount><HideUnit>원</HideUnit></>
        : '데이터 없음',
    },
    {
      lbl: avgLabel,
      val: <><MaskAmount>{KRW(avgValue)}</MaskAmount><HideUnit>원</HideUnit></>,
      sub: avgSub,
    },
  ]

  const HighlightsGrid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      {highlights.map((h, i) => (
        <Card key={i} style={{ padding: 18 }}>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 10 }}>
            {h.lbl}
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-snug)' }}>{h.val}</div>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{h.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  )

  // ---------- TREND TAB ----------
  // 단일 월(segMode === 'm') 또는 사용자 지정 기간이 1개월 이내면 일별 시리즈, 그 외엔 월별 시리즈
  const useDailyTrend = period.segMode === 'm' || (period.segMode === 'custom' && monthlyBuckets.length <= 1)
  const trendChartData = useMemo(() => {
    if (useDailyTrend) {
      const exps = monthExpensesQ.data ?? []
      const fromDay = startOfDay(period.from)
      const toDay = startOfDay(period.to)
      const days = Math.round((toDay.getTime() - fromDay.getTime()) / 86400000) + 1
      const byDay = new Map<string, { income: number; expense: number; label: string }>()
      for (let i = 0; i < days; i++) {
        const d = new Date(fromDay); d.setDate(d.getDate() + i)
        const key = fmt(d)
        byDay.set(key, { income: 0, expense: 0, label: `${d.getMonth() + 1}/${d.getDate()}` })
      }
      for (const e of exps) {
        const key = e.expenseDate.slice(0, 10)
        const bucket = byDay.get(key)
        if (!bucket) continue
        if (e.expenseType === 'INCOME') bucket.income += e.amount
        else bucket.expense += e.amount
      }
      return Array.from(byDay.values()).map(v => ({
        month: v.label,
        income: v.income,
        expense: v.expense,
        savings: v.income - v.expense,
      }))
    }
    return monthlyBuckets.map(b => ({
      month: `${b.year}.${String(b.month).padStart(2, '0')}`,
      income: b.totalIncome,
      expense: b.totalExpense,
      savings: b.totalIncome - b.totalExpense,
    }))
  }, [useDailyTrend, monthlyBuckets, monthExpensesQ.data, period.from, period.to])

  const sumIn = monthlyBuckets.reduce((s, b) => s + b.totalIncome, 0)
  const sumOut = monthlyBuckets.reduce((s, b) => s + b.totalExpense, 0)
  const n = Math.max(1, monthlyBuckets.length)
  const avgIn = sumIn / n
  const avgOut = sumOut / n
  const avgSave = avgIn - avgOut
  const isSingle = period.segMode === 'm'
  const statLabelIn = isSingle ? '수입' : '평균 수입'
  const statLabelOut = isSingle ? '지출' : '평균 지출'
  const statLabelSave = isSingle ? '순저축' : '평균 저축'

  const trendChartConfig: ChartConfig = {
    income: { label: '수입', color: 'var(--border-brand)' },
    expense: { label: '지출', color: 'var(--fg-expense)' },
  }
  const savingsChartConfig: ChartConfig = {
    savings: { label: '순저축', color: 'var(--bg-brand)' },
  }

  const fmtTick = (v: number) =>
    v >= 100_000_000
      ? `${(v / 100_000_000).toFixed(1)}억`
      : v >= 10_000
        ? `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
        : v.toLocaleString('ko-KR')

  const TrendBig = (
    <Card style={{ padding: mobile ? 18 : 24 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>{periodLbl} 수입·지출 추이</CardTitle>
        <div style={{ marginLeft: 'auto' }}>{PeriodSeg}</div>
      </CardHeader>
      {rangeQ.isLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : trendChartData.length === 0 ? (
        <EmptyBox text="추이 데이터가 없습니다" />
      ) : (
        <>
          <ChartContainer
            config={trendChartConfig}
            className="aspect-auto w-full"
            style={{ height: mobile ? 200 : 260 }}
          >
            <AreaChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendIncomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="trendExpenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--fg-tertiary)' }}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={mobile ? 16 : 24}
              />
              {/* 좌축: 수입 */}
              <YAxis
                yAxisId="income"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--color-income)' }}
                tickFormatter={fmtTick}
                width={52}
              />
              {/* 우축: 지출 */}
              <YAxis
                yAxisId="expense"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--color-expense)' }}
                tickFormatter={fmtTick}
                width={52}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--fg-tertiary)', strokeDasharray: '3 3' }}
                content={
                  <PorestChartTooltip
                    rows={[
                      { dataKey: 'income', label: '수입', color: 'var(--border-brand)' },
                      { dataKey: 'expense', label: '지출', color: 'var(--fg-expense)' },
                    ]}
                  />
                }
              />
              <Area
                yAxisId="income"
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                fill="url(#trendIncomeFill)"
                dot={{ fill: 'var(--color-income)', stroke: 'var(--bg-surface)', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                yAxisId="expense"
                type="monotone"
                dataKey="expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                fill="url(#trendExpenseFill)"
                dot={{ fill: 'var(--color-expense)', stroke: 'var(--bg-surface)', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 'var(--fs-caption)', color: 'var(--fg-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-2xs)', background: 'var(--border-brand)' }} /> 수입
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-2xs)', background: 'var(--fg-expense)' }} /> 지출
            </span>
          </div>
        </>
      )}
    </Card>
  )

  const TrendStats = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {([
        { lbl: statLabelIn, val: <><MaskAmount>{KRW(Math.round(avgIn))}</MaskAmount><HideUnit>원</HideUnit></> },
        { lbl: statLabelOut, val: <><MaskAmount>{KRW(Math.round(avgOut))}</MaskAmount><HideUnit>원</HideUnit></> },
        { lbl: statLabelSave, val: <><MaskAmount>{KRW(Math.round(avgSave))}</MaskAmount><HideUnit>원</HideUnit></> },
        { lbl: '저축률', val: avgIn > 0 ? ((avgSave / avgIn) * 100).toFixed(1) + '%' : '—' },
      ] as { lbl: string; val: React.ReactNode }[]).map((s, i) => (
        <Card key={i} style={{ padding: 16 }}>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 6 }}>
            {s.lbl}
          </div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: 'var(--fw-heavy)', letterSpacing: 'var(--tracking-tight)' }}
          >
            {s.val}
          </div>
        </Card>
      ))}
    </div>
  )

  const SavingsBars = (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>{useDailyTrend ? '일별 순저축' : '월별 순저축'}</CardTitle>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)' }}>수입 − 지출</span>
      </CardHeader>
      {rangeQ.isLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : trendChartData.length === 0 ? (
        <EmptyBox text="월별 데이터가 없습니다" />
      ) : (
        <ChartContainer
          config={savingsChartConfig}
          className="aspect-auto w-full"
          style={{ height: mobile ? 180 : 220 }}
        >
          <BarChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--fg-tertiary)' }}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={mobile ? 16 : 24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 'var(--fs-micro)', fill: 'var(--fg-tertiary)' }}
              tickFormatter={fmtTick}
              width={52}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--border-brand)', fillOpacity: 0.05 }}
              content={
                <PorestChartTooltip
                  rows={[
                    {
                      dataKey: 'savings',
                      label: '순저축',
                      color: 'var(--bg-brand)',
                      format: (v) => `${v >= 0 ? '+' : '−'}${KRW(Math.abs(v))}원`,
                    },
                  ]}
                />
              }
            />
            <Bar dataKey="savings" radius={[6, 6, 2, 2]} barSize={mobile ? 18 : 28}>
              {trendChartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.savings < 0
                      ? 'var(--fg-expense)'
                      : 'var(--mossy-400)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  )

  // ---------- COMPARE TAB ----------
  // 카테고리별 비교 (parent rowId로 그룹핑, 아이콘/색 동반)
  type CompareRow = {
    groupRowId: number
    name: string
    icon: string | null
    color: string | null
    now: number
    prev: number
  }
  const compareRows = useMemo<CompareRow[]>(() => {
    const byId = new Map<number, CompareRow>()

    const addBreakdown = (source: 'now' | 'prev', list: CategoryBreakdown[]) => {
      for (const c of list) {
        if (c.expenseType !== 'EXPENSE') continue
        const groupRowId = c.parentCategoryRowId ?? c.categoryRowId
        const groupName = c.parentCategoryName ?? c.categoryName
        let row = byId.get(groupRowId)
        if (!row) {
          const cat = categoryById.get(groupRowId)
          row = {
            groupRowId,
            name: groupName,
            icon: cat?.icon ?? null,
            color: cat?.color ?? null,
            now: 0,
            prev: 0,
          }
          byId.set(groupRowId, row)
        }
        row[source] += c.totalAmount
      }
    }

    addBreakdown('now', rangeQ.data?.categoryBreakdown ?? [])
    addBreakdown('prev', prevRangeQ.data?.categoryBreakdown ?? [])

    return Array.from(byId.values())
      .sort((a, b) => (b.now - a.now) || (b.prev - a.prev))
      .slice(0, 10)
  }, [rangeQ.data, prevRangeQ.data, categoryById])

  const totalNow = periodTotalExpense
  const totalPrev = prevRangeQ.data?.totalExpense ?? 0
  const momUp = totalNow >= totalPrev
  const maxCompareAmt = Math.max(1, ...compareRows.flatMap(r => [r.now, r.prev]))

  const periodNow = labels.now
  const periodPrev = labels.prev
  const momLabel = labels.mom
  const noPrevText = labels.noPrev

  const compareLoading = rangeQ.isLoading || prevRangeQ.isLoading

  const CompareSummary = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 6 }}>
          {periodNow} 지출
        </div>
        <div
          className="num"
          style={{ fontSize: mobile ? 18 : 22, fontWeight: 'var(--fw-heavy)', letterSpacing: 'var(--tracking-tight)' }}
        >
          <MaskAmount>{KRW(totalNow)}</MaskAmount>
          <HideUnit><span style={{ fontSize: 'var(--fs-body)', marginLeft: 2 }}>원</span></HideUnit>
        </div>
      </Card>
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 6 }}>
          {periodPrev} 지출
        </div>
        <div
          className="num"
          style={{
            fontSize: mobile ? 18 : 22,
            fontWeight: 'var(--fw-heavy)',
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--fg-secondary)',
          }}
        >
          <MaskAmount>{KRW(totalPrev)}</MaskAmount>
          <HideUnit><span style={{ fontSize: 'var(--fs-body)', marginLeft: 2 }}>원</span></HideUnit>
        </div>
      </Card>
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)', fontWeight: 'var(--fw-medium)', marginBottom: 6 }}>
          {momLabel}
        </div>
        <div
          className="num"
          style={{
            fontSize: mobile ? 18 : 22,
            fontWeight: 'var(--fw-heavy)',
            letterSpacing: 'var(--tracking-tight)',
            color: momUp ? 'var(--fg-expense)' : 'var(--fg-income)',
          }}
        >
          {totalPrev > 0 ? (
            <>
              {momUp ? '+' : '−'}
              {Math.abs(((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)}%
            </>
          ) : '—'}
        </div>
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
          {totalPrev > 0 ? (
            <>
              <MaskAmount>
                {momUp ? '+' : '−'}{KRW(Math.abs(totalNow - totalPrev))}
              </MaskAmount>
              <HideUnit>원</HideUnit>
            </>
          ) : noPrevText}
        </div>
      </Card>
    </div>
  )

  const CompareCategory = (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--fs-body-lg)' }}>카테고리별 {momLabel}</CardTitle>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 12,
            fontSize: 'var(--fs-micro)',
            color: 'var(--fg-tertiary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-2xs)', background: 'var(--bg-brand)' }} />
            {periodNow}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-2xs)', background: 'var(--border-brand-mid)' }} />
            {periodPrev}
          </span>
        </div>
      </CardHeader>
      {compareLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : compareRows.length === 0 ? (
        <EmptyBox text="비교할 데이터가 없습니다" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {compareRows.map(r => {
            const diff = r.now - r.prev
            const pct = r.prev > 0 ? (diff / r.prev) * 100 : 0
            const up = diff > 0
            const iconBg = r.color
              ? `oklch(from ${r.color} l c h / 0.12)`
              : 'var(--bg-brand-subtle)'
            const iconFg = r.color ?? 'var(--fg-brand-strong)'
            return (
              <div key={r.groupRowId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-tile)',
                      background: iconBg,
                      color: iconFg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderIcon(r.icon, r.name.charAt(0) || '•', 16)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semi)' }}>{r.name}</div>
                  </div>
                  <span className="num" style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)' }}>
                    <MaskAmount>{KRW(r.now)}</MaskAmount>
                    <HideUnit>원</HideUnit>
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--fs-caption)',
                      fontWeight: 'var(--fw-bold)',
                      minWidth: 56,
                      textAlign: 'right',
                      color: r.prev === 0
                        ? 'var(--fg-tertiary)'
                        : up
                          ? 'var(--fg-expense)'
                          : 'var(--fg-income)',
                    }}
                  >
                    {r.prev > 0 ? (
                      <>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%</>
                    ) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 42 }}>
                  <div style={{ position: 'relative', height: 10, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${(r.now / maxCompareAmt) * 100}%`,
                        background: 'var(--bg-brand)',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    />
                  </div>
                  <div style={{ position: 'relative', height: 6, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${(r.prev / maxCompareAmt) * 100}%`,
                        background: 'var(--bg-brand-muted)',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )

  const Content =
    tab === 'cat' ? (
      <>
        <div
          style={{
            display: mobile ? 'flex' : 'grid',
            flexDirection: 'column',
            gridTemplateColumns: mobile ? undefined : '1.4fr 1fr',
            gap: mobile ? 12 : 20,
            marginBottom: 20,
          }}
        >
          {DonutCard}
          {TopMerchantsCard}
        </div>
        <div style={{ marginBottom: 20 }}>{HeatmapCard}</div>
        {HighlightsGrid}
      </>
    ) : tab === 'trend' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 20 }}>
        {TrendBig}
        {TrendStats}
        {SavingsBars}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 20 }}>
        {CompareSummary}
        {CompareCategory}
      </div>
    )

  // Suppress unused warning if totalIncome isn't used elsewhere
  void totalIncome

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        {StatsTabs}
        {Content}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>통계·분석</h1>
          <div className="sub">카테고리·추이·인사이트</div>
        </div>
      </div>
      {StatsTabs}
      {Content}
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// RangePickerPopover — 트리거 없는 popover (parent 가 open 제어).
// react-day-picker mode='range' + 적용/취소 버튼.
// ───────────────────────────────────────────────────────────
function RangePickerPopover({
  initial,
  onCancel,
  onConfirm,
}: {
  initial: { from: Date; to: Date }
  onCancel: () => void
  onConfirm: (range: { from: Date; to: Date }) => void
}) {
  const [draft, setDraft] = useState<{ from?: Date; to?: Date }>(
    () => ({ from: initial.from, to: initial.to }),
  )
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel()
    }
    // mouseup 으로 등록 — 트리거 click 의 mouseup 과 충돌하지 않도록 microtask 후 등록
    const id = window.setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [onCancel])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-lg)',
        padding: 12,
        zIndex: 'var(--z-sticky)',
      } as React.CSSProperties}
    >
      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={{ from: draft.from, to: draft.to }}
        onSelect={(range) => setDraft({ from: range?.from, to: range?.to })}
        defaultMonth={draft.from ?? initial.from}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-semi)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'var(--fg-secondary)',
          }}
        >
          취소
        </button>
        <button
          disabled={!draft.from || !draft.to}
          onClick={() => {
            if (draft.from && draft.to) onConfirm({ from: draft.from, to: draft.to })
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            border: 0,
            background: !draft.from || !draft.to ? 'var(--bg-muted)' : 'var(--bg-brand)',
            color: !draft.from || !draft.to ? 'var(--fg-tertiary)' : 'var(--fg-on-brand)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-bold)',
            cursor: !draft.from || !draft.to ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          적용
        </button>
      </div>
    </div>
  )
}
