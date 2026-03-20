import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckSquare } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

export const TodoSummaryWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const { todoSummary } = data
  const completionRate = todoSummary.totalCount > 0
    ? Math.round((todoSummary.completedCount / todoSummary.totalCount) * 100)
    : 0

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-accent-blue" />
          <h3 className="font-semibold">{t('todo.title')}</h3>
        </div>
        <button
          onClick={() => navigate('/desk/todo')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-3 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{todoSummary.completedCount}</span>
          <span className="text-sm text-muted-foreground">/ {todoSummary.totalCount}</span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent-blue transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{completionRate}% {t('todo.completed')}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="font-semibold">{todoSummary.pendingCount}</p>
            <p className="text-muted-foreground">{t('todo.pending')}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="font-semibold">{todoSummary.inProgressCount}</p>
            <p className="text-muted-foreground">{t('todo.inProgress')}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="font-semibold">{todoSummary.completedCount}</p>
            <p className="text-muted-foreground">{t('todo.completed')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
