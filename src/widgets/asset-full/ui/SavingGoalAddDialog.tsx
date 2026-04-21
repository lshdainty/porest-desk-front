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
import { Textarea } from '@/shared/ui/textarea'
import { IconPicker } from '@/shared/ui/icon-picker'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { KRW } from '@/shared/lib/porest/format'
import { useCreateSavingGoal, useUpdateSavingGoal } from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'

const PRESET_COLORS: string[] = [
  'var(--mossy-600)',
  'var(--sky-500)',
  'var(--berry-500)',
  'var(--sunshine-500)',
  'var(--lavender-500)',
  'var(--moss-500)',
  'var(--terracotta-500)',
]

interface SavingGoalAddDialogProps {
  open: boolean
  onClose: () => void
  /** 있으면 수정 모드, 없으면 생성 모드 */
  goal?: SavingGoal | null
}

export function SavingGoalAddDialog({ open, onClose, goal }: SavingGoalAddDialogProps) {
  const editMode = !!goal
  const [title, setTitle] = useState<string>(goal?.title ?? '')
  const [description, setDescription] = useState<string>(goal?.description ?? '')
  const [targetStr, setTargetStr] = useState<string>(goal?.targetAmount ? KRW(goal.targetAmount) : '0')
  const [deadlineDate, setDeadlineDate] = useState<string>(goal?.deadlineDate ?? '')
  const [icon, setIcon] = useState<string>(goal?.icon ?? 'piggy-bank')
  const [color, setColor] = useState<string>(goal?.color ?? (PRESET_COLORS[0] ?? 'var(--mossy-600)'))

  const createMut = useCreateSavingGoal()
  const updateMut = useUpdateSavingGoal()
  const isPending = createMut.isPending || updateMut.isPending

  const reset = () => {
    setTitle('')
    setDescription('')
    setTargetStr('0')
    setDeadlineDate('')
    setIcon('piggy-bank')
    setColor(PRESET_COLORS[0] ?? 'var(--mossy-600)')
  }

  const handleClose = () => {
    if (isPending) return
    if (!editMode) reset()
    onClose()
  }

  const handleSubmit = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const targetAmount = Number(targetStr.replace(/[^\d-]/g, '')) || 0
    if (targetAmount <= 0) return

    const payload = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      targetAmount,
      deadlineDate: deadlineDate ? deadlineDate : null,
      icon: icon || null,
      color: color || null,
    }

    if (editMode && goal) {
      updateMut.mutate(
        { id: goal.rowId, data: payload },
        {
          onSuccess: () => {
            onClose()
          },
        },
      )
    } else {
      createMut.mutate(
        { ...payload, currency: 'KRW' },
        {
          onSuccess: () => {
            reset()
            onClose()
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-[17px] font-bold tracking-tight">
            {editMode ? '저축 목표 수정' : '저축 목표 추가'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          <div>
            <Label htmlFor="saving-goal-title" className="text-[13px] font-medium mb-2 block">
              목표 이름
            </Label>
            <Input
              id="saving-goal-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 유럽 여행, 비상금"
            />
          </div>

          <div>
            <Label htmlFor="saving-goal-target" className="text-[13px] font-medium mb-2 block">
              목표 금액 (원)
            </Label>
            <Input
              id="saving-goal-target"
              inputMode="numeric"
              value={targetStr}
              onChange={e => setTargetStr(e.target.value.replace(/[^\d-]/g, ''))}
              onBlur={() => {
                const n = Number(targetStr) || 0
                setTargetStr(n ? KRW(n) : '0')
              }}
              onFocus={() => setTargetStr(prev => prev.replace(/,/g, ''))}
            />
          </div>

          <div>
            <Label className="text-[13px] font-medium mb-2 block">기한 (선택)</Label>
            <InputDatePicker
              value={deadlineDate}
              onValueChange={(v) => setDeadlineDate(v ?? '')}
            />
          </div>

          <div className="flex gap-3">
            <div>
              <Label className="text-[13px] font-medium mb-2 block">아이콘</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[13px] font-medium mb-2 block">대표 색상</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => {
                  const active = c === color
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="inline-flex items-center justify-center rounded-full border transition-all"
                      aria-label={`색상 ${c}`}
                      style={{
                        width: 30,
                        height: 30,
                        background: c,
                        borderColor: active ? 'var(--fg-primary)' : 'transparent',
                        borderWidth: active ? 2 : 1,
                        boxShadow: active ? '0 0 0 2px var(--bg-surface)' : undefined,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="saving-goal-desc" className="text-[13px] font-medium mb-2 block">
              메모 (선택)
            </Label>
            <Textarea
              id="saving-goal-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="목표에 대한 간단한 메모"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[var(--border-subtle)] mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            취소
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={isPending || !title.trim()}>
            {isPending ? '저장 중…' : editMode ? '수정' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
