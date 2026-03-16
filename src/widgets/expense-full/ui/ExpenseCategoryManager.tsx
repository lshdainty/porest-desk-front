import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import { renderMaterialIcon } from '@/shared/lib'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expense'
import type { ExpenseCategory, ExpenseCategoryFormValues, ExpenseType, ExpenseCategoryTreeNode } from '@/entities/expense'
import { buildCategoryTree } from '@/entities/expense'
import { Button } from '@/shared/ui/button'
import { ColorPicker } from '@/shared/ui/color-picker'
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
  const [formParentRowId, setFormParentRowId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const allCategories = categories ?? []
  const incomeTree = buildCategoryTree(allCategories.filter((c) => c.expenseType === 'INCOME'))
  const expenseTree = buildCategoryTree(allCategories.filter((c) => c.expenseType === 'EXPENSE'))

  const openCreateForm = useCallback((type: ExpenseType, parentRowId?: number) => {
    setEditing(null)
    setFormType(type)
    setFormName('')
    setFormIcon('')
    setFormColor('#6b7280')
    setFormParentRowId(parentRowId ?? null)
    setDeleteError(null)
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((cat: ExpenseCategory) => {
    setEditing(cat)
    setFormType(cat.expenseType)
    setFormName(cat.categoryName)
    setFormIcon(cat.icon ?? '')
    setFormColor(cat.color ?? '#6b7280')
    setFormParentRowId(cat.parentRowId)
    setDeleteError(null)
    setShowForm(true)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!formName.trim()) return
    const data: ExpenseCategoryFormValues = {
      categoryName: formName.trim(),
      icon: formIcon || undefined,
      color: formColor || undefined,
      expenseType: formType,
      parentRowId: formParentRowId,
    }
    if (editing) {
      updateCategory.mutate(
        { id: editing.rowId, data },
        { onSuccess: () => setShowForm(false) }
      )
    } else {
      createCategory.mutate(data, { onSuccess: () => setShowForm(false) })
    }
  }, [formName, formIcon, formColor, formType, formParentRowId, editing, createCategory, updateCategory])

  const handleDelete = useCallback((cat: ExpenseCategory) => {
    if (cat.hasChildren) {
      setDeleteError(t('cannotDeleteParentCategory'))
      return
    }
    setDeleteError(null)
    deleteCategory.mutate(cat.rowId)
  }, [deleteCategory, t])

  const renderCategoryNode = (node: ExpenseCategoryTreeNode, isChild = false) => (
    <div key={node.rowId}>
      <div
        className={`flex items-center gap-2 rounded-md border px-3 py-2 ${isChild ? 'ml-6' : ''}`}
      >
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: node.color || '#6b7280' }}
        />
        {node.icon && renderMaterialIcon(node.icon, node.categoryName.charAt(0), 16)}
        <span className="flex-1 text-sm">{node.categoryName}</span>
        {!isChild && (
          <button
            onClick={() => openCreateForm(node.expenseType, node.rowId)}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={t('addSubCategory')}
          >
            <Plus size={12} />
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => openEditForm(node)}
        >
          <Edit3 size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => handleDelete(node)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => renderCategoryNode(child, true))}
        </div>
      )}
    </div>
  )

  const renderCategoryList = (tree: ExpenseCategoryTreeNode[], type: ExpenseType) => (
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
      {tree.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">-</p>
      ) : (
        <div className="space-y-1">
          {tree.map((node) => renderCategoryNode(node))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {deleteError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      {renderCategoryList(expenseTree, 'EXPENSE')}
      {renderCategoryList(incomeTree, 'INCOME')}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('editCategory') : formParentRowId ? t('addSubCategory') : t('addCategory')}
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
                <Label>{t('form.icon')}</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder={t('form.iconPlaceholder')}
                />
              </div>
              <div>
                <Label>{t('form.color')}</Label>
                <ColorPicker value={formColor} onChange={setFormColor} />
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
              {(createCategory.isPending || updateCategory.isPending) ? '...' : t('form.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
