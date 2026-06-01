import { Fragment, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { KRW, formatChartAxis } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Donut } from '@/shared/ui/porest/charts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { CalendarClock, ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import {
  useRangeSummary,
  useMerchantSummary,
  useExpenseHeatmap,
  useExpenseCategories,
  useExpenses,
} from '@/features/expense'
import type { CategoryBreakdown, HeatmapCell, ExpenseCategory } from '@/entities/expense'
import { renderIcon, tileRadius } from '@/shared/lib'

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

// porest chart palette 10색 — 카테고리 donut fallback (카테고리 자체 색 없을 때만 사용).
// `--color-cat-*` alias — 라이트/다크 자동 swap.
const DONUT_COLORS = [
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

// 카테고리 자체 색 1순위 + 인덱스 fallback. 앱 `_donutColor` 정합.
const segmentColor = (idx: number, rawColor: string | null | undefined) => {
  if (rawColor && rawColor.trim() !== '') return getPaletteByColor(rawColor).color
  return colorFor(idx)
}

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
        fontSize: 'var(--text-caption)',
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-badge)',
          color: 'var(--fg-tertiary)',
          fontWeight: '600',
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
                borderRadius: 'var(--radius-xs)',
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)' }}>{row.label}</span>
            <span
              className="num"
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--text-label-sm)',
                fontWeight: '700',
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

/** Stats 페이지 구조에 맞춘 skeleton — 탭별로 다른 컨텐츠. */
function StatsPageSkeleton({ mobile, tab }: { mobile: boolean; tab: TabKey }) {
  const Tabs = (
    <div
      style={{
        display: 'flex',
        gap: 16,
        marginBottom: mobile ? 0 : 20,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {[0, 1, 2].map(i => (
        <SkeletonBase
          key={i}
          className={mobile ? 'h-8 flex-1' : 'h-8 w-20'}
        />
      ))}
    </div>
  )

  const CategorySkeleton = (
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
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <SkeletonBase className="h-5 w-32" />
            <SkeletonBase className="h-8 w-40" />
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: 'flex',
                flexDirection: mobile ? 'column' : 'row',
                gap: mobile ? 20 : 32,
                alignItems: 'center',
              }}
            >
              <SkeletonBase
                className={
                  mobile
                    ? 'h-[180px] w-[180px] rounded-full shrink-0'
                    : 'h-[200px] w-[200px] rounded-full shrink-0'
                }
              />
              <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2, 3, 4].map(i => (
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
        <Card style={{ height: '100%' }}>
          <CardHeader>
            <SkeletonBase className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <SkeletonBase className="h-6 w-6" />
                  <div style={{ flex: 1 }}>
                    <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                    <SkeletonBase className="h-1 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div style={{ marginBottom: 20 }}>
        <Card>
          <CardHeader>
            <SkeletonBase className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <SkeletonBase className="h-3 w-2/3 mb-3" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: mobile ? 6 : 8,
              }}
            >
              {Array.from({ length: 56 }).map((_, i) => (
                <SkeletonBase key={i} className="h-7 w-full rounded-sm" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {[0, 1, 2].map(i => (
          <Card key={i}>
            <CardContent>
              <SkeletonBase className="h-3 w-24 mb-3" />
              <SkeletonBase className="h-5 w-32 mb-1.5" />
              <SkeletonBase className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )

  const TrendSkeleton = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 20 }}>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <SkeletonBase className="h-5 w-44" />
          <SkeletonBase className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <SkeletonBase className={mobile ? 'h-[200px] w-full' : 'h-[260px] w-full'} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <SkeletonBase className="h-3 w-12" />
            <SkeletonBase className="h-3 w-12" />
          </div>
        </CardContent>
      </Card>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {[0, 1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent>
              <SkeletonBase className="h-3 w-16 mb-2" />
              <SkeletonBase className={mobile ? 'h-5 w-24' : 'h-6 w-28'} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <SkeletonBase className="h-5 w-28" />
          <SkeletonBase className="h-3 w-24" />
        </CardHeader>
        <CardContent>
          <SkeletonBase className={mobile ? 'h-[180px] w-full' : 'h-[220px] w-full'} />
        </CardContent>
      </Card>
    </div>
  )

  const CompareSkeleton = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {[0, 1, 2].map(i => (
          <Card key={i}>
            <CardContent>
              {/* 라벨 위 / 금액 아래 — App _CompareCard 미러 정합 */}
              <SkeletonBase className="h-3 w-20 mb-2" />
              <SkeletonBase className={mobile ? 'h-7 w-32' : 'h-9 w-40'} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <SkeletonBase className="h-5 w-44" />
          <SkeletonBase className="h-3 w-40" />
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                  <SkeletonBase className="h-4 flex-1" />
                  <SkeletonBase className="h-4 w-20 shrink-0" />
                </div>
                <div style={{ paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SkeletonBase className="h-2.5 w-full rounded-full" />
                  <SkeletonBase className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const Content = tab === 'cat' ? CategorySkeleton : tab === 'trend' ? TrendSkeleton : CompareSkeleton

  if (mobile) {
    // 탭은 화면 가로 전체 + bg-surface 띠 (모바일 앱과 매칭, header 바로 아래 sticky).
    // Content 만 page-edge padding(좌우 20, 상하 24) 적용.
    return (
      <div>
        <div style={{ background: 'var(--bg-surface)' }}>{Tabs}</div>
        <div style={{ padding: 'var(--spacing-xl) 20px' }}>{Content}</div>
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
  // 이전 동등 기간 — 비교 탭(전 기간 비교) 또는 월 모드(하루 평균 전월 대비)에서 필요.
  // 그 외 탭/모드에선 빈 인자로 query disabled.
  const needPrev = tab === 'compare' || period.segMode === 'm'
  const prevRangeQ = useRangeSummary(needPrev ? prevStart : '', needPrev ? prevEnd : '')
  const categoriesQ = useExpenseCategories()
  const merchantQ = useMerchantSummary(startDate, endDate)
  // 추이 탭 'month' 모드에서 일별 시리즈를 그리려면 해당 기간의 raw 거래 목록이 필요.
  const monthExpensesQ = useExpenses({ startDate, endDate })
  const heatmapQ = useExpenseHeatmap(startDate, endDate)

  // 첫 진입 시 모든 데이터가 도착할 때까지 한 번만 skeleton — 이후 기간/탭 변경은 부분 로딩 표시.
  const initialLoading =
    rangeQ.isLoading || categoriesQ.isLoading || merchantQ.isLoading
    || monthExpensesQ.isLoading || heatmapQ.isLoading
    || (needPrev && prevRangeQ.isLoading)
  const [hasEverLoaded, setHasEverLoaded] = useState(false)
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중에 동기 set (React 권장 패턴).
  if (!initialLoading && !hasEverLoaded) setHasEverLoaded(true)
  const shouldShowSkeleton = initialLoading && !hasEverLoaded

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
      style={{ marginBottom: mobile ? 0 : 20 }}
    >
      {/* 모바일에선 탭이 전체 폭을 균등 분할 — 플러터 앱과 매칭 */}
      <TabsList variant="underline" className={mobile ? 'w-full' : undefined}>
        {([
          { v: 'cat', l: '카테고리' },
          { v: 'trend', l: '추이' },
          { v: 'compare', l: '비교' },
        ] as { v: TabKey; l: string }[]).map(t => (
          <TabsTrigger
            key={t.v}
            value={t.v}
            variant="underline"
            className={mobile ? 'flex-1' : undefined}
          >
            {t.l}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  // 가계부 FilterDialog 패턴 정합 — 작은 trigger button (Calendar icon + periodLabel +
  // chevron). 클릭 시 RangePickerSheet 열림 — 안에서 ToggleGroup(월/분기/년/직접) + range
  // 모두 선택. SelectedRangeCard 외부 표시 제거 (trigger label 에 통합).
  const PeriodSeg = (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 'var(--spacing-xs) var(--spacing-md)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          fontSize: 'var(--text-body-sm)',
          fontWeight: '500',
          color: 'var(--fg-primary)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <CalendarClock size={14} style={{ color: 'var(--fg-secondary)' }} />
        {/* custom + 다른 year 시 'YYYY-MM-DD ~ YYYY-MM-DD' 너무 길어 wrap. ~ 다음에서 명시 break. */}
        <span style={{ whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.3 }}>
          {period.segMode === 'custom' && period.from.getFullYear() !== period.to.getFullYear()
            ? `${fmt(period.from)} ~\n${fmt(period.to)}`
            : periodLabel(period)}
        </span>
        <ChevronDown size={12} style={{ color: 'var(--fg-tertiary)' }} />
      </button>
      {pickerOpen && (
        <RangePickerSheet
          mobile={mobile}
          initial={period}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(r) => {
            setPeriod(r)
            setPickerOpen(false)
          }}
        />
      )}
    </>
  )

  // '직접' 활성 시 segment 아래에 표시되는 선택 기간 카드.
  // ---------- LOADING / EMPTY HELPERS ----------
  const EmptyBox = ({ text }: { text: string }) => (
    <div
      style={{
        padding: '32px 0',
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 'var(--text-label-sm)',
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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: '500',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                카테고리별 지출
              </button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}>›</span>
              <span>{activeParent?.name}</span>
            </>
          ) : (
            '카테고리별 지출'
          )}
        </CardTitle>
        {PeriodSeg}
      </CardHeader>
      <CardContent>
      {donutLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 20 : 32,
            alignItems: 'center',
          }}
        >
          <SkeletonBase
            className={mobile ? 'h-[180px] w-[180px] rounded-full shrink-0' : 'h-[200px] w-[200px] rounded-full shrink-0'}
          />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SkeletonBase className="h-2.5 w-2.5 rounded-full shrink-0" />
                <SkeletonBase className="h-3 flex-1" />
                <SkeletonBase className="h-3 w-10 shrink-0" />
                <SkeletonBase className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
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
            segments={donutView.map((s, i) => ({ value: s.amount, color: segmentColor(i, s.color) }))}
            size={mobile ? 180 : 200}
            stroke={28}
          >
            <div className="lbl">{donutCenterLbl}</div>
            <div className="val num" style={{ fontSize: 'var(--text-title-lg)' }}>
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
                    transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
                  }}
                  onMouseEnter={clickable ? (e) => { e.currentTarget.style.background = 'var(--bg-muted)' } : undefined}
                  onMouseLeave={clickable ? (e) => { e.currentTarget.style.background = 'transparent' } : undefined}
                  title={clickable ? '클릭하여 하위 카테고리 보기' : undefined}
                >
                  <span className="cat-legend__sw" style={{ background: segmentColor(i, s.color) }} />
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
      </CardContent>
    </Card>
  )

  const merchants = merchantQ.data?.merchants ?? []
  const topMerchants = merchants.slice(0, 5)
  const maxMerchantAmt = Math.max(1, ...topMerchants.map(m => m.totalAmount))

  const TopMerchantsCard = (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>많이 쓴 가맹점 TOP 5</CardTitle>
      </CardHeader>
      <CardContent>
      {merchantQ.isLoading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonBase className="h-4 w-6 shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <SkeletonBase className="h-4 w-1/3" />
                  <SkeletonBase className="h-3 w-10 ml-auto" />
                </div>
                <SkeletonBase className="h-1 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
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
                  fontSize: 'var(--text-caption)',
                  fontWeight: '700',
                  color: i < 3 ? 'var(--fg-income)' : 'var(--fg-tertiary)',
                  textAlign: 'center',
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{m.merchant}</span>
                  <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginLeft: 6 }}>
                    {m.count}회
                  </span>
                  <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
                    <MaskAmount>{KRW(m.totalAmount)}</MaskAmount>
                    <HideUnit>원</HideUnit>
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'var(--bg-sunken)',
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
      </CardContent>
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
    <Card>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>요일·시간대 지출 패턴</CardTitle>
      </CardHeader>
      <CardContent>
      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginBottom: 16 }}>
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
                background: 'var(--bg-sunken)',
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
            fontSize: 'var(--text-label-sm)',
            background: 'var(--bg-sunken)',
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
                  fontSize: 'var(--text-caption)',
                  fontWeight: '600',
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
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-tertiary)',
                    lineHeight: '1.3',
                    paddingRight: 6,
                  }}
                >
                  <div style={{ fontWeight: '700', color: 'var(--fg-primary)', fontSize: 'var(--text-label-sm)' }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
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
                        fontWeight: '700',
                        color: pal.fg,
                        fontVariantNumeric: 'tabular-nums',
                        boxShadow: isPeak
                          ? '0 0 0 2px var(--fg-brand-strong), 0 0 0 4px color-mix(in srgb, var(--fg-brand-strong) 25%, transparent)'
                          : 'none',
                        transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
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
              fontSize: 'var(--text-badge)',
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
                    borderRadius: 'var(--radius-xs)',
                    background: c.bg,
                    border: '1px solid var(--border-subtle)',
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
      </CardContent>
    </Card>
  )

  const topMerchant = topMerchants[0]
  const categoryTop = donutBreakdown[0]
  // 가맹점 대표 카테고리 — 원시 거래에서 해당 가맹점의 지배적(최다 지출) 카테고리 역산
  const topMerchantCat = useMemo(() => {
    const mName = topMerchant?.merchant
    if (!mName) return null
    const byCat = new Map<number, { amount: number; icon: string | null; color: string | null }>()
    for (const e of monthExpensesQ.data ?? []) {
      if (e.merchant !== mName || e.expenseType !== 'EXPENSE') continue
      const prev = byCat.get(e.categoryRowId)
      if (prev) {
        prev.amount += e.amount
      } else {
        const cat = categoryById.get(e.categoryRowId)
        byCat.set(e.categoryRowId, {
          amount: e.amount,
          icon: e.categoryIcon ?? cat?.icon ?? null,
          color: e.categoryColor ?? cat?.color ?? null,
        })
      }
    }
    let best: { amount: number; icon: string | null; color: string | null } | null = null
    for (const v of byCat.values()) if (!best || v.amount > best.amount) best = v
    return best
  }, [topMerchant, monthExpensesQ.data, categoryById])
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
  // 증감 색상: 지출 증가=fg-expense / 감소=fg-income (compare 탭 동일 컨벤션)
  const avgSub: React.ReactNode = period.segMode !== 'm'
    ? <>{rangeDays}일 합계 <MaskAmount>{KRW(periodTotalExpense)}</MaskAmount><HideUnit>원</HideUnit></>
    : prevTotalExpense > 0
      ? <>전월 대비 <span style={{ color: dayPct >= 0 ? 'var(--fg-expense)' : 'var(--fg-income)', fontWeight: 600 }}>{dayPct >= 0 ? '↑' : '↓'}{Math.abs(dayPct)}%</span></>
      : prevRangeQ.isLoading
        ? '전월 대비 계산 중…'
        : '전월 비교 불가'

  const highlights: {
    lbl: string
    val: React.ReactNode
    sub: React.ReactNode
    icon: string | null
    color: string | null
    fallback: string
  }[] = [
    {
      lbl: '가장 많이 쓴 카테고리',
      val: categoryTop?.name ?? '—',
      sub: categoryTop
        ? <><MaskAmount>{KRW(categoryTop.amount)}</MaskAmount><HideUnit>원</HideUnit></>
        : '데이터 없음',
      icon: categoryTop?.icon ?? null,
      color: categoryTop?.color ?? null,
      fallback: categoryTop?.name?.charAt(0) || '•',
    },
    {
      lbl: '가장 많이 쓴 가맹점',
      val: topMerchant?.merchant ?? '—',
      sub: topMerchant
        ? <>{topMerchant.count}회 · <MaskAmount>{KRW(topMerchant.totalAmount)}</MaskAmount><HideUnit>원</HideUnit></>
        : '데이터 없음',
      // 가맹점이 속한 대표 카테고리 아이콘(역산), 없으면 상점 아이콘 + brand-subtle 타일
      icon: topMerchantCat?.icon ?? 'store',
      color: topMerchantCat?.color ?? null,
      fallback: topMerchant?.merchant?.charAt(0) || '•',
    },
    {
      lbl: avgLabel,
      val: <><MaskAmount>{KRW(avgValue)}</MaskAmount><HideUnit>원</HideUnit></>,
      sub: avgSub,
      icon: 'calendar-days',
      color: null,
      fallback: '∅',
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
      {highlights.map((h, i) => {
        // 카테고리 색은 dark 자동 swap 헬퍼, 메타 없는 카드(가맹점/평균)는 brand-subtle
        const pal = h.color ? getPaletteByColor(h.color) : null
        const iconBg = pal ? pal.bg : 'var(--bg-brand-subtle)'
        const iconFg = pal ? pal.color : 'var(--fg-brand-strong)'
        return (
          <Card key={i}>
            <CardContent>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 10 }}>
                {h.lbl}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-tile)',
                    background: iconBg,
                    color: iconFg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {renderIcon(h.icon, h.fallback, 18)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.val}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{h.sub}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
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
    // 모든 버킷이 같은 해면 'MM' 만 (년 prefix 생략) — 년/단일년도 사용자기간
    const allSameYear =
      monthlyBuckets.length > 0 &&
      monthlyBuckets.every(b => b.year === monthlyBuckets[0]!.year)
    return monthlyBuckets.map(b => ({
      month: allSameYear
        ? String(b.month).padStart(2, '0')
        : `${b.year}.${String(b.month).padStart(2, '0')}`,
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

  // shared formatChartAxis — 음수 분기 + 100만 단위 round (예: -5,200만).
  const fmtTick = formatChartAxis

  const TrendBig = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>수입·지출 추이</CardTitle>
        {PeriodSeg}
      </CardHeader>
      <CardContent>
      {rangeQ.isLoading ? (
        <>
          <SkeletonBase
            className="w-full rounded-lg"
            style={{ height: mobile ? 200 : 260 }}
          />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <SkeletonBase className="h-3 w-12" />
            <SkeletonBase className="h-3 w-12" />
          </div>
        </>
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
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={mobile ? 16 : 24}
              />
              {/* 좌축: 수입 */}
              <YAxis
                yAxisId="income"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--color-income)' }}
                tickFormatter={fmtTick}
                width={52}
              />
              {/* 우축: 지출 */}
              <YAxis
                yAxisId="expense"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--color-expense)' }}
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
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--border-brand)' }} /> 수입
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--fg-expense)' }} /> 지출
            </span>
          </div>
        </>
      )}
      </CardContent>
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
        <Card key={i}>
          <CardContent>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 6 }}>
              {s.lbl}
            </div>
            <div
              className="num"
              style={{ fontSize: mobile ? 16 : 18, fontWeight: '800', letterSpacing: '-0.022em' }}
            >
              {s.val}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const SavingsBars = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{useDailyTrend ? '일별 순저축' : '월별 순저축'}</CardTitle>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>수입 − 지출</span>
      </CardHeader>
      <CardContent>
      {rangeQ.isLoading ? (
        <SkeletonBase
          className="w-full rounded-lg"
          style={{ height: mobile ? 180 : 220 }}
        />
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
              tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={mobile ? 16 : 24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
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
                      : 'var(--fg-income)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      </CardContent>
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
      {/* App _CompareCard 미러: 좌측 정렬 + 라벨 위(caption+tertiary+medium) + 금액 아래(h3+bold). */}
      <Card>
        <CardContent>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 8 }}>
            {periodNow} 지출
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-title-md)',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: 'var(--fg-primary)',
            }}
          >
            <MaskAmount>{KRW(totalNow)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 8 }}>
            {periodPrev} 지출
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-title-md)',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: 'var(--fg-secondary)',
            }}
          >
            <MaskAmount>{KRW(totalPrev)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 8 }}>
            {momLabel}
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-title-md)',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: totalPrev > 0
                ? (momUp ? 'var(--fg-expense)' : 'var(--fg-income)')
                : 'var(--fg-primary)',
            }}
          >
            {totalPrev > 0 ? (
              <>
                {momUp ? '+' : '−'}
                {Math.abs(((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)}%
              </>
            ) : '—'}
          </div>
          {totalPrev > 0 && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
              <MaskAmount>
                {momUp ? '+' : '−'}{KRW(Math.abs(totalNow - totalPrev))}
              </MaskAmount>
              <HideUnit>원</HideUnit>
            </div>
          )}
          {totalPrev === 0 && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
              {noPrevText}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const CompareCategory = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>카테고리별 {momLabel}</CardTitle>
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--bg-brand)' }} />
            {periodNow}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--border-brand-mid)' }} />
            {periodPrev}
          </span>
        </div>
      </CardHeader>
      <CardContent>
      {compareLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <SkeletonBase className="h-4 flex-1" />
                <SkeletonBase className="h-4 w-20 shrink-0" />
                <SkeletonBase className="h-3 w-12 shrink-0" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 42 }}>
                <SkeletonBase className="h-2.5 w-full rounded-full" />
                <SkeletonBase className="h-1.5 w-2/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
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
                      borderRadius: tileRadius(32),
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
                    <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{r.name}</div>
                  </div>
                  <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
                    <MaskAmount>{KRW(r.now)}</MaskAmount>
                    <HideUnit>원</HideUnit>
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-caption)',
                      fontWeight: '700',
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
      </CardContent>
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

  if (shouldShowSkeleton) return <StatsPageSkeleton mobile={mobile} tab={tab} />

  if (mobile) {
    // 탭은 화면 가로 전체 + bg-surface 띠 (모바일 앱과 매칭, header 바로 아래 sticky).
    // Content 만 page-edge padding(좌우 20, 상하 24) 적용.
    return (
      <div>
        <div style={{ background: 'var(--bg-surface)' }}>
          {StatsTabs}
        </div>
        <div style={{ padding: 'var(--spacing-xl) 20px' }}>{Content}</div>
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
// RangePickerSheet — 직접 기간 선택 모달.
// - quick chip: 최근 7일/30일/3개월/6개월/1년 (클릭 시 from/to 자동 set)
// - 시작 / 종료 InputDatePicker (수동 조정 가능)
// - 적용 버튼: 확정 후 confirm
// ───────────────────────────────────────────────────────────
const QUICK_RANGES: { label: string; days: number }[] = [
  { label: '최근 7일', days: 7 },
  { label: '최근 30일', days: 30 },
  { label: '최근 3개월', days: 90 },
  { label: '최근 6개월', days: 180 },
  { label: '최근 1년', days: 365 },
]

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromISODate = (s: string | undefined): Date | undefined => {
  if (!s) return undefined
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function RangePickerSheet({
  mobile,
  initial,
  onCancel,
  onConfirm,
}: {
  mobile: boolean
  initial: RangeState
  onCancel: () => void
  onConfirm: (range: RangeState) => void
}) {
  const [segMode, setSegMode] = useState<SegMode>(initial.segMode)
  const [from, setFrom] = useState<Date>(initial.from)
  const [to, setTo] = useState<Date>(initial.to)
  const canApply = from.getTime() <= to.getTime()

  // segMode 변경 시 — 월/분기/년 의 from/to 자동 계산 (이번 month/quarter/year)
  // custom 은 기존 from/to 유지.
  const setSeg = (v: SegMode) => {
    setSegMode(v)
    const now = new Date()
    if (v === 'm') { const r = monthRangeOf(now); setFrom(r.from); setTo(r.to) }
    else if (v === 'q') { const r = quarterRangeOf(now); setFrom(r.from); setTo(r.to) }
    else if (v === 'y') { const r = yearRangeOf(now); setFrom(r.from); setTo(r.to) }
  }

  const applyQuick = (days: number) => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - days + 1)
    setFrom(start)
    setTo(today)
    setSegMode('custom')
  }

  // 가계부 FilterDialog 패턴 정합 — 상단 ToggleGroup (월/분기/년/직접) + 항상 date range
  // + custom 시만 quick chips (최근 N일/N개월) 표시.
  const formBody = (
    <>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <ToggleGroup
          type="single"
          variant="segmented"
          value={segMode}
          onValueChange={(v) => { if (v) setSeg(v as SegMode) }}
          className="w-full"
        >
          <ToggleGroupItem value="m" className="flex-1">월</ToggleGroupItem>
          <ToggleGroupItem value="q" className="flex-1">분기</ToggleGroupItem>
          <ToggleGroupItem value="y" className="flex-1">년</ToggleGroupItem>
          <ToggleGroupItem value="custom" className="flex-1">직접</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', marginBottom: segMode === 'custom' ? 'var(--spacing-lg)' : 0 }}>
        <div style={{ flex: 1 }}>
          <InputDatePicker
            value={toISODate(from)}
            onValueChange={(v) => {
              const d = fromISODate(v)
              if (d) { setFrom(d); setSegMode('custom') }
            }}
          />
        </div>
        <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
        <div style={{ flex: 1 }}>
          <InputDatePicker
            value={toISODate(to)}
            onValueChange={(v) => {
              const d = fromISODate(v)
              if (d) { setTo(d); setSegMode('custom') }
            }}
          />
        </div>
      </div>
      {segMode === 'custom' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          {QUICK_RANGES.map((q) => (
            <button
              key={q.days}
              type="button"
              onClick={() => applyQuick(q.days)}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                fontSize: 'var(--text-caption)',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--fg-secondary)',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </>
  )

  const cancelBtn = <Button variant="ghost" onClick={onCancel}>취소</Button>
  const applyBtn = (
    <Button disabled={!canApply} onClick={() => canApply && onConfirm({ from, to, segMode })}>적용</Button>
  )

  // 모바일: Drawer (bottom sheet) — 모든 dialog 가 모바일에서 drawer 로 표시되는 패턴 정합.
  if (mobile) {
    return (
      <Drawer open onOpenChange={(o) => { if (!o) onCancel() }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>기간 선택</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>{formBody}</DrawerBody>
          <DrawerFooter>
            {cancelBtn}
            {applyBtn}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  // 데스크탑/태블릿: Dialog (modal).
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>기간 선택</DialogTitle>
        </DialogHeader>
        <DialogBody>{formBody}</DialogBody>
        <DialogFooter>
          {cancelBtn}
          {applyBtn}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
