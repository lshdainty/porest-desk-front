import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, Pin } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard'

export const MemoQuickWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  const summary = data?.memoSummary

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <FileText size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('memo.title')}</h3>
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
                <p className="text-[10px] text-muted-foreground">{t('memo.total')}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Pin size={12} className="text-muted-foreground" />
                  <p className="text-lg font-bold">{summary.pinnedCount}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{t('memo.pinned')}</p>
              </div>
            </div>

            <div className="rounded-md border p-2">
              <p className="text-[10px] text-muted-foreground">{t('memo.recent')}</p>
              <p className="truncate text-sm font-medium">
                {summary.recentMemoTitle ?? t('memo.noRecent')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => navigate('/desk/memo')}
        className="flex items-center justify-center gap-1 border-t p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {t('viewAll')}
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
