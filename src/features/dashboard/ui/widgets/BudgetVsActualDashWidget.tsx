import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useYearlySummary, useExpenseBudgets, useExpenseCategories } from '@/features/expense'
import { BudgetVsActualChart } from '@/widgets/expense-full/ui/summary/BudgetVsActualChart'

export const BudgetVsActualDashWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: yearData, isLoading: loadingYear } = useYearlySummary(year)
  const { data: budgets, isLoading: loadingBudgets } = useExpenseBudgets({ year, month })
  const { data: categories } = useExpenseCategories()

  const categoryNames = useMemo(() => {
    const map: Record<number, string> = {}
    categories?.forEach((c) => {
      map[c.rowId] = c.categoryName
    })
    return map
  }, [categories])

  const currentMonthBreakdown = useMemo(() => {
    if (!yearData?.monthlyAmounts) return []
    const current = yearData.monthlyAmounts.find((m) => m.month === month)
    return current?.categoryBreakdown ?? []
  }, [yearData, month])

  if (loadingYear || loadingBudgets) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <BudgetVsActualChart
        budgets={budgets}
        categoryBreakdown={currentMonthBreakdown}
        categoryNames={categoryNames}
      />
    </div>
  )
}
