import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { cn, formatCurrency } from '@/shared/lib'
import {
  useExpenseBudgets,
  useCreateExpenseBudget,
  useDeleteExpenseBudget,
  useExpenseCategories,
  useMonthlySummary,
  useExpenses,
} from '@/features/expense'
import type { ExpenseBudgetFormValues } from '@/entities/expense'
import { Badge } from '@/shared/ui/badge'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

interface BudgetProgressProps {
  year: number
  month: number
}

/** Progress bar color */
function getProgressGradient(percentage: number): string {
  if (percentage > 100) return 'bg-gradient-to-r from-red-400 to-red-600'
  if (percentage > 90) return 'bg-gradient-to-r from-orange-400 to-red-500'
  if (percentage > 70) return 'bg-gradient-to-r from-yellow-400 to-orange-500'
  if (percentage > 50) return 'bg-gradient-to-r from-blue-400 to-yellow-400'
  return 'bg-gradient-to-r from-blue-400 to-blue-500'
}

export const BudgetProgress = ({ year, month }: BudgetProgressProps) => {
  const { t } = useTranslation('expense')
  const { data: budgets } = useExpenseBudgets({ year, month })
  const { data: categories } = useExpenseCategories()
  const { data: summary } = useMonthlySummary(year, month)
  const createBudget = useCreateExpenseBudget()
  const deleteBudget = useDeleteExpenseBudget()

  // Monthly expense data for daily average
  const lastDay = new Date(year, month, 0).getDate()
  const monthStartDate = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const { data: monthExpenses } = useExpenses({ startDate: monthStartDate, endDate: monthEndDate })

  const [showForm, setShowForm] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetCategoryId, setBudgetCategoryId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const totalExpense = summary?.totalExpense ?? 0
  const breakdown = summary?.categoryBreakdown ?? []

  // Days calculation
  const { daysElapsed, daysRemaining } = useMemo(() => {
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
    const today = isCurrentMonth ? now.getDate() : lastDay
    return {
      daysElapsed: today,
      daysRemaining: lastDay - today,
    }
  }, [year, month, lastDay])

  // Category daily average
  const categoryDailyAvg = useMemo(() => {
    if (!monthExpenses || daysElapsed === 0) return new Map<number | null, number>()
    const map = new Map<number | null, number>()
    const totalExp = monthExpenses
      .filter((e) => e.expenseType === 'EXPENSE')
      .reduce((sum, e) => sum + e.amount, 0)
    map.set(null, totalExp / daysElapsed)
    monthExpenses
      .filter((e) => e.expenseType === 'EXPENSE')
      .forEach((e) => {
        map.set(e.categoryRowId, (map.get(e.categoryRowId) ?? 0) + e.amount)
      })
    for (const [key, val] of map.entries()) {
      if (key !== null) map.set(key, val / daysElapsed)
    }
    return map
  }, [monthExpenses, daysElapsed])

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

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteBudget.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }, [showDeleteConfirm, deleteBudget])

  // Separate overall budget from category budgets
  const overallBudget = budgets?.find((b) => b.categoryRowId === null)
  const categoryBudgets = budgets?.filter((b) => b.categoryRowId !== null) ?? []

  // Overall computation
  const overallData = useMemo(() => {
    if (!overallBudget) return null
    const spent = totalExpense
    const percentage = overallBudget.budgetAmount > 0
      ? Math.round((spent / overallBudget.budgetAmount) * 100)
      : 0
    const remaining = overallBudget.budgetAmount - spent
    return { budget: overallBudget, spent, percentage, remaining }
  }, [overallBudget, totalExpense])

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
            {createBudget.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('budget.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!budgets || budgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="mb-4 rounded-full bg-muted/50 p-4">
            <AlertTriangle size={32} className="opacity-30" />
          </div>
          <p className="text-sm font-medium">{t('budget.noBudget')}</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">
            <Plus size={16} className="mr-1" />
            {t('budget.set')}
          </Button>
        </div>
        {budgetFormDialog}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Budget - Circular Progress */}
      {overallData && (
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t('budget.overall')}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteConfirm(overallData.budget.rowId)}
            >
              <Trash2 size={14} />
            </Button>
          </div>

          {/* Circular progress */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative h-40 w-40 sm:h-48 sm:w-48">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-700 ease-out',
                    overallData.percentage > 100
                      ? 'stroke-red-500'
                      : overallData.percentage > 70
                        ? 'stroke-orange-500'
                        : 'stroke-blue-500',
                  )}
                  strokeDasharray={`${Math.min(overallData.percentage, 100) * 2.639} 263.9`}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  'text-2xl sm:text-3xl font-bold tabular-nums',
                  overallData.percentage > 100
                    ? 'text-red-600 dark:text-red-400'
                    : overallData.percentage > 70
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-foreground',
                )}>
                  {overallData.percentage}%
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {overallData.remaining >= 0
                    ? formatCurrency(overallData.remaining)
                    : `+${formatCurrency(Math.abs(overallData.remaining))}`
                  }
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {overallData.remaining >= 0 ? t('budget.remaining') : t('budget.exceeded')}
                </span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">{t('budget.spent')}</p>
              <p className="text-sm font-bold tabular-nums">{formatCurrency(overallData.spent)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">{t('budget.amount')}</p>
              <p className="text-sm font-bold tabular-nums">{formatCurrency(overallData.budget.budgetAmount)}</p>
            </div>
          </div>

          {/* Daily average info */}
          {daysRemaining > 0 && (
            <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t('budget.dailyAvg')}: {formatCurrency(Math.round(categoryDailyAvg.get(null) ?? 0))}</span>
                <span>{t('budget.daysRemaining', { days: daysRemaining })}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Budgets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-medium">{t('budget.categoryBudget')}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} className="mr-1" />
            {t('budget.addBudget')}
          </Button>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t('budget.noCategoryBudgets')}
          </div>
        ) : (
          <div className="space-y-2">
            {categoryBudgets.map((budget) => {
              const catSpend = breakdown.find((b) => b.categoryRowId === budget.categoryRowId)?.totalAmount ?? 0
              const percentage = budget.budgetAmount > 0 ? (catSpend / budget.budgetAmount) * 100 : 0
              const isExceeded = percentage > 100
              const isWarning = percentage > 70 && percentage <= 100
              const isDanger = percentage > 90 && percentage <= 100
              const catName = categories?.find((c) => c.rowId === budget.categoryRowId)?.categoryName ?? ''
              const dailyAvg = categoryDailyAvg.get(budget.categoryRowId ?? null) ?? 0
              const projectedTotal = catSpend + dailyAvg * daysRemaining
              const projectedExceed = projectedTotal > budget.budgetAmount && !isExceeded

              return (
                <div key={budget.rowId} className="rounded-xl border bg-card p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{catName}</span>
                      {isExceeded && (
                        <Badge variant="destructive" className="gap-0.5 px-1.5 py-0 text-[10px]">
                          <AlertCircle size={9} />
                          {t('budget.exceeded')}
                        </Badge>
                      )}
                      {isDanger && !isExceeded && (
                        <Badge className="gap-0.5 bg-red-100 px-1.5 py-0 text-[10px] text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle size={9} />
                          {t('budget.danger')}
                        </Badge>
                      )}
                      {isWarning && !isDanger && (
                        <Badge className="gap-0.5 bg-orange-100 px-1.5 py-0 text-[10px] text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                          <AlertTriangle size={9} />
                          {t('budget.warning')}
                        </Badge>
                      )}
                      {projectedExceed && !isWarning && !isDanger && (
                        <Badge className="gap-0.5 bg-yellow-100 px-1.5 py-0 text-[10px] text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <AlertTriangle size={9} />
                          {t('budget.projectedExceed')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        'text-xs font-medium tabular-nums',
                        isExceeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                      )}>
                        {formatCurrency(catSpend)} / {formatCurrency(budget.budgetAmount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(budget.rowId)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        getProgressGradient(percentage),
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Percentage + remaining */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className={cn(
                      'font-bold tabular-nums',
                      isExceeded ? 'text-red-600 dark:text-red-400'
                        : isDanger ? 'text-red-500'
                        : isWarning ? 'text-orange-500'
                        : 'text-blue-600 dark:text-blue-400',
                    )}>
                      {Math.round(percentage)}%
                    </span>
                    {!isExceeded && (
                      <span className="text-muted-foreground tabular-nums">
                        {t('budget.remaining')}: {formatCurrency(budget.budgetAmount - catSpend)}
                      </span>
                    )}
                    {isExceeded && (
                      <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
                        +{formatCurrency(catSpend - budget.budgetAmount)} {t('budget.exceeded')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {budgetFormDialog}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('budget.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('budget.deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteBudget.isPending}>
              {deleteBudget.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
