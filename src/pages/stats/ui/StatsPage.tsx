import { Fragment, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { KRW, money, isEn, formatChartAxis } from '@/shared/lib/porest/format'
import { formatYearMonth, formatYear, formatYearQuarter } from '@/shared/lib/date'
import { niceAxis, niceCeil } from '@/shared/lib/porest/chartAxis'
import { MaskAmount, WonUnit, wonPre, useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { Donut } from '@/shared/ui/porest/charts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Card, CardContent } from '@/shared/ui/card'
import { Section } from '@/shared/ui/porest/section'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { CalendarClock, ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react'
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
  DrawerClose,
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
  if (segMode === 'm') return formatYearMonth(from)
  if (segMode === 'q') return formatYearQuarter(from)
  if (segMode === 'y') return formatYear(from)
  const sameYear = from.getFullYear() === to.getFullYear()
  return sameYear
    ? `${from.getMonth() + 1}/${from.getDate()} ~ ${to.getMonth() + 1}/${to.getDate()}`
    : `${fmt(from)} ~ ${fmt(to)}`
}

const labelsOf = ({ segMode }: RangeState) =>
  segMode === 'm'
    ? { now: 'period.m.now', prev: 'period.m.prev', mom: 'period.m.mom', noPrev: 'period.m.noPrev', avg: 'period.m.avg' }
    : segMode === 'q'
      ? { now: 'period.q.now', prev: 'period.q.prev', mom: 'period.q.mom', noPrev: 'period.q.noPrev', avg: 'period.q.avg' }
      : segMode === 'y'
        ? { now: 'period.y.now', prev: 'period.y.prev', mom: 'period.y.mom', noPrev: 'period.y.noPrev', avg: 'period.y.avg' }
        : { now: 'period.custom.now', prev: 'period.custom.prev', mom: 'period.custom.mom', noPrev: 'period.custom.noPrev', avg: 'period.custom.avg' }

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
const HEAT_ROWS: { labelKey: string; subKey: string; hours: number[] }[] = [
  { labelKey: 'heatRow.morning', subKey: 'heatRow.morningSub', hours: [6, 7, 8, 9] },
  { labelKey: 'heatRow.lunch', subKey: 'heatRow.lunchSub', hours: [10, 11, 12, 13] },
  { labelKey: 'heatRow.afternoon', subKey: 'heatRow.afternoonSub', hours: [14, 15, 16, 17] },
  { labelKey: 'heatRow.evening', subKey: 'heatRow.eveningSub', hours: [18, 19, 20, 21] },
  { labelKey: 'heatRow.night', subKey: 'heatRow.nightSub', hours: [22, 23, 0, 1] },
  { labelKey: 'heatRow.dawn', subKey: 'heatRow.dawnSub', hours: [2, 3, 4, 5] },
]

// 열(요일) — Java DayOfWeek: 1=월 ~ 7=일
const HEAT_COLS: { labelKey: string; dow: number }[] = [
  { labelKey: 'dow.mon', dow: 1 },
  { labelKey: 'dow.tue', dow: 2 },
  { labelKey: 'dow.wed', dow: 3 },
  { labelKey: 'dow.thu', dow: 4 },
  { labelKey: 'dow.fri', dow: 5 },
  { labelKey: 'dow.sat', dow: 6 },
  { labelKey: 'dow.sun', dow: 7 },
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
  rows: { dataKey: string; label: string; color: string | ((v: number) => string); format?: (v: number) => string }[]
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
        const swatch = typeof row.color === 'function' ? row.color(v) : row.color
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
                background: swatch,
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
                  <MaskAmount>{wonPre()}{KRW(v)}</MaskAmount>
                  <WonUnit />
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
// 콘텐츠 전용 스켈레톤 — 탭/헤더 같은 정적 틀은 실제 페이지가 항상 렌더한다(스켈레톤 X).
// 여기선 서버 데이터(카테고리/추이/비교) 자리만 채운다.
// 모바일 카드 다이어트 — 소형 스탯/KPI 타일: 카드 벗기고 콘텐츠만 (design Stats p-card 플랫).
// (렌더 중 컴포넌트 생성 금지 — React Compiler 룰 — 로 모듈 레벨 정의.)
function MTile({ mobile, children, style }: { mobile: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return mobile ? (
    <div style={style}>{children}</div>
  ) : (
    <Card style={style}>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function StatsPageSkeleton({ mobile, tab }: { mobile: boolean; tab: TabKey }) {
  const CategorySkeleton = (
    <>
      {/* DonutCard + TopMerchantsCard — 실제 Content(2104~2115) 미러: mobile flex-col, gap/marginBottom = spacing-2xl(32) */}
      <div
        style={{
          display: mobile ? 'flex' : 'grid',
          flexDirection: 'column',
          gridTemplateColumns: mobile ? undefined : '1.4fr 1fr',
          gap: mobile ? 'var(--spacing-2xl)' : 20,
          marginBottom: mobile ? 'var(--spacing-2xl)' : 20,
        }}
      >
        {/* DonutCard 프레임(Section) + 도넛 로딩 (실제 745·778~803 미러) */}
        <Section
          mobile={mobile}
          contentInset
          title={<SkeletonBase className="h-5 w-32" />}
          action={<SkeletonBase className="h-8 w-40" />}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: mobile ? 'column' : 'row',
              gap: mobile ? 0 : 32,
              alignItems: 'center',
            }}
          >
            <div style={{ height: mobile ? 240 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SkeletonBase className={mobile ? 'h-[176px] w-[176px] rounded-full' : 'h-[200px] w-[200px] rounded-full'} />
            </div>
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
        </Section>
        {/* TopMerchantsCard 프레임(Section) + 5행 로딩 (실제 888·897~909 미러) */}
        <Section
          mobile={mobile}
          contentInset
          title={<SkeletonBase className="h-5 w-44" />}
          cardStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
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
        </Section>
      </div>
      {/* HeatmapCard 프레임(Section) + 히트맵 그리드 로딩 (실제 1020·1026~1060 미러) */}
      <div style={{ marginBottom: mobile ? 'var(--spacing-2xl)' : 20 }}>
        <Section mobile={mobile} contentInset title={<SkeletonBase className="h-5 w-40" />}>
          {/* subtitle 자리 — 실제 heatmap.subtitle div(marginBottom:16) */}
          <SkeletonBase className="h-3 w-2/3 mb-4" />
          {/* 실제 heatmap grid 정합: 56px 라벨열 + 7 요일열, 헤더 행 + 6 데이터 행, 정사각형 셀 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `56px repeat(${HEAT_COLS.length}, 1fr)`,
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span />
            {HEAT_COLS.map(col => (
              <div key={col.dow} style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
                <SkeletonBase className="h-3 w-3" />
              </div>
            ))}
            {HEAT_ROWS.map((row, rIdx) => (
              <Fragment key={row.labelKey}>
                <div style={{ paddingRight: 2 }}>
                  <SkeletonBase className="h-3.5 w-8 mb-1" />
                  <SkeletonBase className="h-2.5 w-12" />
                </div>
                {HEAT_COLS.map(col => (
                  <SkeletonBase key={`${rIdx}-${col.dow}`} className="w-full rounded-sm" style={{ aspectRatio: '1' }} />
                ))}
              </Fragment>
            ))}
          </div>
        </Section>
      </div>
      {/* HighlightsGrid — MTile 3개 (실제 1285·1301~1326 미러: 라벨 + 40px 아이콘 + 값/서브) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {[0, 1, 2].map(i => (
          <MTile key={i} mobile={mobile}>
            <SkeletonBase className="h-3 w-24" style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SkeletonBase className="shrink-0" style={{ width: 40, height: 40, borderRadius: 'var(--radius-tile)' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <SkeletonBase className="h-5 w-24" />
                <SkeletonBase className="h-3 w-16" style={{ marginTop: 2 }} />
              </div>
            </div>
          </MTile>
        ))}
      </div>
    </>
  )

  const TrendSkeleton = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 'var(--spacing-2xl)' : 20 }}>
      {/* TrendBig 프레임(Section) + 차트 로딩 (실제 1424·1428~1437 미러) */}
      <Section
        mobile={mobile}
        contentInset
        title={<SkeletonBase className="h-5 w-44" />}
        action={<SkeletonBase className="h-8 w-40" />}
      >
        <SkeletonBase className="w-full rounded-lg" style={{ height: mobile ? 200 : 260 }} />
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <SkeletonBase className="h-3 w-12" />
          <SkeletonBase className="h-3 w-12" />
        </div>
      </Section>
      {/* TrendStats — 저축률 도넛 링 게이지(108px) + 구성 비율바 + 3행 (실제 1547~1596 미러). 이전 4칸 stat 타일 스켈레톤 교체. */}
      <MTile mobile={mobile}>
        <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: mobile ? 20 : 32 }}>
          {/* 저축률 도넛 게이지 자리 (108px 링) + (모바일) 인사이트 텍스트 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: mobile ? 'center' : 'flex-start', flexShrink: 0 }}>
            <SkeletonBase className="rounded-full shrink-0" style={{ width: 108, height: 108 }} />
            {mobile && <SkeletonBase className="h-6 flex-1" />}
          </div>
          {/* 구성 비율바 + 항목 3행 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!mobile && <SkeletonBase className="h-5 w-2/3 mb-3.5" />}
            <SkeletonBase className="w-full rounded-full" style={{ height: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, auto)', gap: mobile ? 10 : 28, marginTop: 14, justifyContent: mobile ? 'stretch' : 'start' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: mobile ? 'space-between' : 'flex-start' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <SkeletonBase className="h-2 w-2 rounded-full shrink-0" />
                    <SkeletonBase className="h-3 w-16" />
                  </span>
                  <SkeletonBase className="h-3 w-14" style={{ marginLeft: mobile ? 0 : 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </MTile>
      {/* SavingsBars 프레임(Section) + 차트 로딩 (실제 1599·1607~1611 미러) */}
      <Section
        mobile={mobile}
        contentInset
        title={<SkeletonBase className="h-5 w-28" />}
        action={<SkeletonBase className="h-3 w-24" />}
      >
        <SkeletonBase className="w-full rounded-lg" style={{ height: mobile ? 180 : 220 }} />
      </Section>
    </div>
  )

  const CompareSkeleton = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 'var(--spacing-2xl)' : 20 }}>
      {/* CompareSummary — MTile 요약(기간 지출 + 증감칩 + vs 문구 + 이번/이전 막대 2행) (실제 1817~1860 미러) */}
      <MTile mobile={mobile}>
        {/* 기간 지출 라벨 */}
        <SkeletonBase className="h-3 w-28" />
        {/* 합계 금액 + 증감칩 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <SkeletonBase className={mobile ? 'h-6 w-36' : 'h-7 w-44'} />
          <SkeletonBase className="h-5 w-14 rounded-full" />
        </div>
        {/* vs 전기간 문구 */}
        <SkeletonBase className="h-4 w-1/2" style={{ marginTop: 10 }} />
        {/* 이번/이전 막대 2행 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SkeletonBase className="h-3 shrink-0" style={{ width: 44 }} />
              <SkeletonBase className="flex-1 rounded-full" style={{ height: 14 }} />
              <SkeletonBase className="h-3 shrink-0" style={{ width: mobile ? 82 : 96 }} />
            </div>
          ))}
        </div>
      </MTile>
      {/* CompareMetrics — MTile 3개 그리드 (실제 1866~1891 미러: 라벨+값 / 증감) */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <MTile key={i} mobile={mobile} style={mobile ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } : undefined}>
            <div>
              <SkeletonBase className="h-3 w-16 mb-2" />
              <SkeletonBase className={mobile ? 'h-4 w-24' : 'h-5 w-28'} />
            </div>
            <SkeletonBase className="h-3 w-20" style={{ marginTop: mobile ? 0 : 6 }} />
          </MTile>
        ))}
      </div>
      {/* CompareCategory 프레임(Section) + 4행 로딩 (실제 1894·1920~1936 미러) */}
      <Section
        mobile={mobile}
        contentInset
        title={<SkeletonBase className="h-5 w-44" />}
        action={<SkeletonBase className="h-3 w-40" />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <SkeletonBase className="h-4 flex-1" />
                <SkeletonBase className="h-4 w-20 shrink-0" />
                <SkeletonBase className="h-3 w-12 shrink-0" />
              </div>
              <div style={{ paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SkeletonBase className="h-2.5 w-full rounded-full" />
                <SkeletonBase className="h-1.5 w-2/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Section>
      {/* CompareWeekday 프레임(Section) + 7일 막대 차트 (실제 2061~2104 미러) */}
      <Section
        mobile={mobile}
        contentInset
        title={<SkeletonBase className="h-5 w-28" />}
        action={<SkeletonBase className="h-3 w-32" />}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 8 : 18, height: mobile ? 140 : 170, padding: '14px 2px 6px' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {/* now/prev 막대 쌍 자리 — height 는 데이터 대체 placeholder (실제 2084~2085 미러) */}
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
                <SkeletonBase style={{ width: '42%', maxWidth: 16, height: '62%', borderRadius: '3px 3px 0 0' }} />
                <SkeletonBase style={{ width: '42%', maxWidth: 16, height: '44%', borderRadius: '3px 3px 0 0' }} />
              </div>
              <SkeletonBase className="h-3 w-6" />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )

  return tab === 'cat' ? CategorySkeleton : tab === 'trend' ? TrendSkeleton : CompareSkeleton
}

export const StatsPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { t } = useTranslation('stats')
  const { t: te } = useTranslation('expense')
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
  // 비교 탭 요일별 비교 — 이전 기간 raw 거래(요일 집계용).
  const prevMonthExpensesQ = useExpenses({ startDate: prevStart, endDate: prevEnd })
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

  const TAB_ITEMS: { v: TabKey; l: string }[] = [
    { v: 'cat', l: t('tab.category') },
    { v: 'trend', l: t('tab.trend') },
    { v: 'compare', l: t('tab.compare') },
  ]
  // 모바일 = design .m-chip-tabs + .tg--pill (컴팩트 pill toggle, 선택=bg-brand 채움, 가로스크롤).
  // 데스크톱 = underline 탭 유지.
  const StatsTabs = mobile ? (
    <div className="scrollbar-hide" style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 20px' }}>
      {TAB_ITEMS.map(({ v, l }) => {
        const on = tab === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            style={{
              padding: '4px 12px',
              minHeight: 32,
              borderRadius: 'var(--radius-md)',
              border: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              background: on ? 'var(--bg-brand)' : 'transparent',
              color: on ? 'var(--fg-on-brand)' : 'var(--fg-secondary)',
              transition: 'color var(--motion-duration-fast), background var(--motion-duration-fast)',
            }}
          >
            {l}
          </button>
        )
      })}
    </div>
  ) : (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} style={{ marginBottom: 20 }}>
      <TabsList variant="underline">
        {TAB_ITEMS.map(({ v, l }) => (
          <TabsTrigger key={v} value={v} variant="underline">
            {l}
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
  const centerPeriodLbl = period.segMode === 'custom' ? t('period.custom.now') : periodLbl
  const donutCenterLbl = isDrilled
    ? t('category.drilledCenter', { name: activeParent?.name ?? '' })
    : t('compare.periodExpense', { period: centerPeriodLbl })

  const DonutCard = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      contentInset
      title={
        isDrilled ? (
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
              {t('category.title')}
            </button>
            <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}>›</span>
            <span>{activeParent?.name}</span>
          </>
        ) : (
          t('category.title')
        )
      }
      action={PeriodSeg}
    >
      {donutLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 0 : 32,
            alignItems: 'center',
          }}
        >
          {/* 도넛 스켈레톤도 200 박스 중앙 + 176 원 — 실제 렌더(앱 정합)와 동일 리듬(로딩 점프 방지). */}
          <div style={{ height: mobile ? 240 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SkeletonBase
              className={mobile ? 'h-[176px] w-[176px] rounded-full' : 'h-[200px] w-[200px] rounded-full'}
            />
          </div>
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
        <EmptyBox text={t('empty.category')} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 0 : 32,
            alignItems: 'center',
          }}
        >
          {/* 도넛을 200 높이 박스 중앙에 — 앱(_DonutCard SizedBox 200 + 도넛 176) 정합. 위·아래 12 여백 확보. */}
          <div style={{ height: mobile ? 240 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Donut
              segments={donutView.map((s, i) => ({ value: s.amount, color: segmentColor(i, s.color) }))}
              size={mobile ? 176 : 200}
              stroke={28}
            >
              <div className="lbl">{donutCenterLbl}</div>
              <div className="val num" style={{ fontSize: 'var(--text-title-lg)' }}>
                <MaskAmount>{wonPre()}{KRW(donutTotal)}</MaskAmount>
                <WonUnit />
              </div>
            </Donut>
          </div>
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
                  title={clickable ? t('category.drillHint') : undefined}
                >
                  <span className="cat-legend__sw" style={{ background: segmentColor(i, s.color) }} />
                  <span className="cat-legend__name">{s.name}</span>
                  <span className="cat-legend__pct num">
                    {donutTotal > 0 ? ((s.amount / donutTotal) * 100).toFixed(1) : '0.0'}%
                  </span>
                  <span
                    className="cat-legend__amt num"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}
                  >
                    <MaskAmount mask="••••">{KRW(s.amount)}</MaskAmount>
                    {/* 하위 카테고리 있는 행 = 클릭 가능 표식 — 숫자 옆 밀착 (앱 chevronRight 정합) */}
                    {clickable && (
                      <ChevronRight
                        size={13}
                        style={{ color: 'var(--fg-tertiary)', marginRight: -2, flexShrink: 0 }}
                        aria-hidden
                      />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Section>
  )

  const merchants = merchantQ.data?.merchants ?? []
  const topMerchants = merchants.slice(0, 5)
  const maxMerchantAmt = Math.max(1, ...topMerchants.map(m => m.totalAmount))

  const TopMerchantsCard = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      contentInset
      title={t('merchant.title')}
      cardStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
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
        <EmptyBox text={t('empty.merchant')} />
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
                    {t('unit.times', { count: m.count })}
                  </span>
                  <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
                    <MaskAmount>{wonPre()}{KRW(m.totalAmount)}</MaskAmount>
                    <WonUnit />
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
    </Section>
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
    if (isEn()) return formatChartAxis(v)
    if (v < 10_000) return `${Math.round(v / 1000)}천`
    return `${(v / 10_000).toFixed(1)}만`
  }

  const HeatmapCard = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section mobile={mobile} contentInset title={t('heatmap.title')}>
      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginBottom: 16 }}>
        {t('heatmap.subtitle')}
      </div>
      {heatmapQ.isLoading ? (
        // 실제 grid 정합: 56px 라벨열 + 7 요일열, 헤더 행(코너+요일) + 6 데이터 행.
        // 셀은 aspectRatio 1 정사각형 + radius-sm (로딩 후 컴포넌트와 1:1).
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `56px repeat(${HEAT_COLS.length}, 1fr)`,
            gap: 6,
            alignItems: 'center',
          }}
        >
          {/* 헤더 행: 빈 코너 + 요일 라벨 placeholder */}
          <span />
          {HEAT_COLS.map(col => (
            <div key={col.dow} style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
              <SkeletonBase className="h-3 w-3" />
            </div>
          ))}
          {/* 데이터 행: 56px 라벨(2줄) + 정사각형 셀 7개 */}
          {HEAT_ROWS.map((row, rIdx) => (
            <Fragment key={row.labelKey}>
              <div style={{ paddingRight: 2 }}>
                <SkeletonBase className="h-3.5 w-8 mb-1" />
                <SkeletonBase className="h-2.5 w-12" />
              </div>
              {HEAT_COLS.map(col => (
                <SkeletonBase
                  key={`${rIdx}-${col.dow}`}
                  className="w-full rounded-sm"
                  style={{ aspectRatio: '1' }}
                />
              ))}
            </Fragment>
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
          {t('heatmap.empty')}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              // 앱과 동일 — 라벨 56px, 셀 간격 4px (앱 cell Padding(all:2)=셀간 4px)
              gridTemplateColumns: `56px repeat(${HEAT_COLS.length}, 1fr)`,
              gap: 6,
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
                {t(col.labelKey)}
              </span>
            ))}

            {/* 데이터 행들 */}
            {HEAT_ROWS.map((row, rIdx) => (
              <Fragment key={row.labelKey}>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-tertiary)',
                    lineHeight: '1.3',
                    paddingRight: 2,
                  }}
                >
                  <div style={{ fontWeight: '700', color: 'var(--fg-primary)', fontSize: 'var(--text-label-sm)' }}>
                    {t(row.labelKey)}
                  </div>
                  <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                    {t(row.subKey)}
                  </div>
                </div>
                {HEAT_COLS.map((col, cIdx) => {
                  const value = heatmapMatrix[rIdx]?.[cIdx] ?? 0
                  const bucket = heatBucket(value)
                  const pal = HEAT_PALETTE[bucket]!
                  const isPeak = value > 0 && value === heatmapMax
                  const cellText = shortAmount(value)
                  // 한 줄 유지 — 글자 수에 따라 폰트 축소(가계부 캘린더형 px 조정 로직 정합) + nowrap
                  const cellFs = mobile
                    ? cellText.length <= 4 ? 10 : cellText.length <= 5 ? 9 : 8
                    : cellText.length <= 5 ? 11.5 : 10
                  return (
                    <div
                      key={`${row.labelKey}-${col.dow}`}
                      title={hidden ? `${t(row.labelKey)}·${t(col.labelKey)}` : `${t(row.labelKey)}·${t(col.labelKey)} ${money(value)}`}
                      style={{
                        aspectRatio: '1', // 앱 AspectRatio(1) 정합 — 정사각형
                        borderRadius: 'var(--radius-sm)',
                        background: pal.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: cellFs,
                        fontWeight: '700',
                        color: pal.fg,
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                        boxShadow: isPeak
                          ? '0 0 0 2px var(--fg-brand-strong), 0 0 0 4px color-mix(in srgb, var(--fg-brand-strong) 25%, transparent)'
                          : 'none',
                        transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
                      }}
                    >
                      <MaskAmount mask={value > 0 ? '••' : '—'}>{cellText}</MaskAmount>
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
            <span>{t('heatmap.less')}</span>
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
            <span>{t('heatmap.more')}</span>
            <span style={{ marginLeft: 'auto' }}>
              {t('heatmap.total')} <MaskAmount>{wonPre()}{KRW(heatmapTotal)}</MaskAmount>
              <WonUnit />
            </span>
          </div>
        </>
      )}
    </Section>
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
  const avgLabel = t(labels.avg)

  // 이전 동등 기간 총지출 (Compare 탭 미사용 시 0 — query가 disabled)
  const prevTotalExpense = prevRangeQ.data?.totalExpense ?? 0
  const dayPct = prevTotalExpense > 0
    ? Math.round(((totalExpense - prevTotalExpense) / prevTotalExpense) * 100)
    : 0
  // 증감 색상: 지출 증가=fg-expense / 감소=fg-income (compare 탭 동일 컨벤션)
  const avgSub: React.ReactNode = period.segMode !== 'm'
    ? <>{t('avgSub.rangeTotal', { days: rangeDays })} <MaskAmount>{wonPre()}{KRW(periodTotalExpense)}</MaskAmount><WonUnit /></>
    : prevTotalExpense > 0
      ? <>{t(labels.mom)} <span style={{ color: dayPct >= 0 ? 'var(--fg-expense)' : 'var(--fg-income)', fontWeight: 600 }}>{dayPct >= 0 ? '↑' : '↓'}{Math.abs(dayPct)}%</span></>
      : prevRangeQ.isLoading
        ? t('avgSub.momCalculating')
        : t('avgSub.momUnavailable')

  const highlights: {
    lbl: string
    val: React.ReactNode
    sub: React.ReactNode
    icon: string | null
    color: string | null
    fallback: string
  }[] = [
    {
      lbl: t('highlight.topCategory'),
      val: categoryTop?.name ?? '—',
      sub: categoryTop
        ? <><MaskAmount>{wonPre()}{KRW(categoryTop.amount)}</MaskAmount><WonUnit /></>
        : t('highlight.noData'),
      icon: categoryTop?.icon ?? null,
      color: categoryTop?.color ?? null,
      fallback: categoryTop?.name?.charAt(0) || '•',
    },
    {
      lbl: t('highlight.topMerchant'),
      val: topMerchant?.merchant ?? '—',
      sub: topMerchant
        ? <>{t('unit.times', { count: topMerchant.count })} · <MaskAmount>{wonPre()}{KRW(topMerchant.totalAmount)}</MaskAmount><WonUnit /></>
        : t('highlight.noData'),
      // 가맹점이 속한 대표 카테고리 아이콘(역산), 없으면 상점 아이콘 + brand-subtle 타일
      icon: topMerchantCat?.icon ?? 'store',
      color: topMerchantCat?.color ?? null,
      fallback: topMerchant?.merchant?.charAt(0) || '•',
    },
    {
      lbl: avgLabel,
      val: <><MaskAmount>{wonPre()}{KRW(avgValue)}</MaskAmount><WonUnit /></>,
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
        // 카테고리 색은 dark 자동 swap. 색 없는 카드(가맹점/평균)도 getPaletteByColor
        // 경유 — null 분기가 brand-light 틴트를 주므로 컬러 타일·앱과 동일.
        const pal = getPaletteByColor(h.color)
        const iconBg = pal.bg
        const iconFg = pal.color
        return (
          // 모바일 카드 다이어트 — 타일 카드 벗김 (grid gap 이 구분).
          <MTile key={i} mobile={mobile}>
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
          </MTile>
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
  const statLabelIn = isSingle ? te('income') : t('trend.avgIncome')
  const statLabelOut = isSingle ? te('expense') : t('trend.avgExpense')
  const statLabelSave = isSingle ? t('trend.savings') : t('trend.avgSavings')

  const trendChartConfig: ChartConfig = {
    income: { label: te('income'), color: 'var(--status-info-fg)' },
    expense: { label: te('expense'), color: 'var(--fg-expense)' },
  }
  const savingsChartConfig: ChartConfig = {
    savings: { label: t('trend.savings'), color: 'var(--bg-brand)' },
  }

  // app stats _fmtTick 정합 — 만 단위 round. 공용 formatChartAxis(100만 단위 round)는
  // 지출 우축처럼 소액 스케일(40만 등)이 전부 '0만'으로 뭉개져서 stats 엔 부적합.
  const fmtTick = (v: number): string => {
    if (isEn()) return formatChartAxis(v)
    const sign = v < 0 ? '-' : ''
    const n = Math.abs(v)
    if (n >= 100_000_000) return `${sign}${(n / 100_000_000).toFixed(1)}억`
    if (n >= 10_000) return `${sign}${Math.round(n / 10_000).toLocaleString('ko-KR')}만`
    return `${sign}${n.toLocaleString('ko-KR')}`
  }

  // Y축 nice 눈금 (앱 stats_screen 정합). dual-axis 는 좌·우 각각 0기준 고정 5틱(niceCeil)
  // 으로 가로 그리드 정렬, 순저축 bar 는 음수 포함 niceAxis.
  const incomeAxis = useMemo(
    () => niceCeil(Math.max(0, ...trendChartData.map(d => d.income))),
    [trendChartData],
  )
  const expenseAxis = useMemo(
    () => niceCeil(Math.max(0, ...trendChartData.map(d => d.expense))),
    [trendChartData],
  )
  const savingsAxis = useMemo(
    () =>
      niceAxis(
        Math.min(0, ...trendChartData.map(d => d.savings)),
        Math.max(0, ...trendChartData.map(d => d.savings)),
      ),
    [trendChartData],
  )

  const TrendBig = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section mobile={mobile} contentInset title={t('trend.title')} action={PeriodSeg}>
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
        <EmptyBox text={t('empty.trend')} />
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
                domain={[0, incomeAxis.max]}
                ticks={incomeAxis.ticks}
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
                domain={[0, expenseAxis.max]}
                ticks={expenseAxis.ticks}
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--color-expense)' }}
                tickFormatter={fmtTick}
                width={52}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--fg-tertiary)', strokeDasharray: '3 3' }}
                content={
                  <PorestChartTooltip
                    rows={[
                      { dataKey: 'income', label: te('income'), color: 'var(--status-info-fg)' },
                      { dataKey: 'expense', label: te('expense'), color: 'var(--fg-expense)' },
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
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--status-info-fg)' }} /> {te('income')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--fg-expense)' }} /> {te('expense')}
            </span>
          </div>
        </>
      )}
    </Section>
  )

  // 추이 탭 — 저축률 도넛 게이지 + 구성 스택바 + 평균수입/지출/저축 3행 (design StatsScreen).
  const saveRate = avgIn > 0 ? Math.max(0, Math.min(100, (avgSave / avgIn) * 100)) : 0
  const spendRate = avgIn > 0 ? Math.max(0, Math.min(100, (avgOut / avgIn) * 100)) : 0
  const RING_R = 48
  const RING_C = 2 * Math.PI * RING_R
  const savingsRows: { lbl: string; val: React.ReactNode; dot: string; pct: number | null }[] = [
    { lbl: statLabelIn, val: <><MaskAmount>{wonPre()}{KRW(Math.round(avgIn))}</MaskAmount><WonUnit /></>, dot: 'var(--fg-tertiary)', pct: null },
    { lbl: statLabelOut, val: <><MaskAmount>{wonPre()}{KRW(Math.round(avgOut))}</MaskAmount><WonUnit /></>, dot: 'var(--fg-expense)', pct: spendRate },
    { lbl: statLabelSave, val: <><MaskAmount>{wonPre()}{KRW(Math.round(avgSave))}</MaskAmount><WonUnit /></>, dot: 'var(--fg-brand)', pct: saveRate },
  ]
  const TrendStats = (
    // 모바일 = 카드 다이어트(flat) / 데스크톱 = Card.
    <MTile mobile={mobile}>
      <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: mobile ? 20 : 32 }}>
        {/* 저축률 도넛 게이지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: mobile ? 'center' : 'flex-start', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 108, height: 108 }}>
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r={RING_R} fill="none" stroke="var(--color-surface-input)" strokeWidth="10" />
              <circle cx="54" cy="54" r={RING_R} fill="none" stroke="var(--fg-brand)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(RING_C * saveRate) / 100} ${RING_C}`} transform="rotate(-90 54 54)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('trend.savingsRate')}</span>
              <span className="num" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{saveRate.toFixed(1)}%</span>
            </div>
          </div>
          {mobile && (
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
              {t('trend.savingsInsight', { pct: Math.round(saveRate) })}
            </div>
          )}
        </div>
        {/* 구성 비율 + 항목 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!mobile && (
            <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: 700, marginBottom: 14 }}>
              {t('trend.savingsInsight', { pct: Math.round(saveRate) })}
            </div>
          )}
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
            <div style={{ width: `${spendRate}%`, background: 'var(--fg-expense)', borderRadius: 999 }} />
            <div style={{ width: `${saveRate}%`, background: 'var(--fg-brand)', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, auto)', gap: mobile ? 10 : 28, marginTop: 14, justifyContent: mobile ? 'stretch' : 'start' }}>
            {savingsRows.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: mobile ? 'space-between' : 'flex-start' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)' }}>
                    {s.lbl}{s.pct != null ? ` ${Math.round(s.pct)}%` : ''}
                  </span>
                </span>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, marginLeft: mobile ? 0 : 8 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MTile>
  )

  const SavingsBars = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      contentInset
      title={useDailyTrend ? t('trend.dailySavings') : t('trend.monthlySavings')}
      action={<span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('trend.savingsFormula')}</span>}
    >
      {rangeQ.isLoading ? (
        <SkeletonBase
          className="w-full rounded-lg"
          style={{ height: mobile ? 180 : 220 }}
        />
      ) : trendChartData.length === 0 ? (
        <EmptyBox text={t('empty.monthlyData')} />
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
              domain={[savingsAxis.min, savingsAxis.max]}
              ticks={savingsAxis.ticks}
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
                      label: t('trend.savings'),
                      color: (v) => (v < 0 ? 'var(--fg-expense)' : 'var(--status-info-fg)'),
                      format: (v) => `${v >= 0 ? '+' : '−'}${money(Math.abs(v))}`,
                    },
                  ]}
                />
              }
            />
            {/* 일별(>20개)은 앱(width 4)처럼 얇게 — 월별은 기존 유지 */}
            <Bar dataKey="savings" radius={[6, 6, 2, 2]} barSize={trendChartData.length > 20 ? 4 : mobile ? 18 : 28}>
              {trendChartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.savings < 0
                      ? 'var(--fg-expense)'
                      : 'var(--status-info-fg)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Section>
  )

  // ---------- 주요 카테고리 월별 추이 (지출 TOP3 stacked) ----------
  // TOP3 = 기간 전체 EXPENSE breakdown 상위 3. 월별 금액은 bucket.categoryExpenses(rowId 매칭).
  const catTrendTop3 = useMemo(
    () => [...periodBreakdown].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3),
    [periodBreakdown],
  )
  const catTrendData = useMemo(
    () =>
      monthlyBuckets.map((b, i) => {
        const parts = catTrendTop3.map(
          c => (b.categoryExpenses ?? []).find(ce => ce.categoryRowId === c.categoryRowId)?.amount ?? 0,
        )
        const label = isEn()
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][b.month - 1]
          : `${b.month}월`
        return { label, parts, sum: parts.reduce((s, v) => s + v, 0), isCur: i === monthlyBuckets.length - 1 }
      }),
    [monthlyBuckets, catTrendTop3],
  )
  const catTrendMax = Math.max(1, ...catTrendData.map(d => d.sum))
  // 여러 달 + TOP3 지출 데이터가 있을 때만 노출(단일 월은 카테고리 탭 도넛이 담당).
  const showCatTrend = monthlyBuckets.length >= 2 && catTrendTop3.length > 0 && catTrendMax > 1
  const CatTrend = showCatTrend ? (
    <Section
      mobile={mobile}
      contentInset
      title={t('trend.catTrendTitle')}
      action={<span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('trend.catTrendTop3')}</span>}
    >
      {/* 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', margin: '10px 0 4px' }}>
        {catTrendTop3.map((c, i) => (
          <span key={c.categoryRowId} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2.5, background: segmentColor(i, categoryById.get(c.categoryRowId)?.color) }} />
            {c.categoryName}
          </span>
        ))}
      </div>
      {/* 월별 stacked 막대 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 10 : 20, height: mobile ? 150 : 180, padding: '16px 4px 6px' }}>
        {catTrendData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: mobile ? 10 : 11, fontWeight: 700, color: d.isCur ? 'var(--fg-primary)' : 'var(--fg-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              {money(d.sum)}
            </span>
            <div
              style={{
                width: '100%',
                maxWidth: 44,
                height: Math.max(8, (d.sum / catTrendMax) * (mobile ? 100 : 128)),
                display: 'flex',
                flexDirection: 'column-reverse',
                borderRadius: 6,
                overflow: 'hidden',
                opacity: d.isCur ? 1 : 0.55,
              }}
            >
              {d.parts.map((v, ci) => (
                <div
                  key={ci}
                  style={{ height: d.sum > 0 ? `${(v / d.sum) * 100}%` : '0%', background: segmentColor(ci, categoryById.get(catTrendTop3[ci]!.categoryRowId)?.color) }}
                  title={`${catTrendTop3[ci]!.categoryName} ${KRW(v)}`}
                />
              ))}
            </div>
            <span style={{ fontSize: mobile ? 10.5 : 11.5, fontWeight: d.isCur ? 700 : 500, color: d.isCur ? 'var(--fg-primary)' : 'var(--fg-tertiary)' }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </Section>
  ) : null

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
  const maxCompareAmt = Math.max(1, ...compareRows.flatMap(r => [r.now, r.prev]))

  const periodNow = t(labels.now)
  const periodPrev = t(labels.prev)
  const momLabel = t(labels.mom)
  const noPrevText = t(labels.noPrev)

  const compareLoading = rangeQ.isLoading || prevRangeQ.isLoading

  // 비교 탭 헤더/지표 (design StatsScreen). 감소=파랑(good)/증가=빨강(지출성).
  const cmpDiff = totalNow - totalPrev
  const cmpLess = cmpDiff <= 0
  const cmpColor = cmpLess ? 'var(--fg-income)' : 'var(--fg-expense)'
  const cmpPct = totalPrev > 0 ? Math.abs((cmpDiff / totalPrev) * 100).toFixed(1) : null
  const cmpBarMax = Math.max(1, totalNow, totalPrev)
  const prevDays = Math.round((startOfDay(prevR.to).getTime() - startOfDay(prevR.from).getTime()) / 86400000) + 1
  const nowTxCount = (monthExpensesQ.data ?? []).filter(e => e.expenseType === 'EXPENSE').length
  const prevTxCount = (prevMonthExpensesQ.data ?? []).filter(e => e.expenseType === 'EXPENSE').length

  const CompareSummary = (
    // 모바일 = 카드 다이어트(flat) / 데스크톱 = Card.
    <MTile mobile={mobile}>
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', fontWeight: 500 }}>
        {t('compare.periodExpense', { period: periodNow })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        <span className="num" style={{ fontSize: mobile ? 24 : 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <MaskAmount>{wonPre()}{KRW(totalNow)}</MaskAmount><WonUnit />
        </span>
        {cmpPct != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: cmpColor, background: `color-mix(in oklab, ${cmpColor} 12%, transparent)` }}>
            {cmpLess ? '▼' : '▲'} {cmpPct}%
          </span>
        )}
      </div>
      {cmpPct != null ? (
        <div style={{ fontSize: mobile ? 14 : 15, fontWeight: 700, marginTop: 10 }}>
          {t('compare.vsLastPrefix')}{' '}
          <span style={{ color: cmpColor }}>
            <MaskAmount>{wonPre()}{KRW(Math.abs(cmpDiff))}</MaskAmount><WonUnit /> {cmpLess ? t('compare.dirLess') : t('compare.dirMore')}
          </span>{' '}
          {t('compare.spentSuffix')}
        </div>
      ) : (
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 10 }}>{noPrevText}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {[
          { lbl: periodNow, amt: totalNow, color: 'var(--fg-brand)', border: false },
          { lbl: periodPrev, amt: totalPrev, color: 'var(--color-surface-input)', border: true },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: 600, width: 44, flexShrink: 0 }}>{m.lbl}</span>
            <div style={{ flex: 1, height: 14, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${(m.amt / cmpBarMax) * 100}%`, height: '100%', borderRadius: 999, background: m.color, border: m.border ? '1px solid var(--border-default)' : 'none', boxSizing: 'border-box' }} />
            </div>
            <span className="num" style={{ fontSize: 12, fontWeight: 700, width: mobile ? 82 : 96, textAlign: 'right', flexShrink: 0 }}>
              <MaskAmount>{wonPre()}{KRW(m.amt)}</MaskAmount><WonUnit />
            </span>
          </div>
        ))}
      </div>
    </MTile>
  )

  // 비교 탭 — 하루 평균 / 거래 건수 / 건당 평균 (이번 기간 vs 이전 기간).
  const cmpMetrics: { label: string; now: number; prev: number; count: boolean }[] = [
    { label: t('compare.metricDailyAvg'), now: Math.round(totalNow / Math.max(1, rangeDays)), prev: Math.round(totalPrev / Math.max(1, prevDays)), count: false },
    { label: t('compare.metricTxCount'), now: nowTxCount, prev: prevTxCount, count: true },
    { label: t('compare.metricPerTx'), now: nowTxCount > 0 ? Math.round(totalNow / nowTxCount) : 0, prev: prevTxCount > 0 ? Math.round(totalPrev / prevTxCount) : 0, count: false },
  ]
  const cmpMetricVal = (v: number, count: boolean) =>
    count ? <>{KRW(v)}{t('compare.unitCount')}</> : <><MaskAmount>{wonPre()}{KRW(v)}</MaskAmount><WonUnit /></>
  const CompareMetrics = (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
      {cmpMetrics.map((m, i) => {
        const d = m.now - m.prev
        const up = d > 0
        const c = up ? 'var(--fg-expense)' : 'var(--fg-income)'
        return (
          <MTile key={i} mobile={mobile} style={mobile ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } : undefined}>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>{m.label}</div>
              <div className="num" style={{ fontSize: mobile ? 16 : 18, fontWeight: 800, letterSpacing: '-0.02em', marginTop: mobile ? 3 : 6 }}>{cmpMetricVal(m.now, m.count)}</div>
            </div>
            <div style={{ marginTop: mobile ? 0 : 6, textAlign: mobile ? 'right' : 'left' }}>
              {d !== 0 && (
                <span style={{ fontSize: 'var(--text-badge)', fontWeight: 700, color: c }}>
                  {up ? '▲' : '▼'} {cmpMetricVal(Math.abs(d), m.count)}
                </span>
              )}
              <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginLeft: 6 }}>
                {t('compare.lastMonthLabel')} {cmpMetricVal(m.prev, m.count)}
              </span>
            </div>
          </MTile>
        )
      })}
    </div>
  )

  const CompareCategory = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      contentInset
      title={t('compare.categoryTitle', { mom: momLabel })}
      action={
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: 'var(--color-cat-blue)' }} />
            {periodNow}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: '#abc8ee' }} />
            {periodPrev}
          </span>
        </div>
      }
    >
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
        <EmptyBox text={t('empty.compare')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {compareRows.map(r => {
            const diff = r.now - r.prev
            const pct = r.prev > 0 ? (diff / r.prev) * 100 : 0
            const up = diff > 0
            // getPaletteByColor 경유 — dark light-variant swap + null 은 brand-light 틴트
            const pal = getPaletteByColor(r.color)
            const iconBg = pal.bg
            const iconFg = pal.color
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
                    <MaskAmount>{wonPre()}{KRW(r.now)}</MaskAmount>
                    <WonUnit />
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
                        background: 'var(--color-cat-blue)',
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
                        background: '#abc8ee',
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
    </Section>
  )

  // 비교 탭 — 요일별 지출 비교 (grouped bars). 이번 기간 vs 이전 기간, 월요일 시작.
  const WK_KEYS = ['dow.mon', 'dow.tue', 'dow.wed', 'dow.thu', 'dow.fri', 'dow.sat', 'dow.sun'] as const
  const wkAgg = (() => {
    const now = new Array(7).fill(0) as number[]
    const prev = new Array(7).fill(0) as number[]
    const add = (
      arr: number[],
      list: ReadonlyArray<{ expenseType: string; amount: number; expenseDate?: string | null }> | undefined,
    ) => {
      for (const e of list ?? []) {
        if (e.expenseType !== 'EXPENSE') continue
        const ds = (e.expenseDate ?? '').slice(0, 10)
        if (!ds) continue
        const idx = (new Date(`${ds}T00:00:00`).getDay() + 6) % 7
        arr[idx] = (arr[idx] ?? 0) + e.amount
      }
    }
    add(now, monthExpensesQ.data)
    add(prev, prevMonthExpensesQ.data)
    return { now, prev }
  })()
  const wkMax = Math.max(1, ...wkAgg.now, ...wkAgg.prev)
  const wkDelta = (() => {
    let idx = -1
    let delta = 0
    for (let i = 0; i < 7; i++) {
      const d = (wkAgg.now[i] ?? 0) - (wkAgg.prev[i] ?? 0)
      if (Math.abs(d) > Math.abs(delta)) { delta = d; idx = i }
    }
    return { idx, delta }
  })()
  const wkDeltaKey = wkDelta.idx >= 0 ? WK_KEYS[wkDelta.idx] : undefined
  const CompareWeekday = (
    <Section
      mobile={mobile}
      contentInset
      title={t('compare.weekdayTitle')}
      action={
        <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2.5, background: 'var(--fg-brand)' }} />{periodNow}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2.5, background: 'var(--color-surface-input)', border: '1px solid var(--border-default)', boxSizing: 'border-box' }} />{periodPrev}
          </span>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 8 : 18, height: mobile ? 140 : 170, padding: '14px 2px 6px' }}>
        {WK_KEYS.map((k, i) => {
          const isSat = i === 5
          const isSun = i === 6
          return (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
                <div style={{ width: '42%', maxWidth: 16, height: `${((wkAgg.now[i] ?? 0) / wkMax) * 100}%`, background: 'var(--fg-brand)', borderRadius: '3px 3px 0 0' }} />
                <div style={{ width: '42%', maxWidth: 16, height: `${((wkAgg.prev[i] ?? 0) / wkMax) * 100}%`, background: 'var(--color-surface-input)', border: '1px solid var(--border-default)', borderBottom: 'none', borderRadius: '3px 3px 0 0', boxSizing: 'border-box' }} />
              </div>
              <span style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: isSun ? 'var(--fg-expense)' : isSat ? 'var(--fg-brand)' : 'var(--fg-tertiary)' }}>{t(k)}</span>
            </div>
          )
        })}
      </div>
      {wkDeltaKey && wkDelta.delta !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)' }}>
          <Sparkles size={14} style={{ color: 'var(--fg-brand)', flexShrink: 0 }} />
          <span>
            {t(wkDelta.delta < 0 ? 'compare.weekdayInsightDown' : 'compare.weekdayInsightUp', {
              dow: t(wkDeltaKey),
              amt: KRW(Math.abs(wkDelta.delta)),
            })}
          </span>
        </div>
      )}
    </Section>
  )

  const Content =
    tab === 'cat' ? (
      <>
        <div
          style={{
            display: mobile ? 'flex' : 'grid',
            flexDirection: 'column',
            gridTemplateColumns: mobile ? undefined : '1.4fr 1fr',
            gap: mobile ? 'var(--spacing-2xl)' : 20,
            marginBottom: mobile ? 'var(--spacing-2xl)' : 20,
          }}
        >
          {DonutCard}
          {TopMerchantsCard}
        </div>
        <div style={{ marginBottom: mobile ? 'var(--spacing-2xl)' : 20 }}>{HeatmapCard}</div>
        {HighlightsGrid}
      </>
    ) : tab === 'trend' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 'var(--spacing-2xl)' : 20 }}>
        {TrendBig}
        {TrendStats}
        {SavingsBars}
        {CatTrend}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 'var(--spacing-2xl)' : 20 }}>
        {CompareSummary}
        {CompareMetrics}
        {CompareCategory}
        {CompareWeekday}
      </div>
    )

  // Suppress unused warning if totalIncome isn't used elsewhere
  void totalIncome

  // 정적 틀(탭·헤더)은 항상 실제 렌더 — 스켈레톤은 콘텐츠 영역에만(서버 데이터 자리).
  const content = shouldShowSkeleton ? <StatsPageSkeleton mobile={mobile} tab={tab} /> : Content

  if (mobile) {
    // 탭은 화면 가로 전체 + bg-surface 띠 (모바일 앱과 매칭, header 바로 아래 고정).
    // viewport fit 패턴 — AppLayout `.m-scroll` 가 flex-col 이므로 페이지 root 는
    // flex-1 + min-h-0 으로 부모 전체 height 차지. 탭 띠는 shrink-0 로 상단 고정,
    // Content 만 별도 overflow-y-auto 스크롤 영역(좌우 20, 상하 24 padding).
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0" style={{ background: 'var(--bg-surface)' }}>
          {StatsTabs}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide" style={{ padding: '20px 24px 24px' }}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>{t('page.title')}</h1>
          <div className="sub">{t('page.subtitle')}</div>
        </div>
      </div>
      {StatsTabs}
      {content}
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// RangePickerSheet — 직접 기간 선택 모달.
// - quick chip: 최근 7일/30일/3개월/6개월/1년 (클릭 시 from/to 자동 set)
// - 시작 / 종료 InputDatePicker (수동 조정 가능)
// - 적용 버튼: 확정 후 confirm
// ───────────────────────────────────────────────────────────
const QUICK_RANGES: { labelKey: string; days: number }[] = [
  { labelKey: 'picker.last7d', days: 7 },
  { labelKey: 'picker.last30d', days: 30 },
  { labelKey: 'picker.last3m', days: 90 },
  { labelKey: 'picker.last6m', days: 180 },
  { labelKey: 'picker.last1y', days: 365 },
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
  const { t } = useTranslation('stats')
  const { t: tc } = useTranslation('common')
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
        <Tabs
          value={segMode}
          onValueChange={(v) => { if (v) setSeg(v as SegMode) }}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="m" className="flex-1">{t('picker.segMonth')}</TabsTrigger>
            <TabsTrigger value="q" className="flex-1">{t('picker.segQuarter')}</TabsTrigger>
            <TabsTrigger value="y" className="flex-1">{t('picker.segYear')}</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">{t('picker.segCustom')}</TabsTrigger>
          </TabsList>
        </Tabs>
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
              {t(q.labelKey)}
            </button>
          ))}
        </div>
      )}
    </>
  )

  const cancelBtn = <Button variant="ghost" onClick={onCancel}>{tc('cancel')}</Button>
  const applyBtn = (
    <Button disabled={!canApply} onClick={() => canApply && onConfirm({ from, to, segMode })}>{t('picker.apply')}</Button>
  )

  // 모바일: Drawer (bottom sheet) — 모든 dialog 가 모바일에서 drawer 로 표시되는 패턴 정합.
  if (mobile) {
    return (
      <Drawer open onOpenChange={(o) => { if (!o) onCancel() }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex-1">{t('picker.title')}</DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label={tc('close')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </DrawerClose>
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
          <DialogTitle>{t('picker.title')}</DialogTitle>
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
