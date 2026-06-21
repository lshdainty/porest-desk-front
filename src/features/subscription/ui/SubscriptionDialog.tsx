import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Minus, Sparkles, TrendingUp } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import {
  useMyFeatures,
  useMySubscription,
  useSubscribe,
  useCancelSubscription,
  useSubscriptionPlans,
} from '@/features/subscription/model/useSubscription'

interface SubFeature {
  label: string
  free: boolean | string
  pro: boolean | string
  star?: boolean
}

const SUB_FEATURES: SubFeature[] = [
  { label: '가계부 · 자산 관리', free: true, pro: true },
  { label: '예산 · 저축 목표 · 캘린더', free: true, pro: true },
  { label: '월 거래 기록', free: '100건', pro: '무제한' },
  { label: '증권 — 실시간 시세 · 종목 검색 · 관심종목', free: false, pro: true, star: true },
  { label: 'CSV · Excel 가져오기 / 내보내기', free: false, pro: true },
  { label: '다중 캘린더 공유', free: false, pro: true },
  { label: '카드 혜택 추천', free: false, pro: true },
]

const won = (n: number) => n.toLocaleString('ko-KR')

function FeatureCell({ val, accent }: { val: boolean | string; accent?: boolean }) {
  if (val === true) return <Check size={15} style={{ color: accent ? 'var(--fg-brand)' : 'var(--status-success-fg)' }} />
  if (val === false) return <Minus size={15} style={{ color: 'var(--fg-disabled)' }} />
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: accent ? 'var(--fg-brand)' : 'var(--fg-secondary)' }}>{val}</span>
}

/**
 * 구독 관리 모달 — Free/Pro 플랜 비교 + 결제 주기 + 기능 비교표.
 * PG 미연동이라 'Pro 시작하기'는 self-grant(useSubscribe)로 즉시 구독된다.
 */
export function SubscriptionDialog({ onClose, mobile }: { onClose: () => void; mobile: boolean }) {
  const featuresQ = useMyFeatures()
  const subQ = useMySubscription()
  const plansQ = useSubscriptionPlans()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')

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
        toast('Porest Pro 구독이 시작되었어요')
        onClose()
      },
      onError: () => toast.error('구독에 실패했어요'),
    })
  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast('구독을 해지했어요')
        onClose()
      },
      onError: () => toast.error('해지에 실패했어요'),
    })

  const cancelSlot = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="md" flush="left" style={{ color: 'var(--status-danger-fg)' }}>
          구독 해지
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>구독을 해지할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            해지하면 {nextBill ?? '만료일'}부터 Free 플랜으로 전환되고 증권 탭이 잠겨요. 그 전까지는 Pro 기능을 계속 쓸 수
            있어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>유지하기</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            구독 해지
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const Footer = isPro ? (
    <ModalFooter onCancel={onClose} cancelLabel="닫기" onSave={onClose} saveLabel="확인" leftSlot={cancelSlot} />
  ) : (
    <ModalFooter
      onCancel={onClose}
      cancelLabel="닫기"
      onSave={onSubscribe}
      saveLabel="Pro 시작하기"
      saving={subscribe.isPending}
    />
  )

  return (
    <ModalShell title="구독 관리" onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
      {/* 현재 플랜 배너 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          marginBottom: 16,
          borderRadius: 'var(--radius-lg)',
          background: 'color-mix(in oklab, var(--color-primary) 10%, var(--bg-surface))',
          border: '1px solid color-mix(in oklab, var(--color-primary) 28%, transparent)',
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>
            {isPro ? 'Porest Pro 이용 중' : 'Free 플랜 이용 중'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
            {isPro
              ? `${nextBill ? `다음 결제 ${nextBill} · ` : ''}${won(proMonthly)}원`
              : '증권·가져오기 등 Pro 기능이 잠겨 있어요'}
          </div>
        </div>
      </div>

      {/* 증권 스포트라이트 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 16px',
          marginBottom: 18,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-sunken)',
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
            background: 'color-mix(in oklab, var(--color-chart-red) 14%, var(--bg-surface))',
            color: 'var(--color-chart-red)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>증권 투자는 Pro 전용이에요</div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            실시간 시세·호가, 국내외 종목 검색, 관심종목, 보유 손익까지 — Pro를 구독하면 증권 탭이 바로 열려요.
          </div>
        </div>
      </div>

      {/* 결제 주기 토글 */}
      <Tabs value={cycle} onValueChange={v => v && setCycle(v as 'monthly' | 'yearly')} style={{ marginBottom: 14 }}>
        <TabsList style={{ width: '100%' }}>
          <TabsTrigger value="monthly" style={{ flex: 1 }}>
            월간
          </TabsTrigger>
          <TabsTrigger value="yearly" style={{ flex: 1 }}>
            연간 <span style={{ color: 'var(--fg-brand)', fontWeight: 700, marginLeft: 4 }}>{savePct}%↓</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 플랜 비교 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>Free</span>
            {!isPro && <Badge variant="secondary">현재 플랜</Badge>}
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
            0원
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>기본 가계부 기능</div>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            border: '2px solid var(--color-primary)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-brand)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} /> Pro
            </span>
            {isPro && <Badge variant="default">현재 플랜</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
              {won(proPrice)}원
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>/ {cycle === 'monthly' ? '월' : '년'}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {cycle === 'yearly' ? `월 ${won(proPerMonth)}원 꼴 · ${savePct}% 절약` : '월 단위 결제'}
          </div>
        </div>
      </div>

      {/* 기능 비교표 */}
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-tertiary)', letterSpacing: '0.04em', marginBottom: 8 }}>
        기능 비교
      </div>
      <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 56px 56px',
            alignItems: 'center',
            padding: '8px 14px',
            background: 'var(--bg-sunken)',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>기능</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', fontWeight: 600, textAlign: 'center' }}>Free</span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-brand)', fontWeight: 700, textAlign: 'center' }}>Pro</span>
        </div>
        {SUB_FEATURES.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 56px 56px',
              alignItems: 'center',
              padding: '11px 14px',
              borderTop: '1px solid var(--border-subtle)',
              background: f.star ? 'color-mix(in oklab, var(--color-primary) 5%, var(--bg-surface))' : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--fg-primary)',
                fontWeight: f.star ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.star && <TrendingUp size={13} style={{ color: 'var(--color-chart-red)' }} />}
              {f.label}
            </span>
            <span style={{ textAlign: 'center' }}>
              <FeatureCell val={f.free} />
            </span>
            <span style={{ textAlign: 'center' }}>
              <FeatureCell val={f.pro} accent={f.star} />
            </span>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
