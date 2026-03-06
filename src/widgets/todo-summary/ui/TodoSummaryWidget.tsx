import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useDashboardSummary } from '@/features/dashboard'

export const TodoSummaryWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  const summary = data?.todoSummary
  const completionRate = summary && summary.totalCount > 0
    ? Math.round((summary.completedCount / summary.totalCount) * 100)
    : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <CheckSquare size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('todo.title')}</h3>
      </div>

      <div className="flex-1 p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{summary.totalCount}</p>
                <p className="text-[10px] text-muted-foreground">{t('todo.total')}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold text-orange-500">{summary.todayDueCount}</p>
                <p className="text-[10px] text-muted-foreground">{t('todo.todayDue')}</p>
              </div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('todo.pending')}: {summary.pendingCount}</span>
              <span>{t('todo.inProgress')}: {summary.inProgressCount}</span>
              <span>{t('todo.completed')}: {summary.completedCount}</span>
            </div>

            {(summary.noteCount ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground">
                <span>{t('todo.notes')}: {summary.noteCount}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('todo.completionRate')}</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => navigate('/desk/todo')}
        className="flex items-center justify-center gap-1 border-t p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {t('viewAll')}
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
