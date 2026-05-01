import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronRight, CreditCard, Eye, EyeOff, Plus, RefreshCw,
  Target, TrendingDown, TrendingUp,
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { KRW } from '@/shared/lib/porest/format'
import {
  HideUnit,
  MaskAmount,
  togglePdHideAmounts,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { Donut } from '@/shared/ui/porest/charts'
import { useAssets, useAssetSummary, useNetWorthTrend, useUpdateAsset } from '@/features/asset'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import { useSavingGoals } from '@/features/savingGoal'
import { AssetAddDialog } from '@/widgets/asset-full/ui/AssetAddDialog'
import { AssetDetailDialog } from '@/widgets/asset-full/ui/AssetDetailDialog'
import { InvestmentAddDialog } from '@/widgets/asset-full/ui/InvestmentAddDialog'
import { CardAddDialog } from '@/widgets/asset-full/ui/CardAddDialog'
import { SavingGoalAddDialog } from '@/widgets/asset-full/ui/SavingGoalAddDialog'
import { AssetEditDialog, type AssetGroup } from '@/features/porest/dialogs/AssetEditDialog'
import type { Asset, AssetFormValues, AssetType, AssetUpdateFormValues } from '@/entities/asset'
import type { SavingGoal } from '@/entities/savingGoal'

/** assetType → AssetEditDialog 용 group 매핑 */
function assetGroupOf(asset: Asset): AssetGroup {
  if (asset.assetType === 'CREDIT_CARD' || asset.assetType === 'CHECK_CARD') return 'card'
  if (asset.assetType === 'INVESTMENT') return 'invest'
  return 'account'
}

const netWorthChartConfig = {
  netWorth: { label: '순자산', color: 'var(--mossy-500)' },
} satisfies ChartConfig

function fmtAxisNum(v: number) {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
  return v.toLocaleString('ko-KR')
}

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
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        padding: '8px 12px',
        fontSize: 11.5,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--mossy-500)' }} />
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>순자산</span>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--fg-primary)' }}
        >
          <MaskAmount>{KRW(v)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
    </div>
  )
}

function NetWorthChart({ height = 180 }: { height?: number }) {
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
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg-tertiary)',
          fontSize: 13,
        }}
      >
        불러오는 중…
      </div>
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
          fontSize: 13,
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
            <stop offset="0%" stopColor="var(--mossy-500)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--mossy-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'var(--fg-tertiary)' }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtAxisNum}
          tick={{ fontSize: 10, fill: 'var(--fg-tertiary)' }}
          width={52}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--fg-tertiary)', strokeDasharray: '3 3' }}
          content={<NetWorthTooltip />}
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="var(--mossy-500)"
          strokeWidth={2}
          fill="url(#netWorthFill)"
          dot={{ fill: 'var(--mossy-500)', stroke: 'var(--bg-surface)', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 6, fill: 'var(--mossy-500)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

type OutletCtx = { onAddTx: () => void; mobile: boolean }

type AssetGroupKey = 'cash' | 'invest' | 'card' | 'loan'

const GROUP_META: Record<AssetGroupKey, { label: string; color: string }> = {
  cash: { label: '현금·예금', color: 'var(--sky-500)' },
  invest: { label: '투자', color: 'var(--mossy-600)' },
  card: { label: '카드', color: 'var(--berry-500)' },
  loan: { label: '대출', color: 'var(--sunlit-700)' },
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
    <div className="p-card" style={{ padding: 22 }}>
      <div className="sec-head" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
          {active ? (
            <>
              <button
                type="button"
                onClick={() => setActive(null)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--fg-secondary)',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 500,
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                자산 구성
              </button>
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}>›</span>
              <span>{GROUP_META[active].label}</span>
            </>
          ) : (
            '자산 구성'
          )}
        </h2>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
          {dateLabel}
        </span>
      </div>
      {segments.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          {active ? '등록된 항목이 없어요' : '자산 데이터가 없어요'}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Donut size={180} stroke={24} segments={segments}>
            <div className="lbl">{centerLbl}</div>
            <div className="val num" style={{ fontSize: 15 }}>
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
                    borderRadius: 8,
                    padding: row.clickable ? '4px 6px' : undefined,
                    margin: row.clickable ? '0 -6px' : undefined,
                    transition: 'background var(--dur-fast) var(--ease-standard)',
                  }}
                  onMouseEnter={row.clickable ? (e) => { e.currentTarget.style.background = 'var(--pd-hover-bg)' } : undefined}
                  onMouseLeave={row.clickable ? (e) => { e.currentTarget.style.background = 'transparent' } : undefined}
                  title={row.clickable ? '클릭하여 하위 자산 보기' : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.label}
                    </span>
                    <span className="num" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}>
                      <MaskAmount mask="••••">{KRW(row.amt)}</MaskAmount>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        flex: 1, height: 6, background: 'var(--pd-surface-inset)',
                        borderRadius: 99, overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`, height: '100%',
                          background: row.color, borderRadius: 99,
                        }}
                      />
                    </div>
                    <span
                      className="num"
                      style={{
                        fontSize: 11.5, fontWeight: 600, color: 'var(--fg-tertiary)',
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
    </div>
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
    <div className="p-card" style={{ padding: 22 }}>
      <div className="sec-head" style={{ marginBottom: 14, display: 'flex', alignItems: 'center' }}>
        <h2 style={{ fontSize: 15 }}>예정된 결제 · 고정지출</h2>
        <button
          type="button"
          onClick={() => goToSettings()}
          style={{
            marginLeft: 'auto', background: 'transparent', border: 0, cursor: 'pointer',
            color: 'var(--fg-secondary)', fontSize: 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 2,
          }}
        >
          전체 보기 <ChevronRight size={12} />
        </button>
      </div>
      {recurringQ.isLoading ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
          불러오는 중…
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
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
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  minWidth: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'var(--mossy-50)', color: 'var(--mossy-700)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <CreditCard size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {it.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5, marginTop: 1,
                      color: urgent ? 'var(--berry-600)' : 'var(--fg-tertiary)',
                      fontWeight: urgent ? 600 : 400,
                    }}
                  >
                    {it.daysLeft <= 0 ? '오늘' : `${it.daysLeft}일 후`} · {it.dateLabel}
                  </div>
                </div>
                <div className="num" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  <MaskAmount mask="••••">−{KRW(it.amount)}</MaskAmount>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
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
  const color = goal.color ?? 'var(--mossy-600)'
  const iconName = (goal.icon && goal.icon.trim().length > 0 ? goal.icon : 'piggy-bank') as IconName

  return (
    <div
      onClick={() => onEdit(goal)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: 10,
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
              fontSize: 13.5, fontWeight: 600,
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
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                달성
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
            {formatDeadline(goal.deadlineDate)}
          </div>
        </div>
        <div className="num" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500 }}>
            {KRW(goal.currentAmount)} / {(goal.targetAmount / 10_000).toFixed(0)}만
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6, background: 'var(--pd-surface-inset)',
          borderRadius: 99, overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`, height: '100%',
            background: color, borderRadius: 99,
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
    <div className="p-card" style={{ padding: 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>저축 목표</h2>
        <button
          className="p-btn p-btn--ghost p-btn--sm"
          style={{ marginLeft: 'auto' }}
          type="button"
          onClick={() => setDialogState({ mode: 'add' })}
        >
          <Plus size={13} /> 목표 추가
        </button>
      </div>
      {isLoading ? (
        <div
          style={{
            padding: '16px 0', textAlign: 'center',
            color: 'var(--fg-tertiary)', fontSize: 12,
          }}
        >
          불러오는 중…
        </div>
      ) : isEmpty ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 13, color: 'var(--fg-tertiary)',
              fontWeight: 500, marginBottom: 10,
            }}
          >
            저축 목표를 추가해보세요
          </div>
          <button
            className="p-btn p-btn--primary p-btn--sm"
            type="button"
            onClick={() => setDialogState({ mode: 'add' })}
          >
            <Plus size={13} /> 첫 목표 추가하기
          </button>
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

      {dialogState && (
        <SavingGoalAddDialog
          goal={dialogState.mode === 'edit' ? dialogState.goal : null}
          mobile={mobile}
          onClose={() => setDialogState(null)}
        />
      )}
    </div>
  )
}

const ACCOUNT_TYPES: AssetType[] = ['BANK_ACCOUNT', 'SAVINGS', 'CASH']
const CARD_TYPES: AssetType[] = ['CREDIT_CARD', 'CHECK_CARD']
const INVESTMENT_TYPES: AssetType[] = ['INVESTMENT']
const LOAN_TYPES: AssetType[] = ['LOAN']

function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % 360
}

function Skeleton({ height = 120, style = {} }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--bg-muted), var(--bg-sunken), var(--bg-muted))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
        ...style,
      }}
    />
  )
}

export const AssetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  return mobile ? <AssetMobile /> : <AssetDesktop />
}

function AssetLogo({ asset }: { asset: Asset }) {
  const label = (asset.institution ?? asset.assetName ?? '?').trim().charAt(0) || '?'
  const brand = getBrandColor(asset.institution, asset.assetName)
  const bg = asset.color ?? brand?.bg ?? `oklch(0.55 0.12 ${hashHue(asset.assetName ?? 'asset')})`
  const fg = brand?.fg ?? '#fff'
  const iconChar = asset.icon && asset.icon.trim().length > 0 ? asset.icon.trim().charAt(0) : null
  return (
    <span className="acc-card__logo" style={{ background: bg, color: fg }}>
      {iconChar ?? label}
    </span>
  )
}

function TypeGroup({
  title,
  assets,
  total,
  totalColor,
  mobile,
  onAdd,
  onOpenDetail,
  negativeTotal = false,
}: {
  title: string
  assets: Asset[]
  total: number
  totalColor?: string
  mobile: boolean
  onAdd: () => void
  onOpenDetail: (asset: Asset) => void
  negativeTotal?: boolean
}) {
  return (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>{title}</h2>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: totalColor }}
        >
          <MaskAmount>
            {negativeTotal ? `−${KRW(total)}` : KRW(total)}
          </MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
        <button
          className="p-btn p-btn--ghost p-btn--sm"
          style={{ marginLeft: 8 }}
          onClick={onAdd}
        >
          <Plus size={13} />추가
        </button>
      </div>
      {assets.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 13,
          }}
        >
          등록된 항목이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assets.map(a => (
            <div
              key={a.rowId}
              role="button"
              tabIndex={0}
              className="acc-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onOpenDetail(a)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpenDetail(a)
                }
              }}
            >
              <AssetLogo asset={a} />
              <div className="acc-card__meta">
                <div className="acc-card__name">
                  {a.assetName}
                  {a.institution && (
                    <span
                      style={{
                        fontWeight: 500,
                        color: 'var(--fg-tertiary)',
                        fontSize: 12,
                        marginLeft: 6,
                      }}
                    >
                      {a.institution}
                    </span>
                  )}
                </div>
                {a.memo && <div className="acc-card__num">{a.memo}</div>}
              </div>
              <div className="num acc-card__amt">
                <MaskAmount>
                  {negativeTotal
                    ? `−${KRW(Math.abs(a.balance))}`
                    : KRW(a.balance)}
                </MaskAmount>
                <HideUnit>원</HideUnit>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

  return (
    <div className="p-card" style={{ padding: mobile ? 18 : 28, marginBottom: mobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500 }}>총 순자산</span>
        <button
          onClick={togglePdHideAmounts}
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
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 6,
        }}
      >
        {isLoading ? '—' : <MaskAmount>{KRW(netWorth)}</MaskAmount>}
        <HideUnit>
          <span style={{ fontSize: mobile ? 16 : 20, fontWeight: 700, marginLeft: 4 }}>원</span>
        </HideUnit>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: 'var(--fg-secondary)',
          marginBottom: mobile ? 14 : 18,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            color: isUp ? 'var(--mossy-700)' : 'var(--berry-500)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? '+' : ''}{changePercent.toFixed(1)}%
          {changeAmount !== 0 && (
            <HideUnit>
              <span style={{ color: 'var(--fg-tertiary)', marginLeft: 4, fontWeight: 500 }}>
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
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>계좌·예금</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: 700 }}>
            <MaskAmount>{KRW(accountsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>투자</div>
          <div className="num" style={{ fontSize: mobile ? 14 : 16, fontWeight: 700 }}>
            <MaskAmount>{KRW(investmentsTotal)}</MaskAmount>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>카드값</div>
          <div
            className="num"
            style={{ fontSize: mobile ? 14 : 16, fontWeight: 700, color: 'var(--berry-700)' }}
          >
            <MaskAmount>−{KRW(cardsTotal)}</MaskAmount>
          </div>
        </div>
      </div>
    </div>
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
  const hidden = useHideAmounts()
  const g = useAssetGroups()
  const [addOpen, setAddOpen] = useState(false)
  const [investOpen, setInvestOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const updateMut = useUpdateAsset()
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
          <button className="p-btn p-btn--secondary p-btn--sm" onClick={togglePdHideAmounts}>
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />} {hidden ? '보이기' : '가리기'}
          </button>
          <button
            className="p-btn p-btn--secondary p-btn--sm"
            onClick={g.refetch}
            disabled={g.isFetching}
          >
            <RefreshCw size={13} /> 새로고침
          </button>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> 계좌 추가
          </button>
        </div>
      </div>

      {g.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <Skeleton height={240} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="p-card" style={{ padding: '64px 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--fg-tertiary)',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            아직 등록된 자산이 없어요
          </div>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> 첫 자산 추가하기
          </button>
        </div>
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
              onAdd={() => setAddOpen(true)}
              onOpenDetail={setDetailAsset}
            />
            {g.investments.length > 0 && (
              <TypeGroup
                title="투자"
                assets={g.investments}
                total={g.investmentsTotal}
                mobile={false}
                onAdd={() => setInvestOpen(true)}
                onOpenDetail={setDetailAsset}
              />
            )}
            <TypeGroup
              title="카드"
              assets={g.cards}
              total={g.cardsTotal}
              totalColor="var(--berry-700)"
              negativeTotal
              mobile={false}
              onAdd={() => setCardOpen(true)}
              onOpenDetail={setDetailAsset}
            />
            {g.loans.length > 0 && (
              <TypeGroup
                title="대출"
                assets={g.loans}
                total={g.loansTotal}
                totalColor="var(--berry-700)"
                negativeTotal
                mobile={false}
                onAdd={() => setAddOpen(true)}
                onOpenDetail={setDetailAsset}
              />
            )}
            <SavingGoalsCard mobile={false} />
          </div>
        </div>
      )}
      <AssetAddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <InvestmentAddDialog open={investOpen} onClose={() => setInvestOpen(false)} />
      <CardAddDialog open={cardOpen} onClose={() => setCardOpen(false)} />
      {detailAsset && (
        <AssetDetailDialog
          asset={detailAsset}
          mobile={false}
          onClose={() => setDetailAsset(null)}
          onEdit={asset => {
            setEditAsset(asset)
            setDetailAsset(null)
          }}
        />
      )}
      {editAsset && (
        <AssetEditDialog
          item={editAsset}
          group={assetGroupOf(editAsset)}
          mobile={false}
          onClose={() => setEditAsset(null)}
          onCreate={(values: AssetFormValues) => {
            /* edit 모드에서는 호출되지 않음 */
            void values
          }}
          onUpdate={(values: AssetUpdateFormValues) => {
            updateMut.mutate(
              { id: editAsset.rowId, data: values },
              { onSuccess: () => setEditAsset(null) },
            )
          }}
          isSubmitting={updateMut.isPending}
        />
      )}
    </div>
  )
}

function AssetMobile() {
  const g = useAssetGroups()
  const [addOpen, setAddOpen] = useState(false)
  const [investOpen, setInvestOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const updateMut = useUpdateAsset()
  const isEmpty =
    !g.isLoading &&
    g.accounts.length === 0 &&
    g.cards.length === 0 &&
    g.investments.length === 0 &&
    g.loans.length === 0

  if (g.isLoading) {
    return (
      <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={180} />
        <Skeleton height={140} />
        <Skeleton height={140} />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div style={{ padding: '4px 20px 24px' }}>
        <div className="p-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--fg-tertiary)',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            아직 등록된 자산이 없어요
          </div>
          <button className="p-btn p-btn--primary p-btn--sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> 첫 자산 추가하기
          </button>
        </div>
        <AssetAddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    )
  }

  return (
    <div style={{ padding: '4px 20px 24px' }}>
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
          onAdd={() => setAddOpen(true)}
          onOpenDetail={setDetailAsset}
        />
        {g.investments.length > 0 && (
          <TypeGroup
            title="투자"
            assets={g.investments}
            total={g.investmentsTotal}
            mobile
            onAdd={() => setInvestOpen(true)}
            onOpenDetail={setDetailAsset}
          />
        )}
        <TypeGroup
          title="카드"
          assets={g.cards}
          total={g.cardsTotal}
          totalColor="var(--berry-700)"
          negativeTotal
          mobile
          onAdd={() => setCardOpen(true)}
          onOpenDetail={setDetailAsset}
        />
        {g.loans.length > 0 && (
          <TypeGroup
            title="대출"
            assets={g.loans}
            total={g.loansTotal}
            totalColor="var(--berry-700)"
            negativeTotal
            mobile
            onAdd={() => setAddOpen(true)}
            onOpenDetail={setDetailAsset}
          />
        )}
      </div>
      <AssetAddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <InvestmentAddDialog open={investOpen} onClose={() => setInvestOpen(false)} />
      <CardAddDialog open={cardOpen} onClose={() => setCardOpen(false)} />
      {detailAsset && (
        <AssetDetailDialog
          asset={detailAsset}
          mobile
          onClose={() => setDetailAsset(null)}
          onEdit={asset => {
            setEditAsset(asset)
            setDetailAsset(null)
          }}
        />
      )}
      {editAsset && (
        <AssetEditDialog
          item={editAsset}
          group={assetGroupOf(editAsset)}
          mobile
          onClose={() => setEditAsset(null)}
          onCreate={(values: AssetFormValues) => {
            void values
          }}
          onUpdate={(values: AssetUpdateFormValues) => {
            updateMut.mutate(
              { id: editAsset.rowId, data: values },
              { onSuccess: () => setEditAsset(null) },
            )
          }}
          isSubmitting={updateMut.isPending}
        />
      )}
    </div>
  )
}

export default AssetPage
