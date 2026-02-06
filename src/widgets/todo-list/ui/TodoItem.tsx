import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn, formatDate } from '@/shared/lib'
import type { Todo } from '@/entities/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
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

export const TodoItem = ({ todo, onToggle, onEdit, onDelete }: TodoItemProps) => {
  const { t } = useTranslation('todo')
  const [expanded, setExpanded] = useState(false)
  const isCompleted = todo.status === 'COMPLETED'

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 transition-all',
        isCompleted && 'opacity-60'
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
            <span
              className={cn(
                'inline-flex h-2 w-2 shrink-0 rounded-full',
                priorityDotMap[todo.priority]
              )}
            />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium',
                priorityColorMap[todo.priority]
              )}
            >
              {t(`priority.${todo.priority}`)}
            </span>
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
          </div>

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
