import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn, formatCurrency } from '@/shared/lib'
import {
  useExpenseBudgets,
  useCreateExpenseBudget,
  useDeleteExpenseBudget,
  useExpenseCategories,
  useMonthlySummary,
} from '@/features/expense'
import type { ExpenseBudgetFormValues } from '@/entities/expense'

interface BudgetProgressProps {
  year: number
  month: number
}

export const BudgetProgress = ({ year, month }: BudgetProgressProps) => {
  const { t } = useTranslation('expense')
  const { data: budgets } = useExpenseBudgets({ year, month })
  const { data: categories } = useExpenseCategories()
  const { data: summary } = useMonthlySummary(year, month)
  const createBudget = useCreateExpenseBudget()
  const deleteBudget = useDeleteExpenseBudget()

  const [showForm, setShowForm] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetCategoryId, setBudgetCategoryId] = useState<number | null>(null)

  const totalExpense = summary?.totalExpense ?? 0
  const breakdown = summary?.categoryBreakdown ?? []

  const handleSubmit = useCallback(() => {
    if (!budgetAmount) return
    const data: ExpenseBudgetFormValues = {
      categoryRowId: budgetCategoryId,
      budgetAmount: parseFloat(budgetAmount),
      budgetYear: year,
      budgetMonth: month,
    }
    createBudget.mutate(data, {
      onSuccess: () => {
        setShowForm(false)
        setBudgetAmount('')
        setBudgetCategoryId(null)
      },
    })
  }, [budgetAmount, budgetCategoryId, year, month, createBudget])

  if (!budgets || budgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">{t('budget.noBudget')}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('budget.set')}
          </button>
        </div>

        {showForm && renderBudgetForm()}
      </div>
    )
  }

  function renderBudgetForm() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={() => setShowForm(false)}
      >
        <div
          className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-4 text-lg font-semibold">{t('budget.set')}</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('category')}</label>
              <select
                value={budgetCategoryId ?? ''}
                onChange={(e) => setBudgetCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Overall</option>
                {categories
                  ?.filter((c) => c.expenseType === 'EXPENSE')
                  .map((cat) => (
                    <option key={cat.rowId} value={cat.rowId}>
                      {cat.categoryName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('budget.amount')}</label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!budgetAmount || createBudget.isPending}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createBudget.isPending ? '...' : t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('budget.title')}</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus size={12} />
          {t('budget.set')}
        </button>
      </div>

      {budgets.map((budget) => {
        const catSpend = budget.categoryRowId
          ? breakdown.find((b) => b.categoryRowId === budget.categoryRowId)?.totalAmount ?? 0
          : totalExpense
        const percentage = budget.budgetAmount > 0 ? (catSpend / budget.budgetAmount) * 100 : 0
        const isExceeded = percentage > 100
        const catName = budget.categoryRowId
          ? categories?.find((c) => c.rowId === budget.categoryRowId)?.categoryName ?? ''
          : 'Overall'

        return (
          <div key={budget.rowId} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{catName}</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs', isExceeded ? 'text-red-600 font-bold' : 'text-muted-foreground')}>
                  {formatCurrency(catSpend)} / {formatCurrency(budget.budgetAmount)}
                </span>
                <button
                  onClick={() => deleteBudget.mutate(budget.rowId)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isExceeded ? 'bg-red-500' : 'bg-primary'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {isExceeded && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {t('budget.exceeded')} ({Math.round(percentage - 100)}%)
              </p>
            )}
            {!isExceeded && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('budget.remaining')}: {formatCurrency(budget.budgetAmount - catSpend)}
              </p>
            )}
          </div>
        )
      })}

      {showForm && renderBudgetForm()}
    </div>
  )
}
