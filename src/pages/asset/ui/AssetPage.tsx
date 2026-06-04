import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronRight, Eye, EyeOff, Plus, RefreshCw,
  Target, TrendingDown, TrendingUp,
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { tileRadius } from '@/shared/lib'
import { KRW, formatChartAxis } from '@/shared/lib/porest/format'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  HideUnit,
  MaskAmount,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Donut } from '@/shared/ui/porest/charts'
import { useAssets, useAssetSummary, useNetWorthTrend } from '@/features/asset'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import { useSavingGoals } from '@/features/savingGoal'
import { AssetDetailDialog } from '@/widgets/asset-full/ui/AssetDetailDialog'
import { SavingGoalAddDialog } from '@/widgets/asset-full/ui/SavingGoalAddDialog'
import { AssetLogo, type Asset, type AssetType } from '@/entities/asset'
import type { SavingGoal } from '@/entities/savingGoal'

const netWorthChartConfig = {
  netWorth: { label: '순자산', color: 'var(--border-brand)' },
} satisfies ChartConfig


type NetWorthPayload = { value?: number; payload?: { monthLabel?: string } }
function NetWorthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: NetWorthPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0]?.value ?? 0)
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-tile)',
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 'var(--text-caption)',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '600', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--border-brand)' }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>순자산</span>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-primary)' }}
        >
          <MaskAmount>{KRW(v)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
    </div>
  )
}

function NetWorthChart({ height = 180 }: { height?: number }) {
  const hidden = useHideAmounts()
  const trendQ = useNetWorthTrend(12)
  const data = useMemo(
    () =>
      (trendQ.data ?? []).map(p => ({
        monthLabel: `${String(p.month).padStart(2, '0')}월`,
        netWorth: p.netWorth,
      })),
    [trendQ.data],
  )

  if (trendQ.isLoading) {
    return (
      <SkeletonBase
        className="w-full rounded-lg"
        style={{ height }}
      />
    )
  }
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg-tertiary)',
          fontSize: 'var(--text-label-sm)',
        }}
      >
        추이 데이터가 없어요
      </div>
    )
  }

  return (
    <ChartContainer
      config={netWorthChartConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--border-brand)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--border-brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          // 금액 숨기기 시 Y축도 마스킹 (앱 net_worth_chart '••••' 정합)
          tickFormatter={(v: number) => (hidden ? '••••' : formatChartAxis(v))}
          tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
          width={52}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--fg-tertiary)', strokeDasharray: '3 3' }}
          content={<NetWorthTooltip />}
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="var(--border-brand)"
          strokeWidth={2}
          fill="url(#netWorthFill)"
          dot={{ fill: 'var(--border-brand)', stroke: 'var(--bg-surface)', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: 'var(--border-brand)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

type OutletCtx = { onAddTx: () => void; mobile: boolean }

type AssetGroupKey = 'cash' | 'invest' | 'card' | 'loan'

// porest chart palette 정합 — AssetSummaryCard ASSET_TYPE_COLORS와 일관
const GROUP_META: Record<AssetGroupKey, { label: string; color: string }> = {
  cash: { label: '현금·예금', color: 'var(--color-chart-blue)' },
  invest: { label: '투자', color: 'var(--bg-brand)' },
  card: { label: '카드', color: 'var(--fg-expense)' },
  loan: { label: '대출', color: 'var(--color-chart-brown)' },
}

function AssetCompositionCard({
  accounts,
  investments,
  cards,
  loans,
  netWorth,
}: {
  accounts: Asset[]
  investments: Asset[]
  cards: Asset[]
  loans: Asset[]
  netWorth: number
}) {
  const [active, setActive] = useState<AssetGroupKey | null>(null)

  const groupAssets: Record<AssetGroupKey, Asset[]> = {
    cash: accounts,
    invest: investments,
    card: cards,
    loan: loans,
  }

  type Row = {
    key: string
    label: string
    amt: number
    color: string
    groupKey?: AssetGroupKey
    clickable: boolean
  }

  const groupRows: Row[] = (['cash', 'invest', 'card', 'loan'] as AssetGroupKey[])
    .map(g => {
      const arr = groupAssets[g]
      const amt = (g === 'card' || g === 'loan')
        ? Math.abs(arr.reduce((s, a) => s + a.balance, 0))
        : arr.reduce((s, a) => s + a.balance, 0)
      return {
        key: g,
        label: GROUP_META[g].label,
        amt,
        color: GROUP_META[g].color,
        groupKey: g,
        clickable: arr.length > 0,
      }
    })
    .filter(r => r.amt > 0)

  const drillRows: Row[] = active
    ? groupAssets[active].map(a => {
        const brand = getBrandColor(a.institution, a.assetName)
        const isDebt = active === 'card' || active === 'loan'
        return {
          key: String(a.rowId),
          label: a.institution ? `${a.institution} · ${a.assetName}` : a.assetName,
          amt: isDebt ? Math.abs(a.balance) : a.balance,
          color: a.color ?? brand?.bg ?? GROUP_META[active].color,
          clickable: false,
        }
      })
        .filter(r => r.amt > 0)
        .sort((a, b) => b.amt - a.amt)
    : []

  const rows = active ? drillRows : groupRows
  const segments = rows.map(r => ({ value: r.amt, color: r.color }))
  const denom = Math.max(1, rows.reduce((s, r) => s + r.amt, 0))

  const activeTotal = rows.reduce((s, r) => s + r.amt, 0)
  const centerLbl = active ? GROUP_META[active].label : '순자산'
  const centerVal = active
    ? activeTotal
    : netWorth

  const totalLabel = Math.abs(centerVal) >= 10_000_000
    ? `${(centerVal / 10_000_000).toFixed(2)}천만`
    : `${(centerVal / 10_000).toFixed(0)}만`

  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일 기준`

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {active ? (
            <>
              <Button
                variant="link"
                onClick={() => setActive(null)}
                className="h-auto p-0 text-body-lg font-medium text-text-secondary hover:text-text-primary no-underline hover:no-underline"
              >
                자산 구성
              </Button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}>›</span>
              <span>{GROUP_META[active].label}</span>
            </>
          ) : (
            '자산 구성'
          )}
        </CardTitle>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
          {dateLabel}
        </span>
      </CardHeader>
      <CardContent>
      {segments.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
          {active ? '등록된 항목이 없어요' : '자산 데이터가 없어요'}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Donut size={180} stroke={24} segments={segments}>
            <div className="lbl">{centerLbl}</div>
            <div className="val num" style={{ fontSize: 'var(--text-body-lg)' }}>
              <MaskAmount mask="••••">{totalLabel}</MaskAmount>
            </div>
          </Donut>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {rows.map(row => {
              const pct = (row.amt / denom) * 100
              return (
                <div
                  key={row.key}
                  role={row.clickable ? 'button' : undefined}
                  tabIndex={row.clickable ? 0 : undefined}
                  onClick={row.clickable ? () => row.groupKey && setActive(row.groupKey) : undefined}
                  onKeyDown={row.clickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (row.groupKey) setActive(row.groupKey)
                    }
                  } : undefined}
                  style={{
                    cursor: row.clickable ? 'pointer' : 'default',
                    borderRadius: 'var(--radius-md)',
                    padding: row.clickable ? '4px 6px' : undefined,
                    margin: row.clickable ? '0 -6px' : undefined,
                    transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
                  }}
                  onMouseEnter={row.clickable ? (e) => { e.currentTarget.style.background = 'var(--bg-muted)' } : undefined}
                  onMouseLeave={row.clickable ? (e) => { e.currentTarget.style.background = 'transparent' } : undefined}
                  title={row.clickable ? '클릭하여 하위 자산 보기' : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 'var(--radius-xs)', background: row.color, flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 'var(--text-label-sm)',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.label}
                    </span>
                    <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
                      <MaskAmount mask="••••">{KRW(row.amt)}</MaskAmount>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        flex: 1, height: 6, background: 'var(--bg-sunken)',
                        borderRadius: 'var(--radius-pill)', overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`, height: '100%',
                          background: row.color, borderRadius: 'var(--radius-pill)',
                        }}
                      />
                    </div>
                    <span
                      className="num"
                      style={{
                        fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-tertiary)',
                        minWidth: 40, textAlign: 'right',
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  )
}

function UpcomingBillsCard() {
  const navigate = useNavigate()
  // 백엔드에서 EXPENSE·활성·nextDate>=today 필터 + limit 6 — 프론트 필터 불필요.
  const recurringQ = useRecurringTransactions({ upcoming: true, limit: 6 })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const items = (recurringQ.data ?? [])
    .filter(r => !!r.nextExecutionDate)
    .map(r => {
      const next = new Date(r.nextExecutionDate as string)
      const daysLeft = Math.round((next.getTime() - today.getTime()) / 86_400_000)
      return {
        rowId: r.rowId,
        title: r.description || r.merchant || r.categoryName,
        categoryName: r.categoryName,
        amount: r.amount,
        daysLeft,
        dateLabel: `${String(next.getMonth() + 1).padStart(2, '0')}/${String(next.getDate()).padStart(2, '0')}`,
        iso: r.nextExecutionDate as string,
      }
    })

  const goToSettings = (rowId?: number) => {
    const params = new URLSearchParams({ tab: 'settings', sub: 'recurring' })
    if (rowId) params.set('recurringId', String(rowId))
    navigate(`/desk/expense?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>예정된 결제 · 고정지출</CardTitle>
        <Button
          variant="link"
          onClick={() => goToSettings()}
          className="h-auto gap-0.5 p-0 text-body-sm font-semibold text-text-secondary hover:text-text-primary no-underline hover:no-underline"
        >
          전체 보기 <ChevronRight size={12} />
        </Button>
      </CardHeader>
      <CardContent>
      {recurringQ.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '16px 18px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-4 w-20 shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-caption)' }}>
          예정된 결제가 없어요
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {items.map(it => {
            const urgent = it.daysLeft <= 3
            return (
              <button
                key={it.rowId}
                type="button"
                onClick={() => goToSettings(it.rowId)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '16px 18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  minWidth: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: urgent ? 600 : 500,
                    color: urgent ? 'var(--fg-expense)' : 'var(--fg-tertiary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                  }}
                >
                  {it.daysLeft <= 0 ? '오늘' : `${it.daysLeft}일 후`} · {it.dateLabel}
                </span>
                <span className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em', flexShrink: 0 }}>
                  <MaskAmount mask="••••">−{KRW(it.amount)}</MaskAmount>
                </span>
              </button>
            )
          })}
        </div>
      )}
      </CardContent>
    </Card>
  )
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return '상시'
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return '상시'
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function SavingGoalItem({
  goal,
  onEdit,
}: {
  goal: SavingGoal
  onEdit: (g: SavingGoal) => void
}) {
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const color = goal.color ?? 'var(--bg-brand)'
  const iconName = (goal.icon && goal.icon.trim().length > 0 ? goal.icon : 'piggy-bank') as IconName

  return (
    <div
      onClick={() => onEdit(goal)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: tileRadius(32),
            background: `oklch(from ${color} l c h / 0.12)`,
            color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DynamicIcon name={iconName} size={15} fallback={() => <Target size={15} />} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-body-sm)', fontWeight: '600',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {goal.title}
            {goal.isAchieved === 'Y' && (
              <span
                style={{
                  marginLeft: 8,
                  padding: '1px 6px',
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                  fontSize: 'var(--text-badge)',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                달성
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
            {formatDeadline(goal.deadlineDate)}
          </div>
        </div>
        <div className="num" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
            {KRW(goal.currentAmount)} / {(goal.targetAmount / 10_000).toFixed(0)}만
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6, background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-pill)', overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`, height: '100%',
            background: color, borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
    </div>
  )
}

function SavingGoalsCard({ mobile }: { mobile: boolean }) {
  const goalsQ = useSavingGoals()
  const [dialogState, setDialogState] = useState<
    { mode: 'add' } | { mode: 'edit'; goal: SavingGoal } | null
  >(null)

  const goals = goalsQ.data?.goals ?? []
  const isLoading = goalsQ.isLoading
  const isEmpty = !isLoading && goals.length === 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>저축 목표</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setDialogState({ mode: 'add' })}
        >
          <Plus size={13} /> 목표 추가
        </Button>
      </CardHeader>
      <CardContent>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <SkeletonBase className="h-4 w-12 mb-1 ml-auto" />
                  <SkeletonBase className="h-3 w-20 ml-auto" />
                </div>
              </div>
              <SkeletonBase className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)',
              fontWeight: '500', marginBottom: 10,
            }}
          >
            저축 목표를 추가해보세요
          </div>
          <Button
            size="sm"
            type="button"
            onClick={() => setDialogState({ mode: 'add' })}
          >
            <Plus size={13} /> 첫 목표 추가하기
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {goals.map(g => (
            <SavingGoalItem
              key={g.rowId}
              goal={g}
              onEdit={goal => setDialogState({ mode: 'edit', goal })}
            />
          ))}
        </div>
      )}
      </CardContent>

      {dialogState && (
        <SavingGoalAddDialog
          goal={dialogState.mode === 'edit' ? dialogState.goal : null}
          mobile={mobile}
          onClose={() => setDialogState(null)}
        />
      )}
    </Card>
  )
}

const ACCOUNT_TYPES: AssetType[] = ['BANK_ACCOUNT', 'SAVINGS', 'CASH']
const CARD_TYPES: AssetType[] = ['CREDIT_CARD', 'CHECK_CARD']
const INVESTMENT_TYPES: AssetType[] = ['INVESTMENT']
const LOAN_TYPES: AssetType[] = ['LOAN']

/**
 * AssetPage 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계.
 * 자식 컴포넌트가 동일 쿼리를 호출해도 TanStack Query 캐시 히트라 추가 fetch 없음 —
 * 페이지 진입 시 "모든 데이터가 준비될 때까지" 하나의 로딩 게이트로 표현하기 위함.
 */
function useAssetPageData() {
  const assetsQ = useAssets()
  const summaryQ = useAssetSummary()
  const trendQ = useNetWorthTrend(12)
  const recurringQ = useRecurringTransactions({ upcoming: true, limit: 6 })
  const goalsQ = useSavingGoals()
  return {
    isLoading:
      assetsQ.isLoading || summaryQ.isLoading || trendQ.isLoading
      || recurringQ.isLoading || goalsQ.isLoading,
  }
}

/** 자산 페이지 구조와 1:1 매칭되는 skeleton. */
function AssetPageSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AssetSummarySkeleton mobile />
        <AssetCompositionSkeleton />
        <TypeGroupSkeleton rows={3} />
        <TypeGroupSkeleton rows={2} />
      </div>
    )
  }
  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>자산</h1>
          <div className="sub">모든 계좌·카드·투자를 한 곳에서</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AssetSummarySkeleton mobile={false} />
          <AssetCompositionSkeleton />
          <UpcomingBillsSkeleton />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TypeGroupSkeleton rows={3} />
          <TypeGroupSkeleton rows={2} />
          <SavingGoalsSkeleton />
        </div>
      </div>
    </div>
  )
}

function AssetSummarySkeleton({ mobile }: { mobile: boolean }) {
  return (
    <Card>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <SkeletonBase className="h-3 w-16" />
        </div>
        <SkeletonBase className={mobile ? 'h-8 w-40 mb-2' : 'h-10 w-56 mb-2'} />
        <SkeletonBase className="h-4 w-32 mb-4" />
        <SkeletonBase className={mobile ? 'h-[140px] w-full' : 'h-[180px] w-full'} />
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            paddingTop: mobile ? 14 : 20, marginTop: mobile ? 14 : 20,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {[0, 1, 2].map(i => (
            <div key={i}>
              <SkeletonBase className="h-3 w-12 mb-2" />
              <SkeletonBase className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AssetCompositionSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-20" />
        <SkeletonBase className="h-3 w-20" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <SkeletonBase className="h-[180px] w-[180px] rounded-full shrink-0" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SkeletonBase className="h-2.5 w-2.5 shrink-0" />
                  <SkeletonBase className="h-4 w-20" />
                  <SkeletonBase className="h-4 w-16 ml-auto" />
                </div>
                <SkeletonBase className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingBillsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-40" />
        <SkeletonBase className="h-4 w-16" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                <SkeletonBase className="h-3 w-1/2" />
              </div>
              <SkeletonBase className="h-4 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TypeGroupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-20" />
        <SkeletonBase className="h-4 w-16 ml-auto" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
              }}
            >
              <SkeletonBase className="h-10 w-10 rounded-md shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                <SkeletonBase className="h-3 w-1/3" />
              </div>
              <SkeletonBase className="h-5 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SavingGoalsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-20" />
        <SkeletonBase className="h-7 w-20" />
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <SkeletonBase className="h-4 w-10 mb-1" />
                  <SkeletonBase className="h-3 w-16" />
                </div>
              </div>
              <SkeletonBase className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const AssetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useAssetPageData()
  if (isLoading) return <AssetPageSkeleton mobile={mobile} />
  return mobile ? <AssetMobile /> : <AssetDesktop />
}

// 카드 사용률 게이지 — usage = abs(balance)/creditLimit*100.
// 70%↑ status-warning, 90%↑ status-danger. SavingGoalItem 진행률 바 패턴 재활용(height 6px pill bg-sunken).
function CardUsageGauge({ asset }: { asset: Asset }) {
  if (asset.assetType !== 'CREDIT_CARD' || asset.creditLimit == null || asset.creditLimit <= 0) {
    return null
  }
  const used = Math.abs(asset.balance)
  const usage = (used / asset.creditLimit) * 100
  const barColor =
    usage >= 90 ? 'var(--color-error)' : usage >= 70 ? 'var(--color-warning)' : 'var(--fg-brand)'

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
          {asset.paymentDay != null ? `${asset.paymentDay}일 결제 · ` : ''}
          한도 <MaskAmount mask="••••">{KRW(asset.creditLimit)}</MaskAmount>
        </span>
        <span
          className="num"
          style={{ fontSize: 'var(--text-badge)', fontWeight: '700', color: barColor }}
        >
          {usage.toFixed(0)}%
        </span>
      </div>
      <div
        style={{
          height: 6, background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-pill)', overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, usage)}%`, height: '100%',
            background: barColor, borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
    </div>
  )
}

// AssetCard: list item 패턴 — 자체 border/radius 없음. 부모 list 가 큰 카드,
// item 사이 border-top 구분선 (TypeGroup 에서 처리). hover 는 background tint 만.
function AssetCard({
  asset,
  negativeAmount = false,
  onOpenDetail,
  showTopBorder = false,
}: {
  asset: Asset
  negativeAmount?: boolean
  onOpenDetail: (asset: Asset) => void
  showTopBorder?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        'flex items-center gap-[14px] cursor-pointer',
        'transition-colors duration-[var(--motion-duration-fast)]',
        'hover:bg-[var(--bg-muted)]',
      ].join(' ')}
      style={{
        padding: '14px 4px',
        borderTop: showTopBorder ? '1px solid var(--border-subtle)' : 'none',
      }}
      onClick={() => onOpenDetail(asset)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail(asset)
        }
      }}
    >
      <AssetLogo asset={asset} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: 'var(--fg-primary)' }}>
          {asset.assetName}
          {asset.institution && (
            <span
              style={{
                fontWeight: '500',
                color: 'var(--fg-tertiary)',
                fontSize: 'var(--text-caption)',
                marginLeft: 6,
              }}
            >
              {asset.institution}
            </span>
          )}
        </div>
        {asset.memo && (
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-tertiary)',
              marginTop: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {asset.memo}
          </div>
        )}
        <CardUsageGauge asset={asset} />
      </div>
      <div
        className="num"
        style={{
          fontSize: 'var(--text-body-lg)',
          fontWeight: '700',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.022em',
          flexShrink: 0,
        }}
      >
        <MaskAmount>
          {negativeAmount
            ? `−${KRW(Math.abs(asset.balance))}`
            : KRW(asset.balance)}
        </MaskAmount>
        <HideUnit>원</HideUnit>
      </div>
    </div>
  )
}

function TypeGroup({
  title,
  assets,
  total,
  totalColor,
  onOpenDetail,
  negativeTotal = false,
}: {
  title: string
  assets: Asset[]
  total: number
  totalColor?: string
  mobile: boolean
  onOpenDetail: (asset: Asset) => void
  negativeTotal?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{title}</CardTitle>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700', color: totalColor }}
        >
          <MaskAmount>
            {negativeTotal ? `−${KRW(total)}` : KRW(total)}
          </MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </CardHeader>
      <CardContent>
      {assets.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 'var(--text-label-sm)',
          }}
        >
          등록된 항목이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {assets.map((a, i) => (
            <AssetCard
              key={a.rowId}
              asset={a}
              negativeAmount={negativeTotal}
              onOpenDetail={onOpenDetail}
              showTopBorder={i > 0}
            />
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  )
}

function SummaryCard({
  mobile,
  netWorth,
  changeAmount,
  changePercent,
  accountsTotal,
  investmentsTotal,
  cardsTotal,
  isLoading,
}: {
  mobile: boolean
  netWorth: number
  changeAmount: number
  changePercent: number
  accountsTotal: number
  investmentsTotal: number
  cardsTotal: number
  isLoading: boolean
}) {
  const hidden = useHideAmounts()
  const isUp = changeAmount >= 0
  const [unlockOpen, setUnlockOpen] = useState(false)
  const handleHideToggle = () => {
    if (hidden) setUnlockOpen(true)
    else enablePdHideAmounts()
  }

  return (
    <Card style={{ marginBottom: mobile ? 16 : 20 }}>
      <CardContent>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>총 순자산</span>
        <button
          onClick={handleHideToggle}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--fg-tertiary)',
            cursor: 'pointer',
            padding: 2,
            display: 'inline-flex',
          }}
          title={hidden ? '금액 보기' : '금액 가리기'}
        >
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div
        className="num"
        style={{
          fontSize: mobile ? 28 : 36,
          fontWeight: '800',
          letterSpacing: '-0.022em',
          lineHeight: '1.15',
          marginBottom: 6,
        }}
      >
        {isLoading ? '—' : <MaskAmount>{KRW(netWorth)}</MaskAmount>}
        <HideUnit>
          <span style={{ fontSize: mobile ? 16 : 20, fontWeight: '700', marginLeft: 4 }}>원</span>
        </HideUnit>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 'var(--text-label-sm)',
          color: 'var(--fg-secondary)',
          marginBottom: mobile ? 14 : 18,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            color: isUp ? 'var(--fg-income)' : 'var(--fg-expense)',
            fontWeight: '600',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? '+' : ''}{changePercent.toFixed(1)}%
          {changeAmount !== 0 && (
            <HideUnit>
              <span style={{ color: 'var(--fg-tertiary)', marginLeft: 4, fontWeight: '500' }}>
                ({isUp ? '+' : '−'}{KRW(Math.abs(changeAmount))}원)
              </span>
            </HideUnit>
          )}
        </span>
        <span style={{ color: 'var(--fg-tertiary)' }}>지난달 대비</span>
      </div>

      <NetWorthChart height={mobile ? 140 : 180} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          paddingTop: mobile ? 14 : 20,
          marginTop: mobile ? 14 : 20,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>계좌·예금</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: '700' }}>
            <MaskAmount>{KRW(accountsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>투자</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: '700' }}>
            <MaskAmount>{KRW(investmentsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>카드값</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 14 : 16, fontWeight: '700', color: 'var(--fg-expense)' }}
          >
            <MaskAmount>−{KRW(cardsTotal)}</MaskAmount>
          </div>
        </div>
      </div>
      </CardContent>
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </Card>
  )
}

function useAssetGroups() {
  const assetsQ = useAssets()
  const summaryQ = useAssetSummary()

  const groups = useMemo(() => {
    const list: Asset[] = assetsQ.data?.assets ?? []
    const accounts = list.filter(a => ACCOUNT_TYPES.includes(a.assetType))
    const cards = list.filter(a => CARD_TYPES.includes(a.assetType))
    const investments = list.filter(a => INVESTMENT_TYPES.includes(a.assetType))
    const loans = list.filter(a => LOAN_TYPES.includes(a.assetType))
    // 순자산·구성비 집계에는 '총액 포함' 자산만 사용해 백엔드 summary 와 일치.
    const inTotal = (a: Asset) => a.isIncludedInTotal === 'Y'
    const sumIncluded = (arr: Asset[]) =>
      arr.filter(inTotal).reduce((s, a) => s + a.balance, 0)
    return {
      accounts,
      cards,
      investments,
      loans,
      accountsTotal: sumIncluded(accounts),
      cardsTotal: Math.abs(sumIncluded(cards)),
      investmentsTotal: sumIncluded(investments),
      loansTotal: Math.abs(sumIncluded(loans)),
    }
  }, [assetsQ.data])

  const netWorth = summaryQ.data?.netWorth ?? 0
  const changeAmount = summaryQ.data?.changeAmount ?? 0
  const changePercent = summaryQ.data?.changePercent ?? 0

  return {
    ...groups,
    netWorth,
    changeAmount,
    changePercent,
    isLoading: assetsQ.isLoading || summaryQ.isLoading,
    isFetching: assetsQ.isFetching || summaryQ.isFetching,
    refetch: () => {
      assetsQ.refetch()
      summaryQ.refetch()
    },
  }
}

function AssetDesktop() {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const g = useAssetGroups()
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [unlockOpen, setUnlockOpen] = useState(false)

  const handleHideToggle = () => {
    if (hidden) setUnlockOpen(true)
    else enablePdHideAmounts()
  }
  const isEmpty =
    !g.isLoading &&
    g.accounts.length === 0 &&
    g.cards.length === 0 &&
    g.investments.length === 0 &&
    g.loans.length === 0

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>자산</h1>
          <div className="sub">모든 계좌·카드·투자를 한 곳에서</div>
        </div>
        <div className="right">
          <Button variant="secondary" size="sm" onClick={handleHideToggle}>
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />} {hidden ? '보이기' : '가리기'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={g.refetch}
            disabled={g.isFetching}
          >
            <RefreshCw size={13} /> 새로고침
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--fg-tertiary)',
                fontWeight: '500',
                marginBottom: 12,
              }}
            >
              아직 등록된 자산이 없어요
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              설정 → 카드·계좌 관리에서 추가할 수 있어요
            </div>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SummaryCard
              mobile={false}
              netWorth={g.netWorth}
              changeAmount={g.changeAmount}
              changePercent={g.changePercent}
              accountsTotal={g.accountsTotal}
              investmentsTotal={g.investmentsTotal}
              cardsTotal={g.cardsTotal}
              isLoading={g.isLoading}
            />
            <AssetCompositionCard
              accounts={g.accounts}
              investments={g.investments}
              cards={g.cards}
              loans={g.loans}
              netWorth={g.netWorth}
            />
            <UpcomingBillsCard />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TypeGroup
              title="계좌 · 예금"
              assets={g.accounts}
              total={g.accountsTotal}
              mobile={false}
              onOpenDetail={setDetailAsset}
            />
            {g.investments.length > 0 && (
              <TypeGroup
                title="투자"
                assets={g.investments}
                total={g.investmentsTotal}
                mobile={false}
                onOpenDetail={setDetailAsset}
              />
            )}
            <TypeGroup
              title="카드"
              assets={g.cards}
              total={g.cardsTotal}
              totalColor="var(--fg-expense)"
              negativeTotal
              mobile={false}
              onOpenDetail={setDetailAsset}
            />
            {g.loans.length > 0 && (
              <TypeGroup
                title="대출"
                assets={g.loans}
                total={g.loansTotal}
                totalColor="var(--fg-expense)"
                negativeTotal
                mobile={false}
                onOpenDetail={setDetailAsset}
              />
            )}
            <SavingGoalsCard mobile={false} />
          </div>
        </div>
      )}
      {detailAsset && (
        <AssetDetailDialog
          asset={detailAsset}
          mobile={false}
          onClose={() => setDetailAsset(null)}
          onEdit={() => {
            navigate('/desk/settings?section=accounts')
            setDetailAsset(null)
          }}
        />
      )}
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </div>
  )
}

function AssetMobile() {
  const navigate = useNavigate()
  const g = useAssetGroups()
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const isEmpty =
    !g.isLoading &&
    g.accounts.length === 0 &&
    g.cards.length === 0 &&
    g.investments.length === 0 &&
    g.loans.length === 0

  if (isEmpty) {
    return (
      <div style={{ padding: 'var(--spacing-xl) 20px' }}>
        <Card>
          <CardContent style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--fg-tertiary)',
                fontWeight: '500',
                marginBottom: 12,
              }}
            >
              아직 등록된 자산이 없어요
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              설정 → 카드·계좌 관리에서 추가할 수 있어요
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--spacing-xl) 20px' }}>
      <SummaryCard
        mobile
        netWorth={g.netWorth}
              changeAmount={g.changeAmount}
              changePercent={g.changePercent}
        accountsTotal={g.accountsTotal}
        investmentsTotal={g.investmentsTotal}
        cardsTotal={g.cardsTotal}
        isLoading={g.isLoading}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TypeGroup
          title="계좌 · 예금"
          assets={g.accounts}
          total={g.accountsTotal}
          mobile
          onOpenDetail={setDetailAsset}
        />
        {g.investments.length > 0 && (
          <TypeGroup
            title="투자"
            assets={g.investments}
            total={g.investmentsTotal}
            mobile
            onOpenDetail={setDetailAsset}
          />
        )}
        <TypeGroup
          title="카드"
          assets={g.cards}
          total={g.cardsTotal}
          totalColor="var(--fg-expense)"
          negativeTotal
          mobile
          onOpenDetail={setDetailAsset}
        />
        {g.loans.length > 0 && (
          <TypeGroup
            title="대출"
            assets={g.loans}
            total={g.loansTotal}
            totalColor="var(--fg-expense)"
            negativeTotal
            mobile
            onOpenDetail={setDetailAsset}
          />
        )}
      </div>
      {detailAsset && (
        <AssetDetailDialog
          asset={detailAsset}
          mobile
          onClose={() => setDetailAsset(null)}
          onEdit={() => {
            navigate('/desk/settings?section=accounts')
            setDetailAsset(null)
          }}
        />
      )}
    </div>
  )
}

export default AssetPage
