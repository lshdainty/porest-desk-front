import { useState } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import {
  useContributeSavingGoal,
  useCreateSavingGoal,
  useDeleteSavingGoal,
  useUpdateSavingGoal,
} from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'

const GOAL_ICONS: { k: IconName; label: string }[] = [
  { k: 'plane', label: '여행' },
  { k: 'shield', label: '비상금' },
  { k: 'laptop', label: '전자기기' },
  { k: 'home', label: '주거' },
  { k: 'graduation-cap', label: '교육' },
  { k: 'gift', label: '선물' },
  { k: 'car', label: '자동차' },
  { k: 'heart', label: '건강' },
  { k: 'piggy-bank', label: '저축' },
  { k: 'wallet', label: '지갑' },
]

const GOAL_COLORS = [
  'var(--sky-500)',
  'var(--mossy-600)',
  'var(--berry-500)',
  'var(--clay-500)',
  'oklch(0.60 0.18 290)',
  'oklch(0.58 0.15 180)',
]

function formatDeadlineLabel(iso: string): string {
  if (!iso) return '기한 없음'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '기한 없음'
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function fmtNum(n: number): string {
  if (!n) return ''
  return n.toLocaleString('ko-KR')
}

function parseNum(v: string): number {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

interface SavingGoalAddDialogProps {
  /** null/undefined → 생성 모드, 객체 → 수정 모드 */
  goal?: SavingGoal | null
  mobile: boolean
  onClose: () => void
}

export function SavingGoalAddDialog({ goal, mobile, onClose }: SavingGoalAddDialogProps) {
  const isEdit = !!goal

  const [title, setTitle] = useState<string>(goal?.title ?? '')
  const [targetStr, setTargetStr] = useState<string>(
    goal?.targetAmount ? fmtNum(goal.targetAmount) : '',
  )
  const [currentStr, setCurrentStr] = useState<string>(
    goal?.currentAmount ? fmtNum(goal.currentAmount) : '',
  )
  const [deadlineDate, setDeadlineDate] = useState<string>(goal?.deadlineDate ?? '')
  const [icon, setIcon] = useState<IconName>(((goal?.icon as IconName) || 'piggy-bank') as IconName)
  const [color, setColor] = useState<string>(goal?.color ?? GOAL_COLORS[0]!)
  const [err, setErr] = useState<string>('')

  const createMut = useCreateSavingGoal()
  const updateMut = useUpdateSavingGoal()
  const contributeMut = useContributeSavingGoal()
  const deleteMut = useDeleteSavingGoal()
  const isPending =
    createMut.isPending ||
    updateMut.isPending ||
    contributeMut.isPending ||
    deleteMut.isPending

  const target = parseNum(targetStr)
  const current = parseNum(currentStr)
  const pct = target > 0 ? (current / target) * 100 : 0

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) {
      setErr('목표 이름을 입력해주세요')
      return
    }
    if (target <= 0) {
      setErr('목표 금액을 입력해주세요')
      return
    }
    if (current > target) {
      setErr('현재 금액이 목표보다 클 수 없어요')
      return
    }
    setErr('')

    if (isEdit && goal) {
      updateMut.mutate(
        {
          id: goal.rowId,
          data: {
            title: t,
            targetAmount: target,
            deadlineDate: deadlineDate || null,
            icon,
            color,
          },
        },
        {
          onSuccess: () => {
            const diff = current - goal.currentAmount
            if (diff !== 0) {
              contributeMut.mutate(
                { id: goal.rowId, data: { amount: diff } },
                { onSuccess: () => onClose() },
              )
            } else {
              onClose()
            }
          },
        },
      )
    } else {
      createMut.mutate(
        {
          title: t,
          targetAmount: target,
          deadlineDate: deadlineDate || null,
          icon,
          color,
          currency: 'KRW',
        },
        {
          onSuccess: created => {
            if (current > 0) {
              contributeMut.mutate(
                { id: created.rowId, data: { amount: current } },
                { onSuccess: () => onClose() },
              )
            } else {
              onClose()
            }
          },
        },
      )
    }
  }

  const handleDelete = () => {
    if (!goal) return
    if (!window.confirm(`'${goal.title}' 목표를 삭제할까요?`)) return
    deleteMut.mutate(goal.rowId, { onSuccess: () => onClose() })
  }

  const Footer = (
    <>
      {isEdit && (
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--status-danger)] hover:text-[var(--berry-700)]"
          onClick={handleDelete}
          disabled={isPending}
          style={{ marginRight: 'auto' }}
        >
          <Trash2 size={14} /> 삭제
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        disabled={isPending}
      >
        취소
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
      >
        {isPending ? '저장 중…' : isEdit ? '저장' : '추가'}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={isEdit ? '목표 편집' : '저축 목표 추가'}
      onClose={onClose}
      mobile={mobile}
      size="md"
      footer={Footer}
    >
      {/* Preview */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `oklch(from ${color} l c h / 0.12)`,
              color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DynamicIcon name={icon} size={17} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title || '목표 이름'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
              {formatDeadlineLabel(deadlineDate)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
              {pct.toFixed(0)}%
            </div>
            <div className="num" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>
              {current.toLocaleString('ko-KR')} / {target.toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--pd-surface-inset)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, pct)}%`,
              height: '100%',
              background: color,
              borderRadius: 99,
            }}
          />
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>목표 이름</FieldLabel>
        <Input
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setErr('')
          }}
          placeholder="예: 유럽 여행"
          autoFocus
        />
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>목표 금액</FieldLabel>
          <div style={{ position: 'relative' }}>
            <Input
              className="num"
              value={fmtNum(parseNum(targetStr))}
              onChange={e => {
                setTargetStr(e.target.value)
                setErr('')
              }}
              placeholder="0"
              inputMode="numeric"
              style={{ paddingRight: 28, textAlign: 'right' }}
            />
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12.5,
                color: 'var(--fg-tertiary)',
                pointerEvents: 'none',
              }}
            >
              원
            </span>
          </div>
        </Field>
        <Field>
          <FieldLabel>현재 모은 금액</FieldLabel>
          <div style={{ position: 'relative' }}>
            <Input
              className="num"
              value={fmtNum(parseNum(currentStr))}
              onChange={e => {
                setCurrentStr(e.target.value)
                setErr('')
              }}
              placeholder="0"
              inputMode="numeric"
              style={{ paddingRight: 28, textAlign: 'right' }}
            />
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12.5,
                color: 'var(--fg-tertiary)',
                pointerEvents: 'none',
              }}
            >
              원
            </span>
          </div>
        </Field>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>
          목표일 <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400 }}>(선택)</span>
        </FieldLabel>
        <InputDatePicker
          value={deadlineDate}
          onValueChange={v => setDeadlineDate(v ?? '')}
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>아이콘</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
          {GOAL_ICONS.map(g => {
            const active = icon === g.k
            return (
              <button
                key={g.k}
                type="button"
                title={g.label}
                onClick={() => setIcon(g.k)}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  background: active
                    ? `oklch(from ${color} l c h / 0.14)`
                    : 'var(--bg-surface)',
                  border: active
                    ? `1.5px solid ${color}`
                    : '1px solid var(--border-subtle)',
                  color: active ? color : 'var(--fg-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                <DynamicIcon name={g.k} size={16} />
              </button>
            )
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>색상</FieldLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {GOAL_COLORS.map(c => {
            const active = color === c
            return (
              <button
                key={c}
                type="button"
                aria-label={`색상 ${c}`}
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: c,
                  border: active ? '2px solid var(--fg-primary)' : '2px solid transparent',
                  boxShadow: active
                    ? `0 0 0 2px var(--bg-surface), 0 0 0 3.5px ${c}`
                    : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            )
          })}
        </div>
      </Field>

      {err && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'oklch(0.96 0.04 20)',
            border: '1px solid var(--berry-300)',
            borderRadius: 8,
            fontSize: 12.5,
            color: 'var(--berry-700)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={13} /> {err}
        </div>
      )}
    </ModalShell>
  )
}
