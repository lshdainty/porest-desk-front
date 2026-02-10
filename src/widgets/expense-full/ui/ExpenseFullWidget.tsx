import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Settings } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
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
import { MonthlySummaryCard } from './MonthlySummary'
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
  const todayStr = now.toISOString().split('T')[0]
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
    <div className="relative h-full">
      <div className="space-y-4">
        {/* Tabs + category manager button */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 overflow-x-auto rounded-lg border bg-muted/30 p-1 scrollbar-none">
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
          <button
            onClick={() => setShowCategoryManager(true)}
            className="rounded-md border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={t('categories')}
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <DailySummaryCard date={todayStr} />
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ExpenseList
                expenses={expenses || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <MonthlySummaryCard year={currentYear} month={currentMonth} />
        )}

        {activeTab === 'budget' && (
          <BudgetProgress year={currentYear} month={currentMonth} />
        )}

        {activeTab === 'template' && (
          <ExpenseTemplateList />
        )}

        {activeTab === 'recurring' && (
          <RecurringTransactionList />
        )}

        {activeTab === 'asset' && (
          <AssetFullWidget />
        )}

        {activeTab === 'dutchPay' && (
          <DutchPayFullWidget />
        )}
      </div>

      {/* FAB for add on mobile, dashed button on desktop */}
      {activeTab === 'list' && (
        <>
          {!isMobile && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus size={16} />
              {t('addTransaction')}
            </button>
          )}

          {isMobile && (
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
        </>
      )}

      {/* Expense form */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories || []}
          assets={assets || []}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createExpense.isPending || updateExpense.isPending}
        />
      )}

      {/* Category manager modal */}
      {showCategoryManager && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowCategoryManager(false)}
        >
          <div
            className={cn(
              'bg-background shadow-lg overflow-y-auto',
              isMobile
                ? 'absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl p-4'
                : 'absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg p-6'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('categories')}</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                &times;
              </button>
            </div>
            <ExpenseCategoryManager />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t('deleteConfirm.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('deleteConfirm.message')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteExpense.isPending}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteExpense.isPending ? '...' : t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
