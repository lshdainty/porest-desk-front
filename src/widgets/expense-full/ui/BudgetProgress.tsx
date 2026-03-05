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
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'

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

  const budgetFormDialog = (
    <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false) }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('budget.set')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t('category')}</Label>
            <Select
              value={budgetCategoryId !== null ? String(budgetCategoryId) : '__none__'}
              onValueChange={(value) => setBudgetCategoryId(value === '__none__' ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Overall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Overall</SelectItem>
                {categories
                  ?.filter((c) => c.expenseType === 'EXPENSE')
                  .map((cat) => (
                    <SelectItem key={cat.rowId} value={String(cat.rowId)}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('budget.amount')}</Label>
            <Input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            {t('deleteConfirm.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!budgetAmount || createBudget.isPending}
          >
            {createBudget.isPending ? '...' : t('budget.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!budgets || budgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">{t('budget.noBudget')}</p>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-3"
          >
            {t('budget.set')}
          </Button>
        </div>

        {budgetFormDialog}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteBudget.mutate(budget.rowId)}
                >
                  <Trash2 size={12} />
                </Button>
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

      {budgetFormDialog}
    </div>
  )
}
