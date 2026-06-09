import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { CAT_PALETTE, getPaletteByColor } from '@/shared/lib/porest/chart-palette'
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

export const LabelManagementDialog = ({ open, onClose }: LabelManagementDialogProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const { data: labels = [], isLoading } = useEventLabels()
  const createLabel = useCreateEventLabel()
  const updateLabel = useUpdateEventLabel()
  const deleteLabel = useDeleteEventLabel()

  const [editingLabel, setEditingLabel] = useState<EventLabel | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState<string>(CAT_PALETTE[0]!.baseHex)

  const resetForm = () => {
    setFormName('')
    setFormColor(CAT_PALETTE[0]!.baseHex)
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

  const headerTitle = (
    <div className="flex items-center justify-between flex-1">
      <span>{t('labels')}</span>
      {!isAdding && !editingLabel && (
        <Button variant="outline" size="sm" onClick={handleStartAdd} className="mr-2">
          <Plus size={14} className="mr-1" />
          {t('addLabel')}
        </Button>
      )}
    </div>
  )

  return (
    <ModalShell title={headerTitle} onClose={onClose} mobile={isMobile} size="sm">
        <div className="space-y-3">
          {/* Existing labels */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <SkeletonBase className="h-4 w-4 rounded-full shrink-0" />
                <SkeletonBase className="h-4 flex-1" />
                <SkeletonBase className="h-8 w-8 rounded-md" />
                <SkeletonBase className="h-8 w-8 rounded-md" />
              </div>
            ))
          ) : labels.map(label => (
            <div
              key={label.rowId}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: getPaletteByColor(label.color).color }}
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
                loading={deleteLabel.isPending}
              >
                {!deleteLabel.isPending && <Trash2 size={14} />}
              </Button>
            </div>
          ))}

          {!isLoading && labels.length === 0 && !isAdding && (
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
              <ColorSwatchGroup
                columns={5}
                value={formColor}
                onValueChange={setFormColor}
                options={CAT_PALETTE.map(p => ({
                  value: p.baseHex,
                  bg: p.bg,
                  fg: p.color,
                }))}
              />
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
                  disabled={!formName.trim()}
                  loading={createLabel.isPending || updateLabel.isPending}
                >
                  <Check size={12} className="mr-1" />
                  {tc('save')}
                </Button>
              </div>
            </div>
          )}

        </div>
    </ModalShell>
  )
}
