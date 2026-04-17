import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Loader2 } from 'lucide-react'
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
  onQuickAdd?: (title: string) => void
  isQuickAddLoading?: boolean
}

type ColumnColors = { header: string; badge: string; border: string }

const columnColorMap: Record<string, ColumnColors> = {
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

const defaultColumnColors: ColumnColors = {
  header: 'text-muted-foreground',
  badge: 'bg-muted text-muted-foreground',
  border: 'border-t-muted-foreground/30',
}

export const KanbanColumn = ({
  id,
  title,
  count,
  todos,
  onEdit,
  onDelete,
  onQuickAdd,
  isQuickAddLoading,
}: KanbanColumnProps) => {
  const { t } = useTranslation('todo')
  const { setNodeRef, isOver } = useDroppable({ id })
  const colors = columnColorMap[id] ?? defaultColumnColors
  const todoIds = todos.map((t) => t.rowId)

  const [isAdding, setIsAdding] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleQuickSubmit = useCallback(() => {
    const trimmed = quickTitle.trim()
    if (!trimmed || isQuickAddLoading || !onQuickAdd) return
    onQuickAdd(trimmed)
    setQuickTitle('')
    inputRef.current?.focus()
  }, [quickTitle, isQuickAddLoading, onQuickAdd])

  const handleQuickKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuickSubmit()
    }
    if (e.key === 'Escape') {
      setQuickTitle('')
      setIsAdding(false)
    }
  }, [handleQuickSubmit])

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
              {t('kanban.empty')}
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

      {onQuickAdd && id !== 'COMPLETED' && (
        <div className="px-2 pb-2">
          {isAdding ? (
            <div className="flex items-center gap-1.5 rounded-md border bg-card p-1.5">
              <input
                ref={inputRef}
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                onBlur={() => {
                  if (!quickTitle.trim()) setIsAdding(false)
                }}
                placeholder={t('quickAdd.placeholder')}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
              {isQuickAddLoading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAdding(true)
                setTimeout(() => inputRef.current?.focus(), 0)
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus size={14} />
              {t('kanban.addTodo')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
