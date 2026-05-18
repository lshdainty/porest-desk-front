import { useOutletContext } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { KRW } from '@/shared/lib/porest/format'
import {
  useDutchPays,
  useMarkParticipantPaid,
  useSettleAll,
} from '@/features/dutch-pay'
import type { DutchPay, DutchPayParticipant } from '@/entities/dutch-pay'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const PARTICIPANT_COLORS = [
  'var(--border-brand)',
  'var(--color-chart-brown)',
  'var(--color-chart-blue)',
  'var(--color-chart-yellow)',
  'var(--fg-expense)',
  'var(--fg-income)',
]

const nameInitial = (name: string) => (name && name.length > 0 ? name[0]! : '?')

const colorFor = (idx: number) => PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length]!

/** DutchPayPage 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계. */
function useDutchPayPageData() {
  const dutchPaysQ = useDutchPays()
  return {
    isLoading: dutchPaysQ.isLoading,
  }
}

/** 진행 중 정산 카드 skeleton — 타이틀+총금액+1인당+참여자 rows. */
function ActiveDutchPayCardSkeleton({ mobile, participants = 3 }: { mobile: boolean; participants?: number }) {
  return (
    <Card
      style={{
        background: 'var(--bg-section-warm)',
        border: '1px solid var(--border-warm)',
      }}
    >
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <SkeletonBase className="h-3 w-20" />
          <SkeletonBase className="h-7 w-28 ml-auto rounded-md" />
        </div>
        <SkeletonBase className={mobile ? 'h-6 w-48 mb-2' : 'h-7 w-56 mb-2'} />
        <SkeletonBase className="h-4 w-40 mb-4" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <SkeletonBase className="h-3 w-10" />
          <SkeletonBase className={mobile ? 'h-7 w-36' : 'h-8 w-40'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <SkeletonBase className="h-3 w-8" />
          <SkeletonBase className="h-5 w-24" />
        </div>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-warm)' }}>
          <SkeletonBase className="h-3 w-14 mb-3" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: participants }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SkeletonBase className="h-9 w-9 rounded-full shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-1/3 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/2" />
                </div>
                <SkeletonBase className="h-7 w-20 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 완료된 정산 카드 skeleton — 헤더 + 완료된 정산 rows. */
function CompletedDutchPayCardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonBase className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <SkeletonBase className="h-4 w-2/5 mb-1" />
              <SkeletonBase className="h-3 w-1/3" />
            </div>
            <SkeletonBase className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** DutchPay 페이지 구조 일치 skeleton — 헤더 + 진행중 정산 카드 + 완료된 정산 카드. */
function DutchPayPageSkeleton({ mobile }: { mobile: boolean }) {
  const Body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16 }}>
      <ActiveDutchPayCardSkeleton mobile={mobile} participants={3} />
      <CompletedDutchPayCardSkeleton rows={2} />
    </div>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <SkeletonBase className="h-7 w-20" />
          <div style={{ marginLeft: 'auto' }}>
            <SkeletonBase className="h-9 w-28 rounded-md" />
          </div>
        </div>
        {Body}
      </div>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <SkeletonBase className="h-8 w-24 mb-2" />
          <SkeletonBase className="h-4 w-40" />
        </div>
        <div className="right">
          <SkeletonBase className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 720 }}>{Body}</div>
    </div>
  )
}

export const DutchPayPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useDutchPayPageData()
  if (isLoading) return <DutchPayPageSkeleton mobile={mobile} />
  return <DutchPayPageInner mobile={mobile} />
}

const DutchPayPageInner = ({ mobile }: { mobile: boolean }) => {
  const dutchPaysQ = useDutchPays()
  const markPaid = useMarkParticipantPaid()
  const settleAll = useSettleAll()

  const list: DutchPay[] = dutchPaysQ.data ?? []
  const active = list.filter(d => !d.isSettled)
  const completed = list.filter(d => d.isSettled)

  const CreateBtn = (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-brand)',
        color: 'var(--fg-on-brand)',
        border: 0,
        borderRadius: 'var(--radius-tile)',
        padding: '8px 14px',
        fontSize: 'var(--text-label-sm)',
        fontWeight: '700',
        cursor: 'pointer',
      }}
    >
      <Plus size={14} /> 정산 만들기
    </button>
  )

  const renderActiveCard = (d: DutchPay) => {
    const perPerson = d.participants.length > 0 ? Math.round(d.totalAmount / d.participants.length) : 0
    const paidCount = d.participants.filter(p => p.isPaid).length

    return (
      <Card
        key={d.rowId}
        style={{
          background: 'var(--bg-section-warm)',
          border: '1px solid var(--border-warm)',
        }}
      >
        <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-on-warm)', fontWeight: '600' }}>진행 중 정산</div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            loading={settleAll.isPending}
            onClick={() => settleAll.mutate(d.rowId)}
          >
            전체 정산 완료
          </Button>
        </div>
        <div style={{ fontSize: mobile ? 18 : 22, fontWeight: '700', letterSpacing: '-0.022em', marginBottom: 6 }}>
          {d.title}
        </div>
        <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', marginBottom: 18 }}>
          {d.dutchPayDate} · {d.participants.length}명 · {paidCount}/{d.participants.length} 정산 완료
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>총 금액</div>
          <div className="num" style={{ fontSize: mobile ? 22 : 26, fontWeight: '800', letterSpacing: '-0.022em' }}>
            {KRW(d.totalAmount)}원
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500' }}>1인당</div>
          <div className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700' }}>
            {KRW(perPerson)}원
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-warm)' }}>
          <div style={{ fontSize: 'var(--text-caption)', fontWeight: '600', color: 'var(--fg-secondary)', marginBottom: 10 }}>참여자</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.participants.map((p, i) => renderParticipantRow(d.rowId, p, i))}
          </div>
        </div>
        </CardContent>
      </Card>
    )
  }

  const renderParticipantRow = (dutchPayId: number, p: DutchPayParticipant, idx: number) => {
    const pillBg = p.isPaid ? 'var(--bg-brand-subtle)' : 'var(--status-warning-subtle)'
    const pillFg = p.isPaid ? 'var(--fg-brand-strong)' : 'var(--status-warning-fg)'
    const pillLabel = p.isPaid ? '송금 완료' : '미정산'

    return (
      <div key={p.rowId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-pill)',
            background: colorFor(idx),
            color: 'var(--fg-on-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            flexShrink: 0,
          }}
        >
          {nameInitial(p.participantName)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{p.participantName}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            분담 {KRW(p.amount)}원{p.paidAt ? ` · ${p.paidAt.slice(0, 10)}` : ''}
          </div>
        </div>
        {!p.isPaid ? (
          <Button
            variant="secondary"
            size="sm"
            loading={markPaid.isPending}
            onClick={() => markPaid.mutate({ dutchPayId, participantId: p.rowId })}
          >
            송금 완료
          </Button>
        ) : (
          <span
            style={{
              fontSize: 'var(--text-badge)',
              fontWeight: '700',
              padding: '3px 9px',
              borderRadius: 'var(--radius-pill)',
              background: pillBg,
              color: pillFg,
            }}
          >
            {pillLabel}
          </span>
        )}
      </div>
    )
  }

  const ActiveSection = active.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16 }}>
      {active.map(renderActiveCard)}
    </div>
  ) : null

  const CompletedSection = completed.length > 0 ? (
    <Card>
      <CardHeader>
        <CardTitle style={{ fontSize: 'var(--text-body-lg)' }}>완료된 정산</CardTitle>
      </CardHeader>
      <CardContent>
      {completed.map((d, i) => (
        <div
          key={d.rowId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-tile)',
              background: 'var(--bg-muted)',
              color: 'var(--fg-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{d.title}</div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
              {d.dutchPayDate} · {d.participants.length}명
            </div>
          </div>
          <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700' }}>
            {KRW(d.totalAmount)}원
          </div>
        </div>
      ))}
      </CardContent>
    </Card>
  ) : null

  const EmptyState = (
    <Card>
      <CardContent
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--fg-tertiary)',
          fontSize: 'var(--text-label-sm)',
        }}
      >
        아직 정산 내역이 없어요
      </CardContent>
    </Card>
  )

  const LoadingState = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16 }}>
      <ActiveDutchPayCardSkeleton mobile={mobile} participants={3} />
      <CompletedDutchPayCardSkeleton rows={2} />
    </div>
  )

  const Body = dutchPaysQ.isLoading
    ? LoadingState
    : list.length === 0
      ? EmptyState
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16 }}>
          {ActiveSection}
          {CompletedSection}
        </div>
      )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', margin: 0, letterSpacing: '-0.022em' }}>더치페이</h2>
          <div style={{ marginLeft: 'auto' }}>{CreateBtn}</div>
        </div>
        {Body}
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>더치페이</h1>
          <div className="sub">함께 쓴 돈, 깔끔하게 정산</div>
        </div>
        <div className="right">{CreateBtn}</div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 720 }}>{Body}</div>
    </div>
  )
}
