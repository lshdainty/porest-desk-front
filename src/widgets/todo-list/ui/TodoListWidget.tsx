import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Settings2, Tags, List, LayoutGrid, CheckSquare } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
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
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodoStatus,
  useToggleTodoPin,
  useDeleteTodo,
  useReorderTodos,
} from '@/features/todo'
import { useTodoProjects } from '@/features/todo-project'
import { useTodoTags } from '@/features/todo-tag'
import type { Todo, TodoFormValues, TodoStatus, TodoPriority } from '@/entities/todo'
import { TodoFilters } from './TodoFilters'
import { TodoItem } from './TodoItem'
import { SortableTodoItem } from './SortableTodoItem'
import { TodoForm } from './TodoForm'
import { TodoQuickAdd } from './TodoQuickAdd'
import { SubtaskList } from './SubtaskList'
import { ProjectManagementDialog } from './ProjectManagementDialog'
import { TagManagementDialog } from './TagManagementDialog'
import { KanbanBoard } from './kanban/KanbanBoard'

type ViewMode = 'list' | 'kanban'

export const TodoListWidget = () => {
  const { t } = useTranslation('todo')
  const isMobile = useIsMobile()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'ALL'>('ALL')
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [subtaskParentId, setSubtaskParentId] = useState<number | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(new Set())
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)

  const filters = {
    type: 'TASK' as const,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
    ...(projectFilter !== null && { projectRowId: projectFilter }),
  }

  const { data: todos, isLoading } = useTodos(filters)
  const { data: projects = [] } = useTodoProjects()
  const { data: tags = [] } = useTodoTags()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const toggleStatus = useToggleTodoStatus()
  const togglePin = useToggleTodoPin()
  const deleteTodo = useDeleteTodo()
  const reorderTodos = useReorderTodos()

  const [activeDragId, setActiveDragId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCreate = useCallback((data: TodoFormValues) => {
    createTodo.mutate(data, {
      onSuccess: () => {
        setShowForm(false)
        setSubtaskParentId(undefined)
      },
    })
  }, [createTodo])

  const handleUpdate = useCallback((data: TodoFormValues) => {
    if (!editingTodo) return
    updateTodo.mutate(
      { id: editingTodo.rowId, data },
      {
        onSuccess: () => {
          setEditingTodo(null)
          setShowForm(false)
        },
      }
    )
  }, [editingTodo, updateTodo])

  const handleToggle = useCallback((id: number) => {
    if (toggleStatus.isPending) return
    toggleStatus.mutate(id)
  }, [toggleStatus])

  const handleTogglePin = useCallback((id: number) => {
    if (togglePin.isPending) return
    togglePin.mutate(id)
  }, [togglePin])

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setSubtaskParentId(undefined)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setShowDeleteConfirm(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteTodo.mutate(showDeleteConfirm, {
      onSuccess: () => {
        setShowDeleteConfirm(null)
      },
    })
  }, [showDeleteConfirm, deleteTodo])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingTodo(null)
    setSubtaskParentId(undefined)
  }, [])

  const handleFormSubmit = useCallback((data: TodoFormValues) => {
    if (editingTodo) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingTodo, handleUpdate, handleCreate])

  const handleQuickAdd = useCallback((title: string) => {
    createTodo.mutate({
      title,
      priority: 'MEDIUM',
      type: 'TASK',
      ...(projectFilter !== null && { projectRowId: projectFilter }),
    })
  }, [createTodo, projectFilter])

  const handleAddSubtask = useCallback((parentId: number) => {
    setEditingTodo(null)
    setSubtaskParentId(parentId)
    setShowForm(true)
  }, [])

  const handleKanbanDelete = useCallback((todo: Todo) => {
    setShowDeleteConfirm(todo.rowId)
  }, [])

  const handleStatusChange = useCallback((id: number, status: TodoStatus) => {
    const todo = todos?.find((t) => t.rowId === id)
    if (!todo) return
    updateTodo.mutate({
      id,
      data: {
        title: todo.title,
        content: todo.content || undefined,
        priority: todo.priority,
        category: todo.category || undefined,
        dueDate: todo.dueDate || undefined,
        projectRowId: todo.projectRowId || undefined,
        parentRowId: todo.parentRowId || undefined,
        type: 'TASK',
        status,
      } as TodoFormValues,
    })
  }, [todos, updateTodo])

  const handleExpandSubtasks = useCallback((todoId: number) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev)
      if (next.has(todoId)) {
        next.delete(todoId)
      } else {
        next.add(todoId)
      }
      return next
    })
  }, [])

  const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

  const sortedTodos = todos
    ? [...todos].sort((a, b) => {
        // 1. Pinned items always come first
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1

        // 2. Completed items always go to bottom
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1

        // 3. Sort by priority (HIGH > MEDIUM > LOW)
        const pa = priorityOrder[a.priority] ?? 1
        const pb = priorityOrder[b.priority] ?? 1
        if (pa !== pb) return pa - pb

        // 4. Same priority: sort by sortOrder
        return a.sortOrder - b.sortOrder
      })
    : []

  const todoIds = useMemo(() => sortedTodos.map((t) => t.rowId), [sortedTodos])
  const activeTodo = useMemo(
    () => (activeDragId !== null ? sortedTodos.find((t) => t.rowId === activeDragId) ?? null : null),
    [activeDragId, sortedTodos]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedTodos.findIndex((t) => t.rowId === Number(active.id))
    const newIndex = sortedTodos.findIndex((t) => t.rowId === Number(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sortedTodos, oldIndex, newIndex)
    const items = reordered.map((todo, index) => ({
      todoId: todo.rowId,
      sortOrder: index,
    }))
    reorderTodos.mutate(items)
  }, [sortedTodos, reorderTodos])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 고정: 필터 + 프로젝트/태그 버튼 */}
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <TodoFilters
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              projectFilter={projectFilter}
              projects={projects}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onProjectChange={setProjectFilter}
            />
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              title={t('view.list')}
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('kanban')}
              title={t('view.kanban')}
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowProjectDialog(true)}
              title={t('projects')}
            >
              <Settings2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowTagDialog(true)}
              title={t('tags')}
            >
              <Tags size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* 스크롤: 리스트 또는 칸반 */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            todos={sortedTodos}
            onEdit={handleEdit}
            onDelete={handleKanbanDelete}
            onToggleStatus={handleToggle}
            onTogglePin={handleTogglePin}
            onStatusChange={handleStatusChange}
          />
        ) : sortedTodos.length === 0 ? (
          (() => {
            const hasActiveFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || projectFilter !== null
            return (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckSquare size={56} strokeWidth={1.2} className="mb-4 text-muted-foreground/30" />
                <p className="text-sm font-medium">{t('empty')}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {hasActiveFilters ? t('emptyFilterDescription') : t('emptyDescription')}
                </p>
                {!hasActiveFilters && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="mt-4"
                  >
                    <Plus size={16} className="mr-1" />
                    {t('createFirst')}
                  </Button>
                )}
              </div>
            )
          })()
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedTodos.map((todo) => (
                  <div key={todo.rowId}>
                    <SortableTodoItem
                      todo={todo}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddSubtask={handleAddSubtask}
                      onExpandSubtasks={handleExpandSubtasks}
                      onTogglePin={handleTogglePin}
                    />
                    {expandedSubtasks.has(todo.rowId) && todo.subtaskCount > 0 && (
                      <SubtaskList
                        parentId={todo.rowId}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeTodo ? (
                <TodoItem
                  todo={activeTodo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {viewMode === 'list' && !isMobile && (
          <div className="mt-4">
            <TodoQuickAdd
              onAdd={handleQuickAdd}
              isLoading={createTodo.isPending}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <button
          onClick={() => setShowForm(true)}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
            'rounded-full bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
        >
          <Plus size={24} />
        </button>
      )}

      {showForm && (
        <TodoForm
          todo={editingTodo}
          projects={projects}
          tags={tags}
          parentId={subtaskParentId}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createTodo.isPending || updateTodo.isPending}
        />
      )}

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTodo.isPending}>
              {deleteTodo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showProjectDialog && (
        <ProjectManagementDialog onClose={() => setShowProjectDialog(false)} />
      )}

      {showTagDialog && (
        <TagManagementDialog onClose={() => setShowTagDialog(false)} />
      )}
    </div>
  )
}
