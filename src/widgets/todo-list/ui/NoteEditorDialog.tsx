import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pin, Eye, EyeOff, Trash2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useUpdateTodo,
  useToggleTodoPin,
  useDeleteTodo,
} from '@/features/todo'
import type { Todo } from '@/entities/todo'
import type { TodoProject } from '@/entities/todo-project'
import type { TodoTag } from '@/entities/todo-tag'
import { MemoPreview } from './MemoPreview'

interface NoteEditorDialogProps {
  todo: Todo | null
  open: boolean
  onClose: () => void
  projects: TodoProject[]
  tags: TodoTag[]
}

export const NoteEditorDialog = ({ todo, open, onClose, projects, tags }: NoteEditorDialogProps) => {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [projectRowId, setProjectRowId] = useState<number | undefined>(undefined)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateTodo = useUpdateTodo()
  const togglePin = useToggleTodoPin()
  const deleteTodo = useDeleteTodo()

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setContent(todo.content || '')
      setProjectRowId(todo.projectRowId || undefined)
      setSelectedTagIds(todo.tags?.map((t) => t.rowId) || [])
      setShowPreview(false)
    }
  }, [todo])

  const handleSave = () => {
    if (!todo || !title.trim()) return
    updateTodo.mutate(
      {
        id: todo.rowId,
        data: {
          title: title.trim(),
          content: content || undefined,
          priority: todo.priority,
          type: 'NOTE',
          projectRowId: projectRowId || undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        },
      },
      { onSuccess: () => onClose() }
    )
  }

  const handleTogglePin = () => {
    if (!todo) return
    togglePin.mutate(todo.rowId)
  }

  const handleDelete = () => {
    if (!todo) return
    deleteTodo.mutate(todo.rowId, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        onClose()
      },
    })
  }

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  if (!todo) return null

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t('type.NOTE')}</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleTogglePin}
                  title={todo.isPinned ? t('note.unpin') : t('note.pin')}
                >
                  <Pin
                    size={16}
                    className={cn(todo.isPinned && 'text-primary')}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(!showPreview)}
                  title={showPreview ? t('note.editor') : t('note.preview')}
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className="text-lg font-semibold"
            />

            {showPreview ? (
              <div className="min-h-[300px] rounded-md border p-4">
                <MemoPreview content={content} />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="resize-none font-mono text-sm"
                placeholder={t('note.markdown')}
              />
            )}

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t('form.project')}</Label>
                <Select
                  value={projectRowId ? String(projectRowId) : '__none__'}
                  onValueChange={(val) => setProjectRowId(val === '__none__' ? undefined : Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allProjects')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('allProjects')}</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.rowId} value={String(project.rowId)}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tags.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t('form.tags')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.rowId)
                    return (
                      <button
                        key={tag.rowId}
                        type="button"
                        onClick={() => toggleTag(tag.rowId)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                        style={
                          isSelected && tag.color
                            ? { borderColor: tag.color, backgroundColor: `${tag.color}15`, color: tag.color }
                            : tag.color
                              ? { borderColor: `${tag.color}40` }
                              : undefined
                        }
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                        {tag.tagName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateTodo.isPending || !title.trim()}
            >
              {updateTodo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteTodo.isPending}>
              {deleteTodo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
