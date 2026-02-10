import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
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
  const isMobile = useIsMobile()

  const { data: labels = [] } = useEventLabels()
  const createLabel = useCreateEventLabel()
  const updateLabel = useUpdateEventLabel()
  const deleteLabel = useDeleteEventLabel()

  const [editingLabel, setEditingLabel] = useState<EventLabel | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(labelColorOptions[0])

  const resetForm = () => {
    setFormName('')
    setFormColor(labelColorOptions[0])
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

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/40',
        !isMobile && 'items-center'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full bg-background shadow-lg',
          isMobile
            ? 'max-h-[85vh] overflow-y-auto rounded-t-2xl'
            : 'max-w-sm rounded-lg max-h-[80vh] overflow-y-auto'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{t('labels')}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
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
              <button
                type="button"
                onClick={() => handleStartEdit(label)}
                className="rounded p-1 hover:bg-muted text-muted-foreground"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(label.rowId)}
                className="rounded p-1 hover:bg-destructive/10 text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {labels.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noLabels')}</p>
          )}

          {/* Add/Edit form */}
          {(isAdding || editingLabel) && (
            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!formName.trim() || createLabel.isPending || updateLabel.isPending}
                  className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Check size={12} className="inline mr-1" />
                  {tc('save')}
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!isAdding && !editingLabel && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="flex w-full items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/20 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus size={14} />
              {t('addLabel')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
