import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
} from '@/features/expense-template'
import { useExpenseCategories } from '@/features/expense'
import { useAssets } from '@/features/asset'
import type { ExpenseTemplate, ExpenseTemplateFormValues } from '@/entities/expense-template'
import { ExpenseTemplateForm } from './ExpenseTemplateForm'

export const ExpenseTemplateList = () => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExpenseTemplate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const { data: templates, isLoading } = useExpenseTemplates()
  const { data: categories } = useExpenseCategories()
  const { data: assets } = useAssets()
  const createTemplate = useCreateExpenseTemplate()
  const updateTemplate = useUpdateExpenseTemplate()
  const deleteTemplate = useDeleteExpenseTemplate()

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Template list */}
      {templates && templates.length > 0 ? (
        <div className="space-y-2">
          {templates.map((template) => (
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
