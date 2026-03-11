import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Wallet, ArrowRight } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useDashboardSummary } from '@/features/dashboard'

export const ExpenseSummaryWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  const summary = data?.expenseSummary
  const monthlyNet = summary ? summary.monthlyIncome - summary.monthlyExpense : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Wallet size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('expense.title')}</h3>
      </div>

      <div className="flex-1 p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-950/30">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.todayIncome)}</p>
                <p className="text-[10px] text-muted-foreground">{t('expense.todayIncome')}</p>
              </div>
              <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-950/30">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.todayExpense)}</p>
                <p className="text-[10px] text-muted-foreground">{t('expense.todayExpense')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.monthlyIncome)}</p>
                <p className="text-[10px] text-muted-foreground">{t('expense.monthlyIncome')}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.monthlyExpense)}</p>
                <p className="text-[10px] text-muted-foreground">{t('expense.monthlyExpense')}</p>
              </div>
            </div>

            <div className="rounded-md border p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{t('expense.net')}</p>
              <p className={cn(
                'text-sm font-bold',
                monthlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => navigate('/desk/expense')}
        className="flex items-center justify-center gap-1 border-t p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {t('viewAll')}
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
