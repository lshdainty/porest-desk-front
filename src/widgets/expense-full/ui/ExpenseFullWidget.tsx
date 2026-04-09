import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, X, Loader2, TrendingDown, TrendingUp, FileDown,
  ChevronLeft, ChevronRight, Wallet,
} from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { HeroStatCard } from '@/shared/ui/hero-stat-card'
import { BudgetRing } from '@/shared/ui/budget-ring'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
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

  // Previous month summary for hero delta (this month vs last month)
  const prevViewMonth = useMemo(() => {
    const m = currentViewMonth.month - 1
    return m < 1
      ? { year: currentViewMonth.year - 1, month: 12 }
      : { year: currentViewMonth.year, month: m }
  }, [currentViewMonth])
  const { data: prevMonthlySummary } = useMonthlySummary(prevViewMonth.year, prevViewMonth.month)

  const heroExpenseDelta = useMemo(() => {
    const curr = monthlySummary?.totalExpense ?? 0
    const prev = prevMonthlySummary?.totalExpense ?? 0
    if (prev === 0) return curr > 0 ? 100 : null
    return Math.round(((curr - prev) / prev) * 100)
  }, [monthlySummary, prevMonthlySummary])

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

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 pb-4">

          {/* 1. Hero — current month expense + budget ring (+ month nav header-right) */}
          <HeroStatCard
            tone="brand"
            icon={Wallet}
            label={t('totalExpense')}
            value={formatCurrency(monthlySummary?.totalExpense ?? 0)}
            delta={heroExpenseDelta}
            isPositiveGood={false}
            headerRight={
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setMonthOffset(0)}
                  className="rounded-md px-2 py-1 text-xs font-semibold tracking-tight hover:bg-muted/50 transition-colors tabular-nums"
                >
                  {currentViewMonth.year}.{String(currentViewMonth.month).padStart(2, '0')}
                </button>
                <button
                  onClick={() => setMonthOffset((prev) => prev + 1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            }
            footer={
              budgetSummary ? (
                <span className="tabular-nums">
                  {t('budget.spent')} {formatCurrency(budgetSummary.totalExpense)} / {formatCurrency(budgetSummary.totalBudget)}
                </span>
              ) : undefined
            }
          />

          {/* 2. Budget Ring + 2 secondary KPI cards */}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            {budgetSummary ? (
              <BudgetRing
                percentage={budgetSummary.percentage}
                label={t('budget.overall')}
                totalBudget={formatCurrency(budgetSummary.totalBudget)}
                spent={formatCurrency(budgetSummary.totalExpense)}
                remaining={
                  budgetSummary.remaining >= 0
                    ? `${t('budget.remaining')} ${formatCurrency(budgetSummary.remaining)}`
                    : `+${formatCurrency(Math.abs(budgetSummary.remaining))} ${t('budget.exceeded')}`
                }
                isOverBudget={budgetSummary.remaining < 0}
                perDay={
                  budgetSummary.daysRemaining > 0
                    ? `${t('budget.perDay')} ${formatCurrency(Math.max(0, budgetSummary.perDay))}`
                    : undefined
                }
                onClick={() => setActiveTab('budget')}
              />
            ) : (
              <button
                onClick={() => setActiveTab('budget')}
                className="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                + {t('budget.set')}
              </button>
            )}

            <MonthlySummaryCard year={currentViewMonth.year} month={currentViewMonth.month} />
          </div>

          {/* 3. Quick Add Bar */}
          <QuickAddBar
            categories={categories || []}
            expenses={expenses || []}
            onCreateExpense={handleQuickCreate}
            onOpenFullForm={handleOpenFullForm}
            isLoading={createExpense.isPending}
          />

          {/* 4. Tab Navigation */}
          <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-1 bg-background/95 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              <TabsList className="h-auto w-full rounded-xl border bg-muted/30 p-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
