import { useMemo, useState } from 'react'
import { Check, Divide, ListOrdered, Percent, Plus, Send, UserPlus, X } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon } from '@/shared/lib'
import { useCreateDutchPay } from '@/features/dutch-pay'
import { useSiblingGroupMembers } from '@/features/group'
import { useExpenseCategories } from '@/features/expense'
import { useCurrentUser } from '@/features/user'
import type { Expense } from '@/entities/expense'
import type {
  DutchPayFormValues,
  ParticipantFormValues,
  SplitMethod,
} from '@/entities/dutch-pay'
import { getPaletteByColor } from './CategoryEditDialog'

const PARTICIPANT_PALETTE = [
  { color: 'oklch(0.55 0.12 55)', bg: 'color-mix(in oklch, oklch(0.55 0.12 55) 18%, transparent)' },
  { color: 'oklch(0.50 0.1 230)', bg: 'color-mix(in oklch, oklch(0.50 0.1 230) 18%, transparent)' },
  { color: 'oklch(0.50 0.12 340)', bg: 'color-mix(in oklch, oklch(0.50 0.12 340) 18%, transparent)' },
  { color: 'oklch(0.50 0.1 140)', bg: 'color-mix(in oklch, oklch(0.50 0.1 140) 18%, transparent)' },
  { color: 'oklch(0.55 0.13 25)', bg: 'color-mix(in oklch, oklch(0.55 0.13 25) 18%, transparent)' },
  { color: 'oklch(0.50 0.12 290)', bg: 'color-mix(in oklch, oklch(0.50 0.12 290) 18%, transparent)' },
  { color: 'oklch(0.52 0.1 215)', bg: 'color-mix(in oklch, oklch(0.52 0.1 215) 18%, transparent)' },
  { color: 'oklch(0.55 0.10 90)', bg: 'color-mix(in oklch, oklch(0.55 0.10 90) 18%, transparent)' },
]

const ME_PALETTE = { color: 'var(--mossy-700)', bg: 'color-mix(in oklch, var(--mossy-700) 18%, transparent)' }

type Participant = {
  uid: string
  userRowId: number | null
  name: string
  isMe: boolean
  customAmount: string // for CUSTOM mode
  ratio: string // for RATIO mode (percentage)
}

const newUid = () => Math.random().toString(36).slice(2, 9)

type Props = {
  expense: Expense
  onClose: () => void
  onCreated?: (dutchPayRowId: number) => void
  mobile: boolean
}

const SPLIT_METHODS: { v: SplitMethod; icon: React.ComponentType<{ size?: number }>; title: string; sub: string }[] = [
  { v: 'EQUAL', icon: Divide, title: 'N분의 1', sub: '균등 분배' },
  { v: 'RATIO', icon: Percent, title: '비율', sub: '인원수·기준' },
  { v: 'CUSTOM', icon: ListOrdered, title: '개별 금액', sub: '각자 다르게' },
]

export function DutchPayFromTxDialog({ expense, onClose, onCreated, mobile }: Props) {
  const totalAbs = Math.abs(expense.amount)
  const expenseDay = (expense.expenseDate ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  const expenseDateTime = (expense.expenseDate ?? '').slice(0, 16).replace('T', ' ')

  const createMut = useCreateDutchPay()
  const siblingsQ = useSiblingGroupMembers()
  const categoriesQ = useExpenseCategories()
  const currentUserQ = useCurrentUser()

  const category = (categoriesQ.data ?? []).find(c => c.rowId === expense.categoryRowId)
  const palette = getPaletteByColor(category?.color)
  const meName = currentUserQ.data?.userName ?? '나'
  const meRowId = currentUserQ.data?.rowId ?? null

  const defaultTitle = expense.merchant || expense.description || '더치페이'

  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL')
  const [includeMyself, setIncludeMyself] = useState(true)
  const [requestMessage, setRequestMessage] = useState('')
  const [manualName, setManualName] = useState('')

  // 참여자: '나'는 includeMyself 가 true 일 때만 포함
  const [others, setOthers] = useState<Participant[]>([])

  const participants = useMemo<Participant[]>(() => {
    if (!includeMyself) return others
    const me: Participant = {
      uid: 'me',
      userRowId: meRowId,
      name: meName,
      isMe: true,
      customAmount: '',
      ratio: '1',
    }
    return [me, ...others]
  }, [includeMyself, others, meName, meRowId])

  // 균등 분배 시 1인당 금액
  const perPersonAmount = participants.length > 0 ? Math.floor(totalAbs / participants.length) : 0
  const perPersonRemainder = totalAbs - perPersonAmount * participants.length

  // 비율 분배 시 합계 (나는 항상 1)
  const ratioSum = participants.reduce((s, p) => s + (Number(p.ratio) || 0), 0)

  // 개별 금액: 다른 참여자가 입력한 합. 나는 (총액 - others 합) 으로 자동 채움.
  const othersCustomTotal = others.reduce((s, p) => s + (Number(p.customAmount) || 0), 0)

  const computeAmount = (p: Participant, idx: number): number => {
    if (splitMethod === 'EQUAL') {
      return idx === 0 ? perPersonAmount + perPersonRemainder : perPersonAmount
    }
    if (splitMethod === 'RATIO') {
      if (ratioSum <= 0) return 0
      return Math.round(totalAbs * ((Number(p.ratio) || 0) / ratioSum))
    }
    if (p.isMe) return Math.max(0, totalAbs - othersCustomTotal)
    return Number(p.customAmount) || 0
  }

  const computedAmounts = participants.map((p, i) => computeAmount(p, i))
  const sumAmount = computedAmounts.reduce((s, a) => s + a, 0)
  const remainder = totalAbs - sumAmount
  const matched = remainder === 0 && participants.length >= 1

  const usedUserIds = useMemo(
    () => new Set(others.map(p => p.userRowId).filter((id): id is number => id !== null)),
    [others],
  )

  const quickAddSuggestions = useMemo(() => {
    const all = siblingsQ.data ?? []
    return all
      .filter(m => !usedUserIds.has(m.userRowId))
      .filter(m => m.userRowId !== meRowId)
      .slice(0, 8)
  }, [siblingsQ.data, usedUserIds, meRowId])

  const addManual = () => {
    const name = manualName.trim()
    if (!name) return
    setOthers([
      ...others,
      {
        uid: newUid(),
        userRowId: null,
        name,
        isMe: false,
        customAmount: String(perPersonAmount),
        ratio: '1',
      },
    ])
    setManualName('')
  }

  const addFromSibling = (userRowId: number, name: string) => {
    setOthers([
      ...others,
      {
        uid: newUid(),
        userRowId,
        name,
        isMe: false,
        customAmount: String(perPersonAmount),
        ratio: '1',
      },
    ])
  }

  const removeOther = (uid: string) => {
    setOthers(others.filter(p => p.uid !== uid))
  }

  const updateOther = (uid: string, patch: Partial<Participant>) => {
    setOthers(others.map(p => (p.uid === uid ? { ...p, ...patch } : p)))
  }

  const handleSave = () => {
    if (!matched) return
    const payload: ParticipantFormValues[] = participants.map((p, i) => ({
      userRowId: p.userRowId ?? null,
      participantName: p.name.trim(),
      amount: computedAmounts[i] ?? 0,
    }))
    const data: DutchPayFormValues = {
      sourceExpenseRowId: expense.rowId,
      title: defaultTitle,
      description: requestMessage.trim() || undefined,
      totalAmount: totalAbs,
      currency: 'KRW',
      splitMethod,
      dutchPayDate: expenseDay,
      participants: payload,
    }
    createMut.mutate(data, {
      onSuccess: created => {
        onCreated?.(created.rowId)
        onClose()
      },
    })
  }

  const submitting = createMut.isPending

  const Footer = (
    <>
      <span style={{ marginRight: 'auto', fontSize: 13, color: 'var(--fg-secondary)' }}>
        1인당{' '}
        <b className="num" style={{ color: 'var(--fg-primary)', fontWeight: 800 }}>
          {KRW(perPersonAmount)}원
        </b>
      </span>
      <button type="button" className="p-btn p-btn--ghost" onClick={onClose} disabled={submitting}>
        취소
      </button>
      <button
        type="button"
        className="p-btn p-btn--primary"
        onClick={handleSave}
        disabled={!matched || submitting || participants.length === 0}
      >
        <Send size={14} />
        {submitting ? '생성 중…' : '정산 만들기'}
      </button>
    </>
  )

  return (
    <ModalShell title="더치페이 시작" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
        이 거래를 기준으로 더치페이 정산을 만듭니다. 참여자에게 송금 요청을 보내고, 정산 진행 상황을 추적할 수 있어요.
      </p>

      {/* Source card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: palette.bg,
            color: palette.color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIcon(category?.icon ?? 'tag', category?.categoryName?.charAt(0) ?? '·', 18)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{defaultTitle}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {expenseDateTime || expenseDay}
          </div>
        </div>
        <div className="num" style={{ fontWeight: 800 }}>
          {KRW(totalAbs)}원
        </div>
      </div>

      {/* 분배 방식 */}
      <Section title="분배 방식">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SPLIT_METHODS.map(m => {
            const Icon = m.icon
            const active = splitMethod === m.v
            return (
              <button
                key={m.v}
                type="button"
                onClick={() => setSplitMethod(m.v)}
                style={{
                  padding: '12px 12px',
                  background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                  border: `1px solid ${active ? 'var(--mossy-700)' : 'var(--border-subtle)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                  }}
                >
                  <Icon size={14} />
                  {m.title}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>{m.sub}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* 나도 포함 */}
      <div
        onClick={() => setIncludeMyself(v => !v)}
        role="checkbox"
        aria-checked={includeMyself}
        tabIndex={0}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIncludeMyself(v => !v) } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          marginBottom: 18,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: `2px solid ${includeMyself ? 'var(--mossy-700)' : 'var(--border-default)'}`,
            background: includeMyself ? 'var(--mossy-700)' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {includeMyself && <Check size={12} strokeWidth={3} />}
        </span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>나도 포함해서 분배</span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>내 몫도 계산됩니다</span>
      </div>

      {/* 참여자 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)' }}>참여자</span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginLeft: 6 }}>
          ({participants.length}명)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {participants.map((p, idx) => {
          const palette = p.isMe
            ? ME_PALETTE
            : PARTICIPANT_PALETTE[(idx - (includeMyself ? 1 : 0) + PARTICIPANT_PALETTE.length) % PARTICIPANT_PALETTE.length]!
          const amt = computedAmounts[idx] ?? 0
          return (
            <div
              key={p.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: palette.bg,
                  color: palette.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {p.name.charAt(0)}
              </span>

              <span style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</span>
                {p.isMe && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: 'color-mix(in oklch, var(--mossy-700) 12%, transparent)',
                      color: 'var(--mossy-700)',
                    }}
                  >
                    나
                  </span>
                )}
              </span>

              {splitMethod === 'CUSTOM' && !p.isMe && (
                <div style={{ position: 'relative', width: 110 }}>
                  <input
                    className="p-input num"
                    value={p.customAmount}
                    onChange={e => updateOther(p.uid, { customAmount: e.target.value.replace(/[^0-9]/g, '') })}
                    inputMode="numeric"
                    placeholder="0"
                    style={{ paddingRight: 26, textAlign: 'right' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      color: 'var(--fg-tertiary)',
                      pointerEvents: 'none',
                    }}
                  >
                    원
                  </span>
                </div>
              )}

              {splitMethod === 'CUSTOM' && p.isMe && (
                <span className="num" style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {KRW(amt)}원
                </span>
              )}

              {splitMethod === 'RATIO' && !p.isMe && (
                <div style={{ position: 'relative', width: 84 }}>
                  <input
                    className="p-input num"
                    value={p.ratio}
                    onChange={e => updateOther(p.uid, { ratio: e.target.value.replace(/[^0-9.]/g, '') })}
                    inputMode="decimal"
                    placeholder="1"
                    style={{ paddingRight: 22, textAlign: 'right' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      color: 'var(--fg-tertiary)',
                      pointerEvents: 'none',
                    }}
                  >
                    %
                  </span>
                </div>
              )}

              {splitMethod === 'RATIO' && (
                <span className="num" style={{ fontWeight: 700, fontSize: 13.5, minWidth: 80, textAlign: 'right' }}>
                  {KRW(amt)}원
                </span>
              )}

              {splitMethod === 'EQUAL' && (
                <span className="num" style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {KRW(amt)}원
                </span>
              )}

              {!p.isMe ? (
                <button
                  type="button"
                  onClick={() => removeOther(p.uid)}
                  aria-label="참여자 삭제"
                  style={{
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 0,
                    borderRadius: 999,
                    color: 'var(--fg-tertiary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              ) : (
                <span style={{ width: 28, height: 28 }} />
              )}
            </div>
          )
        })}
      </div>

      {/* 추가 input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          className="p-input"
          value={manualName}
          onChange={e => setManualName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManual() } }}
          placeholder="이름 입력 후 추가"
          disabled={submitting}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="p-btn p-btn--secondary"
          onClick={addManual}
          disabled={submitting || !manualName.trim()}
        >
          <UserPlus size={14} /> 추가
        </button>
      </div>

      {/* 빠른 추가 chips */}
      {quickAddSuggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {quickAddSuggestions.map((m, i) => {
            const palette = PARTICIPANT_PALETTE[i % PARTICIPANT_PALETTE.length]!
            return (
              <button
                key={m.userRowId}
                type="button"
                onClick={() => addFromSibling(m.userRowId, m.userName)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px 5px 8px',
                  borderRadius: 999,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--fg-primary)',
                }}
                title={m.userEmail}
              >
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: palette.color }} />
                {m.userName}
                <Plus size={12} color="var(--fg-tertiary)" />
              </button>
            )
          })}
        </div>
      )}

      {/* 요청 메시지 */}
      <Section title="요청 메시지 (선택)" tightTop>
        <textarea
          className="p-input"
          value={requestMessage}
          onChange={e => setRequestMessage(e.target.value)}
          placeholder="참여자에게 함께 보낼 한마디를 적어주세요"
          rows={3}
          disabled={submitting}
          style={{ resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
        />
      </Section>

      {!matched && (
        <p style={{ fontSize: 11.5, color: 'var(--berry-700)', marginTop: 8 }}>
          {remainder > 0
            ? `합계가 총액보다 ${KRW(remainder)}원 부족합니다.`
            : `합계가 총액보다 ${KRW(-remainder)}원 초과합니다.`}
        </p>
      )}
    </ModalShell>
  )
}

function Section({
  title,
  tightTop,
  children,
}: {
  title: string
  tightTop?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16, marginTop: tightTop ? 4 : 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
