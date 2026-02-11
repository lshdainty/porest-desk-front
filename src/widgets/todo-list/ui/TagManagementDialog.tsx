import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useTodoTags,
  useCreateTodoTag,
  useUpdateTodoTag,
  useDeleteTodoTag,
} from '@/features/todo-tag'
import type { TodoTag, TodoTagFormValues } from '@/entities/todo-tag'

interface TagManagementDialogProps {
  onClose: () => void
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export const TagManagementDialog = ({ onClose }: TagManagementDialogProps) => {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')

  const { data: tags = [], isLoading } = useTodoTags()
  const createTag = useCreateTodoTag()
  const updateTag = useUpdateTodoTag()
  const deleteTag = useDeleteTodoTag()

  const [editingTag, setEditingTag] = useState<TodoTag | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<TodoTagFormValues>({
    tagName: '',
    color: '#3b82f6',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const openCreateForm = () => {
    setEditingTag(null)
    setFormData({ tagName: '', color: '#3b82f6' })
    setShowForm(true)
  }

  const openEditForm = (tag: TodoTag) => {
    setEditingTag(tag)
    setFormData({
      tagName: tag.tagName,
      color: tag.color || '#3b82f6',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.tagName.trim()) return
    if (editingTag) {
      updateTag.mutate(
        { id: editingTag.rowId, data: formData },
        { onSuccess: () => setShowForm(false) }
      )
    } else {
      createTag.mutate(formData, {
        onSuccess: () => setShowForm(false),
      })
    }
  }

  const handleDelete = (id: number) => {
    deleteTag.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tags')}</DialogTitle>
        </DialogHeader>

        <div>
          {showForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Input
                  value={formData.tagName}
                  onChange={(e) => setFormData({ ...formData, tagName: e.target.value })}
                  placeholder={t('form.tagNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        'h-7 w-7 rounded-full transition-all',
                        formData.color === color && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={createTag.isPending || updateTag.isPending}
                >
                  {(createTag.isPending || updateTag.isPending) ? tc('loading') : tc('save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : tags.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('form.tags')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.rowId}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                      style={{
                        borderColor: tag.color || undefined,
                        backgroundColor: tag.color ? `${tag.color}10` : undefined,
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || '#6b7280' }}
                      />
                      <span className="text-sm font-medium">{tag.tagName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEditForm(tag)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(tag.rowId)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={openCreateForm}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/20 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Plus size={14} />
                {t('addTag')}
              </button>
            </div>
          )}
        </div>

        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tc('delete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteConfirm.message')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
                disabled={deleteTag.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTag.isPending ? '...' : tc('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
