import { Fragment, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { MonthPicker, SegPicker } from '@/shared/ui/porest/primitives'
import { Donut } from '@/shared/ui/porest/charts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import {
  useMonthlySummary,
  useYearlySummary,
  useMerchantSummary,
  useExpenseHeatmap,
  useExpenseCategories,
} from '@/features/expense'
import type { CategoryBreakdown, HeatmapCell, ExpenseCategory } from '@/entities/expense'
import { renderIcon } from '@/shared/lib'

type OutletCtx = { mobile: boolean }
type TabKey = 'cat' | 'trend' | 'compare'
type PeriodKey = '1m' | '3m' | '1y'

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
  'var(--mossy-700)',
]

// 6-step heatmap palette (light → dark) based on mossy hue
const HEAT_PALETTE = [
  'oklch(0.96 0.01 145)',
  'oklch(0.90 0.04 145)',
  'oklch(0.82 0.07 145)',
  'oklch(0.70 0.10 145)',
  'oklch(0.58 0.12 145)',
  'oklch(0.44 0.13 145)',
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

const getCurrentYearMonth = () => {
  const now = new Date()
  return {
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

const prevYearMonth = (year: number, month: number) => {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

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
  const hidden = useHideAmounts()
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        padding: '10px 12px',
        fontSize: 12,
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-tertiary)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {rows.map(row => {
        const item = payload.find(p => p.dataKey === row.dataKey)
        if (!item) return null
        const v = Number(item.value ?? 0)
        const text = hidden ? '••••••' : row.format ? row.format(v) : `${KRW(v)}원`
        return (
          <div
            key={row.dataKey}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{row.label}</span>
            <span
              className="num"
              style={{
                marginLeft: 'auto',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--fg-primary)',
              }}
            >
              {text}
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
  const mask = (s: string | number, fallback = '••••••') => (hidden ? fallback : String(s))
  const initial = getCurrentYearMonth()
  const [tab, setTab] = useState<TabKey>('cat')
  const [period, setPeriod] = useState<PeriodKey>('1m')
  const [monthKey, setMonthKey] = useState<string>(initial.key)
  const [activeParentId, setActiveParentId] = useState<number | null>(null)

  // 기간·월·탭 변경 시 드릴다운 해제
  useEffect(() => setActiveParentId(null), [period, monthKey, tab])

  const [year, month] = monthKey.split('-').map(Number) as [number, number]
  const prev = prevYearMonth(year, month)

  const monthlyQ = useMonthlySummary(year, month)
  const prevMonthlyQ = useMonthlySummary(prev.year, prev.month)
  const yearlyQ = useYearlySummary(year)
  const prevYearlyQ = useYearlySummary(year - 1)
  const categoriesQ = useExpenseCategories()

  // Merchant summary over current month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDateObj = new Date(year, month, 0) // last day of month
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`
  const merchantQ = useMerchantSummary(startDate, endDate)
  const heatmapQ = useExpenseHeatmap(year, month)

  const categoryBreakdown: CategoryBreakdown[] = useMemo(
    () => monthlyQ.data?.categoryBreakdown ?? [],
    [monthlyQ.data],
  )
  const totalExpense = monthlyQ.data?.totalExpense ?? 0
  const totalIncome = monthlyQ.data?.totalIncome ?? 0

  // 기간 선택(월/분기/년)에 해당하는 실제 월 번호 목록
  const periodMonths = useMemo(() => {
    if (period === '1m') return [month]
    if (period === '3m') {
      const q = Math.ceil(month / 3)
      return [q * 3 - 2, q * 3 - 1, q * 3]
    }
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }, [period, month])

  // 카테고리 메타(rowId → 아이콘/색/이름) 룩업
  const categoryById = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    for (const c of categoriesQ.data ?? []) map.set(c.rowId, c)
    return map
  }, [categoriesQ.data])

  // 기간 범위의 leaf 카테고리 원본(필터·집계용)
  const periodBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const items: CategoryBreakdown[] = []
    const push = (list: CategoryBreakdown[]) => {
      for (const c of list) {
        if (c.expenseType !== 'EXPENSE') continue
        items.push(c)
      }
    }
    if (period === '1m') push(categoryBreakdown)
    else for (const m of yearlyQ.data?.monthlyAmounts ?? []) {
      if (periodMonths.includes(m.month)) push(m.categoryBreakdown)
    }
    return items
  }, [period, categoryBreakdown, yearlyQ.data, periodMonths])

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

  // 기간 총 지출 (하이라이트 · 도넛 센터용)
  const periodTotalExpense = useMemo(() => {
    if (period === '1m') return totalExpense
    let sum = 0
    for (const m of yearlyQ.data?.monthlyAmounts ?? []) {
      if (periodMonths.includes(m.month)) sum += m.totalExpense
    }
    return sum
  }, [period, totalExpense, yearlyQ.data, periodMonths])

  const donutLoading = period === '1m' ? monthlyQ.isLoading : yearlyQ.isLoading

  const periodLbl = period === '1m'
    ? `${month}월`
    : period === '3m'
      ? `${year}년 ${Math.ceil(month / 3)}분기`
      : `${year}년`

  const Tabs = (
    <div className="p-tabs" style={{ marginBottom: mobile ? 14 : 20 }}>
      {([
        { v: 'cat', l: '카테고리' },
        { v: 'trend', l: '추이' },
        { v: 'compare', l: '비교' },
      ] as { v: TabKey; l: string }[]).map(t => (
        <button
          key={t.v}
          type="button"
          className={`p-tab ${tab === t.v ? 'is-active' : ''}`}
          aria-selected={tab === t.v}
          onClick={() => setTab(t.v)}
        >
          {t.l}
        </button>
      ))}
    </div>
  )

  const PeriodSeg = (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <MonthPicker value={monthKey} onChange={setMonthKey} />
      <SegPicker
        options={[
          { value: '1m', label: '월' },
          { value: '3m', label: '분기' },
          { value: '1y', label: '년' },
        ]}
        value={period}
        onChange={setPeriod}
      />
    </div>
  )

  // ---------- LOADING / EMPTY HELPERS ----------
  const EmptyBox = ({ text }: { text: string }) => (
    <div
      style={{
        padding: '32px 0',
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 13,
      }}
    >
      {text}
    </div>
  )

  // ---------- CATEGORY TAB ----------
  const donutTotal = donutView.reduce((s, x) => s + x.amount, 0)
  const donutCenterLbl = isDrilled
    ? `${activeParent?.name ?? ''} 세부`
    : `${periodLbl} 지출`

  const DonutCard = (
    <div className="p-card" style={{ padding: mobile ? 18 : 24 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  fontSize: 14,
                  fontWeight: 500,
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                카테고리별 지출
              </button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}>›</span>
              <span>{activeParent?.name}</span>
            </>
          ) : (
            '카테고리별 지출'
          )}
        </h2>
        <div style={{ marginLeft: 'auto' }}>{PeriodSeg}</div>
      </div>
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
            <div className="val num" style={{ fontSize: 20 }}>
              {hidden ? '••••••' : `${KRW(donutTotal)}원`}
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
                    borderRadius: 8,
                    padding: clickable ? '4px 6px' : undefined,
                    margin: clickable ? '0 -6px' : undefined,
                    transition: 'background var(--dur-fast) var(--ease-standard)',
                  }}
                  onMouseEnter={clickable ? (e) => { e.currentTarget.style.background = 'var(--mist-100)' } : undefined}
                  onMouseLeave={clickable ? (e) => { e.currentTarget.style.background = 'transparent' } : undefined}
                  title={clickable ? '클릭하여 하위 카테고리 보기' : undefined}
                >
                  <span className="cat-legend__sw" style={{ background: colorFor(i) }} />
                  <span className="cat-legend__name">{s.name}</span>
                  <span className="cat-legend__pct num">
                    {donutTotal > 0 ? ((s.amount / donutTotal) * 100).toFixed(1) : '0.0'}%
                  </span>
                  <span className="cat-legend__amt num">{mask(KRW(s.amount), '••••')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const merchants = merchantQ.data?.merchants ?? []
  const topMerchants = merchants.slice(0, 5)
  const maxMerchantAmt = Math.max(1, ...topMerchants.map(m => m.totalAmount))

  const TopMerchantsCard = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>많이 쓴 가맹점 TOP 5</h2>
      </div>
      {merchantQ.isLoading ? (
        <EmptyBox text="불러오는 중…" />
      ) : topMerchants.length === 0 ? (
        <EmptyBox text="가맹점 데이터가 없습니다" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topMerchants.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 24,
                  fontSize: 12,
                  fontWeight: 700,
                  color: i < 3 ? 'var(--mossy-700)' : 'var(--fg-tertiary)',
                  textAlign: 'center',
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{m.merchant}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginLeft: 6 }}>
                    {m.count}회
                  </span>
                  <span className="num" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}>
                    {hidden ? '••••••' : `${KRW(m.totalAmount)}원`}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--mist-100)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(m.totalAmount / maxMerchantAmt) * 100}%`,
                      height: '100%',
                      background: colorFor(i),
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

  const heatColor = (value: number): string => {
    if (heatmapMax <= 0 || value <= 0) return HEAT_PALETTE[0]!
    // 6단계: ratio 0~1 → step 1~5 (0 단계는 빈 값)
    const ratio = value / heatmapMax
    const step = Math.min(5, Math.max(1, Math.ceil(ratio * 5)))
    return HEAT_PALETTE[step]!
  }

  /**
   * 셀 내부에 표시할 금액 약식
   *   0        → "—"
   *   < 10000  → "3천"   (천 단위)
   *   < 10만   → "1.2만"  (만 단위, 소수 1자리)
   *   >= 10만  → "12만"   (만 단위, 정수)
   */
  const shortAmount = (v: number): string => {
    if (v <= 0) return '—'
    if (v < 10_000) return `${Math.round(v / 1000)}천`
    if (v < 100_000) return `${(v / 10_000).toFixed(1)}만`
    return `${Math.round(v / 10_000)}만`
  }

  /**
   * 진한 배경(step >= 3) 에서는 텍스트를 흰색, 옅은 배경에서는 fg-primary.
   */
  const heatTextColor = (value: number): string => {
    if (heatmapMax <= 0 || value <= 0) return 'var(--fg-tertiary)'
    const ratio = value / heatmapMax
    const step = Math.min(5, Math.max(1, Math.ceil(ratio * 5)))
    return step >= 3 ? '#fff' : 'var(--fg-primary)'
  }

  const HeatmapCard = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 15 }}>요일·시간대 지출 패턴</h2>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 16 }}>
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
                background: 'var(--mist-100)',
                borderRadius: 8,
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
            fontSize: 13,
            background: 'var(--mist-100)',
            borderRadius: 12,
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
                  fontSize: 12,
                  fontWeight: 600,
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
                    fontSize: 12,
                    color: 'var(--fg-tertiary)',
                    lineHeight: 1.35,
                    paddingRight: 6,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--fg-primary)', fontSize: 13 }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {row.sub}
                  </div>
                </div>
                {HEAT_COLS.map((col, cIdx) => {
                  const value = heatmapMatrix[rIdx]?.[cIdx] ?? 0
                  const isPeak = value > 0 && value === heatmapMax
                  return (
                    <div
                      key={`${row.label}-${col.dow}`}
                      title={hidden ? `${row.label}·${col.label}` : `${row.label}·${col.label} ${KRW(value)}원`}
                      style={{
                        height: mobile ? 64 : 96,
                        borderRadius: 10,
                        background: heatColor(value),
                        border: isPeak
                          ? '2px solid var(--mossy-800)'
                          : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: mobile ? 12 : 15,
                        fontWeight: 700,
                        color: heatTextColor(value),
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'background var(--dur-med) var(--ease-decel)',
                      }}
                    >
                      {hidden && value > 0 ? '••' : shortAmount(value)}
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
              fontSize: 11,
              color: 'var(--fg-tertiary)',
            }}
          >
            <span>적음</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {HEAT_PALETTE.map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 10,
                    borderRadius: 2,
                    background: c,
                    border: '1px solid var(--border-subtle)',
                  }}
                />
              ))}
            </div>
            <span>많음</span>
            <span style={{ marginLeft: 'auto' }}>
              총 {hidden ? '••••••' : `${KRW(heatmapTotal)}원`}
            </span>
          </div>
        </>
      )}
    </div>
  )

  const topMerchant = topMerchants[0]
  const categoryTop = donutBreakdown[0]
  const daysInMonth = endDateObj.getDate()
  const prevTotalExpense = prevMonthlyQ.data?.totalExpense ?? 0
  const dayPct = prevTotalExpense > 0
    ? Math.round(((totalExpense - prevTotalExpense) / prevTotalExpense) * 100)
    : 0

  const avgLabel = period === '1m' ? '하루 평균' : '월 평균'
  const avgDivisor = period === '1m' ? daysInMonth : periodMonths.length
  const avgValue = avgDivisor > 0 ? Math.round(periodTotalExpense / avgDivisor) : 0
  const avgSub = period !== '1m'
    ? `${periodMonths.length}개월 합계 ${hidden ? '••••••' : `${KRW(periodTotalExpense)}원`}`
    : prevTotalExpense > 0
      ? `전월 대비 ${dayPct >= 0 ? '↑' : '↓'}${Math.abs(dayPct)}%`
      : '전월 비교 불가'

  const highlights = [
    {
      lbl: '가장 많이 쓴 카테고리',
      val: categoryTop?.name ?? '—',
      sub: categoryTop ? (hidden ? '••••••' : `${KRW(categoryTop.amount)}원`) : '데이터 없음',
    },
    {
      lbl: '가장 많이 쓴 가맹점',
      val: topMerchant?.merchant ?? '—',
      sub: topMerchant
        ? `${topMerchant.count}회 · ${hidden ? '••••••' : `${KRW(topMerchant.totalAmount)}원`}`
        : '데이터 없음',
    },
    {
      lbl: avgLabel,
      val: hidden ? '••••••' : `${KRW(avgValue)}원`,
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
        <div key={i} className="p-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 10 }}>
            {h.lbl}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{h.val}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>{h.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )

  // ---------- TREND TAB ----------
  const monthlyAmounts = useMemo(
    () => yearlyQ.data?.monthlyAmounts ?? [],
    [yearlyQ.data],
  )
  // 기간 선택에 따라 필터링된 월들 (월별 정렬)
  const trendMonths = useMemo(
    () =>
      monthlyAmounts
        .filter(m => periodMonths.includes(m.month))
        .slice()
        .sort((a, b) => a.month - b.month),
    [monthlyAmounts, periodMonths],
  )
  const trendChartData = useMemo(
    () =>
      trendMonths.map(m => ({
        month: `${String(m.month).padStart(2, '0')}월`,
        income: m.totalIncome,
        expense: m.totalExpense,
        savings: m.totalIncome - m.totalExpense,
      })),
    [trendMonths],
  )

  const sumIn = trendMonths.reduce((s, m) => s + m.totalIncome, 0)
  const sumOut = trendMonths.reduce((s, m) => s + m.totalExpense, 0)
  const n = Math.max(1, trendMonths.length)
  const avgIn = sumIn / n
  const avgOut = sumOut / n
  const avgSave = avgIn - avgOut
  const isSingle = period === '1m'
  const statLabelIn = isSingle ? '수입' : '평균 수입'
  const statLabelOut = isSingle ? '지출' : '평균 지출'
  const statLabelSave = isSingle ? '순저축' : '평균 저축'

  const trendChartConfig: ChartConfig = {
    income: { label: '수입', color: 'var(--mossy-500)' },
    expense: { label: '지출', color: 'var(--berry-500)' },
  }
  const savingsChartConfig: ChartConfig = {
    savings: { label: '순저축', color: 'var(--mossy-600)' },
  }

  const fmtTick = (v: number) =>
    v >= 100_000_000
      ? `${(v / 100_000_000).toFixed(1)}억`
      : v >= 10_000
        ? `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
        : v.toLocaleString('ko-KR')

  const TrendBig = (
    <div className="p-card" style={{ padding: mobile ? 18 : 24 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>{periodLbl} 수입·지출 추이</h2>
        <div style={{ marginLeft: 'auto' }}>{PeriodSeg}</div>
      </div>
      {yearlyQ.isLoading ? (
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
              <CartesianGrid vertical={false} stroke="var(--mist-200)" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
                tickFormatter={fmtTick}
                width={52}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--fg-tertiary)', strokeDasharray: '3 3' }}
                content={
                  <PorestChartTooltip
                    rows={[
                      { dataKey: 'income', label: '수입', color: 'var(--mossy-500)' },
                      { dataKey: 'expense', label: '지출', color: 'var(--berry-500)' },
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                fill="url(#trendIncomeFill)"
                dot={{ fill: 'var(--color-income)', stroke: 'var(--bg-surface)', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
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
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--fg-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--mossy-500)' }} /> 수입
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--berry-500)' }} /> 지출
            </span>
          </div>
        </>
      )}
    </div>
  )

  const TrendStats = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {[
        { lbl: statLabelIn, val: hidden ? '••••••' : KRW(Math.round(avgIn)) + '원' },
        { lbl: statLabelOut, val: hidden ? '••••••' : KRW(Math.round(avgOut)) + '원' },
        { lbl: statLabelSave, val: hidden ? '••••••' : KRW(Math.round(avgSave)) + '원' },
        { lbl: '저축률', val: avgIn > 0 ? ((avgSave / avgIn) * 100).toFixed(1) + '%' : '—' },
      ].map((s, i) => (
        <div key={i} className="p-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6 }}>
            {s.lbl}
          </div>
          <div
            className="num"
            style={{ fontSize: mobile ? 16 : 18, fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            {s.val}
          </div>
        </div>
      ))}
    </div>
  )

  const SavingsBars = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>월별 순저축</h2>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>수입 − 지출</span>
      </div>
      {yearlyQ.isLoading ? (
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
            <CartesianGrid vertical={false} stroke="var(--mist-200)" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--mist-500)' }}
              tickFormatter={fmtTick}
              width={52}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--mossy-500)', fillOpacity: 0.05 }}
              content={
                <PorestChartTooltip
                  rows={[
                    {
                      dataKey: 'savings',
                      label: '순저축',
                      color: 'var(--mossy-600)',
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
                      ? 'var(--berry-400)'
                      : d.month === `${month}월`
                        ? 'var(--mossy-700)'
                        : 'var(--mossy-400)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  )

  // ---------- COMPARE TAB ----------
  // 현재 기간과 비교(이전 기간)의 년/월 범위 계산
  const prevPeriod = useMemo<{ year: number; months: number[] }>(() => {
    if (period === '1m') return { year: prev.year, months: [prev.month] }
    if (period === '3m') {
      const q = Math.ceil(month / 3)
      if (q === 1) return { year: year - 1, months: [10, 11, 12] }
      const pq = q - 1
      return { year, months: [pq * 3 - 2, pq * 3 - 1, pq * 3] }
    }
    return { year: year - 1, months: Array.from({ length: 12 }, (_, i) => i + 1) }
  }, [period, year, month, prev])

  const prevPeriodYearly = prevPeriod.year === year ? yearlyQ.data : prevYearlyQ.data

  // 이전 기간 총 지출
  const prevPeriodTotal = useMemo(() => {
    if (period === '1m') return prevMonthlyQ.data?.totalExpense ?? 0
    let total = 0
    for (const m of prevPeriodYearly?.monthlyAmounts ?? []) {
      if (prevPeriod.months.includes(m.month)) total += m.totalExpense
    }
    return total
  }, [period, prevMonthlyQ.data, prevPeriodYearly, prevPeriod])

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

    // 현재 기간
    if (period === '1m') {
      addBreakdown('now', monthlyQ.data?.categoryBreakdown ?? [])
    } else {
      for (const m of yearlyQ.data?.monthlyAmounts ?? []) {
        if (periodMonths.includes(m.month)) addBreakdown('now', m.categoryBreakdown)
      }
    }

    // 이전 기간
    if (period === '1m') {
      addBreakdown('prev', prevMonthlyQ.data?.categoryBreakdown ?? [])
    } else {
      for (const m of prevPeriodYearly?.monthlyAmounts ?? []) {
        if (prevPeriod.months.includes(m.month)) addBreakdown('prev', m.categoryBreakdown)
      }
    }

    return Array.from(byId.values())
      .sort((a, b) => (b.now - a.now) || (b.prev - a.prev))
      .slice(0, 10)
  }, [period, monthlyQ.data, prevMonthlyQ.data, yearlyQ.data, prevPeriodYearly, periodMonths, prevPeriod, categoryById])

  const totalNow = periodTotalExpense
  const totalPrev = prevPeriodTotal
  const momUp = totalNow >= totalPrev
  const maxCompareAmt = Math.max(1, ...compareRows.flatMap(r => [r.now, r.prev]))

  const periodNow = period === '1m' ? '이번 달' : period === '3m' ? '이번 분기' : '이번 해'
  const periodPrev = period === '1m' ? '지난 달' : period === '3m' ? '지난 분기' : '지난 해'
  const momLabel = period === '1m' ? '전월 대비' : period === '3m' ? '전분기 대비' : '전년 대비'
  const noPrevText = period === '1m' ? '전월 데이터 없음' : period === '3m' ? '전분기 데이터 없음' : '전년 데이터 없음'

  const compareLoading = period === '1m'
    ? (monthlyQ.isLoading || prevMonthlyQ.isLoading)
    : (yearlyQ.isLoading || (prevPeriod.year !== year && prevYearlyQ.isLoading))

  const CompareSummary = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      <div className="p-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6 }}>
          {periodNow} 지출
        </div>
        <div
          className="num"
          style={{ fontSize: mobile ? 18 : 22, fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          {hidden ? (
            '••••••'
          ) : (
            <>
              {KRW(totalNow)}
              <span style={{ fontSize: 14, marginLeft: 2 }}>원</span>
            </>
          )}
        </div>
      </div>
      <div className="p-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6 }}>
          {periodPrev} 지출
        </div>
        <div
          className="num"
          style={{
            fontSize: mobile ? 18 : 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--fg-secondary)',
          }}
        >
          {hidden ? (
            '••••••'
          ) : (
            <>
              {KRW(totalPrev)}
              <span style={{ fontSize: 14, marginLeft: 2 }}>원</span>
            </>
          )}
        </div>
      </div>
      <div className="p-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6 }}>
          {momLabel}
        </div>
        <div
          className="num"
          style={{
            fontSize: mobile ? 18 : 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: momUp ? 'var(--berry-700)' : 'var(--mossy-700)',
          }}
        >
          {totalPrev > 0 ? (
            <>
              {momUp ? '+' : '−'}
              {Math.abs(((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)}%
            </>
          ) : '—'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 4 }}>
          {totalPrev > 0 ? (
            hidden ? (
              '••••••'
            ) : (
              <>
                {momUp ? '+' : '−'}
                {KRW(Math.abs(totalNow - totalPrev))}원
              </>
            )
          ) : noPrevText}
        </div>
      </div>
    </div>
  )

  const CompareCategory = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>카테고리별 {momLabel}</h2>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 12,
            fontSize: 11,
            color: 'var(--fg-tertiary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--mossy-600)' }} />
            {periodNow}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--mossy-300)' }} />
            {periodPrev}
          </span>
        </div>
      </div>
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
                      borderRadius: 10,
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
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                  </div>
                  <span className="num" style={{ fontSize: 13, fontWeight: 700 }}>
                    {hidden ? '••••••' : `${KRW(r.now)}원`}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      minWidth: 56,
                      textAlign: 'right',
                      color: r.prev === 0
                        ? 'var(--fg-tertiary)'
                        : up
                          ? 'var(--berry-700)'
                          : 'var(--mossy-700)',
                    }}
                  >
                    {r.prev > 0 ? (
                      <>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%</>
                    ) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 42 }}>
                  <div style={{ position: 'relative', height: 10, background: 'var(--bg-subtle)', borderRadius: 999 }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${(r.now / maxCompareAmt) * 100}%`,
                        background: 'var(--mossy-600)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div style={{ position: 'relative', height: 6, background: 'var(--bg-subtle)', borderRadius: 999 }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${(r.prev / maxCompareAmt) * 100}%`,
                        background: 'var(--mossy-200)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
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
        {Tabs}
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
      {Tabs}
      {Content}
    </div>
  )
}
