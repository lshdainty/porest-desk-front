import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/shared/hooks'
import { MonthlyBudgetChart } from './MonthlyBudgetChart'
import { BudgetVsActualChart } from './BudgetVsActualChart'
import type { ExpenseBudget, CategoryBreakdown, ExpenseCategory } from '@/entities/expense'

interface SectionBudgetProps {
  budgets: ExpenseBudget[]
  categoryBreakdown: CategoryBreakdown[]
  categoryNames: Record<number, string>
  categories?: ExpenseCategory[]
}

export const SectionBudget = ({
  budgets,
  categoryBreakdown,
  categoryNames,
  categories,
}: SectionBudgetProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()

  return (
    <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('stats.budgetGauge')}</h3>
        <MonthlyBudgetChart
          budgets={budgets}
          categoryBreakdown={categoryBreakdown}
          categoryNames={categoryNames}
          categories={categories}
        />
      </div>
      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('stats.budgetVsActual')}</h3>
        <BudgetVsActualChart
          budgets={budgets}
          categoryBreakdown={categoryBreakdown}
          categoryNames={categoryNames}
        />
      </div>
    </div>
  )
}
