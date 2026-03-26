import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2, Play, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
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
  useExpenseTemplates,
  useCreateExpenseTemplate,
  useUpdateExpenseTemplate,
  useDeleteExpenseTemplate,
  useUseExpenseTemplate,
} from '@/features/expense-template'
import { useExpenseCategories } from '@/features/expense'
import { useAssets } from '@/features/asset'
import type { ExpenseTemplate, ExpenseTemplateFormValues } from '@/entities/expense-template'
import { ExpenseTemplateForm } from './ExpenseTemplateForm'

type SortMode = 'default' | 'frequency'

export const ExpenseTemplateList = () => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExpenseTemplate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('default')

  const { data: templates, isLoading } = useExpenseTemplates()
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createTemplate = useCreateExpenseTemplate()
  const updateTemplate = useUpdateExpenseTemplate()
  const deleteTemplate = useDeleteExpenseTemplate()
  const useTemplate = useUseExpenseTemplate()

  const sortedTemplates = useMemo(() => {
    if (!templates) return []
    if (sortMode === 'frequency') {
      return [...templates].sort((a, b) => b.useCount - a.useCount)
    }
    return templates
  }, [templates, sortMode])

  const handleCreate = useCallback((data: ExpenseTemplateFormValues) => {
    createTemplate.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }, [createTemplate])

  const handleUpdate = useCallback((data: ExpenseTemplateFormValues) => {
    if (!editingTemplate) return
    updateTemplate.mutate(
      { id: editingTemplate.rowId, data },
      {
        onSuccess: () => {
          setEditingTemplate(null)
          setShowForm(false)
        },
      }
    )
  }, [editingTemplate, updateTemplate])

  const handleEdit = useCallback((template: ExpenseTemplate) => {
    setEditingTemplate(template)
    setShowForm(true)
  }, [])

  const handleQuickUse = useCallback((template: ExpenseTemplate) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    useTemplate.mutate({ id: template.rowId, data: { expenseDate: today } })
  }, [useTemplate])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteTemplate.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }, [showDeleteConfirm, deleteTemplate])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingTemplate(null)
  }, [])

  const handleFormSubmit = useCallback((data: ExpenseTemplateFormValues) => {
    if (editingTemplate) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingTemplate, handleUpdate, handleCreate])

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
      {/* Sort toggle */}
      {sortedTemplates.length > 1 && (
        <div className="flex justify-end">
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
        </div>
      )}

      {/* Template list */}
      {sortedTemplates.length > 0 ? (
        <div className="space-y-2">
          {sortedTemplates.map((template) => (
            <div
              key={template.rowId}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{template.templateName}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                      template.expenseType === 'EXPENSE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    )}
                  >
                    {t(template.expenseType === 'EXPENSE' ? 'expense' : 'income')}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {template.categoryName && <span>{template.categoryName}</span>}
                  {template.amount && (
                    <span>{template.amount.toLocaleString()}원</span>
                  )}
                  {template.merchant && <span>· {template.merchant}</span>}
                  <span className="ml-auto">사용 {template.useCount}회</span>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 gap-1">
                {/* Quick execute button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  onClick={() => handleQuickUse(template)}
                  disabled={useTemplate.isPending}
                  title="바로 사용"
                >
                  {useTemplate.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(template)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(template.rowId)}
                >
                  <Trash2 size={14} />
                </Button>
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
          {t('addTemplate')}
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

      {/* Template form */}
      {showForm && (
        <ExpenseTemplateForm
          template={editingTemplate}
          categories={categories || []}
          assets={assets?.assets || []}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createTemplate.isPending || updateTemplate.isPending}
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
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTemplate.isPending}>
              {deleteTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
