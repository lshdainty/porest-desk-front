import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Settings2, Tags } from 'lucide-react'
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
} from '@/features/todo'
import { useTodoProjects } from '@/features/todo-project'
import { useTodoTags } from '@/features/todo-tag'
import type { Todo, TodoFormValues, TodoStatus, TodoPriority, TodoType } from '@/entities/todo'
import { TodoFilters } from './TodoFilters'
import { TodoItem } from './TodoItem'
import { TodoForm } from './TodoForm'
import { SubtaskList } from './SubtaskList'
import { ProjectManagementDialog } from './ProjectManagementDialog'
import { TagManagementDialog } from './TagManagementDialog'
import { NoteEditorDialog } from './NoteEditorDialog'

export const TodoListWidget = () => {
  const { t } = useTranslation('todo')
  const isMobile = useIsMobile()

  const [typeFilter, setTypeFilter] = useState<TodoType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'ALL'>('ALL')
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editingNote, setEditingNote] = useState<Todo | null>(null)
  const [subtaskParentId, setSubtaskParentId] = useState<number | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(new Set())
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)

  const filters = {
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    ...(statusFilter !== 'ALL' && typeFilter !== 'NOTE' && { status: statusFilter }),
    ...(priorityFilter !== 'ALL' && typeFilter !== 'NOTE' && { priority: priorityFilter }),
    ...(projectFilter !== null && { projectRowId: projectFilter }),
  }

  const { data: todos, isLoading } = useTodos(
    Object.keys(filters).length > 0 ? filters : undefined
  )
  const { data: projects = [] } = useTodoProjects()
  const { data: tags = [] } = useTodoTags()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const toggleStatus = useToggleTodoStatus()
  const togglePin = useToggleTodoPin()
  const deleteTodo = useDeleteTodo()

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

  const handleNoteClick = useCallback((todo: Todo) => {
    setEditingNote(todo)
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

  const handleAddSubtask = useCallback((parentId: number) => {
    setEditingTodo(null)
    setSubtaskParentId(parentId)
    setShowForm(true)
  }, [])

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

  const handleTypeFilterChange = useCallback((type: TodoType | 'ALL') => {
    setTypeFilter(type)
    if (type === 'NOTE') {
      setStatusFilter('ALL')
      setPriorityFilter('ALL')
    }
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

        if (typeFilter === 'NOTE') {
          // NOTE: sort by modifyAt desc
          return new Date(b.modifyAt).getTime() - new Date(a.modifyAt).getTime()
        }

        // TASK or ALL: sort by priority, then sortOrder
        if (a.type === 'NOTE' && b.type === 'NOTE') {
          return new Date(b.modifyAt).getTime() - new Date(a.modifyAt).getTime()
        }

        // 3. Tasks: sort by priority (HIGH > MEDIUM > LOW)
        const pa = priorityOrder[a.priority] ?? 1
        const pb = priorityOrder[b.priority] ?? 1
        if (pa !== pb) return pa - pb

        // 4. Same priority: sort by sortOrder
        return a.sortOrder - b.sortOrder
      })
    : []

  const defaultFormType: TodoType = typeFilter === 'NOTE' ? 'NOTE' : 'TASK'
  const emptyMessage = typeFilter === 'NOTE' ? t('note.empty') : t('empty')
  const emptyAction = typeFilter === 'NOTE' ? t('note.createFirst') : t('createFirst')
  const addButtonText = typeFilter === 'NOTE' ? t('type.NOTE') : t('addTodo')

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 고정: 필터 + 프로젝트/태그 버튼 */}
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <TodoFilters
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              projectFilter={projectFilter}
              projects={projects}
              onTypeChange={handleTypeFilterChange}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onProjectChange={setProjectFilter}
            />
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-1">
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

      {/* 스크롤: 리스트 */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">{emptyMessage}</p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-3"
            >
              {emptyAction}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTodos.map((todo) => (
              <div key={todo.rowId}>
                <TodoItem
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddSubtask={handleAddSubtask}
                  onExpandSubtasks={handleExpandSubtasks}
                  onTogglePin={handleTogglePin}
                  onNoteClick={handleNoteClick}
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
        )}

        {!isMobile && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus size={16} />
            {addButtonText}
          </button>
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
          defaultType={defaultFormType}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createTodo.isPending || updateTodo.isPending}
        />
      )}

      <NoteEditorDialog
        todo={editingNote}
        open={editingNote !== null}
        onClose={() => setEditingNote(null)}
        projects={projects}
        tags={tags}
      />

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTodo.isPending}>
              {deleteTodo.isPending ? '...' : t('deleteConfirm.confirm')}
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
