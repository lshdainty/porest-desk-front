import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodoStatus,
  useDeleteTodo,
} from '@/features/todo'
import type { Todo, TodoFormValues, TodoStatus, TodoPriority } from '@/entities/todo'
import { TodoFilters } from './TodoFilters'
import { TodoItem } from './TodoItem'
import { TodoForm } from './TodoForm'

export const TodoListWidget = () => {
  const { t } = useTranslation('todo')
  const isMobile = useIsMobile()

  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const filters = {
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
  }

  const { data: todos, isLoading } = useTodos(
    Object.keys(filters).length > 0 ? filters : undefined
  )
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const toggleStatus = useToggleTodoStatus()
  const deleteTodo = useDeleteTodo()

  const handleCreate = useCallback((data: TodoFormValues) => {
    createTodo.mutate(data, {
      onSuccess: () => {
        setShowForm(false)
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
    toggleStatus.mutate(id)
  }, [toggleStatus])

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo)
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
  }, [])

  const handleFormSubmit = useCallback((data: TodoFormValues) => {
    if (editingTodo) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingTodo, handleUpdate, handleCreate])

  const sortedTodos = todos
    ? [...todos].sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1
        return a.sortOrder - b.sortOrder
      })
    : []

  return (
    <div className="relative h-full">
      <div className="space-y-4">
        <TodoFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">{t('empty')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTodos.map((todo) => (
              <TodoItem
                key={todo.rowId}
                todo={todo}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {!isMobile && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={16} />
          {t('addTodo')}
        </button>
      )}

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
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createTodo.isPending || updateTodo.isPending}
        />
      )}

      {showDeleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t('deleteConfirm.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('deleteConfirm.message')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTodo.isPending}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteTodo.isPending ? '...' : t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
