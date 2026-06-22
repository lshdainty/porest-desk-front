import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Minus, Sparkles, TrendingUp } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
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
  return <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: accent ? 'var(--fg-brand)' : 'var(--fg-secondary)' }}>{val}</span>
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

  // 앱 시트 footer 정합 — [닫기 | 구독 해지(danger)] / [닫기 | Pro 시작하기(primary)].
  // 구독 해지는 ModalFooter 주액션(destructive)으로 두고, 확인 다이얼로그는 controlled 로 띄운다.
  const Footer = isPro ? (
    <ModalFooter
      fullWidth
      onCancel={onClose}
      cancelLabel="닫기"
      onSave={() => setConfirmOpen(true)}
      saveLabel="구독 해지"
      saveVariant="destructive"
    />
  ) : (
    <ModalFooter
      fullWidth
      onCancel={onClose}
      cancelLabel="닫기"
      onSave={onSubscribe}
      saveLabel="Pro 시작하기"
      saving={subscribe.isPending}
    />
  )

  return (
    <ModalShell title="구독 관리" onClose={onClose} size="lg" footer={Footer} mobile={mobile}>
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
            {isPro ? 'Porest Pro 이용 중' : 'Free 플랜 이용 중'}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2 }}>
            {isPro
              ? `${nextBill ? `다음 결제 ${nextBill} · ` : ''}${won(proMonthly)}원`
              : '증권·가져오기 등 Pro 기능이 잠겨 있어요'}
          </div>
        </div>
      </Card>

      {/* 증권 스포트라이트 — Card.muted (sunken 톤 info 박스) */}
      <Card
        variant="muted"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 16px',
          marginBottom: 18,
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
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>증권 투자는 Pro 전용이에요</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            실시간 시세·호가, 국내외 종목 검색, 관심종목, 보유 손익까지 — Pro를 구독하면 증권 탭이 바로 열려요.
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
          월간
        </ToggleGroupItem>
        <ToggleGroupItem value="yearly" variant="segmented">
          연간 {savePct}%↓
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
            {!isPro && <Badge variant="secondary">현재 플랜</Badge>}
          </div>
          <div className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
            0원
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>기본 가계부 기능</div>
        </Card>
        <Card
          variant="bordered"
          style={{ padding: 16, borderColor: 'var(--border-brand)', borderWidth: 2, position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-brand)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} /> Pro
            </span>
            {isPro && <Badge variant="default">현재 플랜</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="num" style={{ fontSize: 'var(--text-display-sm)', fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}>
              {won(proPrice)}원
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>/ {cycle === 'monthly' ? '월' : '년'}</span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {cycle === 'yearly' ? `월 ${won(proPerMonth)}원 꼴 · ${savePct}% 절약` : '월 단위 결제'}
          </div>
        </Card>
      </div>

      {/* 기능 비교표 — Card.bordered (행 모서리 라운딩은 overflow:hidden 으로 clip) */}
      <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--fg-tertiary)', letterSpacing: '0.04em', marginBottom: 8 }}>
        기능 비교
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
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>기능</span>
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
              {f.label}
            </span>
            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FeatureCell val={f.free} />
            </span>
            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FeatureCell val={f.pro} accent={f.star} />
            </span>
          </div>
        ))}
      </Card>

      {/* 구독 해지 확인 — footer '구독 해지'(destructive) 클릭 시 controlled 로 표시 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
    </ModalShell>
  )
}
