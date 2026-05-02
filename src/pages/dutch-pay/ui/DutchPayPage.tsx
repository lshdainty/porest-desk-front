import { useOutletContext } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import {
  useDutchPays,
  useMarkParticipantPaid,
  useSettleAll,
} from '@/features/dutch-pay'
import type { DutchPay, DutchPayParticipant } from '@/entities/dutch-pay'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const PARTICIPANT_COLORS = [
  'var(--mossy-500)',
  'var(--bark-500)',
  'var(--sky-500)',
  'var(--sunlit-500)',
  'var(--berry-500)',
  'var(--mossy-700)',
]

const nameInitial = (name: string) => (name && name.length > 0 ? name[0]! : '?')

const colorFor = (idx: number) => PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length]!

export const DutchPayPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
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
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 700,
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
        variant="warm"
        style={{
          padding: mobile ? 18 : 24,
          background: 'var(--bg-section-warm)',
          border: '1px solid var(--border-warm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-on-warm)', fontWeight: 600 }}>진행 중 정산</div>
          <button
            onClick={() => settleAll.mutate(d.rowId)}
            disabled={settleAll.isPending}
            style={{
              marginLeft: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--fg-primary)',
              cursor: settleAll.isPending ? 'not-allowed' : 'pointer',
              opacity: settleAll.isPending ? 0.5 : 1,
            }}
          >
            전체 정산 완료
          </button>
        </div>
        <div style={{ fontSize: mobile ? 18 : 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          {d.title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', marginBottom: 18 }}>
          {d.dutchPayDate} · {d.participants.length}명 · {paidCount}/{d.participants.length} 정산 완료
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500 }}>총 금액</div>
          <div className="num" style={{ fontSize: mobile ? 22 : 26, fontWeight: 800, letterSpacing: '-0.025em' }}>
            {KRW(d.totalAmount)}원
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500 }}>1인당</div>
          <div className="num" style={{ fontSize: 16, fontWeight: 700 }}>
            {KRW(perPerson)}원
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-warm)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 10 }}>참여자</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.participants.map((p, i) => renderParticipantRow(d.rowId, p, i))}
          </div>
        </div>
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
            borderRadius: 999,
            background: colorFor(idx),
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {nameInitial(p.participantName)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.participantName}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            분담 {KRW(p.amount)}원{p.paidAt ? ` · ${p.paidAt.slice(0, 10)}` : ''}
          </div>
        </div>
        {!p.isPaid ? (
          <button
            onClick={() => markPaid.mutate({ dutchPayId, participantId: p.rowId })}
            disabled={markPaid.isPending}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--fg-primary)',
              cursor: markPaid.isPending ? 'not-allowed' : 'pointer',
              opacity: markPaid.isPending ? 0.5 : 1,
            }}
          >
            송금 완료
          </button>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 999,
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
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 15 }}>완료된 정산</CardTitle>
      </CardHeader>
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
              borderRadius: 10,
              background: 'var(--pd-surface-subtle)',
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
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
              {d.dutchPayDate} · {d.participants.length}명
            </div>
          </div>
          <div className="num" style={{ fontSize: 13.5, fontWeight: 700 }}>
            {KRW(d.totalAmount)}원
          </div>
        </div>
      ))}
    </Card>
  ) : null

  const EmptyState = (
    <Card
      style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 13,
      }}
    >
      아직 정산 내역이 없어요
    </Card>
  )

  const LoadingState = (
    <Card
      style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 13,
      }}
    >
      불러오는 중…
    </Card>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>더치페이</h2>
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
