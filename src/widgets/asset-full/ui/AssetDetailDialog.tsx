import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Eye, EyeOff, Pencil } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { AssetLogo, type Asset, type BillingItem, type BillingStatus } from '@/entities/asset'
import type { Expense } from '@/entities/expense'
import { useAssetBalanceTrend, useCardBilling, usePayCard } from '@/features/asset'
import { useSearchExpenses } from '@/features/expense'
import { ModalShell, ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { KRW, formatChartAxis } from '@/shared/lib/porest/format'
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

// 청구 상태 배지 — COMPLETED=success / PENDING=neutral / FAILED=danger / SKIPPED=neutral
const BILLING_STATUS_META: Record<BillingStatus, { label: string; variant: 'success' | 'secondary' | 'error' }> = {
  COMPLETED: { label: '완료', variant: 'success' },
  PENDING: { label: '대기', variant: 'secondary' },
  FAILED: { label: '실패', variant: 'error' },
  SKIPPED: { label: '건너뜀', variant: 'secondary' },
}

function CardBillingSection({ asset, mobile }: { asset: Asset; mobile: boolean }) {
  const { data: billing, isLoading } = useCardBilling(asset.rowId)
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
  const history: BillingItem[] = billing?.history ?? []

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: mobile ? 'flex-start' : 'center',
          flexDirection: mobile ? 'column' : 'row',
          gap: 12,
          padding: '16px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '600', marginBottom: 4 }}>
            결제 예정액
          </div>
          <div
            className="num"
            style={{ fontSize: 'var(--text-body-lg)', fontWeight: '800', color: 'var(--fg-expense)', letterSpacing: '-0.012em' }}
          >
            <MaskAmount>−{KRW(upcomingAmount)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {nextPaymentDate ? `결제 예정일 ${nextPaymentDate}` : '결제일 미설정'}
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          disabled={upcomingAmount <= 0 || payCard.isPending}
          onClick={() => setConfirmPay(true)}
          style={mobile ? { width: '100%' } : undefined}
        >
          지금 결제
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
          청구 이력{history.length > 0 ? ` (${history.length})` : ''}
        </h4>
      </div>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <SkeletonBase className="h-4 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--fg-tertiary)',
              fontSize: 'var(--text-label-sm)',
            }}
          >
            청구 이력이 없어요.
          </div>
        ) : (
          history.map((b, i) => {
            const meta = BILLING_STATUS_META[b.status]
            return (
              <div
                key={b.rowId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: 'var(--fg-primary)' }}>
                      {b.paymentDate}
                    </span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                    {b.periodStart} ~ {b.periodEnd}
                    {b.failureReason ? ` · ${b.failureReason}` : ''}
                  </div>
                </div>
                <span
                  className="num"
                  style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', flexShrink: 0, color: 'var(--fg-expense)' }}
                >
                  <MaskAmount>−{KRW(b.billingAmount)}</MaskAmount>
                  <HideUnit>원</HideUnit>
                </span>
              </div>
            )
          })
        )}
      </div>

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
    <>
      <Button
        variant="ghost"
        style={{ marginRight: 'auto' }}
        onClick={handleHideToggle}
        type="button"
      >
        {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
        {hidden ? '금액 표시' : '금액 가리기'}
      </Button>
      {onEdit && (
        <Button variant="ghost" onClick={() => onEdit(asset)}>
          <Pencil size={14} />편집
        </Button>
      )}
      <Button onClick={onClose}>확인</Button>
    </>
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

      {/* Card billing cycle (CREDIT_CARD 전용) */}
      {isCard && asset.assetType === 'CREDIT_CARD' && (
        <CardBillingSection asset={asset} mobile={mobile} />
      )}

      {/* Balance trend chart */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
            최근 {periodLabel} {isCard ? '사용 추이' : isInv ? '평가액 추이' : '잔액 추이'}
          </h4>
          <ToggleGroup
            type="single"
            variant="segmented-subtle"
            size="sm"
            value={period}
            onValueChange={(v) => v && setPeriod(v as '3m' | '6m' | '1y')}
            className="ml-auto w-auto"
          >
            <ToggleGroupItem value="3m">3개월</ToggleGroupItem>
            <ToggleGroupItem value="6m">6개월</ToggleGroupItem>
            <ToggleGroupItem value="1y">1년</ToggleGroupItem>
          </ToggleGroup>
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
                tickFormatter={formatChartAxis}
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
                dot={{ r: 3, fill: 'var(--color-balance)', stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
                activeDot={{ r: 4.5, fill: 'var(--color-balance)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
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
