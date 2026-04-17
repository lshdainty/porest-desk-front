import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit3, Trash2, Loader2, GripVertical, ShoppingCart, Coffee, Car, Home, Utensils, Heart, Briefcase, Gift, Plane, Smartphone } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { renderIcon } from '@/shared/lib'
import { IconPicker } from '@/shared/ui/icon-picker'
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

const ICON_PRESETS = [
  { name: 'shopping-cart', Icon: ShoppingCart },
  { name: 'coffee', Icon: Coffee },
  { name: 'car', Icon: Car },
  { name: 'home', Icon: Home },
  { name: 'utensils', Icon: Utensils },
  { name: 'heart', Icon: Heart },
  { name: 'briefcase', Icon: Briefcase },
  { name: 'gift', Icon: Gift },
  { name: 'plane', Icon: Plane },
  { name: 'smartphone', Icon: Smartphone },
]

const COLOR_PRESETS = [
  { name: 'red', value: '#EF4444' },
  { name: 'orange', value: '#F97316' },
  { name: 'amber', value: '#F59E0B' },
  { name: 'yellow', value: '#EAB308' },
  { name: 'green', value: '#22C55E' },
  { name: 'emerald', value: '#10B981' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'indigo', value: '#6366F1' },
  { name: 'purple', value: '#8B5CF6' },
  { name: 'pink', value: '#EC4899' },
]

interface SortableCategoryNodeProps {
  node: ExpenseCategoryTreeNode
  isChild?: boolean
  onOpenCreate: (type: ExpenseType, parentRowId?: number) => void
  onOpenEdit: (cat: ExpenseCategory) => void
  onDelete: (cat: ExpenseCategory) => void
}

const SortableCategoryNode = ({ node, isChild = false, onOpenCreate, onOpenEdit, onDelete }: SortableCategoryNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.rowId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 rounded-md border px-3 py-2 ${isChild ? 'ml-6' : ''}`}
      >
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: node.color || '#6b7280' }}
        />
        {node.icon && renderIcon(node.icon, node.categoryName.charAt(0), 16)}
        <span className="flex-1 text-sm">{node.categoryName}</span>
        {!isChild && (
          <button
            onClick={() => onOpenCreate(node.expenseType, node.rowId)}
            className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onOpenEdit(node)}
        >
          <Edit3 size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(node)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <SortableCategoryNode
              key={child.rowId}
              node={child}
              isChild
              onOpenCreate={onOpenCreate}
              onOpenEdit={onOpenEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

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
  const incomeTree = useMemo(() => buildCategoryTree(allCategories.filter((c) => c.expenseType === 'INCOME')), [allCategories])
  const expenseTree = useMemo(() => buildCategoryTree(allCategories.filter((c) => c.expenseType === 'EXPENSE')), [allCategories])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  const handleDragEnd = useCallback((event: DragEndEvent, tree: ExpenseCategoryTreeNode[]) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tree.findIndex((n) => n.rowId === active.id)
    const newIndex = tree.findIndex((n) => n.rowId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(tree, oldIndex, newIndex)
    reordered.forEach((node, idx) => {
      updateCategory.mutate({
        id: node.rowId,
        data: {
          categoryName: node.categoryName,
          icon: node.icon ?? undefined,
          color: node.color ?? undefined,
          expenseType: node.expenseType,
          parentRowId: node.parentRowId,
          sortOrder: idx,
        },
      })
    })
  }, [updateCategory])

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(event, tree)}
        >
          <SortableContext
            items={tree.map((n) => n.rowId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {tree.map((node) => (
                <SortableCategoryNode
                  key={node.rowId}
                  node={node}
                  onOpenCreate={openCreateForm}
                  onOpenEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
            {/* Icon preset palette */}
            <div>
              <Label>{t('form.icon')}</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ICON_PRESETS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormIcon(name)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all hover:bg-accent ${
                      formIcon === name ? 'ring-2 ring-primary border-primary' : 'border-input'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
                <IconPicker value={formIcon} onChange={setFormIcon} className="h-8 w-8" />
              </div>
            </div>
            {/* Color preset palette */}
            <div>
              <Label>{t('form.color')}</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map(({ name, value }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormColor(value)}
                    className={`h-7 w-7 rounded-md border transition-all hover:scale-110 ${
                      formColor.toUpperCase() === value.toUpperCase()
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                        : 'border-border/30'
                    }`}
                    style={{ backgroundColor: value }}
                  />
                ))}
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
              {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('form.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
