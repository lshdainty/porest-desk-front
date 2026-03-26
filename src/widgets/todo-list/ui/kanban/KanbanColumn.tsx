import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import type { Todo } from '@/entities/todo'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
}

const columnColorMap: Record<string, { header: string; badge: string; border: string }> = {
  PENDING: {
    header: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    border: 'border-t-yellow-500',
  },
  IN_PROGRESS: {
    header: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    border: 'border-t-blue-500',
  },
  COMPLETED: {
    header: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    border: 'border-t-green-500',
  },
}

export const KanbanColumn = ({
  id,
  title,
  count,
  todos,
  onEdit,
  onDelete,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  const colors = columnColorMap[id] ?? columnColorMap.PENDING
  const todoIds = todos.map((t) => t.rowId)

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-t-4 bg-muted/30',
        colors.border,
        isOver && 'bg-accent/50'
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className={cn('text-sm font-semibold', colors.header)}>
          {title}
        </span>
        <Badge
          variant="secondary"
          className={cn('h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold', colors.badge)}
        >
          {count}
        </Badge>
      </div>

      <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 max-h-[calc(100vh-240px)]"
        >
          {todos.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-8 text-xs text-muted-foreground">
              여기에 드래그하세요
            </div>
          ) : (
            todos.map((todo) => (
              <KanbanCard
                key={todo.rowId}
                todo={todo}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
