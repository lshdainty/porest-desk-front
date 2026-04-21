import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { KRW } from '@/shared/lib/porest/format'
import { useContributeSavingGoal } from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'

interface SavingGoalContributeDialogProps {
  open: boolean
  onClose: () => void
  goal: SavingGoal | null
}

export function SavingGoalContributeDialog({ open, onClose, goal }: SavingGoalContributeDialogProps) {
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [sign, setSign] = useState<'+' | '-'>('+')

  const mut = useContributeSavingGoal()

  const reset = () => {
    setAmountStr('0')
    setNote('')
    setSign('+')
  }

  const handleClose = () => {
    if (mut.isPending) return
    reset()
    onClose()
  }

  const handleSubmit = () => {
    if (!goal) return
    const magnitude = Number(amountStr.replace(/[^\d-]/g, '')) || 0
    if (magnitude === 0) return
    const amount = sign === '+' ? magnitude : -magnitude
    mut.mutate(
      { id: goal.rowId, data: { amount, note: note.trim() || undefined } },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  const remaining = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-[17px] font-bold tracking-tight">적립 기록</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {goal && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{ background: 'var(--bg-sunken)' }}
            >
              <div className="text-[13px] font-semibold mb-1">{goal.title}</div>
              <div className="flex items-center justify-between text-[12px] text-[var(--fg-tertiary)]">
                <span>현재</span>
                <span className="num font-semibold text-[var(--fg-primary)]">
                  {KRW(goal.currentAmount)} / {KRW(goal.targetAmount)}원
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-[var(--fg-tertiary)] mt-1">
                <span>목표까지</span>
                <span className="num">{KRW(remaining)}원</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-[13px] font-medium mb-2 block">유형</Label>
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)]"
            >
              {(['+', '-'] as const).map(s => {
                const active = s === sign
                const label = s === '+' ? '적립 (+)' : '회수 (−)'
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSign(s)}
                    className="h-9 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: 'var(--mossy-800)', color: 'var(--fg-on-brand)' }
                        : { background: 'transparent', color: 'var(--fg-secondary)' }
                    }
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="saving-contribute-amount" className="text-[13px] font-medium mb-2 block">
              금액 (원)
            </Label>
            <Input
              id="saving-contribute-amount"
              inputMode="numeric"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value.replace(/[^\d-]/g, ''))}
              onBlur={() => {
                const n = Number(amountStr) || 0
                setAmountStr(n ? KRW(n) : '0')
              }}
              onFocus={() => setAmountStr(prev => prev.replace(/,/g, ''))}
            />
          </div>

          <div>
            <Label htmlFor="saving-contribute-note" className="text-[13px] font-medium mb-2 block">
              메모 (선택)
            </Label>
            <Input
              id="saving-contribute-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="예: 월급 이체"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[var(--border-subtle)] mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={mut.isPending}>
            취소
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={mut.isPending || !goal || Number(amountStr.replace(/[^\d-]/g, '')) === 0}
          >
            {mut.isPending ? '저장 중…' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
