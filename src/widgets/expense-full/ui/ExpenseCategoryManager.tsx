import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit3, Trash2, X } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expense'
import type { ExpenseCategory, ExpenseCategoryFormValues, ExpenseType } from '@/entities/expense'

export const ExpenseCategoryManager = () => {
  const { t } = useTranslation('expense')
  const { data: categories } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const updateCategory = useUpdateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExpenseCategory | null>(null)
  const [formType, setFormType] = useState<ExpenseType>('EXPENSE')
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formColor, setFormColor] = useState('#6b7280')

  const incomeCategories = categories?.filter((c) => c.expenseType === 'INCOME') ?? []
  const expenseCategories = categories?.filter((c) => c.expenseType === 'EXPENSE') ?? []

  const openCreateForm = useCallback((type: ExpenseType) => {
    setEditing(null)
    setFormType(type)
    setFormName('')
    setFormIcon('')
    setFormColor('#6b7280')
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((cat: ExpenseCategory) => {
    setEditing(cat)
    setFormType(cat.expenseType)
    setFormName(cat.categoryName)
    setFormIcon(cat.icon ?? '')
    setFormColor(cat.color ?? '#6b7280')
    setShowForm(true)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!formName.trim()) return
    const data: ExpenseCategoryFormValues = {
      categoryName: formName.trim(),
      icon: formIcon || undefined,
      color: formColor || undefined,
      expenseType: formType,
    }
    if (editing) {
      updateCategory.mutate(
        { id: editing.rowId, data },
        { onSuccess: () => setShowForm(false) }
      )
    } else {
      createCategory.mutate(data, { onSuccess: () => setShowForm(false) })
    }
  }, [formName, formIcon, formColor, formType, editing, createCategory, updateCategory])

  const handleDelete = useCallback((id: number) => {
    deleteCategory.mutate(id)
  }, [deleteCategory])

  const renderCategoryList = (items: ExpenseCategory[], type: ExpenseType) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {type === 'INCOME' ? t('income') : t('expense')}
        </h4>
        <button
          onClick={() => openCreateForm(type)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus size={12} />
          {t('addCategory')}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">-</p>
      ) : (
        <div className="space-y-1">
          {items.map((cat) => (
            <div
              key={cat.rowId}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color || '#6b7280' }}
              />
              {cat.icon && <span className="text-sm">{cat.icon}</span>}
              <span className="flex-1 text-sm">{cat.categoryName}</span>
              <button
                onClick={() => openEditForm(cat)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={() => handleDelete(cat.rowId)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {renderCategoryList(expenseCategories, 'EXPENSE')}
      {renderCategoryList(incomeCategories, 'INCOME')}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowForm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editing ? t('editCategory') : t('addCategory')}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('categoryName')}</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('categoryNamePlaceholder')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">Icon</label>
                  <input
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="e.g. emoji"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Color</label>
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border bg-background p-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t('deleteConfirm.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formName.trim() || createCategory.isPending || updateCategory.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {(createCategory.isPending || updateCategory.isPending) ? '...' : t('deleteConfirm.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
