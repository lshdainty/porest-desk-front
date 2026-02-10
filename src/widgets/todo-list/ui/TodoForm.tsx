import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { X, Check } from 'lucide-react'
import { cn } from '@/shared/lib'
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
    },
  })

  const selectedPriority = watch('priority')

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
      content: data.content || undefined,
      category: data.category || undefined,
      dueDate: data.dueDate || undefined,
      projectRowId: data.projectRowId || undefined,
      parentRowId: data.parentRowId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    })
  }

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
            : 'max-w-md rounded-lg'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {parentId
              ? t('addSubtask')
              : todo
                ? t('editTodo')
                : t('createTodo')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.title')}</label>
            <input
              {...register('title', { required: t('form.titleRequired') })}
              className={cn(
                'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.title && 'border-destructive'
              )}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.content')}</label>
            <textarea
              {...register('content')}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder={t('form.contentPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.priority')}</label>
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

          {!parentId && projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('form.project')}</label>
              <select
                {...register('projectRowId', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{t('allProjects')}</option>
                {projects.map((project) => (
                  <option key={project.rowId} value={project.rowId}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tags.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('form.tags')}</label>
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.category')}</label>
            <input
              {...register('category')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder={t('form.categoryPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.dueDate')}</label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? tc('loading') : tc('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
