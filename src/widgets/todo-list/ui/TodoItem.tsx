import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, Plus, ListTodo, FileText, Pin } from 'lucide-react'
import { cn, formatDate } from '@/shared/lib'
import type { Todo } from '@/entities/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
  onAddSubtask?: (parentId: number) => void
  onExpandSubtasks?: (todoId: number) => void
  onTogglePin?: (id: number) => void
  onNoteClick?: (todo: Todo) => void
  isSubtask?: boolean
}

const priorityColorMap = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const priorityDotMap = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
}

const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/^>\s/gm, '')
    .replace(/\n/g, ' ')
    .trim()
}

export const TodoItem = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onExpandSubtasks,
  onTogglePin,
  onNoteClick,
  isSubtask = false,
}: TodoItemProps) => {
  const { t } = useTranslation('todo')
  const [expanded, setExpanded] = useState(false)
  const isCompleted = todo.status === 'COMPLETED'
  const hasSubtasks = todo.subtaskCount > 0
  const isNote = todo.type === 'NOTE'

  if (isNote) {
    const contentPreview = todo.content
      ? stripMarkdown(todo.content).slice(0, 80)
      : ''

    return (
      <div
        className={cn(
          'rounded-lg border bg-card p-3 transition-all cursor-pointer hover:bg-accent/50',
          todo.isPinned && 'border-primary/30 bg-primary/5'
        )}
        onClick={() => onNoteClick?.(todo)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
            <FileText size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {todo.title}
              </span>
              {todo.isPinned && (
                <Pin size={12} className="shrink-0 text-primary" />
              )}
            </div>

            {contentPreview && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {contentPreview}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {todo.projectName && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  {todo.projectName}
                </span>
              )}

              {todo.tags?.map((tag) => (
                <span
                  key={tag.rowId}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    color: tag.color || undefined,
                    border: `1px solid ${tag.color || 'var(--border)'}`,
                  }}
                >
                  {tag.tagName}
                </span>
              ))}

              <span className="text-[10px] text-muted-foreground">
                {formatDate(todo.modifyAt, 'yyyy-MM-dd HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin?.(todo.rowId) }}
              className={cn(
                'rounded p-1 transition-colors',
                todo.isPinned
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={todo.isPinned ? t('note.unpin') : t('note.pin')}
            >
              <Pin size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(todo.rowId) }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 transition-all',
        isCompleted && 'opacity-60',
        isSubtask && 'ml-6 border-dashed',
        !isSubtask && todo.isPinned && 'border-primary/30 bg-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.rowId)}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            isCompleted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/40 hover:border-primary'
          )}
        >
          {isCompleted && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {todo.title}
            </span>
            {todo.isPinned && (
              <Pin size={12} className="shrink-0 text-primary" />
            )}
            <span
              className={cn(
                'inline-flex h-2 w-2 shrink-0 rounded-full',
                priorityDotMap[todo.priority]
              )}
            />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium',
                priorityColorMap[todo.priority]
              )}
            >
              {t(`priority.${todo.priority}`)}
            </span>

            {todo.projectName && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              >
                {todo.projectName}
              </span>
            )}

            {todo.tags?.map((tag) => (
              <span
                key={tag.rowId}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  color: tag.color || undefined,
                  border: `1px solid ${tag.color || 'var(--border)'}`,
                }}
              >
                {tag.tagName}
              </span>
            ))}

            {todo.category && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {todo.category}
              </span>
            )}
            {todo.dueDate && (
              <span className="text-[10px] text-muted-foreground">
                {formatDate(todo.dueDate)}
              </span>
            )}

            {hasSubtasks && (
              <button
                onClick={() => onExpandSubtasks?.(todo.rowId)}
                className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <ListTodo size={10} />
                {t('subtaskProgress', {
                  completed: todo.subtaskCompletedCount,
                  total: todo.subtaskCount,
                })}
              </button>
            )}
          </div>

          {hasSubtasks && (
            <div className="mt-1.5">
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${todo.subtaskCount > 0 ? (todo.subtaskCompletedCount / todo.subtaskCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {expanded && todo.content && (
            <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
              {todo.content}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {todo.content && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {!isSubtask && onAddSubtask && (
            <button
              onClick={() => onAddSubtask(todo.rowId)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={t('addSubtask')}
            >
              <Plus size={14} />
            </button>
          )}
          {!isSubtask && onTogglePin && (
            <button
              onClick={() => onTogglePin(todo.rowId)}
              className={cn(
                'rounded p-1 transition-colors',
                todo.isPinned
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={todo.isPinned ? t('note.unpin') : t('note.pin')}
            >
              <Pin size={14} />
            </button>
          )}
          <button
            onClick={() => onEdit(todo)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(todo.rowId)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
