import { useMemo, useState } from 'react'
import { AssetTradeDialog } from '@/features/porest/dialogs/AssetTradeDialog'
import { useAssetTrades, useDeleteTrade } from '@/features/asset'
import type { TradeType } from '@/entities/asset'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Pencil, SlidersHorizontal, Target, Zap, Trash2 } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { AssetLogo, HOLDING_UNIT_KEY,
  formatQty, qtyNumber, type Asset, type AssetHolding } from '@/entities/asset'
import type { Expense } from '@/entities/expense'
import { useAssetBalanceTrend, useCardBilling, usePayCard, useInvestValuation, holdingsOf, useAssetTransfers } from '@/features/asset'
import type { AssetTransfer } from '@/entities/asset'
import { useTossPrices, useTossExchangeRate, usePrevCloses } from '@/features/stock/model/useTossStocks'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { useStockSymbolName } from '@/features/stock/model/useStockMaster'
import { useCardPerformance } from '@/features/card-performance'
import { useSearchExpenses } from '@/features/expense'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ExpenseRow, TransferRow } from '@/shared/ui/porest/expense-row'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/shared/ui/chart'
import { KRW, money, formatChartAxis, isEn, formatDay } from '@/shared/lib/porest/format'
import { DateGroupHeader } from '@/shared/ui/date-group-header'
import { niceAxis } from '@/shared/lib/porest/chartAxis'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { assetTypeLabel } from '@/shared/lib/porest/asset-labels'
import { HideUnit, MaskAmount, WonUnit } from '@/shared/lib/porest/hide-amounts'
import { disablePdHideAmounts, enablePdHideAmounts, wonPre, useHideAmounts } from '@/shared/lib/porest/hide-amounts-core'
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
          <MaskAmount>{wonPre()}{KRW(val)}</MaskAmount>
          <WonUnit />
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

// 카드 월 실적 배지 — design card-detail.jsx 신판(달성/잔여 요약). 실적 무관 카드면 숨김.
// 달성: cat-green 10% tint 배경(다크 스왑) / 미달: sunken. 아이콘 30 원(surface).
/** 자산 상세의 한 행. 이체는 지출/수입이 아니라 자산 간 이동이라 별도 종류로 둔다. */
type AssetLedgerItem =
  | { kind: 'expense'; at: string; expense: Expense }
  | { kind: 'transfer'; at: string; transfer: AssetTransfer }

function CardPerfBadge({ assetRowId }: { assetRowId: number }) {
  const { t } = useTranslation('asset')
  const ym = currentYearMonth()
  const { data: p, isLoading } = useCardPerformance(assetRowId, ym)
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 13px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-sunken)' }}>
        <SkeletonBase className="h-[30px] w-[30px] rounded-full shrink-0" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <SkeletonBase className="h-4 w-32 mb-1" />
          <SkeletonBase className="h-3 w-40" />
        </div>
      </div>
    )
  }
  if (!p || !p.isRequired || p.requiredAmount == null) return null
  const done = p.isAchieved
  const pct = Math.trunc(Math.min(Math.max(p.achievementRate, 0), 1.5) * 100)
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 13px',
        borderRadius: 'var(--radius-lg)',
        background: done
          ? 'color-mix(in oklab, var(--color-cat-green) 10%, var(--bg-surface))'
          : 'var(--bg-sunken)',
      }}
    >
      <span
        style={{
          width: 30, height: 30, borderRadius: 'var(--radius-pill)', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-surface)',
          color: done ? 'var(--color-cat-green)' : 'var(--fg-secondary)',
        }}
      >
        {done ? <Check size={15} strokeWidth={3} /> : <Target size={15} strokeWidth={1.9} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
          {done
            ? t('assetDetail.perfDone')
            : t('assetDetail.perfRemain', { amount: money(p.remainingAmount ?? 0) })}
        </div>
        <div className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
          <MaskAmount mask="•••">{wonPre()}{KRW(p.currentAmount)}</MaskAmount>
          {' / '}
          <MaskAmount mask="•••">{wonPre()}{KRW(p.requiredAmount)}</MaskAmount>
          <WonUnit /> · {pct}%
        </div>
      </div>
    </div>
  )
}

// 결제 회차(청구월) 항목 — 예정 1건 + 과거 결제 완료 이력.
type CardStatement = {
  key: string
  label: string
  scheduled: boolean
  amount: number
  periodStart: string | null
  periodEnd: string | null
  paymentDate: string
}

/**
 * 카드 상세 본문 — design card-detail.jsx 신판(현대카드 결제정보 패턴) 토큰 스냅.
 * 회차 히어로(기간 선택 시트) / 결제일·이용 기간 행 / 액션 2타일 /
 * 한도 사용 게이지·실적 배지 / 이용 내역(정렬 칩 + 날짜 그룹). CREDIT_CARD 전용.
 */
function CardDetailBody({
  asset,
  mobile,
  onEdit,
}: {
  asset: Asset
  mobile: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { data: billing, isLoading } = useCardBilling(asset.rowId)
  const payCard = usePayCard()
  const [confirmPay, setConfirmPay] = useState(false)
  // 부분 선결제 — 기본값은 남은 청구액 전액. 고치면 그만큼만 내고 나머지는 결제일에 빠진다.
  const [payAmount, setPayAmount] = useState('')
  const [stIdx, setStIdx] = useState(0)
  const [pickOpen, setPickOpen] = useState(false)
  const [sort, setSort] = useState<'recent' | 'amount' | 'category'>('recent')

  const statements: CardStatement[] = useMemo(() => {
    const out: CardStatement[] = []
    if (billing?.nextPaymentDate) {
      out.push({
        key: `up-${billing.nextPaymentDate}`,
        label: formatDay(billing.nextPaymentDate).md,
        scheduled: true,
        amount: billing.upcomingAmount,
        periodStart: billing.upcomingPeriodStart,
        periodEnd: billing.upcomingPeriodEnd,
        paymentDate: billing.nextPaymentDate,
      })
    }
    // 과거 회차 — 결제월별 합산: 같은 달에 여러 번(선결제 등) 결제해도 월 1행(사용자 결정).
    // 라벨은 정규 결제일(paymentDay, 말일 보정), 기간은 결제월의 전월 1일~말일(백엔드 회차 규칙 미러).
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const byMonth = new Map<string, { amount: number; latest: string }>()
    for (const b of billing?.history ?? []) {
      if (b.status !== 'COMPLETED') continue
      const ym = b.paymentDate.slice(0, 7)
      const cur = byMonth.get(ym)
      if (cur) {
        cur.amount += b.billingAmount
        if (b.paymentDate > cur.latest) cur.latest = b.paymentDate
      } else {
        byMonth.set(ym, { amount: b.billingAmount, latest: b.paymentDate })
      }
    }
    for (const [ym, g] of byMonth) {
      const [y, m] = ym.split('-').map(Number)
      if (!y || !m) continue
      const lastDay = new Date(y, m, 0).getDate()
      const day = Math.min(billing?.paymentDay ?? Number(g.latest.slice(8, 10)), lastDay)
      const paymentDate = `${ym}-${pad2(day)}`
      const py = m === 1 ? y - 1 : y
      const pm = m === 1 ? 12 : m - 1
      const pLast = new Date(py, pm, 0).getDate()
      out.push({
        key: `m-${ym}`,
        label: formatDay(paymentDate).md,
        scheduled: false,
        amount: g.amount,
        periodStart: `${py}-${pad2(pm)}-01`,
        periodEnd: `${py}-${pad2(pm)}-${pad2(pLast)}`,
        paymentDate,
      })
    }
    return out
  }, [billing])
  const st = statements[Math.min(stIdx, Math.max(0, statements.length - 1))] ?? null

  // 기간 선택 시트 — 연도별 그룹(최신순 유지)
  const byYear = useMemo(() => {
    const g = new Map<string, { s: CardStatement; i: number }[]>()
    statements.forEach((s, i) => {
      const y = s.paymentDate.slice(0, 4)
      if (!g.has(y)) g.set(y, [])
      g.get(y)!.push({ s, i })
    })
    return [...g.entries()]
  }, [statements])

  // 한도 사용 — 현재 미결제 잔액(총 부채) 기준
  const limit = asset.creditLimit ?? 0
  const used = Math.abs(asset.balance)
  const limitPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const limitWarn = limitPct >= 80

  const paymentDay = billing?.paymentDay ?? asset.paymentDay ?? null
  const canPay = (billing?.upcomingAmount ?? 0) > 0 && !payCard.isPending
  const periodText = st?.periodStart && st?.periodEnd
    ? `${fmtBillingDate(st.periodStart)} ~ ${fmtBillingDate(st.periodEnd)}`
    : null

  // 이용 내역 — 선택 회차의 청구 기간(전월 1일~말일)만 조회(사용자 결정).
  // 기간 미확정(폴백 회차)이면 기간 조건 없이 카드 전체에서 최근순.
  const { data: usageAll } = useSearchExpenses(
    st?.periodStart && st?.periodEnd
      ? { assetId: asset.rowId, startDate: st.periodStart, endDate: st.periodEnd }
      : { assetId: asset.rowId },
  )
  const usageTx: Expense[] = useMemo(
    () => [...(usageAll ?? [])]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)),
    [usageAll],
  )

  const sorted = useMemo(() => {
    const list = [...usageTx]
    if (sort === 'amount') return list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    if (sort === 'category') return list.sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? ''))
    return list
  }, [usageTx, sort])

  // 날짜 그룹(최근순 뷰)
  const usageGroups = useMemo(() => {
    const m = new Map<string, Expense[]>()
    for (const tx of usageTx) {
      const k = tx.expenseDate.slice(0, 10)
      const arr = m.get(k)
      if (arr) arr.push(tx)
      else m.set(k, [tx])
    }
    return [...m.entries()]
  }, [usageTx])

  const openPay = () => {
    setPayAmount(String(billing?.upcomingAmount ?? 0))
    setConfirmPay(true)
  }

  const payAmountNum = Number(payAmount.replace(/[^0-9]/g, '')) || 0
  const upcoming = billing?.upcomingAmount ?? 0
  const payAmountValid = payAmountNum > 0 && payAmountNum <= upcoming

  const handlePay = () => {
    if (!payAmountValid) return
    payCard.mutate({ id: asset.rowId, amount: payAmountNum }, {
      onSuccess: () => {
        setConfirmPay(false)
        toast.success(t('assetDetail.toastPaid'))
      },
      onError: () => {
        setConfirmPay(false)
        toast.error(t('assetDetail.toastPayFail'))
      },
    })
  }

  const viewAll = () => navigate(`/desk/expense?assetId=${asset.rowId}`)

  if (isLoading) {
    return (
      <div style={{ padding: '2px 2px 16px' }}>
        <SkeletonBase className="h-6 w-32 mb-3" />
        <SkeletonBase className="h-9 w-44 mb-4" />
        <SkeletonBase className="h-12 w-full" />
      </div>
    )
  }

  return (
    <>
      {/* 결제 예정 히어로 — 회차 선택 */}
      <div style={{ padding: '2px 2px 16px' }}>
        <button
          type="button"
          onClick={() => setPickOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span style={{ fontSize: 'var(--text-title-lg)', fontWeight: '700', color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
            {st?.label ?? '—'}
          </span>
          {st?.scheduled && (
            <span style={{ fontSize: 'var(--text-badge)', fontWeight: '700', color: 'var(--fg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '2px 9px' }}>
              {t('assetDetail.scheduledTag')}
            </span>
          )}
          <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-pill)', background: 'var(--bg-sunken)', color: 'var(--fg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronDown size={14} strokeWidth={2.4} />
          </span>
        </button>
        <div className="num" style={{ fontSize: 'var(--text-display-md)', fontWeight: '800', letterSpacing: '-0.03em', marginTop: 10, color: 'var(--fg-primary)' }}>
          <MaskAmount>{wonPre()}{KRW(st?.amount ?? 0)}</MaskAmount>
          {!isEn() && (
            <HideUnit>
              <span style={{ fontSize: 'var(--text-title-lg)', marginLeft: 1 }}>원</span>
            </HideUnit>
          )}
        </div>
        {st && !st.scheduled && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-cat-green)', fontWeight: '600', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={13} strokeWidth={3} /> {t('assetDetail.paidDone')}
          </div>
        )}
      </div>

      {/* 결제일 · 카드 이용 기간 */}
      {paymentDay != null && (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 2px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', minWidth: 68, flexShrink: 0 }}>
              {t('assetDetail.paymentDateLabel')}
            </span>
            <span className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: 'var(--fg-primary)' }}>
              {t('assetDetail.billedMonthly', { day: paymentDay })}
            </span>
            {periodText && (
              <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                {t('assetDetail.usagePeriod', { period: periodText })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 빠른 액션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0 4px' }}>
        <button
          type="button"
          disabled={!canPay}
          onClick={openPay}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px', background: 'var(--bg-sunken)', border: 0, borderRadius: 'var(--radius-lg)', cursor: canPay ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-primary)', opacity: canPay ? 1 : 0.55 }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--fg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} strokeWidth={1.9} />
          </span>
          <span>{t('assetDetail.payNow')}</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px', background: 'var(--bg-sunken)', border: 0, borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-primary)' }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--fg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <SlidersHorizontal size={15} strokeWidth={1.9} />
          </span>
          <span>{t('assetDetail.limitSettings')}</span>
        </button>
      </div>

      {/* 한도 사용 · 실적 */}
      {limit > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 18, paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: '700', letterSpacing: '-0.01em', color: 'var(--fg-primary)' }}>
              {t('assetDetail.limitUsage')}
            </h4>
            <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700', color: limitWarn ? 'var(--color-cat-red)' : 'var(--fg-brand)' }}>
              {t('assetDetail.limitPctUsed', { pct: limitPct })}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--bg-sunken)', overflow: 'hidden', margin: '11px 0 7px' }}>
            <div style={{ width: `${limitPct}%`, height: '100%', borderRadius: 'var(--radius-pill)', background: limitWarn ? 'var(--color-cat-red)' : 'var(--bg-brand)' }} />
          </div>
          <div className="num" style={{ display: 'flex', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            <span>{t('assetDetail.limitOf', { used: money(used), limit: money(limit) })}</span>
            <span style={{ marginLeft: 'auto' }}>{t('assetDetail.limitRemain', { amount: money(Math.max(0, limit - used)) })}</span>
          </div>
          <button
            type="button"
            onClick={onEdit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '8px 13px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-primary)' }}
          >
            <Pencil size={12} strokeWidth={2.2} /> {t('assetDetail.limitEdit')}
          </button>
          <CardPerfBadge assetRowId={asset.rowId} />
        </div>
      )}
      {limit <= 0 && <CardPerfBadge assetRowId={asset.rowId} />}

      {/* 이용 내역 — 정렬 칩 + 날짜 그룹 리스트 */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 18, paddingTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
            {t('assetDetail.usageHistory')}{' '}
            {sorted.length > 0 && <span className="num" style={{ color: 'var(--fg-brand)' }}>{sorted.length}</span>}
          </h4>
          <button
            type="button"
            onClick={viewAll}
            style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--fg-secondary)', cursor: 'pointer', fontSize: 'var(--text-label-sm)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: 2 }}
          >
            {t('assetDetail.viewAll')} <ChevronRight size={12} />
          </button>
        </div>
        {/* 정렬 — 통계 페이지와 동일한 pills 탭(공용, 사용자 결정) */}
        <div style={{ margin: '12px 0 2px' }}>
          <Tabs value={sort} onValueChange={v => v && setSort(v as 'recent' | 'amount' | 'category')}>
            <TabsList variant="pills" size="sm">
              <TabsTrigger value="recent">{t('assetDetail.sortRecent')}</TabsTrigger>
              <TabsTrigger value="amount">{t('assetDetail.sortAmount')}</TabsTrigger>
              <TabsTrigger value="category">{t('assetDetail.sortCategory')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {sorted.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
            {t('assetDetail.noUsage')}
          </div>
        ) : sort === 'recent' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
            {usageGroups.map(([d, items]) => {
              const { md, dow } = formatDay(d)
              const out = items.filter(tx => tx.expenseType === 'EXPENSE').reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
              const inn = items.filter(tx => tx.expenseType === 'INCOME').reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
              return (
                <div key={d}>
                  <DateGroupHeader date={md} weekday={dow} expense={out} income={inn} />
                  {items.map(tx => (
                    <ExpenseRow key={tx.rowId} expense={tx} />
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ paddingTop: 6 }}>
            {sorted.map(tx => (
              <ExpenseRow key={tx.rowId} expense={tx} />
            ))}
          </div>
        )}
      </div>

      {/* 기간 선택 시트 */}
      {pickOpen && (
        <ModalShell title={t('assetDetail.periodPick')} onClose={() => setPickOpen(false)} size="md" mobile={mobile}>
          {byYear.map(([y, rows]) => (
            <div key={y} style={{ display: 'flex', gap: 14, paddingTop: 6 }}>
              <div className="num" style={{ width: 52, flexShrink: 0, fontSize: 'var(--text-body-md)', fontWeight: '700', color: 'var(--fg-primary)', paddingTop: 15 }}>
                {y}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {rows.map(({ s, i }, ri) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setStIdx(i); setPickOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '15px 2px', background: 'transparent', border: 0,
                      borderTop: ri === 0 ? 'none' : '1px solid var(--border-subtle)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-body-md)', fontWeight: i === stIdx ? '700' : '500', color: 'var(--fg-primary)' }}>
                      {s.label}{s.scheduled ? ` (${t('assetDetail.scheduledTag')})` : ''}
                    </span>
                    <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)' }}>
                      <MaskAmount>{wonPre()}{KRW(s.amount)}</MaskAmount>
                      <WonUnit />
                    </span>
                    {i === stIdx && <Check size={16} color="var(--fg-brand)" strokeWidth={2.6} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ModalShell>
      )}

      {confirmPay && (
        <ModalShell
          title={t('assetDetail.payNow')}
          onClose={() => { if (!payCard.isPending) setConfirmPay(false) }}
          mobile={mobile}
          size="sm"
          footer={
            <ModalFooter
              onCancel={() => { if (!payCard.isPending) setConfirmPay(false) }}
              cancelLabel={tc('cancel')}
              onSave={handlePay}
              saveLabel={t('assetDetail.payAction')}
              saving={payCard.isPending}
              saveDisabled={!payAmountValid}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', lineHeight: 1.7, margin: 0 }}>
              <Trans
                i18nKey="assetDetail.payConfirm"
                ns="asset"
                values={{ amount: money(upcoming) }}
                components={{ strong: <strong /> }}
              />
              {billing?.nextPaymentDate ? ` ${t('assetDetail.paymentDateNote', { date: billing.nextPaymentDate })}` : ''}
            </p>

            {/* 부분 선결제 — 일부만 내면 나머지는 결제일에 정상적으로 빠진다. */}
            <div className="flex flex-col gap-2">
              <Label>{t('assetDetail.payAmount')}</Label>
              <Input
                className="num"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
              />
              {payAmountNum > 0 && payAmountNum < upcoming && (
                <p className="text-xs text-[var(--fg-tertiary)]">
                  {t('assetDetail.payRemainder', { amount: money(upcoming - payAmountNum) })}
                </p>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// 투자 상세 — 보유 종목 리스트 (design dialogs.jsx split24 AssetDetailDialog invest 분기 미러)
//   연동(linked) 항목: 종목명 · "N주 · 현재가 X 연동" · 평가액 · 등락%
//   수동(manual) 항목: 이름 · "직접 입력" · 평가액
//   행 클릭 → 편집 다이얼로그(종목 추가/수정은 편집에서).
// ---------------------------------------------------------------------------
function HoldingRow({
  holding,
  price,
  prevClose,
  fx,
  live,
  first,
  onEdit,
}: {
  holding: AssetHolding
  price: { price: number; currency: string } | null
  prevClose: number | null
  fx: number | null
  live: boolean
  first: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation('asset')
  const { data: masterName } = useStockSymbolName(holding.linked ? holding.tossSymbol ?? '' : '')
  const name = holding.linked
    ? masterName ?? holding.tossSymbol ?? ''
    : holding.holdingName ?? ''

  const toKrw = (v: number, currency: string): number | null => {
    if (currency === 'KRW') return v
    return fx != null && fx > 0 ? v * fx : null
  }
  // 수량은 정밀도 때문에 문자열로 온다 — 표시·미리보기 계산에서만 숫자로 푼다(저장은 서버 몫).
  const qty = qtyNumber(holding.quantity) ?? 0
  let value: number | null = null
  let changePct: number | null = null
  let priceLabel: string | null = null
  if (holding.linked) {
    if (live && price) {
      const krw = toKrw(price.price, price.currency)
      if (krw != null) value = Math.round(krw * qty)
      priceLabel =
        price.currency === 'USD' ? `$${price.price.toLocaleString()}` : `${KRW(price.price)}원`
      if (prevClose != null && prevClose > 0) {
        changePct = Math.round(((price.price - prevClose) / prevClose) * 1000) / 10
      }
    }
  } else {
    value = holding.holdingValue ?? 0
  }

  // 수량 표기는 문자열을 그대로 다듬는다 — 코인은 8자리까지(0.00012345 BTC 가 0 으로 보이지 않게).
  const qtyLabel = formatQty(holding.quantity, holding.holdingType ?? 'STOCK')
  // 미연동도 수량을 적어뒀으면 함께 보여준다 — 단위는 유형을 따른다(주/g/개).
  const manualQty =
    !holding.linked && qty > 0
      ? `${qtyLabel}${t(HOLDING_UNIT_KEY[holding.holdingType ?? 'STOCK'])}`
      : null
  const sub = holding.linked
    ? live && priceLabel
      ? t('holdings.linkedSub', { n: qtyLabel, price: priceLabel })
      : t('holdings.linkedPending', { n: qtyLabel })
    : manualQty
      ? `${manualQty} · ${t('holdings.manualSub')}`
      : t('holdings.manualSub')

  return (
    <div
      onClick={onEdit}
      role={onEdit ? 'button' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderTop: first ? 'none' : '1px solid var(--border-subtle)',
        cursor: onEdit ? 'pointer' : 'default',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {name}
        </div>
        <div className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700 }}>
          {value != null ? (
            <>
              <MaskAmount>{wonPre()}{KRW(value)}</MaskAmount>
              <WonUnit />
            </>
          ) : (
            '—'
          )}
        </div>
        {changePct != null && (
          <div
            className="num"
            style={{
              fontSize: 'var(--text-badge)',
              fontWeight: 600,
              marginTop: 2,
              color: changePct >= 0 ? 'var(--status-danger-fg)' : 'var(--fg-brand)',
            }}
          >
            {changePct >= 0 ? '+' : ''}{changePct}%
          </div>
        )}
      </div>
      {onEdit && <ChevronRight size={15} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />}
    </div>
  )
}

/**
 * 거래 내역 — 매수·매도가 언제 얼마에 있었는지. 실현손익도 함께 보여 준다.
 * 취소하면 예수금·보유 수량·원가가 거래 전으로 되돌아간다.
 */
function TradeHistory({ assetRowId }: { assetRowId: number }) {
  const { t } = useTranslation('asset')
  const { data: trades } = useAssetTrades(assetRowId)
  const deleteMut = useDeleteTrade()
  if (!trades || trades.length === 0) {
    return null
  }
  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700, margin: '0 0 6px' }}>
        {t('trade.history')}
      </h3>
      {trades.map(tr => (
        <div
          key={tr.rowId}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-badge)', fontWeight: 700,
              color: tr.tradeType === 'SELL' ? 'var(--fg-brand)' : 'var(--status-danger-fg)',
            }}
          >
            {tr.tradeType === 'SELL' ? t('trade.sell') : t('trade.buy')}
          </span>
          <span className="truncate" style={{ fontSize: 'var(--text-body-sm)', minWidth: 0, flex: 1 }}>
            {tr.holdingKey}
          </span>
          <span className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
            {tr.quantity} · {tr.tradeDate.slice(0, 10)}
          </span>
          <span className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700 }}>
            {KRW(tr.amount)}원
          </span>
          {tr.realizedPl != null && tr.realizedPl !== 0 && (
            <span
              className="num"
              style={{
                fontSize: 'var(--text-badge)', fontWeight: 700,
                color: tr.realizedPl > 0 ? 'var(--fg-income)' : 'var(--fg-expense)',
              }}
            >
              {tr.realizedPl > 0 ? '+' : '−'}{KRW(Math.abs(tr.realizedPl))}
            </span>
          )}
          <Button
            variant="ghost"
            size="xs"
            aria-label={t('trade.deleted')}
            onClick={() => {
              if (window.confirm(t('trade.deleteConfirm'))) {
                deleteMut.mutate(tr.rowId, { onSuccess: () => toast.success(t('trade.deleted')) })
              }
            }}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ))}
    </div>
  )
}

function HoldingsSection({ asset, onEdit, mobile }: { asset: Asset; onEdit?: () => void; mobile: boolean }) {
  const { t } = useTranslation('asset')
  const [trade, setTrade] = useState<TradeType | null>(null)
  const { data: features } = useMyFeatures()
  const live =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const hs = holdingsOf(asset)
  const symbols = useMemo(
    () => [...new Set(hs.filter(h => h.linked && h.tossSymbol).map(h => h.tossSymbol as string))],
    [hs],
  )
  const active = live && symbols.length > 0
  const activeSymbols = useMemo(() => (active ? symbols : []), [active, symbols])
  const pricesQ = useTossPrices(activeSymbols)
  const fxQ = useTossExchangeRate(active)
  const prevCloses = usePrevCloses(activeSymbols)
  const priceBySymbol = useMemo(() => {
    const m = new Map<string, { price: number; currency: string }>()
    for (const p of pricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) m.set(p.symbol, { price: v, currency: p.currency })
    }
    return m
  }, [pricesQ.data])
  const fx = Number.parseFloat(fxQ.data?.rate ?? '')

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 0 6px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <h2 style={{ fontSize: 'var(--text-label-md)', fontWeight: 700, margin: 0 }}>
          {t('holdings.sectionTitle')}{' '}
          <span className="num" style={{ color: 'var(--fg-brand)' }}>{hs.length}</span>
        </h2>
        {/* 매수·매도 — 예수금이 실제로 움직이는 자리. 보유를 손으로 고치는 것과 다르다. */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <Button variant="accent" size="sm" onClick={() => setTrade('BUY')}>
            {t('trade.entryBuy')}
          </Button>
          <Button variant="accent" size="sm" disabled={hs.length === 0} onClick={() => setTrade('SELL')}>
            {t('trade.entrySell')}
          </Button>
        </div>
      </div>
      {hs.map((h, i) => (
        <HoldingRow
          key={h.rowId ?? `${h.tossSymbol ?? h.holdingName ?? ''}-${i}`}
          holding={h}
          price={h.linked && h.tossSymbol ? priceBySymbol.get(h.tossSymbol) ?? null : null}
          prevClose={h.linked && h.tossSymbol ? prevCloses.get(h.tossSymbol) ?? null : null}
          fx={Number.isFinite(fx) && fx > 0 ? fx : null}
          live={live}
          first={i === 0}
          onEdit={onEdit}
        />
      ))}
      {hs.length === 0 && (
        <div style={{ padding: '20px 0', fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', textAlign: 'center' }}>
          {t('holdings.emptyDetail')}
        </div>
      )}

      {/* 거래 내역 — 언제 사고 팔았는지, 얼마가 남았는지. 취소도 여기서. */}
      <TradeHistory assetRowId={asset.rowId} />

      {trade && (
        <AssetTradeDialog
          asset={asset}
          holdings={hs}
          defaultType={trade}
          mobile={mobile}
          onClose={() => setTrade(null)}
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
  const { t } = useTranslation('asset')
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
    () => (trendData ?? []).map((p, i) => ({ label: t('assetDetail.weekLabel', { n: i + 1 }), weekStart: p.weekStart, balance: p.balance })),
    [trendData, t],
  )
  // Y축: 0기준 nice 눈금 (앱 asset_detail niceAxis 정합). 음수 잔액(대출)도 0 아래로 확장.
  const yAxis = useMemo(() => {
    const vals = chartData.map(d => d.balance)
    return niceAxis(Math.min(0, ...vals), Math.max(0, ...vals))
  }, [chartData])
  const periodLabel = period === '3m' ? t('assetDetail.weekLabel', { n: 12 }) : period === '6m' ? t('assetDetail.weekLabel', { n: 24 }) : t('assetDetail.weekLabel', { n: 52 })
  const seriesLabel = isCard ? t('assetDetail.seriesUsage') : isInv ? t('assetDetail.seriesValuation') : t('assetDetail.seriesBalance')

  const color = getPaletteByColor(asset.color).color
  const chartConfig: ChartConfig = {
    balance: { label: seriesLabel, color },
  }

  const absBalance = Math.abs(asset.balance)

  // 투자 자산 — holdings 라이브 평가(시세×수량+수동합)로 헤로 금액을 덮어쓰고 등락 표시.
  const investAssets = useMemo(() => (isInv ? [asset] : []), [isInv, asset])
  const investValMap = useInvestValuation(investAssets)
  const investVal = isInv ? investValMap.get(asset.rowId) ?? null : null

  // 라이브 평가는 '보유분'만 — 예수금을 더해야 계좌 총액이다.
  const investCash = isInv ? asset.cashBalance ?? 0 : 0
  const investHolding = investVal != null ? investVal.value : asset.holdingBalance ?? 0
  const heroAmount = investVal != null ? Math.abs(investCash + investVal.value) : absBalance
  // CREDIT_CARD 는 신판 카드 상세 본문(CardDetailBody) — 회차 히어로가 금액을 담당.
  const isCredit = asset.assetType === 'CREDIT_CARD'

  const { data: relatedAll, isLoading: relatedLoading } = useSearchExpenses({ assetId: asset.rowId })
  // 이체는 expense 가 아니라 asset_transfer 라 따로 받아 합친다. 한 건이 자산 두 개에 걸치므로
  // 이 자산이 보내는 쪽인지 받는 쪽인지로 걸러낸다(서버 필터는 기간만 지원).
  const { data: transfersAll } = useAssetTransfers()
  const relatedItems = useMemo(() => {
    const rows: AssetLedgerItem[] = [
      ...(relatedAll ?? []).map(e => ({ kind: 'expense', at: e.expenseDate, expense: e }) as AssetLedgerItem),
      ...(transfersAll?.transfers ?? [])
        .filter(t => t.fromAssetRowId === asset.rowId || t.toAssetRowId === asset.rowId)
        .map(t => ({ kind: 'transfer', at: t.transferDate, transfer: t }) as AssetLedgerItem),
    ]
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12)
  }, [relatedAll, transfersAll, asset.rowId])

  // 가계부 메인 리스트 미러 — 날짜별 그룹(최신순), 헤더에 일 지출/수입 합계.
  const relatedGroups = useMemo(() => {
    const m = new Map<string, AssetLedgerItem[]>()
    for (const item of relatedItems) {
      const k = item.at.slice(0, 10)
      const arr = m.get(k)
      if (arr) arr.push(item)
      else m.set(k, [item])
    }
    return [...m.entries()]
  }, [relatedItems])

  const title = isCard ? t('assetDetail.titleCard') : isInv ? t('assetDetail.titleInvest') : t('assetDetail.titleAccount')
  const valueLabel = isCard ? t('assetDetail.valueCard') : isInv ? t('assetDetail.seriesValuation') : t('assetDetail.seriesBalance')

  const viewAll = () => {
    onClose()
    navigate(`/desk/expense?assetId=${asset.rowId}`)
  }

  const Footer = (
    <ModalViewFooter
      leftSlot={
        <Button variant="ghost" size="md" flush="left" onClick={handleHideToggle} type="button">
          {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
          {hidden ? t('assetDetail.showAmounts') : t('assetDetail.hideAmounts')}
        </Button>
      }
      onEdit={onEdit ? () => onEdit(asset) : undefined}
      onConfirm={onClose}
    />
  )

  return (
    <>
    <ModalShell title={title} onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      {/* Hero — 플랫(design 신판): 이름 행 + 구분선 + 잔액. 신용카드는 이름 행만
          (회차 히어로가 금액 담당 — CardDetailBody). */}
      <div style={{ marginBottom: isCredit ? 0 : 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            paddingBottom: 14,
            marginBottom: isCredit ? 0 : 14,
            borderBottom: isCredit ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          <AssetLogo asset={asset} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', letterSpacing: '-0.012em' }}>
              {asset.assetName}
            </div>
            <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {/* 투자 — design: "투자 · 보유 N종목 · 메모" */}
              {isInv
                ? [
                    assetTypeLabel(asset.assetType),
                    t('holdings.countLabel', { n: holdingsOf(asset).length }),
                    asset.memo,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : [asset.institution, assetTypeLabel(asset.assetType), asset.memo]
                    .filter(Boolean)
                    .join(' · ')}
            </div>
          </div>
        </div>
        {!isCredit && (
          <>
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
                color: 'var(--fg-primary)',
              }}
            >
              <MaskAmount>
                {wonPre()}
                {KRW(heroAmount)}
              </MaskAmount>
              {!isEn() && (
                <HideUnit>
                  <span style={{ fontSize: 'var(--text-body-lg)', marginLeft: 2 }}>원</span>
                </HideUnit>
              )}
            </div>
            {/* 예수금·평가금액 — 실제 증권 계좌처럼 나눠 보여 준다(예수금이 있을 때만). */}
            {isInv && investCash !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)' }}>
                <span className="num">
                  {t('holdings.cashBalance')} <MaskAmount>{KRW(investCash)}</MaskAmount>
                </span>
                <span className="dot-sep" />
                <span className="num">
                  {t('holdings.holdingBalance')} <MaskAmount>{KRW(investHolding)}</MaskAmount>
                </span>
              </div>
            )}

            {/* 투자 등락 — design: "+N% · 오늘 ±N원" (+빨강/−파랑 국내 통념) */}
            {investVal?.changePct != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 'var(--text-label-sm)' }}>
                <span
                  className="num"
                  style={{
                    fontWeight: 700,
                    color: investVal.changePct >= 0 ? 'var(--status-danger-fg)' : 'var(--fg-brand)',
                  }}
                >
                  {investVal.changePct >= 0 ? '+' : ''}{investVal.changePct}%
                </span>
                {investVal.changeAmt != null && (
                  <span className="num" style={{ color: 'var(--fg-tertiary)' }}>
                    {t('holdings.todayChange', {
                      sign: investVal.changeAmt >= 0 ? '+' : '−',
                      amount: KRW(Math.abs(investVal.changeAmt)),
                    })}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 보유 종목 — design invest 상세: 연동/수동 항목 리스트 (행 클릭 → 편집) */}
      {isInv && <HoldingsSection asset={asset} onEdit={onEdit ? () => onEdit(asset) : undefined} mobile={mobile} />}

      {/* 신용카드 — 신판 카드 상세 본문(회차·한도·실적·이용 내역 일체) */}
      {isCredit && (
        <CardDetailBody
          asset={asset}
          mobile={mobile}
          onEdit={onEdit ? () => onEdit(asset) : undefined}
        />
      )}

      {/* 체크카드 — 실적 배지만(청구 회차 없음) */}
      {isCard && !isCredit && (
        <div style={{ marginBottom: 18 }}>
          <CardPerfBadge assetRowId={asset.rowId} />
        </div>
      )}

      {!isCredit && (
      <>
      {/* Balance trend chart */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
            {t('assetDetail.recentTrend', { period: periodLabel, label: isCard ? t('assetDetail.trendUsage') : isInv ? t('assetDetail.trendValuation') : t('assetDetail.trendBalance') })}
          </h4>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as '3m' | '6m' | '1y')}
            className="ml-auto"
          >
            <TabsList variant="pill" size="sm">
              <TabsTrigger value="3m">{t('assetDetail.period3m')}</TabsTrigger>
              <TabsTrigger value="6m">{t('assetDetail.period6m')}</TabsTrigger>
              <TabsTrigger value="1y">{t('assetDetail.period1y')}</TabsTrigger>
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
            {t('assetDetail.noData')}
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
            {t('assetDetail.recentTx')}{relatedItems.length > 0 ? ` (${relatedItems.length})` : ''}
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
            {t('assetDetail.viewAll')} <ChevronRight size={12} />
          </button>
        </div>
        {/* 가계부 메인 리스트 미러 — 카드 제거, 날짜 그룹 헤더 + 플랫 행 */}
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
        ) : relatedItems.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--fg-tertiary)',
              fontSize: 'var(--text-label-sm)',
            }}
          >
            {t('assetDetail.noLinkedTx')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {relatedGroups.map(([d, items]) => {
              const { md, dow } = formatDay(d)
              // 일 합계는 지출/수입만 — 이체는 자산 간 이동이라 어느 쪽에도 넣지 않는다.
              const dayExpenses = items.flatMap(i => (i.kind === 'expense' ? [i.expense] : []))
              const out = dayExpenses
                .filter(tx => tx.expenseType === 'EXPENSE')
                .reduce((s, tx) => s + Math.abs(tx.amount), 0)
              const inn = dayExpenses
                .filter(tx => tx.expenseType === 'INCOME')
                .reduce((s, tx) => s + Math.abs(tx.amount), 0)
              return (
                <div key={d}>
                  <DateGroupHeader date={md} weekday={dow} expense={out} income={inn} />
                  {items.map(item => (item.kind === 'expense'
                    ? <ExpenseRow key={`e${item.expense.rowId}`} expense={item.expense} />
                    : <TransferRow
                        key={`t${item.transfer.rowId}`}
                        transfer={item.transfer}
                        perspectiveAssetRowId={asset.rowId}
                      />))}
                </div>
              )
            })}
          </div>
        )}
      </div>
      </>
      )}
    </ModalShell>
    <HideAmountsUnlockDialog
      open={unlockOpen}
      onOpenChange={setUnlockOpen}
      onVerified={disablePdHideAmounts}
    />
    </>
  )
}
