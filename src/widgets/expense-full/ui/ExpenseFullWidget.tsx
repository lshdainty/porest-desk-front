import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Settings } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
} from '@/features/expense'
import { useAssets } from '@/features/asset'
import type { Expense, ExpenseFormValues } from '@/entities/expense'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { ExpenseCategoryManager } from './ExpenseCategoryManager'
import { DailySummaryCard } from './DailySummary'
import { SummaryDashboard } from './summary/SummaryDashboard'
import { BudgetProgress } from './BudgetProgress'
import { ExpenseTemplateList } from './ExpenseTemplateList'
import { RecurringTransactionList } from './RecurringTransactionList'
import { AssetFullWidget } from '@/widgets/asset-full'
import { DutchPayFullWidget } from '@/widgets/dutch-pay-full'

type TabType = 'list' | 'summary' | 'budget' | 'asset' | 'dutchPay' | 'template' | 'recurring'

export const ExpenseFullWidget = () => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0] ?? ''
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const { data: expenses, isLoading } = useExpenses()
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const handleCreate = useCallback((data: ExpenseFormValues) => {
    createExpense.mutate(data, {
      onSuccess: () => {
        setShowForm(false)
      },
    })
  }, [createExpense])

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

  const { t: tAsset } = useTranslation('asset')
  const { t: tDutchPay } = useTranslation('dutchPay')

  const tabs: { key: TabType; label: string }[] = [
    { key: 'list', label: t('list') },
    { key: 'summary', label: t('summary') },
    { key: 'budget', label: t('budget') },
    { key: 'asset', label: tAsset('title') },
    { key: 'dutchPay', label: tDutchPay('title') },
    { key: 'template', label: t('template') },
    { key: 'recurring', label: t('recurring') },
  ]

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* 고정: 탭바 */}
      <div className="shrink-0">
        <div className="flex items-center rounded-lg border bg-muted/30 px-1">
          <div className="flex min-w-0 flex-1 overflow-x-auto py-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center pl-1">
            <div className="mx-1 h-5 w-px bg-border" />
            <button
              onClick={() => setShowCategoryManager(true)}
              title={t('categories')}
              className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠: 탭별 스크롤 */}
      <div className="mt-4 min-h-0 flex-1 flex flex-col">
        {activeTab === 'list' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0">
              <DailySummaryCard date={todayStr} />
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ExpenseList
                  expenses={expenses || []}
                  categories={categories || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {!isMobile && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                  {t('addTransaction')}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SummaryDashboard year={currentYear} month={currentMonth} />
          </div>
        )}

        {activeTab === 'budget' && (
          <BudgetProgress year={currentYear} month={currentMonth} />
        )}

        {activeTab === 'template' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ExpenseTemplateList />
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <RecurringTransactionList />
          </div>
        )}

        {activeTab === 'asset' && (
          <AssetFullWidget />
        )}

        {activeTab === 'dutchPay' && (
          <DutchPayFullWidget />
        )}
      </div>

      {/* Mobile FAB */}
      {activeTab === 'list' && isMobile && (
        <button
          onClick={() => setShowForm(true)}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
            'rounded-full bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Expense form */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories || []}
          assets={assets?.assets || []}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createExpense.isPending || updateExpense.isPending}
        />
      )}

      {/* Category manager modal */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('categories')}</DialogTitle>
          </DialogHeader>
          <ExpenseCategoryManager />
        </DialogContent>
      </Dialog>

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
