import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import { formatMonthShort } from '@/shared/lib/date'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import {
  useBudgetCompliance,
  useExpenseBudgets,
  useExpenseCategories,
  useRangeSummary,
} from '@/features/expense'
import { useUserPreferences } from '@/features/user'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { getPaletteByColor } from '@/features/porest/dialogs'

type OutletCtx = { mobile: boolean }

const currentMonthKey = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

type ComplianceTickProps = {
  x?: string | number
  y?: string | number
  payload?: { value?: string; index?: number }
}

// 마지막(이번 달) 레이블만 볼드 + primary 컬러.
function ComplianceMonthTick({ x, y, payload }: ComplianceTickProps) {
  const last = (payload?.index ?? 0) === 5
  const yNum = typeof y === 'number' ? y : Number(y ?? 0)
  return (
    <text
      x={x}
      y={yNum + 14}
      textAnchor="middle"
      style={{
        fontSize: 'var(--text-badge)',
        fontWeight: last ? 700 : 500,
        fill: last ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
      }}
    >
      {payload?.value}
    </text>
  )
}

type CompliancePayload = {
  payload?: { label?: string; percent?: number; limit?: number; spent?: number }
}

function ComplianceTooltip({ active, payload }: { active?: boolean; payload?: CompliancePayload[] }) {
  const { t } = useTranslation('budget')
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const p = Number(d.percent ?? 0)
  const over = p > 100
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 'var(--text-caption)',
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '600', marginBottom: 4 }}>
        {d.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: 'var(--radius-xs)',
            background: over ? 'var(--fg-expense)' : 'var(--bg-brand)',
          }}
        />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{t('vsLimit')}</span>
        <span
          className="num"
          style={{
            marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700',
            color: over ? 'var(--fg-expense)' : 'var(--fg-primary)',
          }}
        >
          {p.toFixed(1)}%
        </span>
      </div>
      <div style={{
        marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <div style={{ display: 'flex', fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>
          <span>{t('spent')}</span>
          <span className="num" style={{ marginLeft: 'auto', fontWeight: '600' }}>
            <MaskAmount mask="••••">{Number(d.spent ?? 0).toLocaleString('ko-KR')}</MaskAmount>
            <HideUnit>원</HideUnit>
          </span>
        </div>
        <div style={{ display: 'flex', fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>
          <span>{t('limit')}</span>
          <span className="num" style={{ marginLeft: 'auto', fontWeight: '600' }}>
            <MaskAmount mask="••••">{Number(d.limit ?? 0).toLocaleString('ko-KR')}</MaskAmount>
            <HideUnit>원</HideUnit>
          </span>
        </div>
      </div>
    </div>
  )
}

/** Budget 페이지 구조에 맞춘 skeleton — HeaderCard + PaceCard + StatusTiles + ListCard + ComplianceCard. */
function BudgetPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('budget')
  const HeaderCardSkeleton = (
    <Card>
      <CardContent>
        <SkeletonBase className="h-3 w-24 mb-2" />
        <SkeletonBase className="h-3 w-3/4 mb-3" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <SkeletonBase className={mobile ? 'h-7 w-32' : 'h-9 w-40'} />
          <SkeletonBase className="h-4 w-28" />
        </div>
        <SkeletonBase className="h-2.5 w-full rounded-full" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-3 w-24" />
        </div>
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            paddingTop: 14, marginTop: 14,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {[0, 1, 2].map(i => (
            <div key={i}>
              <SkeletonBase className="h-3 w-16 mb-2" />
              <SkeletonBase className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const PaceCardSkeleton = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-24" />
        <SkeletonBase className="h-6 w-16 rounded-full" />
      </CardHeader>
      <CardContent>
        <SkeletonBase className="h-3 w-full rounded-full mb-3" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-3 w-24" />
        </div>
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {[0, 1].map(i => (
            <div key={i}>
              <SkeletonBase className="h-3 w-20 mb-2" />
              <SkeletonBase className="h-6 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const StatusTilesSkeleton = (
    <Card>
      <CardHeader>
        <SkeletonBase className="h-5 w-20" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[0, 1].map(i => (
            <div
              key={i}
              style={{
                padding: 12,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <SkeletonBase className="h-3 w-10 mb-2" />
              <SkeletonBase className="h-7 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const ListCardSkeleton = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-28" />
        <SkeletonBase className="h-3 w-16" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-9 w-9 rounded-lg shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <SkeletonBase className="h-4 w-20 mb-1 ml-auto" />
                  <SkeletonBase className="h-3 w-16 ml-auto" />
                </div>
              </div>
              <SkeletonBase className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const ComplianceCardSkeleton = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-44" />
        <SkeletonBase className="h-3 w-24" />
      </CardHeader>
      <CardContent>
        <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 12, paddingTop: 24 }}>
          {[0.6, 0.8, 0.5, 0.9, 0.7, 1.0].map((h, i) => (
            <SkeletonBase
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h * 80}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (mobile) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <SkeletonBase className="h-8 w-32" />
          <SkeletonBase className="h-8 w-24" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HeaderCardSkeleton}
          {PaceCardSkeleton}
          {StatusTilesSkeleton}
          {ListCardSkeleton}
          {ComplianceCardSkeleton}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>{t('pageTitle')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {HeaderCardSkeleton}
          {PaceCardSkeleton}
          {StatusTilesSkeleton}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ListCardSkeleton}
          {ComplianceCardSkeleton}
        </div>
      </div>
    </div>
  )
}

export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { t } = useTranslation('budget')
  const navigate = useNavigate()
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey())
  const [year, month] = monthKey.split('-').map(Number) as [number, number]

  const budgetsQ = useExpenseBudgets({ year, month })
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(monthEndDay).padStart(2, '0')}`
  const summaryQ = useRangeSummary(monthStart, monthEnd)
  const categoriesQ = useExpenseCategories()
  const complianceQ = useBudgetCompliance(6)
  const preferencesQ = useUserPreferences()

  // 첫 진입 시 모든 데이터 도착 전까지 한 번만 skeleton — 이후 monthKey 변경은 부분 로딩.
  const pageDataLoading =
    budgetsQ.isLoading || summaryQ.isLoading || categoriesQ.isLoading
    || complianceQ.isLoading || preferencesQ.isLoading
  const [hasEverLoaded, setHasEverLoaded] = useState(false)
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중에 동기 set (React 권장 패턴).
  if (!pageDataLoading && !hasEverLoaded) setHasEverLoaded(true)
  const shouldShowSkeleton = pageDataLoading && !hasEverLoaded

  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85
  const warnRatio = warnThreshold / 100

  const goToSettings = () => navigate('/desk/settings?section=budget')

  const budgets: ExpenseBudget[] = budgetsQ.data ?? []
  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    for (const c of categoriesQ.data ?? []) map.set(c.rowId, c)
    return map
  }, [categoriesQ.data])

  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of summaryQ.data?.categoryBreakdown ?? []) {
      map.set(c.categoryRowId, (map.get(c.categoryRowId) ?? 0) + c.totalAmount)
      if (c.parentCategoryRowId != null) {
        map.set(c.parentCategoryRowId, (map.get(c.parentCategoryRowId) ?? 0) + c.totalAmount)
      }
    }
    return map
  }, [summaryQ.data])

  const totalExpense = summaryQ.data?.totalExpense ?? 0
  const overallBudget = budgets.find(b => b.categoryRowId === null)
  const categoryBudgets = budgets.filter(b => b.categoryRowId !== null)

  // 카테고리 한도 합
  const categoryLimitSum = categoryBudgets.reduce((s, b) => s + b.budgetAmount, 0)
  // 월 전체 상한(overall). 없으면 카테고리 합을 대체 값으로 사용.
  const totalLimit = overallBudget?.budgetAmount ?? categoryLimitSum
  // 전체 지출은 언제나 이번 달 EXPENSE 총합 (미분류 포함)
  const totalSpent = totalExpense
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const headerState = pct > 100 ? 'over' : pct > warnThreshold ? 'warn' : ''
  const isLoading = budgetsQ.isLoading || summaryQ.isLoading

  // 전체 상한 대비 카테고리 할당 상태
  const overallLimit = overallBudget?.budgetAmount ?? 0
  const allocable = overallLimit - categoryLimitSum
  const overAllocated = overallBudget != null && categoryLimitSum > overallLimit

  // Pace
  const today = new Date()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayOfMonth = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate()
    : daysInMonth
  const daysElapsedPct = (dayOfMonth / daysInMonth) * 100
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth)
  const dailyActual = Math.round(totalSpent / Math.max(1, dayOfMonth))
  const dailyTarget = Math.round(Math.max(0, totalLimit - totalSpent) / daysRemaining)
  const onTrack = pct <= daysElapsedPct + 5

  // 상태 집계
  const overList = categoryBudgets.filter(b => {
    if (b.categoryRowId == null) return false
    const spent = spentByCategory.get(b.categoryRowId) ?? 0
    return spent > b.budgetAmount
  })
  const healthyList = categoryBudgets.filter(b => {
    if (b.categoryRowId == null) return false
    const spent = spentByCategory.get(b.categoryRowId) ?? 0
    return b.budgetAmount > 0 && spent / b.budgetAmount <= warnRatio
  })

  // ---- Cards ----
  const HeaderCard = (
    <Card style={{ background: 'linear-gradient(var(--bg-brand-tint), var(--bg-brand-tint)), var(--bg-surface)' }}>
      <CardContent>
      <div
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--fg-brand-strong)',
          fontWeight: '600',
          letterSpacing: '0.04em',
          marginBottom: 2,
        }}
      >
        {t('monthlyCap', { month })}
      </div>
      <div
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--fg-tertiary)',
          lineHeight: '1.5',
          marginBottom: 10,
        }}
      >
        {t('capHint')}
      </div>
      {overallBudget ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <div
              className="num"
              style={{ fontSize: mobile ? 24 : 30, fontWeight: '800', letterSpacing: '-0.022em' }}
            >
              <MaskAmount mask="••••">{KRW(totalSpent)}</MaskAmount>
            </div>
            <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', fontWeight: '500' }}>
              / <MaskAmount mask="••••">{KRW(totalLimit)}</MaskAmount>
              <HideUnit>원</HideUnit>
            </div>
          </div>
          <div className="budget-bar" style={{ height: 10 }}>
            <div
              className={`budget-bar__fill ${headerState}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-secondary)',
              marginTop: 8,
            }}
          >
            <span>{pct.toFixed(0)}% {t('manager.spent')}</span>
            <span style={{ color: totalLimit - totalSpent < 0 ? 'var(--fg-expense)' : undefined }}>
              {totalLimit - totalSpent >= 0
                ? <>{t('manager.remaining')} <MaskAmount mask="••••">{KRW(totalLimit - totalSpent)}</MaskAmount><HideUnit>원</HideUnit></>
                : <>{t('limit')} <MaskAmount mask="••••">{KRW(totalSpent - totalLimit)}</MaskAmount><HideUnit>원</HideUnit> {t('over')}</>}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              paddingTop: 14,
              marginTop: 14,
              borderTop: '1px solid color-mix(in srgb, var(--border-strong) 28%, var(--border-subtle))',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('totalCap')}
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(overallLimit)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('categoryAllocated')}
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(categoryLimitSum)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('manager.assignable')}
              </div>
              <div
                className="num"
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: '700',
                  color: overAllocated ? 'var(--fg-expense)' : 'var(--fg-income)',
                }}
              >
                <MaskAmount mask="••••">
                  {overAllocated ? '−' : '+'}
                  {KRW(Math.abs(allocable))}
                </MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
          </div>
          {overAllocated && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'var(--status-danger-subtle)',
                border: '1px solid color-mix(in oklch, var(--fg-expense) 30%, transparent)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-caption)',
                color: 'var(--status-danger-fg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {t('manager.overCapPre')} <MaskAmount mask="••••">{KRW(categoryLimitSum - overallLimit)}</MaskAmount><HideUnit>원</HideUnit> {t('manager.overCapPost')}
              </span>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: '14px 0 2px',
            fontSize: 'var(--text-label-sm)',
            color: 'var(--fg-secondary)',
            lineHeight: '1.7',
          }}
        >
          {t('capUnsetPre')} <strong>{t('manager.setBudget')}</strong> {t('capUnsetPost')}
          {categoryLimitSum > 0 && (
            <div style={{ marginTop: 8, fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              {t('currentCategorySum')}: <MaskAmount mask="••••">{KRW(categoryLimitSum)}</MaskAmount><HideUnit>원</HideUnit>
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )

  const PaceCard = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('spendingPace')}</CardTitle>
        <Badge
          variant={onTrack ? 'success' : 'warning'}
          // 색은 앱 정합 — 다크에서 -fg(light variant)·-subtle 로 (text-warning 고정 base 대신)
          className={onTrack
            ? 'bg-[var(--status-success-subtle)] text-[var(--status-success-fg)]'
            : 'bg-[var(--status-warning-subtle)] text-[var(--status-warning-fg)]'}
        >
          {onTrack ? t('paceNormal') : t('paceFast')}
        </Badge>
      </CardHeader>
      <CardContent>
      <div
        style={{
          position: 'relative',
          height: 12,
          background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            background: pct > 100 ? 'var(--fg-expense)' : 'var(--bg-brand)',
            borderRadius: 'var(--radius-pill)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${daysElapsedPct}%`,
            top: -3,
            width: 2,
            height: 18,
            background: 'var(--fg-primary)',
            borderRadius: 'var(--radius-xs)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--text-caption)',
          color: 'var(--fg-tertiary)',
          marginBottom: 16,
        }}
      >
        <span>{pct.toFixed(0)}% {t('manager.spent')}</span>
        <span>{t('monthElapsed', { percent: daysElapsedPct.toFixed(0) })}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>
            {t('dailyAvg')}
          </div>
          <div className="num" style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', letterSpacing: '-0.022em' }}>
            <MaskAmount mask="••••">{KRW(dailyActual)}</MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
            </HideUnit>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 4 }}>
            {t('recommendedDaily')}
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-title-md)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              color: 'var(--fg-brand-strong)',
            }}
          >
            <MaskAmount mask="••••">{KRW(dailyTarget)}</MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
            </HideUnit>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )

  const StatusTiles = (
    <Card>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('status')}</CardTitle>
      </CardHeader>
      <CardContent>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div
          style={{
            padding: 12,
            background: overList.length > 0 ? 'var(--status-danger-subtle)' : 'var(--bg-surface)',
            border: `1px solid ${overList.length > 0 ? 'color-mix(in oklch, var(--fg-expense) 30%, transparent)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--text-caption)',
              color: overList.length > 0 ? 'var(--fg-expense)' : 'var(--fg-tertiary)',
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            <AlertTriangle size={13} /> {t('over')}
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-display-sm)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              color: overList.length > 0 ? 'var(--fg-expense)' : 'var(--fg-primary)',
            }}
          >
            {overList.length}
            <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              {t('edit.categoryLabel')}
            </span>
          </div>
        </div>
        <div
          style={{
            padding: 12,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-income)',
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            <CheckCircle2 size={13} /> {t('healthy')}
          </div>
          <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: '700', letterSpacing: '-0.022em' }}>
            {healthyList.length}
            <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              {t('edit.categoryLabel')}
            </span>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )

  const ComplianceCard = (() => {
    const rows = complianceQ.data ?? []
    const complianceChartConfig = {
      percent: { label: t('complianceRate'), color: 'var(--bg-brand)' },
    } satisfies ChartConfig
    const data = rows.map(b => ({
      label: formatMonthShort(b.month),
      percent: b.compliancePercent,
      limit: b.totalLimit,
      spent: b.totalSpent,
      year: b.year,
      month: b.month,
      active: b.year === year && b.month === month,
    }))
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('complianceTitle')}</CardTitle>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            {t('vsLimitSpending')}
          </span>
        </CardHeader>
        <CardContent>
        {complianceQ.isLoading ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'end', justifyContent: 'space-around', padding: '24px 8px 8px', gap: 12 }}>
            {[60, 80, 45, 70, 90, 55].map((h, i) => (
              <SkeletonBase
                key={i}
                className="rounded-t flex-1"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
            {t('noComplianceData')}
          </div>
        ) : (
          <ChartContainer
            config={complianceChartConfig}
            className="aspect-auto w-full"
            style={{ height: 180 }}
          >
            <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 8 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={ComplianceMonthTick}
                tickMargin={6}
              />
              <YAxis hide domain={[0, (dmax: number) => Math.max(100, dmax)]} />
              <ChartTooltip
                cursor={{ fill: 'var(--border-brand)', fillOpacity: 0.06 }}
                content={<ComplianceTooltip />}
              />
              <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive>
                {data.map(d => (
                  <Cell
                    key={`${d.year}-${d.month}`}
                    fill={
                      d.percent > 100
                        ? 'var(--fg-expense)'
                        : d.active
                          ? 'var(--bg-brand)'
                          : 'var(--border-strong)'
                    }
                  />
                ))}
                <LabelList
                  dataKey="percent"
                  position="top"
                  formatter={(v: unknown) => `${Math.round(Number(v ?? 0))}%`}
                  style={{ fontSize: 'var(--text-badge)', fontWeight: '700', fill: 'var(--fg-primary)' }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
        </CardContent>
      </Card>
    )
  })()

  const ListCard = (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('categoryBudgets')}</CardTitle>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
          {t('countSet', { count: categoryBudgets.length })}
        </span>
      </CardHeader>
      <CardContent>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-9 w-9 rounded-lg shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <SkeletonBase className="h-4 w-20 mb-1 ml-auto" />
                  <SkeletonBase className="h-3 w-16 ml-auto" />
                </div>
              </div>
              <SkeletonBase className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
          <div>{t('noCategoryBudgets')}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            style={{ marginTop: 10, color: 'var(--fg-brand-strong)' }}
            onClick={goToSettings}
          >
            {t('goSetBudget')}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {categoryBudgets.map(b => {
            const catId = b.categoryRowId as number
            const cat = categoryMap.get(catId)
            const palette = getPaletteByColor(cat?.color)
            const name = cat?.categoryName ?? b.categoryName ?? t('manager.categoryFallback', { id: catId })
            const spent = spentByCategory.get(catId) ?? 0
            const limit = b.budgetAmount
            const p = limit > 0 ? (spent / limit) * 100 : 0
            const state = p > 100 ? 'over' : p > warnThreshold ? 'warn' : ''

            return (
              <div key={b.rowId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-tile)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: '700',
                      background: palette.bg,
                      color: palette.color,
                    }}
                  >
                    <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{name}</div>
                    <div style={{ fontSize: 'var(--text-caption)', color: state === 'over' ? 'var(--fg-expense)' : 'var(--fg-tertiary)', marginTop: 1 }}>
                      {state === 'over'
                        ? <>{t('limit')} <MaskAmount mask="••••">{KRW(spent - limit)}</MaskAmount><HideUnit>원</HideUnit> {t('over')}</>
                        : <>{t('manager.remaining')} <MaskAmount mask="••••">{KRW(Math.max(0, limit - spent))}</MaskAmount><HideUnit>원</HideUnit></>}
                    </div>
                  </div>
                  <div className="num" style={{ textAlign: 'right', minWidth: 90 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: '700',
                        color: state === 'over' ? 'var(--fg-expense)' : 'var(--fg-primary)',
                      }}
                    >
                      <MaskAmount mask="••••">{KRW(spent)}</MaskAmount>
                    </div>
                    <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
                      / <MaskAmount mask="••••">{KRW(limit)}</MaskAmount>
                    </div>
                  </div>
                </div>
                <div className="budget-bar" style={{ height: 7 }}>
                  <div
                    className={`budget-bar__fill ${state}`}
                    style={{ width: `${Math.min(100, p)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
      </CardContent>
    </Card>
  )

  const adjustMonth = (delta: number) => {
    const [y, m] = monthKey.split('-').map(Number) as [number, number]
    let ny = y
    let nm = m + delta
    if (nm < 1) { ny -= 1; nm = 12 }
    if (nm > 12) { ny += 1; nm = 1 }
    setMonthKey(`${ny}-${String(nm).padStart(2, '0')}`)
  }
  const PageControls = (
    <>
      <Button variant="ghost" size="icon" type="button" aria-label={t('prevMonth')} onClick={() => adjustMonth(-1)}>
        <ChevronLeft size={16} />
      </Button>
      <MonthPicker value={monthKey} onChange={setMonthKey} variant="borderless" />
      <Button variant="ghost" size="icon" type="button" aria-label={t('nextMonth')} onClick={() => adjustMonth(1)}>
        <ChevronRight size={16} />
      </Button>
      <Button
        variant="accent"
        size="sm"
        type="button"
        onClick={goToSettings}
        style={{ marginLeft: 'auto' }}
      >
        <Settings size={14} /> {t('settings')}
      </Button>
    </>
  )

  if (shouldShowSkeleton) return <BudgetPageSkeleton mobile={mobile} />

  if (mobile) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {PageControls}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HeaderCard}
          {PaceCard}
          {StatusTiles}
          {ListCard}
          {ComplianceCard}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>{t('pageTitle')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">{PageControls}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {HeaderCard}
          {PaceCard}
          {StatusTiles}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ListCard}
          {ComplianceCard}
        </div>
      </div>
    </div>
  )
}
