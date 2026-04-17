import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { isBefore, startOfDay, parseISO } from 'date-fns'
import { cn, formatDate } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { Todo } from '@/entities/todo'

interface KanbanCardProps {
  todo: Todo
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

const priorityConfig = {
  HIGH: { label: 'HIGH', className: 'border-red-500 text-red-600 dark:text-red-400', borderColor: 'border-l-red-500' },
  MEDIUM: { label: 'MEDIUM', className: 'border-yellow-500 text-yellow-600 dark:text-yellow-400', borderColor: 'border-l-amber-500' },
  LOW: { label: 'LOW', className: 'border-green-500 text-green-600 dark:text-green-400', borderColor: 'border-l-green-500' },
} as const

export const KanbanCard = ({ todo, onEdit, onDelete }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.rowId })

  const style = {
    transform: isDragging
      ? `${CSS.Transform.toString(transform)} rotate(3deg)`
      : CSS.Transform.toString(transform),
    transition,
  }

  const isCompleted = todo.status === 'COMPLETED'
  const isOverdue =
    todo.dueDate && !isCompleted && isBefore(parseISO(todo.dueDate), startOfDay(new Date()))
  const priority = priorityConfig[todo.priority]
  const visibleTags = todo.tags?.slice(0, 2) ?? []
  const remainingTagCount = (todo.tags?.length ?? 0) - visibleTags.length

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-action]')) return
    onEdit(todo)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={cn(
        'group cursor-grab border-l-4 p-3 transition-all duration-200',
        priority.borderColor,
        'hover:shadow-lg hover:-translate-y-0.5',
        isDragging && 'shadow-xl ring-2 ring-primary',
        isCompleted && 'opacity-60',
        isOverdue && 'bg-red-50 dark:bg-red-950/20'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className={cn('shrink-0 text-[10px]', priority.className)}>
          {priority.label}
        </Badge>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            data-action="edit"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(todo)
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil size={12} />
          </button>
          <button
            data-action="delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(todo)
            }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p
        className={cn(
          'mt-1.5 text-sm font-medium line-clamp-2',
          isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {todo.title}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {todo.projectName && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            {todo.projectName}
          </span>
        )}

        {todo.dueDate && (
          <span
            className={cn(
              'text-[10px]',
              isOverdue
                ? 'rounded bg-red-100 px-1 py-0.5 font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'text-muted-foreground'
            )}
          >
            {formatDate(todo.dueDate, 'M/d')}
          </span>
        )}

        {todo.subtaskCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {todo.subtaskCompletedCount}/{todo.subtaskCount}
          </span>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag.rowId}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : undefined,
                color: tag.color || undefined,
                border: `1px solid ${tag.color || 'var(--border)'}`,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color || 'var(--muted-foreground)' }}
              />
              {tag.tagName}
            </span>
          ))}
          {remainingTagCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              +{remainingTagCount}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
