import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expense'
import type { ExpenseCategory, ExpenseCategoryFormValues, ExpenseType } from '@/entities/expense'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'

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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEditForm(cat)}
              >
                <Edit3 size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(cat.rowId)}
              >
                <Trash2 size={12} />
              </Button>
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

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editCategory') : t('addCategory')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('categoryName')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('categoryNamePlaceholder')}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Icon</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g. emoji"
                />
              </div>
              <div>
                <Label>Color</Label>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border bg-background p-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {t('deleteConfirm.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) ? '...' : t('deleteConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
