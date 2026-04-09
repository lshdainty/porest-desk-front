import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useIsMobile } from '@/shared/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import type { Todo, TodoStatus } from '@/entities/todo'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface KanbanBoardProps {
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onToggleStatus: (id: number) => void
  onTogglePin: (id: number) => void
  onStatusChange: (id: number, status: TodoStatus) => void
  onQuickAdd?: (title: string, status: TodoStatus) => void
  isQuickAddLoading?: boolean
}

const COLUMNS: { id: TodoStatus; translationKey: string }[] = [
  { id: 'PENDING', translationKey: 'kanban.pending' },
  { id: 'IN_PROGRESS', translationKey: 'kanban.inProgress' },
  { id: 'COMPLETED', translationKey: 'kanban.completed' },
]

export const KanbanBoard = ({
  todos,
  onEdit,
  onDelete,
  onStatusChange,
  onQuickAdd,
  isQuickAddLoading,
}: KanbanBoardProps) => {
  const { t } = useTranslation('todo')
  const isMobile = useIsMobile()
  const [activeDragId, setActiveDragId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupedTodos = useMemo(() => {
    const groups: Record<TodoStatus, Todo[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    }
    for (const todo of todos) {
      if (groups[todo.status]) {
        groups[todo.status].push(todo)
      }
    }
    return groups
  }, [todos])

  const activeTodo = useMemo(
    () => (activeDragId !== null ? todos.find((t) => t.rowId === activeDragId) ?? null : null),
    [activeDragId, todos]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)

    const { active, over } = event
    if (!over) return

    const todoId = Number(active.id)
    const todo = todos.find((t) => t.rowId === todoId)
    if (!todo) return

    // Determine target column: either the droppable column itself or the column of the item dropped onto
    let targetStatus: TodoStatus | null = null

    const overId = String(over.id)
    if (overId === 'PENDING' || overId === 'IN_PROGRESS' || overId === 'COMPLETED') {
      targetStatus = overId as TodoStatus
    } else {
      // Dropped onto another card - find which column it belongs to
      const overTodo = todos.find((t) => t.rowId === Number(over.id))
      if (overTodo) {
        targetStatus = overTodo.status
      }
    }

    if (targetStatus && targetStatus !== todo.status) {
      onStatusChange(todoId, targetStatus)
    }
  }

  const handleDragCancel = () => {
    setActiveDragId(null)
  }

  const makeQuickAddHandler = useCallback(
    (status: TodoStatus) => (title: string) => {
      onQuickAdd?.(title, status)
    },
    [onQuickAdd]
  )

  if (isMobile) {
    return (
      <Tabs defaultValue="PENDING" className="flex flex-col">
        <TabsList className="w-full">
          {COLUMNS.map((col) => (
            <TabsTrigger key={col.id} value={col.id} className="flex-1 gap-1.5 text-xs">
              {t(col.translationKey)}
              <span className="text-[10px] text-muted-foreground">
                ({t('kanban.count', { count: groupedTodos[col.id].length })})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {COLUMNS.map((col) => (
            <TabsContent key={col.id} value={col.id}>
              <KanbanColumn
                id={col.id}
                title={t(col.translationKey)}
                count={groupedTodos[col.id].length}
                todos={groupedTodos[col.id]}
                onEdit={onEdit}
                onDelete={onDelete}
                onQuickAdd={onQuickAdd ? makeQuickAddHandler(col.id) : undefined}
                isQuickAddLoading={isQuickAddLoading}
              />
            </TabsContent>
          ))}

          <DragOverlay>
            {activeTodo ? (
              <KanbanCard
                todo={activeTodo}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </Tabs>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={t(col.translationKey)}
            count={groupedTodos[col.id].length}
            todos={groupedTodos[col.id]}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuickAdd={onQuickAdd ? makeQuickAddHandler(col.id) : undefined}
            isQuickAddLoading={isQuickAddLoading}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTodo ? (
          <KanbanCard
            todo={activeTodo}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
