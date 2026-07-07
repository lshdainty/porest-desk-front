import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Minus, Sparkles, TrendingUp } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { KRW, money } from '@/shared/lib/porest/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useMyFeatures,
  useMySubscription,
  useSubscribe,
  useCancelSubscription,
  useSubscriptionPlans,
} from '@/features/subscription/model/useSubscription'

interface SubFeature {
  labelKey: string
  free: boolean | string
  pro: boolean | string
  star?: boolean
}

// free/pro 의 string 값은 i18n 키 (FeatureCell 렌더 시 t 로 해석)
const SUB_FEATURES: SubFeature[] = [
  { labelKey: 'feature.core', free: true, pro: true },
  { labelKey: 'feature.budget', free: true, pro: true },
  { labelKey: 'feature.txLog', free: 'feature.txFree', pro: 'feature.txUnlimited' },
  { labelKey: 'feature.securities', free: false, pro: true, star: true },
  { labelKey: 'feature.importExport', free: false, pro: true },
  { labelKey: 'feature.multiCalendar', free: false, pro: true },
  { labelKey: 'feature.cardBenefit', free: false, pro: true },
]

function FeatureCell({ val, accent }: { val: boolean | string; accent?: boolean }) {
  if (val === true) return <Check size={15} style={{ color: accent ? 'var(--fg-brand)' : 'var(--status-success-fg)' }} />
  if (val === false) return <Minus size={15} style={{ color: 'var(--fg-disabled)' }} />
  return <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: accent ? 'var(--fg-brand)' : 'var(--fg-secondary)' }}>{val}</span>
}

/**
 * 구독 관리 모달 — Free/Pro 플랜 비교 + 결제 주기 + 기능 비교표.
 * PG 미연동이라 'Pro 시작하기'는 self-grant(useSubscribe)로 즉시 구독된다.
 */
export function SubscriptionDialog({ onClose, mobile }: { onClose: () => void; mobile: boolean }) {
  const { t } = useTranslation('subscription')
  const { t: tCommon } = useTranslation('common')
  const featuresQ = useMyFeatures()
  const subQ = useMySubscription()
  const plansQ = useSubscriptionPlans()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isPro = featuresQ.data?.features?.includes('SECURITIES') ?? false
  const sub = subQ.data
  const nextBill = sub?.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : null
  const upgradePlan = plansQ.data?.[0]

  const proMonthly = 9_900
  const proYearly = 99_000
  const proPrice = cycle === 'monthly' ? proMonthly : proYearly
  const proPerMonth = cycle === 'monthly' ? proMonthly : Math.round(proYearly / 12)
  const savePct = Math.round((1 - proYearly / (proMonthly * 12)) * 100)

  const onSubscribe = () =>
    subscribe.mutate(upgradePlan?.planCode ?? 'SECURITIES', {
      onSuccess: () => {
        toast(t('toast.subscribed'))
        onClose()
      },
      onError: () => toast.error(t('toast.subscribeFailed')),
    })
  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast(t('toast.canceled'))
        onClose()
      },
      onError: () => toast.error(t('toast.cancelFailed')),
    })

  // 앱 시트 footer 정합 — [닫기 | 구독 해지(danger)] / [닫기 | Pro 시작하기(primary)].
  // 구독 해지는 ModalFooter 주액션(destructive)으로 두고, 확인 다이얼로그는 controlled 로 띄운다.
  const Footer = isPro ? (
    <ModalFooter
      fullWidth
      onCancel={onClose}
      cancelLabel={tCommon('close')}
      onSave={() => setConfirmOpen(true)}
      saveLabel={t('cancelSub')}
      saveVariant="destructive"
    />
  ) : (
    <ModalFooter
      fullWidth
      onCancel={onClose}
      cancelLabel={tCommon('close')}
      onSave={onSubscribe}
      saveLabel={t('startPro')}
      saving={subscribe.isPending}
    />
  )

  return (
    <ModalShell title={t('title')} onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      {/* 현재 플랜 배너 — Card.brand (bg-brand-subtle + soft brand border) */}
      <Card
        variant="brand"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 16,
          borderColor: 'var(--border-brand-soft)',
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>
            {isPro ? t('proInUse') : t('freeInUse')}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2 }}>
            {isPro
              ? (nextBill ? `${t('nextBill', { date: nextBill })} · ${money(proMonthly)}` : `${money(proMonthly)}`)
              : t('freeLocked')}
          </div>
        </div>
      </Card>

      {/* 증권 스포트라이트 — Card.muted + page 톤 override (앱 bgSunken 정합: surface 보다
          어두운 sunken. 웹 --bg-muted 는 다크에서 surface 보다 밝아 앱과 반대라 --bg-canvas 사용) */}
      <Card
        variant="muted"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 16px',
          marginBottom: 18,
          background: 'var(--bg-canvas)',
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
            background: 'var(--status-danger-subtle)',
            color: 'var(--status-danger-fg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>{t('spotlightTitle')}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            {t('spotlightDesc')}
          </div>
        </div>
      </Card>

      {/* 결제 주기 토글 — ToggleGroup segmented (앱 PSegmented 정합) */}
      <ToggleGroup
        type="single"
        variant="segmented"
        value={cycle}
        onValueChange={v => v && setCycle(v as 'monthly' | 'yearly')}
        style={{ marginBottom: 14 }}
      >
        <ToggleGroupItem value="monthly" variant="segmented">
          {t('cycleMonthly')}
        </ToggleGroupItem>
        <ToggleGroupItem value="yearly" variant="segmented">
          {t('cycleYearly', { pct: savePct })}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* 플랜 비교 카드 — 모바일(drawer)에서도 앱처럼 항상 2열 나란히 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Card variant="bordered" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>Free</span>
            {!isPro && <Badge variant="secondary">{t('currentPlan')}</Badge>}
          </div>
          <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
            0원
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{t('freeDesc')}</div>
        </Card>
        <Card
          variant="bordered"
          style={{ padding: 16, borderColor: 'var(--border-brand)', borderWidth: 2, position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-brand)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} /> Pro
            </span>
            {isPro && <Badge variant="default">{t('currentPlan')}</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
              {money(proPrice)}
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>/ {cycle === 'monthly' ? t('perMonth') : t('perYear')}</span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {cycle === 'yearly' ? t('pricePerMonthNote', { price: KRW(proPerMonth), pct: savePct }) : t('monthlyBilling')}
          </div>
        </Card>
      </div>

      {/* 기능 비교표 — Card.bordered (행 모서리 라운딩은 overflow:hidden 으로 clip) */}
      <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--fg-tertiary)', letterSpacing: '0.04em', marginBottom: 8 }}>
        {t('comparisonTitle')}
      </div>
      <Card variant="bordered" style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 52px 52px',
            alignItems: 'center',
            padding: '8px 14px',
            background: 'var(--bg-table-head)',
          }}
        >
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('colFeature')}</span>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: 600, textAlign: 'center' }}>Free</span>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-brand)', fontWeight: 700, textAlign: 'center' }}>Pro</span>
        </div>
        {SUB_FEATURES.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 52px 52px',
              alignItems: 'center',
              padding: '11px 14px',
              borderTop: '1px solid var(--border-subtle)',
              background: f.star ? 'var(--bg-brand-subtle)' : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-label-sm)',
                color: 'var(--fg-primary)',
                fontWeight: f.star ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
              }}
            >
              {f.star && <TrendingUp size={13} style={{ color: 'var(--status-danger-fg)', flexShrink: 0 }} />}
              {t(f.labelKey)}
            </span>
            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FeatureCell val={typeof f.free === 'string' ? t(f.free) : f.free} />
            </span>
            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FeatureCell val={typeof f.pro === 'string' ? t(f.pro) : f.pro} accent={f.star} />
            </span>
          </div>
        ))}
      </Card>

      {/* 구독 해지 확인 — footer '구독 해지'(destructive) 클릭 시 controlled 로 표시 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelConfirmDesc', { date: nextBill ?? t('expiryDate') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('keepSub')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('cancelSub')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModalShell>
  )
}
