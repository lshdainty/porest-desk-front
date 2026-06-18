import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Eye, EyeOff, TrendingUp, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { AssetLogo, type Asset, type BillingItem, type BillingStatus } from '@/entities/asset'
import type { Expense } from '@/entities/expense'
import { useAssetBalanceTrend, useCardBilling, usePayCard } from '@/features/asset'
import { useCardPerformance } from '@/features/card-performance'
import { useSearchExpenses } from '@/features/expense'
import { ModalShell, ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { KRW, formatChartAxis } from '@/shared/lib/porest/format'
import { niceAxis } from '@/shared/lib/porest/chartAxis'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { assetTypeLabel } from '@/shared/lib/porest/asset-labels'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  HideUnit,
  MaskAmount,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'


type BalanceTooltipProps = {
  active?: boolean
  payload?: { value?: number; payload?: { label?: string; weekStart?: string } }[]
  seriesLabel: string
}

function BalanceTooltip({ active, payload, seriesLabel }: BalanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const first = payload[0]
  const val = Number(first?.value ?? 0)
  const label = first?.payload?.label ?? ''
  const weekStart = first?.payload?.weekStart ?? ''
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
      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '600', marginBottom: 4 }}>
        {label}
        {weekStart && <span style={{ marginLeft: 6 }}>· {weekStart.slice(5)}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: 'var(--color-balance)' }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)' }}>{seriesLabel}</span>
        <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700' }}>
          <MaskAmount>{KRW(val)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
      </div>
    </div>
  )
}

type AssetGroup = 'account' | 'card' | 'invest'

const groupOf = (asset: Asset): AssetGroup => {
  if (asset.assetType === 'CREDIT_CARD' || asset.assetType === 'CHECK_CARD') return 'card'
  if (asset.assetType === 'INVESTMENT') return 'invest'
  return 'account'
}

// 청구 상태 배지 — app _StatusBadge 미러: COMPLETED=success / PENDING=warning / FAILED=error / SKIPPED=neutral
const BILLING_STATUS_META: Record<BillingStatus, { label: string; variant: 'success' | 'secondary' | 'warning' | 'error' }> = {
  COMPLETED: { label: '완료', variant: 'success' },
  PENDING: { label: '대기', variant: 'warning' },
  FAILED: { label: '실패', variant: 'error' },
  SKIPPED: { label: '건너뜀', variant: 'secondary' },
}

/** 'yyyy-MM-dd' → 'M.d' 표기 — app _fmtDate 미러. */
function fmtBillingDate(iso: string): string {
  const [, mm, dd] = iso.split('-')
  if (mm == null || dd == null) return iso
  const m = parseInt(mm, 10)
  const d = parseInt(dd, 10)
  if (!Number.isFinite(m) || !Number.isFinite(d)) return iso
  return `${m}.${d}`
}

function currentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 카드 월 실적 카드 — app CardPerformanceBar 미러.
// 헤더('YYYY-MM 실적' + pct%) / progress 8px / 사용·필요액 + 남은/달성 / requiredText.
// 실적 무관 카드면 숨김. 달성(100%↑) 시 bar·% status-success, 미만은 fg-brand(다크 primary-light).
function CardPerformanceCard({ assetRowId }: { assetRowId: number }) {
  const ym = currentYearMonth()
  const { data: p, isLoading } = useCardPerformance(assetRowId, ym)
  // 서버 실적 로딩 중 — 실제 바 레이아웃(헤더/진행바/금액 행) 그대로 스켈레톤 (앱 CardPerformanceBar 정합).
  if (isLoading) {
    return (
      <div
        style={{
          padding: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SkeletonBase className="h-3 w-24" />
          <SkeletonBase className="ml-auto h-3 w-8" />
        </div>
        <SkeletonBase className="h-2 w-full rounded-full" style={{ margin: '6px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SkeletonBase className="h-3 w-28" />
          <SkeletonBase className="ml-auto h-3 w-16" />
        </div>
      </div>
    )
  }
  if (!p || !p.isRequired || p.requiredAmount == null) return null
  const rate = Math.min(Math.max(p.achievementRate, 0), 1.5)
  const pct = Math.trunc(rate * 100)
  const overrun = p.achievementRate >= 1.0
  const barColor = overrun ? 'var(--status-success)' : 'var(--fg-brand)'
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendingUp size={14} style={{ color: 'var(--fg-secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-primary)' }}>
          {ym} 실적
        </span>
        <span
          className="num"
          style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: '700', color: barColor }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 8, background: 'var(--bg-track)',
          borderRadius: 'var(--radius-xs)', overflow: 'hidden', margin: '6px 0',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, rate * 100)}%`, height: '100%',
            background: barColor, borderRadius: 'var(--radius-xs)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)',
        }}
      >
        <span className="num">
          <MaskAmount mask="•••">{KRW(p.currentAmount)}</MaskAmount>
          {' / '}
          <MaskAmount mask="•••">{KRW(p.requiredAmount)}</MaskAmount>
          <HideUnit>원</HideUnit>
        </span>
        {!p.isAchieved && p.remainingAmount != null ? (
          <span className="num" style={{ marginLeft: 'auto' }}>
            남은 <MaskAmount mask="•••">{KRW(p.remainingAmount)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </span>
        ) : (
          <span style={{ marginLeft: 'auto', color: 'var(--status-success-fg)', fontWeight: '700' }}>달성</span>
        )}
      </div>
      {p.requiredText && (
        <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
          {p.requiredText}
        </div>
      )}
    </div>
  )
}

// 신용카드 청구 사이클 — app _CardBillingSection 미러.
// 단일 bordered 카드 안에 [결제 예정 + 예정일 M.d] / [금액 + 지금 결제] / 매월 N일 결제 / divider / 청구 이력.
function CardBillingSection({ asset }: { asset: Asset }) {
  const { data: billing, isLoading, isError } = useCardBilling(asset.rowId)
  const payCard = usePayCard()
  const [confirmPay, setConfirmPay] = useState(false)

  const handlePay = () => {
    payCard.mutate(asset.rowId, {
      onSuccess: () => {
        setConfirmPay(false)
        toast.success('결제가 기록되었어요')
      },
      onError: () => {
        setConfirmPay(false)
        toast.error('결제 처리에 실패했어요')
      },
    })
  }

  const upcomingAmount = billing?.upcomingAmount ?? Math.abs(asset.balance)
  const nextPaymentDate = billing?.nextPaymentDate ?? null
  const paymentDay = billing?.paymentDay ?? asset.paymentDay ?? null
  const history: BillingItem[] = billing?.history ?? []
  const canPay = upcomingAmount > 0 && !payCard.isPending

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    marginBottom: 18,
  }

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonBase className="h-4 w-16" />
          <SkeletonBase className="h-3 w-10" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <SkeletonBase className="h-7 w-28" />
          <SkeletonBase className="h-8 w-24 rounded-md" />
        </div>
        <SkeletonBase className="h-3 w-24 mt-2" />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={cardStyle}>
        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>
          청구 정보를 불러오지 못했어요
        </span>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {/* 헤더: 결제 예정 + 다음 결제일 M.d */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
          결제 예정
        </span>
        {nextPaymentDate && (
          <span
            className="num"
            style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}
          >
            {fmtBillingDate(nextPaymentDate)}
          </span>
        )}
      </div>

      {/* 금액 + 지금 결제 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
        <div
          className="num"
          style={{
            fontWeight: '700',
            letterSpacing: '-0.012em',
            color: upcomingAmount > 0 ? 'var(--status-danger-fg)' : 'var(--fg-primary)',
          }}
        >
          <MaskAmount>
            <span style={{ fontSize: 'var(--text-display-sm)' }}>{KRW(upcomingAmount)}</span>
          </MaskAmount>
          <HideUnit>
            <span style={{ fontSize: 'var(--text-body-sm)' }}>원</span>
          </HideUnit>
        </div>
        <Button
          variant="default"
          size="sm"
          style={{ marginLeft: 'auto' }}
          disabled={!canPay}
          onClick={() => setConfirmPay(true)}
        >
          <Wallet size={14} />
          지금 결제
        </Button>
      </div>

      {paymentDay != null && (
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
          매월 {paymentDay}일 결제
        </div>
      )}

      {/* 청구 이력 — divider 아래 같은 카드 내부 (app 정합) */}
      {history.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0 8px' }} />
          <div style={{ fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-secondary)' }}>
            청구 이력
          </div>
          <div style={{ marginTop: 4 }}>
            {history.map(b => {
              const meta = BILLING_STATUS_META[b.status]
              return (
                <div key={b.rowId} style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="num"
                      style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}
                    >
                      <MaskAmount>{KRW(b.billingAmount)}</MaskAmount>
                      <HideUnit>원</HideUnit>
                    </span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <div
                    className="num"
                    style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}
                  >
                    {fmtBillingDate(b.periodStart)} ~ {fmtBillingDate(b.periodEnd)} · 결제일 {fmtBillingDate(b.paymentDate)}
                  </div>
                  {b.failureReason && (
                    <div style={{ fontSize: 'var(--text-badge)', color: 'var(--status-danger-fg)', marginTop: 2 }}>
                      {b.failureReason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {confirmPay && (
        <ConfirmDialog
          title="지금 결제"
          message={
            <>
              결제 예정액 <strong>{KRW(upcomingAmount)}원</strong>을 지금 결제 처리할까요?
              {nextPaymentDate ? ` 결제일은 ${nextPaymentDate} 입니다.` : ''}
            </>
          }
          confirmLabel="결제하기"
          loading={payCard.isPending}
          onCancel={() => { if (!payCard.isPending) setConfirmPay(false) }}
          onConfirm={handlePay}
        />
      )}
    </div>
  )
}

export function AssetDetailDialog({
  asset,
  onClose,
  onEdit,
  mobile,
}: {
  asset: Asset
  onClose: () => void
  onEdit?: (asset: Asset) => void
  mobile: boolean
}) {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const [unlockOpen, setUnlockOpen] = useState(false)

  const handleHideToggle = () => {
    if (hidden) {
      setUnlockOpen(true)
    } else {
      enablePdHideAmounts()
    }
  }

  const group = groupOf(asset)
  const isCard = group === 'card'
  const isInv = group === 'invest'

  // 차트 기간: 3m/6m/1y → 12/24/52주
  const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('3m')
  const weeks = period === '3m' ? 12 : period === '6m' ? 24 : 52
  const { data: trendData, isLoading: trendLoading } = useAssetBalanceTrend(asset.rowId, weeks)
  const chartData = useMemo(
    () => (trendData ?? []).map((p, i) => ({ label: `${i + 1}주`, weekStart: p.weekStart, balance: p.balance })),
    [trendData],
  )
  // Y축: 0기준 nice 눈금 (앱 asset_detail niceAxis 정합). 음수 잔액(대출)도 0 아래로 확장.
  const yAxis = useMemo(() => {
    const vals = chartData.map(d => d.balance)
    return niceAxis(Math.min(0, ...vals), Math.max(0, ...vals))
  }, [chartData])
  const periodLabel = period === '3m' ? '12주' : period === '6m' ? '24주' : '52주'
  const seriesLabel = isCard ? '사용' : isInv ? '평가액' : '잔액'

  const color = getPaletteByColor(asset.color).color
  const chartConfig: ChartConfig = {
    balance: { label: seriesLabel, color },
  }

  const absBalance = Math.abs(asset.balance)

  const { data: relatedAll, isLoading: relatedLoading } = useSearchExpenses({ assetId: asset.rowId })
  const relatedTx: Expense[] = (relatedAll ?? []).slice(0, 12)

  const title = isCard ? '카드 상세' : isInv ? '투자 상세' : '계좌 상세'
  const valueLabel = isCard ? '이번 달 결제 예정' : isInv ? '평가액' : '잔액'

  const viewAll = () => {
    onClose()
    navigate(`/desk/expense?assetId=${asset.rowId}`)
  }

  const Footer = (
    <ModalViewFooter
      leftSlot={
        <Button variant="ghost" size="md" flush="left" onClick={handleHideToggle} type="button">
          {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
          {hidden ? '금액 표시' : '금액 가리기'}
        </Button>
      }
      onEdit={onEdit ? () => onEdit(asset) : undefined}
      onConfirm={onClose}
    />
  )

  return (
    <>
    <ModalShell title={title} onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, color-mix(in oklch, ${color} 12%, transparent), color-mix(in oklch, ${color} 4%, transparent))`,
          border: `1px solid color-mix(in oklch, ${color} 22%, transparent)`,
          borderRadius: 'var(--radius-xl)',
          padding: 22,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <AssetLogo asset={asset} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em' }}>
              {asset.assetName}
            </div>
            <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {[asset.institution, assetTypeLabel(asset.assetType), asset.memo]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            fontWeight: '600',
            letterSpacing: '0.04em',
            marginBottom: 4,
          }}
        >
          {valueLabel}
        </div>
        <div
          className="num"
          style={{
            fontSize: 'var(--text-display-md)',
            fontWeight: '800',
            letterSpacing: '-0.022em',
            color: isCard ? 'var(--fg-expense)' : 'var(--fg-primary)',
          }}
        >
          <MaskAmount>
            {isCard ? '−' : ''}
            {KRW(absBalance)}
          </MaskAmount>
          <HideUnit>
            <span style={{ fontSize: 'var(--text-body-lg)', marginLeft: 2 }}>원</span>
          </HideUnit>
        </div>
      </div>

      {/* 카드 월 실적 (카드 공통) — app CardPerformanceBar 미러 */}
      {isCard && <CardPerformanceCard assetRowId={asset.rowId} />}

      {/* Card billing cycle (CREDIT_CARD 전용) — app _CardBillingSection 미러 */}
      {asset.assetType === 'CREDIT_CARD' && <CardBillingSection asset={asset} />}

      {/* Balance trend chart */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
            최근 {periodLabel} {isCard ? '사용 추이' : isInv ? '평가액 추이' : '잔액 추이'}
          </h4>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as '3m' | '6m' | '1y')}
            className="ml-auto"
          >
            <TabsList variant="pill" size="sm">
              <TabsTrigger value="3m">3개월</TabsTrigger>
              <TabsTrigger value="6m">6개월</TabsTrigger>
              <TabsTrigger value="1y">1년</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {trendLoading ? (
          <SkeletonBase className="h-[160px] w-full rounded-md" />
        ) : chartData.length === 0 ? (
          <div style={{
            height: 160, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-tile)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)',
          }}>
            표시할 데이터가 없어요
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: 160 }}>
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={`asset-balance-fill-${asset.rowId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
                tickMargin={6}
                interval="preserveStartEnd"
                minTickGap={18}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[yAxis.min, yAxis.max]}
                ticks={yAxis.ticks}
                // 금액 숨기기 시 Y축도 마스킹 (앱 정합 — '••••' 4점)
                tickFormatter={(v: number) => (hidden ? '••••' : formatChartAxis(v))}
                tick={{ fontSize: 'var(--text-badge)', fill: 'var(--fg-tertiary)' }}
                width={44}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--fg-tertiary)', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<BalanceTooltip seriesLabel={seriesLabel} />}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2}
                fill={`url(#asset-balance-fill-${asset.rowId})`}
                dot={{ r: 4, fill: 'var(--color-balance)', stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
                activeDot={{ r: 5.5, fill: 'var(--color-balance)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      {/* Recent tx */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
            최근 거래{relatedTx.length > 0 ? ` (${relatedTx.length})` : ''}
          </h4>
          <button
            type="button"
            className="all"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 0,
              color: 'var(--fg-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-label-sm)',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            onClick={viewAll}
          >
            전체 보기 <ChevronRight size={12} />
          </button>
        </div>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '4px 14px',
          }}
        >
          {relatedLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                    <SkeletonBase className="h-3 w-1/3" />
                  </div>
                  <SkeletonBase className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : relatedTx.length === 0 ? (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                color: 'var(--fg-tertiary)',
                fontSize: 'var(--text-label-sm)',
              }}
            >
              연결된 거래 내역이 없어요.
            </div>
          ) : (
            relatedTx.map(t => <ExpenseRow key={t.rowId} expense={t} />)
          )}
        </div>
      </div>
    </ModalShell>
    <HideAmountsUnlockDialog
      open={unlockOpen}
      onOpenChange={setUnlockOpen}
      onVerified={disablePdHideAmounts}
    />
    </>
  )
}
