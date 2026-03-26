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

/** 진행률에 따른 색상 클래스 반환 */
function getProgressColor(percentage: number): string {
  if (percentage > 100) return 'bg-red-500'
  if (percentage > 90) return 'bg-red-400'
  if (percentage > 70) return 'bg-orange-400'
  if (percentage > 50) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

/** 진행률에 따른 배경 그라디언트 */
function getProgressGradient(percentage: number): string {
  if (percentage > 100) return 'bg-gradient-to-r from-red-400 to-red-600'
  if (percentage > 90) return 'bg-gradient-to-r from-orange-400 to-red-500'
  if (percentage > 70) return 'bg-gradient-to-r from-yellow-400 to-orange-500'
  if (percentage > 50) return 'bg-gradient-to-r from-emerald-400 to-yellow-400'
  return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
}

export const BudgetProgress = ({ year, month }: BudgetProgressProps) => {
  const { t } = useTranslation('expense')
  const { data: budgets } = useExpenseBudgets({ year, month })
  const { data: categories } = useExpenseCategories()
  const { data: summary } = useMonthlySummary(year, month)
  const createBudget = useCreateExpenseBudget()
  const deleteBudget = useDeleteExpenseBudget()

  // 해당 월 거래 데이터 (일평균 계산용)
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

  // 남은 일수 및 일평균 계산
  const { daysElapsed, daysRemaining } = useMemo(() => {
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
    const today = isCurrentMonth ? now.getDate() : lastDay
    return {
      daysElapsed: today,
      daysRemaining: lastDay - today,
    }
  }, [year, month, lastDay])

  // 카테고리별 일평균 지출 계산
  const categoryDailyAvg = useMemo(() => {
    if (!monthExpenses || daysElapsed === 0) return new Map<number | null, number>()
    const map = new Map<number | null, number>()

    // 전체(Overall) 계산
    const totalExp = monthExpenses
      .filter((e) => e.expenseType === 'EXPENSE')
      .reduce((sum, e) => sum + e.amount, 0)
    map.set(null, totalExp / daysElapsed)

    // 카테고리별 계산
    monthExpenses
      .filter((e) => e.expenseType === 'EXPENSE')
      .forEach((e) => {
        map.set(e.categoryRowId, (map.get(e.categoryRowId) ?? 0) + e.amount)
      })

    // 일평균으로 변환
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 고정: 헤더 */}
      <div className="shrink-0">
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
      </div>

      {/* 스크롤: 예산 아이템 */}
      <div className="mt-4 space-y-4 min-h-0 flex-1 overflow-y-auto">
        {budgets.map((budget) => {
          const catSpend = budget.categoryRowId
            ? breakdown.find((b) => b.categoryRowId === budget.categoryRowId)?.totalAmount ?? 0
            : totalExpense
          const percentage = budget.budgetAmount > 0 ? (catSpend / budget.budgetAmount) * 100 : 0
          const isExceeded = percentage > 100
          const isWarning = percentage > 70 && percentage <= 100
          const isDanger = percentage > 90 && percentage <= 100
          const catName = budget.categoryRowId
            ? categories?.find((c) => c.rowId === budget.categoryRowId)?.categoryName ?? ''
            : 'Overall'

          // 월말 예상 지출 계산
          const dailyAvg = categoryDailyAvg.get(budget.categoryRowId ?? null) ?? 0
          const projectedTotal = catSpend + dailyAvg * daysRemaining
          const projectedExceed = projectedTotal > budget.budgetAmount && !isExceeded

          return (
            <div key={budget.rowId} className="rounded-lg border p-3">
              {/* 헤더: 카테고리명 + 경고 배지 + 금액 */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{catName}</span>
                  {isExceeded && (
                    <Badge variant="destructive" className="gap-1 px-1.5 py-0 text-[10px]">
                      <AlertCircle size={10} />
                      {t('budget.exceeded')}
                    </Badge>
                  )}
                  {isDanger && !isExceeded && (
                    <Badge className="gap-1 bg-red-100 px-1.5 py-0 text-[10px] text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                      <AlertCircle size={10} />
                      {t('budget.danger')}
                    </Badge>
                  )}
                  {isWarning && !isDanger && (
                    <Badge className="gap-1 bg-orange-100 px-1.5 py-0 text-[10px] text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                      <AlertTriangle size={10} />
                      {t('budget.warning')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium tabular-nums', isExceeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                    {formatCurrency(catSpend)} / {formatCurrency(budget.budgetAmount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(budget.rowId)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* 진행률 바 (그라디언트) */}
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getProgressGradient(percentage),
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
                {/* 70%, 90% 마커 */}
                <div className="absolute top-0 h-full w-px bg-muted-foreground/20" style={{ left: '70%' }} />
                <div className="absolute top-0 h-full w-px bg-muted-foreground/30" style={{ left: '90%' }} />
              </div>

              {/* 퍼센트 표시 */}
              <div className="mt-1.5 flex items-center justify-between">
                <span className={cn(
                  'text-xs font-bold tabular-nums',
                  isExceeded
                    ? 'text-red-600 dark:text-red-400'
                    : isDanger
                      ? 'text-red-500'
                      : isWarning
                        ? 'text-orange-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {Math.round(percentage)}%
                </span>
                {!isExceeded && (
                  <span className="text-xs text-muted-foreground">
                    {t('budget.remaining')}: {formatCurrency(budget.budgetAmount - catSpend)}
                  </span>
                )}
                {isExceeded && (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    +{formatCurrency(catSpend - budget.budgetAmount)} {t('budget.exceeded')}
                  </span>
                )}
              </div>

              {/* 예상 지출 & 일평균 (남은 일수가 있을 때만) */}
              {daysRemaining > 0 && dailyAvg > 0 && (
                <div className={cn(
                  'mt-2 rounded-md px-2.5 py-1.5 text-xs',
                  projectedExceed
                    ? 'bg-orange-50 dark:bg-orange-950/20'
                    : 'bg-muted/50',
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('budget.dailyAvg')}: {formatCurrency(Math.round(dailyAvg))}
                    </span>
                    <span className="text-muted-foreground">
                      {t('budget.daysRemaining', { days: daysRemaining })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t('budget.projectedAmount')}:
                    </span>
                    <span className={cn(
                      'font-medium tabular-nums',
                      projectedExceed ? 'text-orange-600 dark:text-orange-400' : 'text-foreground',
                    )}>
                      {formatCurrency(Math.round(projectedTotal))}
                      {projectedExceed && (
                        <span className="ml-1 text-orange-500">
                          ({t('budget.projectedExceed')})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
