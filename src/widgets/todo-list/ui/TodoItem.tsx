import { useState, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, Plus, ListTodo, Pin, GripVertical } from 'lucide-react'
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
  isSubtask?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
  /** Passed through to the root div — used by SortableTodoItem for transform. */
  style?: React.CSSProperties
}

const priorityDotMap = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
}

export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onExpandSubtasks,
  onTogglePin,
  isSubtask = false,
  dragHandleProps,
  isDragging = false,
  ...rest
}, ref) => {
  const { t } = useTranslation('todo')
  const [expanded, setExpanded] = useState(false)
  const isCompleted = todo.status === 'COMPLETED'
  const hasSubtasks = todo.subtaskCount > 0

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'group rounded-lg border bg-card p-3 transition-all duration-300',
        isCompleted && 'opacity-60',
        isSubtask && 'ml-6 border-dashed',
        !isSubtask && todo.isPinned && 'border-[var(--color-accent-amber)]/40 bg-[var(--color-accent-amber)]/5',
        isDragging && 'opacity-50 ring-2 ring-primary shadow-lg'
      )}
    >
      <div className="flex items-start gap-3">
        {dragHandleProps && !isSubtask && (
          <button
            {...dragHandleProps}
            className="mt-0.5 flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </button>
        )}
        <button
          onClick={() => onToggle(todo.rowId)}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-300',
            isCompleted
              ? 'border-primary bg-primary text-primary-foreground scale-110'
              : 'border-muted-foreground/40 hover:border-primary scale-100'
          )}
        >
          <Check
            size={12}
            strokeWidth={3}
            className={cn(
              'transition-all duration-300',
              isCompleted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium transition-all duration-300',
                isCompleted
                  ? 'line-through text-muted-foreground/60'
                  : 'no-underline text-foreground'
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

          {/* Meta row — only render if there's actually something to show */}
          {(todo.projectName || todo.dueDate || hasSubtasks || (todo.tags && todo.tags.length > 0)) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {todo.dueDate && (
                <span className="tabular-nums">
                  {formatDate(todo.dueDate)}
                </span>
              )}

              {todo.projectName && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
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

              {hasSubtasks && (
                <button
                  onClick={() => onExpandSubtasks?.(todo.rowId)}
                  className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <ListTodo size={10} />
                  {t('subtaskProgress', {
                    completed: todo.subtaskCompletedCount,
                    total: todo.subtaskCount,
                  })}
                </button>
              )}
            </div>
          )}

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
          {/* Always-visible: expand content + pin */}
          {todo.content && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {!isSubtask && onTogglePin && todo.isPinned && (
            <button
              onClick={() => onTogglePin(todo.rowId)}
              className="rounded p-1 text-[color:var(--color-accent-amber)] hover:bg-[var(--color-accent-amber)]/10 transition-colors"
              title={t('note.unpin')}
            >
              <Pin size={14} />
            </button>
          )}

          {/* Hover-only actions on desktop */}
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {!isSubtask && onTogglePin && !todo.isPinned && (
              <button
                onClick={() => onTogglePin(todo.rowId)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={t('note.pin')}
              >
                <Pin size={14} />
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
    </div>
  )
})

TodoItem.displayName = 'TodoItem'
