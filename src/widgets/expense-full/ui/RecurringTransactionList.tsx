import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
  useToggleRecurringTransaction,
} from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import { useAssets } from '@/features/asset'
import type { RecurringTransaction, RecurringTransactionFormValues } from '@/entities/recurring-transaction'
import { RecurringTransactionForm } from './RecurringTransactionForm'

export const RecurringTransactionList = () => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const { data: recurringList, isLoading } = useRecurringTransactions()
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createRecurring = useCreateRecurringTransaction()
  const updateRecurring = useUpdateRecurringTransaction()
  const deleteRecurring = useDeleteRecurringTransaction()
  const toggleRecurring = useToggleRecurringTransaction()

  const handleCreate = useCallback((data: RecurringTransactionFormValues) => {
    createRecurring.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }, [createRecurring])

  const handleUpdate = useCallback((data: RecurringTransactionFormValues) => {
    if (!editingRecurring) return
    updateRecurring.mutate(
      { id: editingRecurring.rowId, data },
      {
        onSuccess: () => {
          setEditingRecurring(null)
          setShowForm(false)
        },
      }
    )
  }, [editingRecurring, updateRecurring])

  const handleEdit = useCallback((recurring: RecurringTransaction) => {
    setEditingRecurring(recurring)
    setShowForm(true)
  }, [])

  const handleToggle = useCallback((id: number) => {
    toggleRecurring.mutate(id)
  }, [toggleRecurring])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteRecurring.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }, [showDeleteConfirm, deleteRecurring])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingRecurring(null)
  }, [])

  const handleFormSubmit = useCallback((data: RecurringTransactionFormValues) => {
    if (editingRecurring) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingRecurring, handleUpdate, handleCreate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recurring list */}
      {recurringList && recurringList.length > 0 ? (
        <div className="space-y-2">
          {recurringList.map((recurring) => (
            <div
              key={recurring.rowId}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                recurring.isActive === 'N' && 'opacity-50'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {recurring.description || recurring.categoryName || t('recurring')}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                      recurring.expenseType === 'EXPENSE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    )}
                  >
                    {t(recurring.expenseType === 'EXPENSE' ? 'expense' : 'income')}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-xs',
                      recurring.isActive === 'Y'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {t(`frequency.${recurring.frequency}`)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{recurring.amount.toLocaleString()}원</span>
                  {recurring.merchant && <span>· {recurring.merchant}</span>}
                  <span className="ml-auto">{t('nextExecution')}: {recurring.nextExecutionDate}</span>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 gap-1">
                <button
                  onClick={() => handleToggle(recurring.rowId)}
                  disabled={toggleRecurring.isPending}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    recurring.isActive === 'Y'
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  title={recurring.isActive === 'Y' ? t('active') : t('inactive')}
                >
                  {recurring.isActive === 'Y' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => handleEdit(recurring)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(recurring.rowId)}
                  className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t('noTransactions')}
        </div>
      )}

      {/* Add button */}
      {!isMobile ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={16} />
          {t('addRecurring')}
        </button>
      ) : (
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

      {/* Recurring form */}
      {showForm && (
        <RecurringTransactionForm
          recurring={editingRecurring}
          categories={categories || []}
          assets={assets || []}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createRecurring.isPending || updateRecurring.isPending}
        />
      )}

      {/* Delete confirmation */}
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
                {tc('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteRecurring.isPending}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteRecurring.isPending ? '...' : tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
