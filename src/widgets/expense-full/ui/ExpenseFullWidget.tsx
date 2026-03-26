import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, X, Loader2, TrendingDown, TrendingUp, FileDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useExpenses,
  useSearchExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenseBudgets,
  useMonthlySummary,
} from '@/features/expense'
import type { ExpenseSearchParams } from '@/features/expense'
import { useAssets } from '@/features/asset'
import type { Expense, ExpenseFormValues } from '@/entities/expense'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { ExpenseFilterBar } from './ExpenseFilterBar'
import { ExpenseCategoryManager } from './ExpenseCategoryManager'
import { QuickAddBar } from './QuickAddBar'
import { MonthlySummaryCard } from './MonthlySummary'
import { SummaryDashboard } from './summary/SummaryDashboard'
import { BudgetProgress } from './BudgetProgress'
import { ExpenseTemplateList } from './ExpenseTemplateList'
import { RecurringTransactionList } from './RecurringTransactionList'

type TabType = 'transactions' | 'analysis' | 'budget' | 'settings'
type SettingsSubTab = 'template' | 'recurring' | 'category'

export const ExpenseFullWidget = () => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState<TabType>('transactions')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('template')
  const [searchFilters, setSearchFilters] = useState<ExpenseSearchParams>({})
  const [fabOpen, setFabOpen] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  const baseYear = now.getFullYear()
  const baseMonth = now.getMonth() + 1

  // Compute current view month from offset
  const currentViewMonth = useMemo(() => {
    let y = baseYear
    let m = baseMonth + monthOffset
    while (m > 12) { m -= 12; y++ }
    while (m < 1) { m += 12; y-- }
    return { year: y, month: m }
  }, [baseYear, baseMonth, monthOffset])

  const isSearchMode = useMemo(
    () => Object.values(searchFilters).some((v) => v !== undefined && v !== ''),
    [searchFilters],
  )

  const { data: expenses, isLoading } = useExpenses()
  const { data: searchResults, isLoading: isSearchLoading } = useSearchExpenses(searchFilters)
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  // Budget summary for the overview bar
  const { data: budgets } = useExpenseBudgets({ year: currentViewMonth.year, month: currentViewMonth.month })
  const { data: monthlySummary } = useMonthlySummary(currentViewMonth.year, currentViewMonth.month)

  const budgetSummary = useMemo(() => {
    if (!budgets?.length) return null
    // Find overall budget (categoryRowId === null)
    const overallBudget = budgets.find((b) => b.categoryRowId === null)
    if (!overallBudget) {
      // Fallback: sum all budgets
      const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
      const totalExpense = monthlySummary?.totalExpense ?? 0
      const percentage = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0
      const remaining = totalBudget - totalExpense
      // Calculate days remaining
      const lastDay = new Date(currentViewMonth.year, currentViewMonth.month, 0).getDate()
      const isCurrentMonth = now.getFullYear() === currentViewMonth.year && now.getMonth() + 1 === currentViewMonth.month
      const today = isCurrentMonth ? now.getDate() : lastDay
      const daysRemaining = Math.max(0, lastDay - today)
      const perDay = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0
      return { totalBudget, totalExpense, percentage, remaining, daysRemaining, perDay }
    }
    const totalExpense = monthlySummary?.totalExpense ?? 0
    const percentage = overallBudget.budgetAmount > 0 ? Math.round((totalExpense / overallBudget.budgetAmount) * 100) : 0
    const remaining = overallBudget.budgetAmount - totalExpense
    const lastDay = new Date(currentViewMonth.year, currentViewMonth.month, 0).getDate()
    const isCurrentMonth = now.getFullYear() === currentViewMonth.year && now.getMonth() + 1 === currentViewMonth.month
    const today = isCurrentMonth ? now.getDate() : lastDay
    const daysRemaining = Math.max(0, lastDay - today)
    const perDay = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0
    return { totalBudget: overallBudget.budgetAmount, totalExpense, percentage, remaining, daysRemaining, perDay }
  }, [budgets, monthlySummary, currentViewMonth, now])

  // Recent merchants
  const recentMerchants = useMemo(() => {
    if (!expenses) return []
    const freq = new Map<string, number>()
    expenses.forEach((e) => {
      if (e.merchant) freq.set(e.merchant, (freq.get(e.merchant) ?? 0) + 1)
    })
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m)
  }, [expenses])

  const [formDefaults, setFormDefaults] = useState<Partial<ExpenseFormValues>>({})

  const handleCreate = useCallback((data: ExpenseFormValues) => {
    createExpense.mutate(data, {
      onSuccess: () => {
        setShowForm(false)
        setFormDefaults({})
      },
    })
  }, [createExpense])

  const handleQuickCreate = useCallback((data: ExpenseFormValues) => {
    createExpense.mutate(data)
  }, [createExpense])

  const handleOpenFullForm = useCallback((partial: Partial<ExpenseFormValues>) => {
    setFormDefaults(partial)
    setEditingExpense(null)
    setShowForm(true)
  }, [])

  const handleUpdate = useCallback((data: ExpenseFormValues) => {
    if (!editingExpense) return
    updateExpense.mutate(
      { id: editingExpense.rowId, data },
      {
        onSuccess: () => {
          setEditingExpense(null)
          setShowForm(false)
        },
      }
    )
  }, [editingExpense, updateExpense])

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setShowDeleteConfirm(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteExpense.mutate(showDeleteConfirm, {
      onSuccess: () => {
        setShowDeleteConfirm(null)
      },
    })
  }, [showDeleteConfirm, deleteExpense])

  const handleNavigateToList = useCallback((categoryId?: number) => {
    if (categoryId) {
      setSearchFilters({ categoryId })
    }
    setActiveTab('transactions')
  }, [])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingExpense(null)
  }, [])

  const handleFormSubmit = useCallback((data: ExpenseFormValues) => {
    if (editingExpense) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingExpense, handleUpdate, handleCreate])

  const tabs: { key: TabType; label: string }[] = [
    { key: 'transactions', label: t('transactions') },
    { key: 'analysis', label: t('analysis') },
    { key: 'budget', label: t('budget') },
    { key: 'settings', label: t('settings') },
  ]

  const settingsSubTabs: { key: SettingsSubTab; label: string }[] = [
    { key: 'template', label: t('template') },
    { key: 'recurring', label: t('recurring') },
    { key: 'category', label: t('categories') },
  ]

  // Budget bar gradient
  const budgetBarGradient = useMemo(() => {
    if (!budgetSummary) return ''
    const p = budgetSummary.percentage
    if (p > 100) return 'bg-gradient-to-r from-red-400 to-red-600'
    if (p > 90) return 'bg-gradient-to-r from-orange-400 to-red-500'
    if (p > 70) return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    return 'bg-gradient-to-r from-blue-400 to-blue-600'
  }, [budgetSummary])

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 pb-4">

          {/* 1. Month Navigator */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonthOffset((prev) => prev - 1)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setMonthOffset(0)}
              className="rounded-lg px-4 py-1.5 text-center hover:bg-muted/50 transition-colors"
            >
              <p className="text-lg font-bold tracking-tight">
                {currentViewMonth.year}년 {currentViewMonth.month}월
              </p>
              {monthOffset !== 0 && (
                <p className="text-[10px] text-muted-foreground">탭하여 이번 달로</p>
              )}
            </button>
            <button
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 2. KPI Summary Cards */}
          <MonthlySummaryCard year={currentViewMonth.year} month={currentViewMonth.month} />

          {/* 3. Budget Progress Bar (overview) */}
          {budgetSummary && (
            <button
              onClick={() => setActiveTab('budget')}
              className="w-full rounded-xl border bg-card p-3 sm:p-4 text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{t('budget.overall')}</span>
                <span className={cn(
                  'text-xs font-bold tabular-nums',
                  budgetSummary.percentage > 100 ? 'text-red-600 dark:text-red-400'
                    : budgetSummary.percentage > 70 ? 'text-orange-600 dark:text-orange-400'
                    : 'text-blue-600 dark:text-blue-400',
                )}>
                  {budgetSummary.percentage}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all duration-700 ease-out', budgetBarGradient)}
                  style={{ width: `${Math.min(budgetSummary.percentage, 100)}%` }}
                />
              </div>
              {/* Details row */}
              <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {t('budget.spent')} {formatCurrency(budgetSummary.totalExpense)} / {formatCurrency(budgetSummary.totalBudget)}
                </span>
                {budgetSummary.remaining >= 0 && budgetSummary.daysRemaining > 0 && (
                  <span className="tabular-nums">
                    {t('budget.perDay')} {formatCurrency(Math.max(0, budgetSummary.perDay))}
                  </span>
                )}
                {budgetSummary.remaining < 0 && (
                  <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
                    +{formatCurrency(Math.abs(budgetSummary.remaining))} {t('budget.exceeded')}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* 4. Quick Add Bar */}
          <QuickAddBar
            categories={categories || []}
            expenses={expenses || []}
            onCreateExpense={handleQuickCreate}
            onOpenFullForm={handleOpenFullForm}
            isLoading={createExpense.isPending}
          />

          {/* 5. Tab Navigation */}
          <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-1 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center rounded-xl border bg-muted/30 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all',
                    activeTab === tab.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Tab Content */}
          <div className="min-h-[300px]">
            {/* Transactions tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-3">
                <ExpenseFilterBar
                  categories={categories || []}
                  assets={assets?.assets || []}
                  filters={searchFilters}
                  onFiltersChange={setSearchFilters}
                  onClear={() => setSearchFilters({})}
                />

                {isSearchMode && searchResults && (
                  <p className="text-xs text-muted-foreground">
                    {t('searchResults', { count: searchResults.length })}
                  </p>
                )}

                {(isSearchMode ? isSearchLoading : isLoading) ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ExpenseList
                    expenses={(isSearchMode ? searchResults : expenses) || []}
                    categories={categories || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={() => setShowForm(true)}
                    viewYear={currentViewMonth.year}
                    viewMonth={currentViewMonth.month}
                  />
                )}

                {!isMobile && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Plus size={16} />
                    {t('addTransaction')}
                  </button>
                )}
              </div>
            )}

            {/* Analysis tab */}
            {activeTab === 'analysis' && (
              <SummaryDashboard
                year={currentViewMonth.year}
                month={currentViewMonth.month}
                onNavigateToList={handleNavigateToList}
              />
            )}

            {/* Budget tab */}
            {activeTab === 'budget' && (
              <BudgetProgress year={currentViewMonth.year} month={currentViewMonth.month} />
            )}

            {/* Settings tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="flex gap-1">
                  {settingsSubTabs.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setSettingsSubTab(sub.key)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        settingsSubTab === sub.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
                {settingsSubTab === 'template' && <ExpenseTemplateList />}
                {settingsSubTab === 'recurring' && <RecurringTransactionList />}
                {settingsSubTab === 'category' && <ExpenseCategoryManager />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile SpeedDial FAB */}
      {isMobile && (
        <>
          {fabOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setFabOpen(false)}
            />
          )}

          {fabOpen && (
            <div className="fixed bottom-36 right-4 z-40 flex flex-col items-end gap-2">
              <button
                onClick={() => {
                  setFabOpen(false)
                  setFormDefaults({ expenseType: 'EXPENSE' })
                  setEditingExpense(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-2 rounded-full bg-red-500 pl-3 pr-4 py-2.5 text-white shadow-lg active:scale-95 transition-all"
              >
                <TrendingDown size={16} />
                <span className="text-sm font-medium">{t('expense')}</span>
              </button>
              <button
                onClick={() => {
                  setFabOpen(false)
                  setFormDefaults({ expenseType: 'INCOME' })
                  setEditingExpense(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-2 rounded-full bg-emerald-500 pl-3 pr-4 py-2.5 text-white shadow-lg active:scale-95 transition-all"
              >
                <TrendingUp size={16} />
                <span className="text-sm font-medium">{t('income')}</span>
              </button>
              <button
                onClick={() => {
                  setFabOpen(false)
                  setFormDefaults({})
                  setEditingExpense(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-2 rounded-full bg-blue-500 pl-3 pr-4 py-2.5 text-white shadow-lg active:scale-95 transition-all"
              >
                <FileDown size={16} />
                <span className="text-sm font-medium">{t('loadFromTemplate')}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
              'rounded-full bg-primary text-primary-foreground shadow-lg',
              'hover:bg-primary/90 active:scale-95 transition-all',
              fabOpen && 'rotate-45',
            )}
          >
            {fabOpen ? <X size={24} /> : <Plus size={24} />}
          </button>
        </>
      )}

      {/* Expense form */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories || []}
          assets={assets?.assets || []}
          defaultValues={formDefaults}
          recentMerchants={recentMerchants}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createExpense.isPending || updateExpense.isPending}
        />
      )}

      {/* Delete confirmation modal */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>
              {t('deleteConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteExpense.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
