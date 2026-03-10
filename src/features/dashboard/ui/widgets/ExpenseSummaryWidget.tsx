import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wallet } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const ExpenseSummaryWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
      </div>
    )
  }

  const { expenseSummary } = data
  const net = expenseSummary.monthlyIncome - expenseSummary.monthlyExpense
  const isPositiveNet = net >= 0

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-accent-red" />
          <h3 className="font-semibold">{t('expense.title')}</h3>
        </div>
        <button
          onClick={() => navigate('/desk/expense')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-3 flex-1 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('expense.todayLabel')}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-accent-green">+ {formatCurrency(expenseSummary.todayIncome)}</span>
            <span className="text-accent-red">- {formatCurrency(expenseSummary.todayExpense)}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{t('expense.monthly')}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-accent-green">+ {formatCurrency(expenseSummary.monthlyIncome)}</span>
            <span className="text-accent-red">- {formatCurrency(expenseSummary.monthlyExpense)}</span>
          </div>
        </div>

        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">{t('expense.net')}</p>
          <p className={`text-lg font-bold ${isPositiveNet ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositiveNet ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>
      </div>
    </div>
  )
}
