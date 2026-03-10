import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { dashboardKeys } from '@/shared/config'
import type { RecentTodo } from '@/features/dashboard/api/dashboardApi'

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
}

const PRIORITY_BG: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-600',
  MEDIUM: 'bg-yellow-500/10 text-yellow-600',
  LOW: 'bg-blue-500/10 text-blue-600',
}

export const RecentTodosWidget = () => {
  const { t } = useTranslation('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 60000,
  })

  const todos = data?.recentTodos ?? []

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    const d = new Date(dueDate)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {todos.map((todo: RecentTodo) => (
        <div
          key={todo.rowId}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: PRIORITY_COLORS[todo.priority] ?? '#6b7280' }}
          />
          <span className="flex-1 truncate text-sm">{todo.title}</span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              PRIORITY_BG[todo.priority] ?? 'bg-muted text-muted-foreground'
            }`}
          >
            {todo.priority}
          </span>
          {todo.dueDate && (
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {formatDueDate(todo.dueDate)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
