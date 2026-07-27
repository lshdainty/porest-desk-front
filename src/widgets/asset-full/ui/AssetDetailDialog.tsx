import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Pencil, SlidersHorizontal, Target, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { AssetLogo, type Asset } from '@/entities/asset'
import type { Expense } from '@/entities/expense'
import { useAssetBalanceTrend, useCardBilling, usePayCard, useLinkTossSymbol, useUnlinkTossSymbol } from '@/features/asset'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { Input } from '@/shared/ui/input'
import { searchKrxStocks, getKrxStockName, type KrxStock } from '@/features/stock/lib/krxSearch'
import { useCardPerformance } from '@/features/card-performance'
import { useSearchExpenses } from '@/features/expense'
import { ModalShell, ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
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
          ? 'color-mix(in oklch, var(--color-cat-green) 10%, var(--bg-surface))'
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
  relatedTx,
  relatedGroups,
  mobile,
  onEdit,
}: {
  asset: Asset
  relatedTx: Expense[]
  relatedGroups: [string, Expense[]][]
  mobile: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation('asset')
  const navigate = useNavigate()
  const { data: billing, isLoading } = useCardBilling(asset.rowId)
  const payCard = usePayCard()
  const [confirmPay, setConfirmPay] = useState(false)
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

  const sorted = useMemo(() => {
    const list = [...relatedTx]
    if (sort === 'amount') return list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    if (sort === 'category') return list.sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? ''))
    return list
  }, [relatedTx, sort])

  const handlePay = () => {
    payCard.mutate(asset.rowId, {
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
          onClick={() => setConfirmPay(true)}
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
            {relatedGroups.map(([d, items]) => {
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
        <ConfirmDialog
          title={t('assetDetail.payNow')}
          message={
            <>
              <Trans
                i18nKey="assetDetail.payConfirm"
                ns="asset"
                values={{ amount: money(billing?.upcomingAmount ?? 0) }}
                components={{ strong: <strong /> }}
              />
              {billing?.nextPaymentDate ? ` ${t('assetDetail.paymentDateNote', { date: billing.nextPaymentDate })}` : ''}
            </>
          }
          confirmLabel={t('assetDetail.payAction')}
          loading={payCard.isPending}
          onCancel={() => { if (!payCard.isPending) setConfirmPay(false) }}
          onConfirm={handlePay}
        />
      )}
    </>
  )
}

const tossListBtn: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 'var(--text-caption)',
  color: 'var(--fg-primary)',
  background: 'var(--bg-muted)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 10px',
  cursor: 'pointer',
}

/**
 * 투자 자산 ↔ 토스 종목 연결 섹션 (프로(SECURITIES) + 토스 연결 사용자에게만 노출).
 * 종목 + 보유수량을 등록하면 토스 현재가 × 수량으로 평가액이 실시간 계산된다.
 * 토스 계좌 보유분과 무관 — 시세만 빌려 타 증권사 보유 주식도 평가.
 */
function TossLinkSection({ asset }: { asset: Asset }) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const { data: features } = useMyFeatures()
  const enabled =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const linkMut = useLinkTossSymbol()
  const unlinkMut = useUnlinkTossSymbol()
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<KrxStock[]>([])
  const [selSymbol, setSelSymbol] = useState(asset.tossSymbol ?? '')
  const [selName, setSelName] = useState('')
  const [qty, setQty] = useState(asset.tossQuantity != null ? String(asset.tossQuantity) : '')
  // 연결 상태는 mutation 후 즉시 반영되도록 로컬로 추적 (asset prop 은 부모 state 라 stale).
  const [linked, setLinked] = useState<{ symbol: string; quantity: number } | null>(
    asset.tossSymbol && asset.tossQuantity != null
      ? { symbol: asset.tossSymbol, quantity: asset.tossQuantity }
      : null,
  )
  // KRX 마스터에서 조회한 종목명 (연결/선택 종목 표시용).
  const [resolvedName, setResolvedName] = useState<string | undefined>(undefined)
  // 보유수량 수정 모드.
  const [editingQty, setEditingQty] = useState(false)
  const [editQty, setEditQty] = useState('')

  // 종목 검색 (KRX 마스터, lazy fetch). 최신 query 만 반영(race-safe).
  useEffect(() => {
    const term = query.trim()
    if (!term) {
      setMatches([])
      return
    }
    let alive = true
    searchKrxStocks(term)
      .then(r => { if (alive) setMatches(r) })
      .catch(() => { if (alive) setMatches([]) })
    return () => { alive = false }
  }, [query])

  // 연결/선택된 종목코드의 이름 조회 (KRX 마스터).
  useEffect(() => {
    const sym = linked?.symbol ?? selSymbol
    if (!sym) {
      setResolvedName(undefined)
      return
    }
    let alive = true
    getKrxStockName(sym).then(n => { if (alive) setResolvedName(n) }).catch(() => {})
    return () => { alive = false }
  }, [linked, selSymbol])

  if (!enabled) return null

  const box: React.CSSProperties = {
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-surface)',
    padding: 16,
    marginBottom: 18,
  }

  if (linked) {
    const editQtyNum = Number(editQty.replace(/[^\d]/g, '')) || 0
    return (
      <section style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Badge variant="info">{t('assetDetail.tossLinked')}</Badge>
          <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700 }}>
            {resolvedName ?? linked.symbol} · {t('assetDetail.sharesUnit', { n: linked.quantity.toLocaleString() })}
          </span>
        </div>
        {editingQty ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              inputMode="numeric"
              value={editQty}
              onChange={e => setEditQty(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={t('assetDetail.holdingsQty')}
              style={{ flex: 1 }}
            />
            <Button
              size="sm"
              disabled={editQtyNum <= 0 || linkMut.isPending}
              onClick={() =>
                linkMut.mutate(
                  { id: asset.rowId, symbol: linked.symbol, quantity: editQtyNum },
                  {
                    onSuccess: () => {
                      setLinked({ symbol: linked.symbol, quantity: editQtyNum })
                      setEditingQty(false)
                      toast.success(t('assetDetail.toastQtyUpdated'))
                    },
                    onError: () => toast.error(t('assetDetail.toastQtyFail')),
                  },
                )
              }
            >
              {tc('save')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditingQty(false)}>
              {tc('cancel')}
            </Button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginBottom: 12 }}>
              {t('assetDetail.valuationFormula', { n: linked.quantity.toLocaleString() })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditQty(String(linked.quantity))
                  setEditingQty(true)
                }}
              >
                {t('assetDetail.editQty')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={unlinkMut.isPending}
                onClick={() =>
                  unlinkMut.mutate(asset.rowId, {
                    onSuccess: () => {
                      setLinked(null)
                      setSelSymbol('')
                      setSelName('')
                      setQty('')
                      setQuery('')
                      toast.success(t('assetDetail.toastUnlinked'))
                    },
                    onError: () => toast.error(t('assetDetail.toastUnlinkFail')),
                  })
                }
              >
                {t('assetDetail.unlink')}
              </Button>
            </div>
          </>
        )}
      </section>
    )
  }

  const q = query.trim()
  const codeFallback = q && matches.length === 0 ? q.toUpperCase() : ''
  const pick = (symbol: string, name: string) => {
    setSelSymbol(symbol)
    setSelName(name)
    setQuery('')
    setMatches([])
  }
  const qtyNum = Number(qty.replace(/[^\d]/g, '')) || 0
  const canLink = !!selSymbol && qtyNum > 0 && !linkMut.isPending

  return (
    <section style={box}>
      <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700, marginBottom: 6 }}>
        {t('assetDetail.tossRealtimeTitle')}
      </div>
      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginBottom: 12 }}>
        {t('assetDetail.tossRealtimeDesc')}
      </div>

      {selSymbol ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600 }}>
            {selName || resolvedName || selSymbol} ({selSymbol})
          </span>
          <button
            type="button"
            onClick={() => { setSelSymbol(''); setSelName('') }}
            style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {t('assetDetail.change')}
          </button>
        </div>
      ) : (
        <>
          <Input
            search
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('assetDetail.symbolSearchPlaceholder')}
          />
          {(matches.length > 0 || codeFallback) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, marginBottom: 4 }}>
              {matches.map(s => (
                <button key={s.ticker} type="button" onClick={() => pick(s.ticker, s.name)} style={tossListBtn}>
                  {s.name} <span style={{ color: 'var(--fg-tertiary)' }}>({s.ticker})</span>
                </button>
              ))}
              {codeFallback && (
                <button type="button" onClick={() => pick(codeFallback, '')} style={tossListBtn}>
                  {t('assetDetail.linkByCode', { code: codeFallback })}
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <Input
          inputMode="numeric"
          value={qty}
          onChange={e => setQty(e.target.value.replace(/[^\d]/g, ''))}
          placeholder={t('assetDetail.holdingsQty')}
          style={{ flex: 1 }}
        />
        <Button
          size="sm"
          disabled={!canLink}
          onClick={() =>
            linkMut.mutate(
              { id: asset.rowId, symbol: selSymbol, quantity: qtyNum },
              {
                onSuccess: () => {
                  setLinked({ symbol: selSymbol, quantity: qtyNum })
                  toast.success(t('assetDetail.toastLinkStarted'))
                },
                onError: () => toast.error(t('assetDetail.toastLinkFail')),
              },
            )
          }
        >
          {t('assetDetail.link')}
        </Button>
      </div>
    </section>
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

  const heroAmount = absBalance
  // CREDIT_CARD 는 신판 카드 상세 본문(CardDetailBody) — 회차 히어로가 금액을 담당.
  const isCredit = asset.assetType === 'CREDIT_CARD'

  const { data: relatedAll, isLoading: relatedLoading } = useSearchExpenses({ assetId: asset.rowId })
  const relatedTx: Expense[] = useMemo(
    () => [...(relatedAll ?? [])]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 12),
    [relatedAll],
  )

  // 가계부 메인 리스트 미러 — 날짜별 그룹(최신순), 헤더에 일 지출/수입 합계.
  const relatedGroups = useMemo(() => {
    const m = new Map<string, Expense[]>()
    for (const tx of relatedTx) {
      const k = tx.expenseDate.slice(0, 10)
      const arr = m.get(k)
      if (arr) arr.push(tx)
      else m.set(k, [tx])
    }
    return [...m.entries()]
  }, [relatedTx])

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
              {[asset.institution, assetTypeLabel(asset.assetType), asset.memo]
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
          </>
        )}
      </div>

      {/* 투자 자산 ↔ 토스 보유종목 연결 (프로+토스 연결 사용자만 노출) */}
      {isInv && <TossLinkSection asset={asset} />}

      {/* 신용카드 — 신판 카드 상세 본문(회차·한도·실적·이용 내역 일체) */}
      {isCredit && (
        <CardDetailBody
          asset={asset}
          relatedTx={relatedTx}
          relatedGroups={relatedGroups}
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
            {t('assetDetail.recentTx')}{relatedTx.length > 0 ? ` (${relatedTx.length})` : ''}
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
        ) : relatedTx.length === 0 ? (
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
              const out = items
                .filter(tx => tx.expenseType === 'EXPENSE')
                .reduce((s, tx) => s + Math.abs(tx.amount), 0)
              const inn = items
                .filter(tx => tx.expenseType === 'INCOME')
                .reduce((s, tx) => s + Math.abs(tx.amount), 0)
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
