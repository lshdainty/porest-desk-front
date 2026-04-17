import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/ui/dialog'
import type { EventLabel } from '@/entities/event-label'
import {
  useEventLabels,
  useCreateEventLabel,
  useUpdateEventLabel,
  useDeleteEventLabel,
} from '@/features/event-label'

interface LabelManagementDialogProps {
  open: boolean
  onClose: () => void
}

const labelColorOptions = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6b7280',
]

export const LabelManagementDialog = ({ open, onClose }: LabelManagementDialogProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')

  const { data: labels = [] } = useEventLabels()
  const createLabel = useCreateEventLabel()
  const updateLabel = useUpdateEventLabel()
  const deleteLabel = useDeleteEventLabel()

  const [editingLabel, setEditingLabel] = useState<EventLabel | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState<string>(labelColorOptions[0] ?? '#3b82f6')

  const resetForm = () => {
    setFormName('')
    setFormColor(labelColorOptions[0] ?? '#3b82f6')
    setEditingLabel(null)
    setIsAdding(false)
  }

  const handleStartEdit = (label: EventLabel) => {
    setEditingLabel(label)
    setFormName(label.labelName)
    setFormColor(label.color)
    setIsAdding(false)
  }

  const handleStartAdd = () => {
    resetForm()
    setIsAdding(true)
  }

  const handleSave = () => {
    if (!formName.trim()) return

    if (editingLabel) {
      updateLabel.mutate(
        { id: editingLabel.rowId, data: { labelName: formName.trim(), color: formColor } },
        { onSuccess: resetForm }
      )
    } else {
      createLabel.mutate(
        { labelName: formName.trim(), color: formColor },
        { onSuccess: resetForm }
      )
    }
  }

  const handleDelete = (id: number) => {
    deleteLabel.mutate(id)
    if (editingLabel?.rowId === id) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('labels')}</DialogTitle>
            {!isAdding && !editingLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartAdd}
              >
                <Plus size={14} className="mr-1" />
                {t('addLabel')}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Existing labels */}
          {labels.map(label => (
            <div
              key={label.rowId}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 text-sm truncate">{label.labelName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleStartEdit(label)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(label.rowId)}
                disabled={deleteLabel.isPending}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}

          {labels.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noLabels')}</p>
          )}

          {/* Add/Edit form */}
          {(isAdding || editingLabel) && (
            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('form.labelName')}
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {labelColorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all',
                      formColor === color && 'ring-2 ring-offset-1 ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={resetForm}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={handleSave}
                  disabled={!formName.trim() || createLabel.isPending || updateLabel.isPending}
                >
                  <Check size={12} className="mr-1" />
                  {(createLabel.isPending || updateLabel.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tc('save')}
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
