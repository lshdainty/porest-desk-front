import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight, Eye, EyeOff, RefreshCw,
  Target, TrendingDown, TrendingUp,
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { tileRadius } from '@/shared/lib'
import { KRW, money, formatChartAxis, isEn } from '@/shared/lib/porest/format'
import { formatYearMonth, formatMonthShort, formatMonthDay } from '@/shared/lib/date'
import { niceAxis } from '@/shared/lib/porest/chartAxis'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { HideCard, HideUnit, MaskAmount, WonUnit } from '@/shared/lib/porest/hide-amounts'
import type { HideCardKey } from '@/shared/lib/porest/hide-amounts-cards'
import { wonPre, useHideAmounts } from '@/shared/lib/porest/hide-amounts-core'
import { useOpenHideAmountsSettings } from '@/shared/lib/porest/hide-amounts-nav'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Section } from '@/shared/ui/porest/section'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Donut } from '@/shared/ui/porest/charts'
import { useAssets, useAssetSummary, useNetWorthTrend, useInvestValuation, holdingsOf, type InvestValuation } from '@/features/asset'
import { useStockSymbolName } from '@/features/stock/model/useStockMaster'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import { useSavingGoals } from '@/features/savingGoal'
import { AssetDetailDialog } from '@/widgets/asset-full/ui/AssetDetailDialog'
import { AssetLogo, type Asset, type AssetType } from '@/entities/asset'
import type { SavingGoal } from '@/entities/savingGoal'

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
  const { t } = useTranslation('asset')
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
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{t('netWorth')}</span>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-primary)' }}
        >
          <MaskAmount card="asset.netWorth">{wonPre()}{KRW(v)}</MaskAmount>
          <WonUnit card="asset.netWorth" />
        </span>
      </div>
    </div>
  )
}

function NetWorthChart({ height = 180 }: { height?: number }) {
  const { t } = useTranslation('asset')
  const netWorthChartConfig = {
    netWorth: { label: t('netWorth'), color: 'var(--border-brand)' },
  } satisfies ChartConfig
  const hidden = useHideAmounts('asset.netWorth')
  const trendQ = useNetWorthTrend(12)
  const data = useMemo(
    () =>
      (trendQ.data ?? []).map(p => ({
        monthLabel: formatMonthShort(p.month, { pad: true }),
        netWorth: p.netWorth,
      })),
    [trendQ.data],
  )
  // Y축: 0기준 nice 눈금 (앱 net_worth_chart niceAxis 정합).
  const yAxis = useMemo(() => {
    const vals = data.map(d => d.netWorth)
    return niceAxis(Math.min(0, ...vals), Math.max(0, ...vals))
  }, [data])

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
        {t('noTrendData')}
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
          domain={[yAxis.min, yAxis.max]}
          ticks={yAxis.ticks}
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
const GROUP_META: Record<AssetGroupKey, { labelKey: string; color: string }> = {
  cash: { labelKey: 'group.cashDeposit', color: 'var(--color-chart-blue)' },
  invest: { labelKey: 'group.invest', color: 'var(--bg-brand)' },
  card: { labelKey: 'group.card', color: 'var(--fg-expense)' },
  loan: { labelKey: 'assetType.loan', color: 'var(--color-chart-brown)' },
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
  const { t } = useTranslation('asset')
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
        label: t(GROUP_META[g].labelKey),
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
  const centerLbl = active ? t(GROUP_META[active].labelKey) : t('netWorth')
  const centerVal = active
    ? activeTotal
    : netWorth

  const totalLabel = isEn()
    ? formatChartAxis(centerVal)
    : Math.abs(centerVal) >= 10_000_000
      ? `${(centerVal / 10_000_000).toFixed(2)}천만`
      : `${(centerVal / 10_000).toFixed(0)}만`

  const today = new Date()
  const dateLabel = t('date:asOf', { date: formatMonthDay(today) })

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
                {t('composition')}
              </Button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}>›</span>
              <span>{t(GROUP_META[active].labelKey)}</span>
            </>
          ) : (
            t('composition')
          )}
        </CardTitle>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
          {dateLabel}
        </span>
      </CardHeader>
      <CardContent>
      {segments.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
          {active ? t('noItems') : t('noAssetData')}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Donut size={180} stroke={24} segments={segments}>
            <div className="lbl">{centerLbl}</div>
            <div className="val num" style={{ fontSize: 'var(--text-body-lg)' }}>
              <MaskAmount card="asset.composition" mask="••••">{totalLabel}</MaskAmount>
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
                  title={row.clickable ? t('viewSubAssets') : undefined}
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
                      <MaskAmount card="asset.composition" mask="••••">{KRW(row.amt)}</MaskAmount>
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
  const { t } = useTranslation('asset')
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
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>{t('upcomingBills')}</CardTitle>
        <Button
          variant="link"
          onClick={() => goToSettings()}
          className="h-auto gap-0.5 p-0 text-body-sm font-semibold text-text-secondary hover:text-text-primary no-underline hover:no-underline"
        >
          {t('viewAll')} <ChevronRight size={12} />
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
          {t('noUpcomingBills')}
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
                  {it.daysLeft <= 0 ? t('date:today') : t('date:daysLater', { count: it.daysLeft })} · {it.dateLabel}
                </span>
                <span className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em', flexShrink: 0 }}>
                  <MaskAmount card="asset.upcoming" mask="••••">−{KRW(it.amount)}</MaskAmount>
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

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return null
  return formatYearMonth(d)
}

function SavingGoalItem({ goal }: { goal: SavingGoal }) {
  const { t } = useTranslation('asset')
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  // 다크에서 light variant 로 스왑되도록 팔레트 헬퍼를 통과시킨다(앱 resolveChartColor 정합).
  const palette = getPaletteByColor(goal.color)
  const color = palette.color
  const iconName = (goal.icon && goal.icon.trim().length > 0 ? goal.icon : 'piggy-bank') as IconName

  return (
    // 조회 전용 — 추가·수정·삭제는 설정 > 저축 목표(관리)에서 (design AssetsScreen GoalsCard).
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: tileRadius(32),
            background: palette.bg,
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
                {t('achieved')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
            {formatDeadline(goal.deadlineDate) ?? t('anytime')}
          </div>
        </div>
        <div className="num" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
            {/* 저축목표만 마스킹에서 빠져 있었다 — 금액을 가려도 여기엔 그대로 나왔다. */}
            <MaskAmount card="asset.savingGoals" mask="••• / •••">
              {KRW(goal.currentAmount)} / {isEn() ? formatChartAxis(goal.targetAmount) : `${(goal.targetAmount / 10_000).toFixed(0)}만`}
            </MaskAmount>
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

/**
 * 저축 목표 — 조회 전용 (추가·수정·삭제는 설정 > 저축 목표에서, design AssetsScreen GoalsCard).
 * 모바일 = flat Section / 데스크톱 = Card, 우측 '관리 >' 링크로 설정 섹션 진입.
 */
function SavingGoalsCard({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('asset')
  const navigate = useNavigate()
  const goalsQ = useSavingGoals()

  const goals = goalsQ.data?.goals ?? []
  const isLoading = goalsQ.isLoading
  const isEmpty = !isLoading && goals.length === 0

  return (
    <Section
      mobile={mobile}
      title={t('savingGoals')}
      action={
        <button className="all" onClick={() => navigate('/desk/settings?section=goals')}>
          {t('manage')} <ChevronRight size={13} />
        </button>
      }
    >
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SkeletonBase className="h-8 w-8 rounded-[10px] shrink-0" />
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
        <div
          style={{
            padding: '20px 0', textAlign: 'center',
            fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', fontWeight: '500',
          }}
        >
          {t('manageGoalsPrompt')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {goals.map(g => (
            <SavingGoalItem key={g.rowId} goal={g} />
          ))}
        </div>
      )}
    </Section>
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
  const { t } = useTranslation('asset')
  if (mobile) {
    return (
      // 카드 다이어트 — 실렌더(keep 요약 + flat 그룹, gap 36)와 동일 구조.
      <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
        <AssetSummarySkeleton mobile />
        <TypeGroupSkeleton mobile rows={3} />
        <TypeGroupSkeleton mobile rows={2} />
      </div>
    )
  }
  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>{t('assets')}</h1>
          <div className="sub">{t('subtitle')}</div>
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
    <Card variant={mobile ? 'raised' : undefined}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SkeletonBase className="h-2.5 w-2.5 rounded-[var(--radius-xs)] shrink-0" />
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '16px 18px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-5 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TypeGroupSkeleton({ rows = 3, mobile = false }: { rows?: number; mobile?: boolean }) {
  const list = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          // design .acc-card flat row 리듬 — 실렌더(AssetCard)와 동일.
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 2px 12px 8px', margin: '0 -2px', borderRadius: 10,
          }}
        >
          <SkeletonBase className="h-10 w-10 rounded-[var(--radius-tile)] shrink-0" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBase className="h-4 w-1/2 mb-1.5" />
            <SkeletonBase className="h-3 w-1/3" />
          </div>
          <SkeletonBase className="h-5 w-24 shrink-0" />
        </div>
      ))}
    </div>
  )
  if (mobile) {
    // 카드 다이어트 — flat-group 헤드 + 리스트.
    return (
      <section>
        <div className="flat-group__head">
          <SkeletonBase className="h-5 w-20" />
          <SkeletonBase className="h-4 w-16 ml-auto" />
        </div>
        {list}
      </section>
    )
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SkeletonBase className="h-5 w-20" />
        <SkeletonBase className="h-4 w-16 ml-auto" />
      </CardHeader>
      <CardContent>{list}</CardContent>
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
                <SkeletonBase className="h-8 w-8 rounded-[10px] shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <SkeletonBase className="h-4 w-10 mb-1 ml-auto" />
                  <SkeletonBase className="h-3 w-16 ml-auto" />
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
    <div style={{ marginTop: 6 }}>
      {/* 앱 정합 — 바(위) → 사용금액/한도 라벨(아래) 순서. 결제일은 행 상단(메모 아래)에 별도 표기 */}
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
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, marginTop: 4,
        }}
      >
        <span className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>
          <MaskAmount mask="••• / •••">{wonPre()}{KRW(used)} / {wonPre()}{KRW(asset.creditLimit)}</MaskAmount>
          <WonUnit />
        </span>
        <span
          className="num"
          style={{ fontSize: 'var(--text-badge)', fontWeight: '700', color: barColor }}
        >
          {usage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// 투자 행 서브텍스트 — design: "{첫 보유명} 외 N종목" / "보유 종목 없음".
// 연동 항목은 이름이 마스터에 있으므로 첫 항목이 linked 면 심볼→이름 1건 조회(캐시됨).
function InvestHoldingsSub({ asset }: { asset: Asset }) {
  const { t } = useTranslation('asset')
  const hs = holdingsOf(asset)
  const first = hs[0]
  const firstSymbol = first?.linked ? first.tossSymbol ?? '' : ''
  const { data: firstName } = useStockSymbolName(firstSymbol)
  if (hs.length === 0) {
    return <>{t('holdings.emptySub')}</>
  }
  const label = first?.linked
    ? firstName ?? first.tossSymbol ?? ''
    : first?.holdingName ?? ''
  return <>{hs.length > 1 ? t('holdings.firstAndMore', { name: label, n: hs.length - 1 }) : label}</>
}

// AssetCard: list item 패턴 — 자체 border/radius 없음. 부모 list 가 큰 카드,
// item 사이 border-top 구분선 (TypeGroup 에서 처리). hover 는 background tint 만.
function AssetCard({
  asset,
  onOpenDetail,
  investVal,
}: {
  asset: Asset
  onOpenDetail: (asset: Asset) => void
  /** 투자 자산 라이브 평가(등락) — 투자 그룹에서만 전달, 없으면 등락 미표시 */
  investVal?: InvestValuation | null
}) {
  const { t } = useTranslation('asset')
  // 음수(빚)는 부호(−)만, 색은 중립(fg-primary) — 행 금액 규칙 정합(사용자 결정).
  // 0 은 부호·강조 없이 '0원' (−0원 방지) — 관리 화면(AccountManager) 과 동일 로직.
  //
  // 저장된 부호를 그대로 믿는다. 예전엔 카드 그룹에서 부호를 강제로 뒤집었는데(negativeAmount),
  // 그러면 데이터가 양수로 어긋나도 행은 멀쩡해 보이고 그룹 합계만 틀린 값이 나온다 —
  // 실제로 신용카드 잔액 하나가 양수로 들어가 그렇게 어긋났다. 지금은 저장할 때
  // 음수로 정규화하므로 표시에서 손볼 게 없다.
  const neg = asset.balance < 0
  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        'flex items-center gap-[14px] cursor-pointer',
        'transition-colors duration-[var(--motion-duration-fast)]',
        'hover:bg-[var(--bg-muted)]',
      ].join(' ')}
      // design .acc-card flat row 리듬 — 구분선 없이 hover 면으로 행 구분.
      style={{
        padding: '12px 2px 12px 8px',
        margin: '0 -2px',
        borderRadius: 10,
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
        {/* 투자 자산 — 보유 종목 요약 서브라인 (design: "첫 보유명 외 N종목" / "보유 종목 없음") */}
        {asset.assetType === 'INVESTMENT' ? (
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-tertiary)',
              marginTop: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <InvestHoldingsSub asset={asset} />
          </div>
        ) : asset.memo && !CARD_TYPES.includes(asset.assetType) ? (
          /* 카드는 메모를 행에 안 띄운다. 아래로 결제일·게이지가 이어지는데 메모가 한 줄
             끼면 그만큼 밀려, 카드마다 게이지 높이가 달라진다. 투자 행이 이미 쓰는
             원칙과 같다 — 메모는 상세에서 본다. */
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
        ) : null}
        {/* 신용카드는 이 줄을 늘 차지한다. 결제일이 없다고 줄을 빼면 그 카드만
            게이지가 위로 붙어 목록이 어긋난다. */}
        {asset.assetType === 'CREDIT_CARD' && (
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-tertiary)',
              marginTop: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {/* 결제일이 없으면 빈 칸(nbsp)으로 줄만 남긴다. 빈 문자열은 div 높이가
                0 이라 자리가 안 잡힌다. */}
            {asset.paymentDay != null ? t('paymentDayLabel', { day: asset.paymentDay }) : ' '}
          </div>
        )}
        <CardUsageGauge asset={asset} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <div
          className="num"
          style={{
            fontSize: 'var(--text-body-lg)',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.022em',
          }}
        >
          <MaskAmount>
            {neg ? '−' : ''}{wonPre()}{KRW(Math.abs(asset.balance))}
          </MaskAmount>
          <WonUnit />
        </div>
        {/* 투자 등락 — design: +상승 빨강/−하락 파랑(국내 통념) + (변동액) */}
        {investVal?.changePct != null && (
          <div
            className="num"
            style={{
              fontSize: 'var(--text-badge)',
              fontWeight: '600',
              marginTop: 2,
              color: investVal.changePct >= 0 ? 'var(--status-danger-fg)' : 'var(--fg-brand)',
            }}
          >
            {investVal.changePct >= 0 ? '+' : ''}{investVal.changePct}%
            {investVal.changeAmt != null && (
              <MaskAmount mask="">
                {' '}({investVal.changeAmt >= 0 ? '+' : '−'}{KRW(Math.abs(investVal.changeAmt))})
              </MaskAmount>
            )}
          </div>
        )}
        {/* 총액에서 제외된 자산이면 금액 아래 '총액 제외' 표기 (관리 화면 정합) */}
        {asset.isIncludedInTotal === 'N' && (
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {t('excludedFromTotal')}
          </div>
        )}
      </div>
    </div>
  )
}

function TypeGroup({
  title,
  assets,
  total,
  totalColor,
  mobile,
  onOpenDetail,
  negativeTotal = false,
  investValMap,
  card,
}: {
  title: string
  assets: Asset[]
  total: number
  totalColor?: string
  mobile: boolean
  onOpenDetail: (asset: Asset) => void
  negativeTotal?: boolean
  /** 이 그룹이 금액 숨기기에서 어느 카드인지 — 안쪽 금액이 전부 이 키로 잡힌다. */
  card: HideCardKey
  /** 투자 그룹 전용 — 자산별 라이브 평가(등락) 맵 */
  investValMap?: Map<number, InvestValuation>
}) {
  const { t } = useTranslation('asset')
  return (
    // 그룹 안의 금액(그룹 합계·자산별 잔액·카드 사용액·투자 등락)이 전부 이 카드로 잡힌다.
    <HideCard card={card}>
      {/* 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card — design Section SoT. */}
      <Section
      mobile={mobile}
      title={title}
      totalColor={total === 0 ? undefined : totalColor}
      total={
        <>
          <MaskAmount>
            {negativeTotal && total !== 0 ? `−${wonPre()}${KRW(total)}` : `${wonPre()}${KRW(total)}`}
          </MaskAmount>
          <WonUnit />
        </>
      }
    >
      {assets.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 'var(--text-label-sm)',
          }}
        >
          {t('noItems')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {assets.map(a => (
            <AssetCard
              key={a.rowId}
              asset={a}
              onOpenDetail={onOpenDetail}
              investVal={investValMap?.get(a.rowId) ?? null}
            />
          ))}
        </div>
      )}
    </Section>
    </HideCard>
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
  const { t } = useTranslation('asset')
  const hidden = useHideAmounts()
  const isUp = changeAmount >= 0
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings('asset')

  return (
    // 모바일 = keep 카드(raised + shadow-lg) — 카드 다이어트에서 유지되는 강조 요약 (design p-card--keep).
    // 간격은 부모 flex gap 이 담당하므로 모바일 marginBottom 제거.
    <Card variant={mobile ? 'raised' : undefined} style={mobile ? undefined : { marginBottom: 20 }}>
      <CardContent>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>{t('totalNetWorth')}</span>
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
          title={hidden ? t('showAmount') : t('hideAmount')}
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
        {isLoading ? '—' : <MaskAmount card="asset.netWorth">{wonPre()}{KRW(netWorth)}</MaskAmount>}
        {!isEn() && (
          <HideUnit>
            <span style={{ fontSize: mobile ? 16 : 20, fontWeight: '700', marginLeft: 4 }}>원</span>
          </HideUnit>
        )}
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
                ({isUp ? '+' : '−'}{money(Math.abs(changeAmount))})
              </span>
            </HideUnit>
          )}
        </span>
        <span style={{ color: 'var(--fg-tertiary)' }}>{t('vsLastMonth')}</span>
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
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('tab.accountDeposit')}</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: '700' }}>
            <MaskAmount card="asset.netWorth">{KRW(accountsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('group.invest')}</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: '700' }}>
            <MaskAmount card="asset.netWorth">{KRW(investmentsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>{t('cardBalance')}</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 14 : 16, fontWeight: '700', color: 'var(--fg-expense)' }}
          >
            <MaskAmount card="asset.netWorth">−{KRW(cardsTotal)}</MaskAmount>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}

function useAssetGroups() {
  const assetsQ = useAssets()
  const summaryQ = useAssetSummary()
  // 연동 보유가 있는 투자 자산은 라이브 평가액으로 잔액을 덮어쓴다(프로+토스 연결 시에만, 그 외 빈 맵).
  // holdings(다건) 우선, 구버전 단일 tossSymbol 은 holdingsOf 가 합성해 하위호환.
  const linked = useMemo(
    () => (assetsQ.data?.assets ?? []).filter(a => holdingsOf(a).some(h => h.linked)),
    [assetsQ.data],
  )
  const investValMap = useInvestValuation(linked)
  const valMap = useMemo(() => {
    const m = new Map<number, number>()
    for (const [k, v] of investValMap) m.set(k, v.value)
    return m
  }, [investValMap])

  const groups = useMemo(() => {
    // 연결 종목은 토스 라이브 평가액(시세×수량)으로 치환 → 목록·구성비·합계가 실시간 반영.
    // 라이브 평가는 '보유분'만이라 예수금을 더해야 총액이 된다(안 더하면 증권계좌에 넣어 둔
    // 매수 대기 자금이 목록에서 통째로 빠진다).
    const list: Asset[] = (assetsQ.data?.assets ?? []).map(a =>
      valMap.has(a.rowId)
        ? { ...a, holdingBalance: valMap.get(a.rowId)!, balance: (a.cashBalance ?? 0) + valMap.get(a.rowId)! }
        : a,
    )
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
  }, [assetsQ.data, valMap])

  // 백엔드 summary(DB 잔액 기준)에 연결 자산의 (라이브−DB) 차액만큼 순자산/변화를 보정.
  //
  // 비교 대상은 평가금액끼리다. 라이브 값은 보유분만 계산하는데 balance 는
  // 예수금 + 평가금액이라, 그걸 빼면 예수금만큼 순자산이 깎인다.
  const liveDelta = useMemo(
    () =>
      linked.reduce((s, a) => {
        if (a.isIncludedInTotal !== 'Y') return s
        const v = valMap.get(a.rowId)
        return v != null ? s + (v - (a.holdingBalance ?? 0)) : s
      }, 0),
    [linked, valMap],
  )

  const netWorth = (summaryQ.data?.netWorth ?? 0) + liveDelta
  const changeAmount = (summaryQ.data?.changeAmount ?? 0) + liveDelta
  const lastMonth = summaryQ.data?.lastMonthNetWorth ?? 0
  const changePercent =
    lastMonth !== 0
      ? Math.round((changeAmount / Math.abs(lastMonth)) * 1000) / 10
      : summaryQ.data?.changePercent ?? 0

  return {
    ...groups,
    investValMap,
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
  const { t } = useTranslation('asset')
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const g = useAssetGroups()
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings('asset')
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
          <h1>{t('assets')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">
          <Button variant="secondary" size="sm" onClick={handleHideToggle}>
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />} {hidden ? t('show') : t('hide')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={g.refetch}
            disabled={g.isFetching}
          >
            <RefreshCw size={13} /> {t('refresh')}
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
              {t('emptyTitle')}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              {t('emptyDesc')}
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
              card="asset.accounts"
              title={t('accountDepositTitle')}
              assets={g.accounts}
              total={g.accountsTotal}
              mobile={false}
              onOpenDetail={setDetailAsset}
            />
            {g.investments.length > 0 && (
              <TypeGroup
                card="asset.investments"
                title={t('group.invest')}
                assets={g.investments}
                total={g.investmentsTotal}
                mobile={false}
                onOpenDetail={setDetailAsset}
                investValMap={g.investValMap}
              />
            )}
            <TypeGroup
              card="asset.cards"
              title={t('group.card')}
              assets={g.cards}
              total={g.cardsTotal}
              totalColor="var(--fg-expense)"
              negativeTotal
              mobile={false}
              onOpenDetail={setDetailAsset}
            />
            {g.loans.length > 0 && (
              <TypeGroup
                card="asset.loans"
                title={t('assetType.loan')}
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
    </div>
  )
}

function AssetMobile() {
  const { t } = useTranslation('asset')
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
      // 카드 다이어트 — 빈 상태도 카드 없이 배경 위 플랫.
      <div style={{ padding: '16px 24px 24px' }}>
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--fg-tertiary)',
              fontWeight: '500',
              marginBottom: 12,
            }}
          >
            {t('emptyTitle')}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            {t('emptyDesc')}
          </div>
        </div>
      </div>
    )
  }

  return (
    // 모바일 카드 다이어트 — keep 요약 + flat 그룹, 섹션 gap 36 (design AssetsScreen).
    <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
        <TypeGroup
          card="asset.accounts"
          title={t('accountDepositTitle')}
          assets={g.accounts}
          total={g.accountsTotal}
          mobile
          onOpenDetail={setDetailAsset}
        />
        {g.investments.length > 0 && (
          <TypeGroup
            card="asset.investments"
            title={t('group.invest')}
            assets={g.investments}
            total={g.investmentsTotal}
            mobile
            onOpenDetail={setDetailAsset}
            investValMap={g.investValMap}
          />
        )}
        <TypeGroup
          card="asset.cards"
          title={t('group.card')}
          assets={g.cards}
          total={g.cardsTotal}
          totalColor="var(--fg-expense)"
          negativeTotal
          mobile
          onOpenDetail={setDetailAsset}
        />
        {g.loans.length > 0 && (
          <TypeGroup
            card="asset.loans"
            title={t('assetType.loan')}
            assets={g.loans}
            total={g.loansTotal}
            totalColor="var(--fg-expense)"
            negativeTotal
            mobile
            onOpenDetail={setDetailAsset}
          />
        )}
        <SavingGoalsCard mobile />
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
