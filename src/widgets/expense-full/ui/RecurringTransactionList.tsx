import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, ArrowUpDown } from 'lucide-react'
import { differenceInDays, parseISO, startOfDay } from 'date-fns'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
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

type SortMode = 'default' | 'frequency'

const FREQUENCY_ORDER: Record<string, number> = {
  DAILY: 0,
  WEEKLY: 1,
  MONTHLY: 2,
  YEARLY: 3,
}

const getDDay = (nextExecutionDate: string): number => {
  const today = startOfDay(new Date())
  const next = startOfDay(parseISO(nextExecutionDate))
  return differenceInDays(next, today)
}

const getDDayLabel = (dDay: number): string => {
  if (dDay === 0) return 'D-Day'
  if (dDay > 0) return `D-${dDay}`
  return `D+${Math.abs(dDay)}`
}

const getDDayColor = (dDay: number): string => {
  if (dDay <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (dDay <= 3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (dDay <= 7) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

export const RecurringTransactionList = () => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('default')

  const { data: recurringList, isLoading } = useRecurringTransactions()
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createRecurring = useCreateRecurringTransaction()
  const updateRecurring = useUpdateRecurringTransaction()
  const deleteRecurring = useDeleteRecurringTransaction()
  const toggleRecurring = useToggleRecurringTransaction()

  const sortedList = useMemo(() => {
    if (!recurringList) return []
    if (sortMode === 'frequency') {
      return [...recurringList].sort((a, b) => {
        const fa = FREQUENCY_ORDER[a.frequency] ?? 99
        const fb = FREQUENCY_ORDER[b.frequency] ?? 99
        return fa - fb
      })
    }
    return recurringList
  }, [recurringList, sortMode])

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

  const toggleSortMode = useCallback(() => {
    setSortMode((prev) => (prev === 'default' ? 'frequency' : 'default'))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with sort toggle and add button */}
      <div className="flex items-center justify-between">
        <div>
          {sortedList.length > 1 && (
            <button
              onClick={toggleSortMode}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
                sortMode === 'frequency'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <ArrowUpDown size={12} />
              {sortMode === 'frequency' ? '빈도순' : '기본순'}
            </button>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} className="mr-1" />
            {t('addRecurring')}
          </Button>
        )}
      </div>

      {/* Recurring list */}
      {sortedList.length > 0 ? (
        <div className="space-y-2">
          {sortedList.map((recurring) => {
            const dDay = recurring.isActive === 'Y' ? getDDay(recurring.nextExecutionDate) : null

            return (
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
                    {/* D-day badge */}
                    {dDay !== null && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          getDDayColor(dDay),
                        )}
                      >
                        {getDDayLabel(dDay)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{recurring.amount.toLocaleString()}원</span>
                    {recurring.merchant && <span>· {recurring.merchant}</span>}
                    <span className="ml-auto">{t('nextExecution')}: {recurring.nextExecutionDate}</span>
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      recurring.isActive === 'Y'
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => handleToggle(recurring.rowId)}
                    disabled={toggleRecurring.isPending}
                    title={recurring.isActive === 'Y' ? t('active') : t('inactive')}
                  >
                    {recurring.isActive === 'Y' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(recurring)}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(recurring.rowId)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t('noTransactions')}
        </div>
      )}

      {/* Mobile FAB */}
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

      {/* Recurring form */}
      {showForm && (
        <RecurringTransactionForm
          recurring={editingRecurring}
          categories={categories || []}
          assets={assets?.assets || []}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createRecurring.isPending || updateRecurring.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteRecurring.isPending}>
              {deleteRecurring.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
