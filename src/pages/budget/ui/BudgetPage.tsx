import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Settings } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import {
  useBudgetCompliance,
  useExpenseBudgets,
  useExpenseCategories,
  useMonthlySummary,
} from '@/features/expense'
import { useUserPreferences } from '@/features/user'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { getPaletteByColor } from '@/features/porest/dialogs'

type OutletCtx = { mobile: boolean }

const currentMonthKey = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const complianceChartConfig = {
  percent: { label: '이행률', color: 'var(--mossy-600)' },
} satisfies ChartConfig

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
        fontSize: 11,
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
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 11.5,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4 }}>
        {d.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: 2,
            background: over ? 'var(--berry-500)' : 'var(--mossy-600)',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>한도 대비</span>
        <span
          className="num"
          style={{
            marginLeft: 'auto', fontSize: 12, fontWeight: 700,
            color: over ? 'var(--berry-700)' : 'var(--fg-primary)',
          }}
        >
          {p.toFixed(1)}%
        </span>
      </div>
      <div style={{
        marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <div style={{ display: 'flex', fontSize: 11, color: 'var(--fg-secondary)' }}>
          <span>지출</span>
          <span className="num" style={{ marginLeft: 'auto', fontWeight: 600 }}>
            <MaskAmount mask="••••">{Number(d.spent ?? 0).toLocaleString('ko-KR')}</MaskAmount>
            <HideUnit>원</HideUnit>
          </span>
        </div>
        <div style={{ display: 'flex', fontSize: 11, color: 'var(--fg-secondary)' }}>
          <span>한도</span>
          <span className="num" style={{ marginLeft: 'auto', fontWeight: 600 }}>
            <MaskAmount mask="••••">{Number(d.limit ?? 0).toLocaleString('ko-KR')}</MaskAmount>
            <HideUnit>원</HideUnit>
          </span>
        </div>
      </div>
    </div>
  )
}

export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const navigate = useNavigate()
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey())
  const [year, month] = monthKey.split('-').map(Number) as [number, number]

  const budgetsQ = useExpenseBudgets({ year, month })
  const summaryQ = useMonthlySummary(year, month)
  const categoriesQ = useExpenseCategories()
  const complianceQ = useBudgetCompliance(6)
  const preferencesQ = useUserPreferences()

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
    <Card
      variant="brand"
      style={{ padding: mobile ? 18 : 24, marginBottom: mobile ? 12 : 0 }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--fg-brand-strong)',
          fontWeight: 600,
          letterSpacing: '0.02em',
          marginBottom: 2,
        }}
      >
        {month}월 전체 상한
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--fg-tertiary)',
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        이번 달 전체 지출의 상한이에요 (카테고리 예산이 없는 지출도 포함).
      </div>
      {overallBudget ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <div
              className="num"
              style={{ fontSize: mobile ? 24 : 30, fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              <MaskAmount mask="••••">{KRW(totalSpent)}</MaskAmount>
            </div>
            <div style={{ fontSize: 14, color: 'var(--fg-secondary)', fontWeight: 500 }}>
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
              fontSize: 12,
              color: 'var(--fg-secondary)',
              marginTop: 8,
            }}
          >
            <span>{pct.toFixed(0)}% 사용</span>
            <span>
              {totalLimit - totalSpent >= 0
                ? <>남은 예산 <MaskAmount mask="••••">{KRW(totalLimit - totalSpent)}</MaskAmount><HideUnit>원</HideUnit></>
                : <>한도 <MaskAmount mask="••••">{KRW(totalSpent - totalLimit)}</MaskAmount><HideUnit>원</HideUnit> 초과</>}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              paddingTop: 14,
              marginTop: 14,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                전체 상한
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                <MaskAmount mask="••••">{KRW(overallLimit)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                카테고리 할당
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                <MaskAmount mask="••••">{KRW(categoryLimitSum)}</MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                할당 가능
              </div>
              <div
                className="num"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: overAllocated ? 'var(--berry-700)' : 'var(--mossy-700)',
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
                border: '1px solid var(--berry-300)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--status-danger-fg)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={13} />
              카테고리 한도 합이 전체 상한을 <MaskAmount mask="••••">{KRW(categoryLimitSum - overallLimit)}</MaskAmount><HideUnit>원</HideUnit> 초과했어요.
              전체 상한을 올리거나 카테고리 한도를 줄여주세요.
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: '14px 0 2px',
            fontSize: 13,
            color: 'var(--fg-secondary)',
            lineHeight: 1.6,
          }}
        >
          전체 상한이 아직 설정되지 않았어요. 우측 상단 <strong>예산 설정</strong> 버튼으로 이번 달 최대 지출 한도를 지정할 수 있어요.
          {categoryLimitSum > 0 && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
              현재 카테고리 한도 합계: <MaskAmount mask="••••">{KRW(categoryLimitSum)}</MaskAmount><HideUnit>원</HideUnit>
            </div>
          )}
        </div>
      )}
    </Card>
  )

  const PaceCard = (
    <Card style={{ padding: 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 15 }}>지출 페이스</CardTitle>
        <Badge
          variant={onTrack ? 'success' : 'warning'}
          style={{ marginLeft: 'auto' }}
        >
          {onTrack ? '정상 속도' : '빠른 속도'}
        </Badge>
      </CardHeader>
      <div
        style={{
          position: 'relative',
          height: 12,
          background: 'var(--pd-surface-inset)',
          borderRadius: 99,
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
            background: pct > 100 ? 'var(--berry-500)' : 'var(--bg-brand)',
            borderRadius: 99,
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
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--fg-tertiary)',
          marginBottom: 16,
        }}
      >
        <span>{pct.toFixed(0)}% 사용</span>
        <span>이번 달 {daysElapsedPct.toFixed(0)}% 경과 ↑</span>
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
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>
            일평균 지출
          </div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <MaskAmount mask="••••">{KRW(dailyActual)}</MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
            </HideUnit>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>
            남은 일 권장 지출
          </div>
          <div
            className="num"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--fg-brand-strong)',
            }}
          >
            <MaskAmount mask="••••">{KRW(dailyTarget)}</MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
            </HideUnit>
          </div>
        </div>
      </div>
    </Card>
  )

  const StatusTiles = (
    <Card style={{ padding: 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 15 }}>예산 현황</CardTitle>
      </CardHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div
          style={{
            padding: 14,
            background: overList.length > 0 ? 'var(--status-danger-subtle)' : 'var(--bg-surface)',
            border: `1px solid ${overList.length > 0 ? 'var(--berry-300)' : 'var(--border-subtle)'}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: overList.length > 0 ? 'var(--berry-700)' : 'var(--fg-tertiary)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <AlertTriangle size={13} /> 초과
          </div>
          <div
            className="num"
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: overList.length > 0 ? 'var(--berry-700)' : 'var(--fg-primary)',
            }}
          >
            {overList.length}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              카테고리
            </span>
          </div>
        </div>
        <div
          style={{
            padding: 14,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'var(--mossy-700)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <CheckCircle2 size={13} /> 여유
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {healthyList.length}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              카테고리
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  const ComplianceCard = (() => {
    const rows = complianceQ.data ?? []
    const data = rows.map(b => ({
      label: `${b.month}월`,
      percent: b.compliancePercent,
      limit: b.totalLimit,
      spent: b.totalSpent,
      year: b.year,
      month: b.month,
      active: b.year === year && b.month === month,
    }))
    return (
      <Card style={{ padding: 22 }}>
        <CardHeader style={{ marginBottom: 16 }}>
          <CardTitle style={{ fontSize: 15 }}>최근 6개월 예산 이행률</CardTitle>
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
            한도 대비 지출 %
          </span>
        </CardHeader>
        {complianceQ.isLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
            불러오는 중…
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
            아직 이행률 데이터가 없어요
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
                cursor={{ fill: 'var(--mossy-500)', fillOpacity: 0.06 }}
                content={<ComplianceTooltip />}
              />
              <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive>
                {data.map(d => (
                  <Cell
                    key={`${d.year}-${d.month}`}
                    fill={
                      d.percent > 100
                        ? 'var(--berry-500)'
                        : d.active
                          ? 'var(--mossy-600)'
                          : 'var(--pd-divider-strong)'
                    }
                  />
                ))}
                <LabelList
                  dataKey="percent"
                  position="top"
                  formatter={(v: unknown) => `${Math.round(Number(v ?? 0))}%`}
                  style={{ fontSize: 11, fontWeight: 700, fill: 'var(--fg-primary)' }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </Card>
    )
  })()

  const ListCard = (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 15 }}>카테고리별 예산</CardTitle>
        <span style={{ marginLeft: 8, fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
          {categoryBudgets.length}개 설정됨
        </span>
      </CardHeader>
      {isLoading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          불러오는 중…
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          <div>카테고리별 예산이 없어요</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            style={{ marginTop: 10, color: 'var(--fg-brand-strong)' }}
            onClick={goToSettings}
          >
            예산 설정하러 가기 →
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {categoryBudgets.map(b => {
            const catId = b.categoryRowId as number
            const cat = categoryMap.get(catId)
            const palette = getPaletteByColor(cat?.color)
            const name = cat?.categoryName ?? b.categoryName ?? `카테고리 #${catId}`
            const spent = spentByCategory.get(catId) ?? 0
            const limit = b.budgetAmount
            const p = limit > 0 ? (spent / limit) * 100 : 0
            const state = p > 100 ? 'over' : p > warnThreshold ? 'warn' : ''

            return (
              <div key={b.rowId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    className="cat-row__icon"
                    style={{
                      background: palette.bg,
                      color: palette.color,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {state === 'over'
                        ? <>한도 <MaskAmount mask="••••">{KRW(spent - limit)}</MaskAmount><HideUnit>원</HideUnit> 초과</>
                        : <>남은 예산 <MaskAmount mask="••••">{KRW(Math.max(0, limit - spent))}</MaskAmount><HideUnit>원</HideUnit></>}
                    </div>
                  </div>
                  <div className="num" style={{ textAlign: 'right', minWidth: 90 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: state === 'over' ? 'var(--berry-700)' : 'var(--fg-primary)',
                      }}
                    >
                      <MaskAmount mask="••••">{KRW(spent)}</MaskAmount>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500 }}>
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
    </Card>
  )

  const PageControls = (
    <>
      <MonthPicker value={monthKey} onChange={setMonthKey} />
      <Button
        size="sm"
        type="button"
        onClick={goToSettings}
      >
        <Settings size={14} /> 예산 설정
      </Button>
    </>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {PageControls}
        </div>
        {HeaderCard}
        {PaceCard}
        {StatusTiles}
        {ListCard}
        {ComplianceCard}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>예산</h1>
          <div className="sub">카테고리별 한도 관리</div>
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
