import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
import type { Todo, TodoFormValues, TodoPriority } from '@/entities/todo'
import type { TodoProject } from '@/entities/todo-project'
import type { TodoTag } from '@/entities/todo-tag'

interface TodoFormProps {
  todo?: Todo | null
  projects: TodoProject[]
  tags: TodoTag[]
  parentId?: number
  onSubmit: (data: TodoFormValues) => void
  onClose: () => void
  isLoading?: boolean
}

const priorityOptions: TodoPriority[] = ['HIGH', 'MEDIUM', 'LOW']

export const TodoForm = ({ todo, projects, tags, parentId, onSubmit, onClose, isLoading }: TodoFormProps) => {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TodoFormValues>({
    defaultValues: {
      title: '',
      content: '',
      priority: 'MEDIUM',
      category: '',
      dueDate: '',
      projectRowId: undefined,
      parentRowId: parentId,
      tagIds: [],
      type: 'TASK',
    },
  })

  const selectedPriority = watch('priority')
  const projectRowId = watch('projectRowId')

  useEffect(() => {
    if (todo) {
      reset({
        title: todo.title,
        content: todo.content || '',
        priority: todo.priority,
        category: todo.category || '',
        dueDate: todo.dueDate || '',
        projectRowId: todo.projectRowId || undefined,
        parentRowId: todo.parentRowId || undefined,
        tagIds: todo.tags?.map((t) => t.rowId) || [],
        type: 'TASK',
      })
      setSelectedTagIds(todo.tags?.map((t) => t.rowId) || [])
    } else {
      reset({
        title: '',
        content: '',
        priority: 'MEDIUM',
        category: '',
        dueDate: '',
        projectRowId: undefined,
        parentRowId: parentId,
        tagIds: [],
        type: 'TASK',
      })
      setSelectedTagIds([])
    }
  }, [todo, parentId, reset])

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) => {
      const next = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
      setValue('tagIds', next)
      return next
    })
  }

  const onFormSubmit = (data: TodoFormValues) => {
    onSubmit({
      ...data,
      type: 'TASK',
      content: data.content || undefined,
      category: data.category || undefined,
      dueDate: data.dueDate || undefined,
      projectRowId: data.projectRowId || undefined,
      parentRowId: data.parentRowId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    })
  }

  const title = parentId ? t('addSubtask') : todo ? t('editTodo') : t('createTodo')

  const Footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        {tc('cancel')}
      </Button>
      <Button type="button" onClick={handleSubmit(onFormSubmit)} disabled={isLoading}>
        {isLoading ? tc('loading') : tc('save')}
      </Button>
    </>
  )

  return (
    <ModalShell title={title} onClose={onClose} mobile={isMobile} size="sm" footer={Footer}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('form.title')}</Label>
            <Input
              {...register('title', { required: t('form.titleRequired') })}
              className={cn(errors.title && 'border-destructive')}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t('form.content')}</Label>
            <Textarea
              {...register('content')}
              rows={3}
              className="resize-none"
              placeholder={t('form.contentPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('form.priority')}</Label>
            <div className="flex gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setValue('priority', priority)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    selectedPriority === priority
                      ? priority === 'HIGH'
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : priority === 'MEDIUM'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'hover:bg-muted'
                  )}
                >
                  {t(`priority.${priority}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('form.category')}</Label>
            <Input
              {...register('category')}
              placeholder={t('form.categoryPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('form.dueDate')}</Label>
            <InputDatePicker
              value={watch('dueDate')}
              onValueChange={(v) => setValue('dueDate', v)}
            />
          </div>

          {!parentId && projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('form.project')}</Label>
              <Select
                value={projectRowId ? String(projectRowId) : '__none__'}
                onValueChange={(val) => setValue('projectRowId', val === '__none__' ? undefined : Number(val))}
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

        </form>
    </ModalShell>
  )
}
