import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronDown } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import type { ExpenseFormValues, ExpenseType, ExpenseCategory } from '@/entities/expense'
import { buildCategoryTree, getSelectableCategories } from '@/entities/expense'

interface QuickAddBarProps {
  categories: ExpenseCategory[]
  onCreateExpense: (data: ExpenseFormValues) => void
  onOpenFullForm: (partial: Partial<ExpenseFormValues>) => void
  isLoading: boolean
}

export const QuickAddBar = ({
  categories,
  onCreateExpense,
  onOpenFullForm,
  isLoading,
}: QuickAddBarProps) => {
  const { t } = useTranslation('expense')

  const [expenseType, setExpenseType] = useState<ExpenseType>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [categoryRowId, setCategoryRowId] = useState<number>(0)

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)
  const categoryTree = buildCategoryTree(filteredCategories)
  const selectableCategories = getSelectableCategories(filteredCategories)

  const handleSubmit = useCallback(() => {
    if (!categoryRowId || !amount) return
    const data: ExpenseFormValues = {
      categoryRowId,
      expenseType,
      amount: parseFloat(amount),
      expenseDate: new Date().toISOString().split('T')[0] ?? '',
    }
    onCreateExpense(data)
    setAmount('')
  }, [categoryRowId, expenseType, amount, onCreateExpense])

  const handleOpenFull = useCallback(() => {
    onOpenFullForm({
      expenseType,
      amount: amount ? parseFloat(amount) : undefined,
      categoryRowId: categoryRowId || undefined,
    })
  }, [expenseType, amount, categoryRowId, onOpenFullForm])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  // Auto-select first category
  if (categoryRowId === 0 && selectableCategories.length > 0) {
    setCategoryRowId(selectableCategories[0]?.rowId ?? 0)
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      {/* Row 1: Type toggle + Amount */}
      <div className="flex gap-2">
        <div className="flex shrink-0 rounded-md border bg-muted/30 p-0.5">
          <button
            onClick={() => setExpenseType('EXPENSE')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              expenseType === 'EXPENSE'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('expense')}
          </button>
          <button
            onClick={() => setExpenseType('INCOME')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              expenseType === 'INCOME'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('income')}
          </button>
        </div>
        <Input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('form.amountPlaceholder')}
          className="h-8 flex-1 text-sm font-bold"
        />
      </div>

      {/* Row 2: Category + Submit + Full form link */}
      <div className="mt-2 flex items-center gap-2">
        <Select
          value={categoryRowId ? String(categoryRowId) : undefined}
          onValueChange={(val) => setCategoryRowId(Number(val))}
        >
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent>
            {categoryTree.map((node, index) =>
              node.children.length > 0 ? (
                <SelectGroup key={node.rowId}>
                  {index > 0 && <SelectSeparator />}
                  <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {node.icon && <span className="inline-flex mr-0.5">{renderIcon(node.icon, '', 12)}</span>}
                    {node.categoryName}
                  </SelectLabel>
                  {node.children.map((child) => (
                    <SelectItem key={child.rowId} value={String(child.rowId)} className="pl-8 text-xs">
                      {child.icon && <span className="inline-flex mr-0.5">{renderIcon(child.icon, '', 12)}</span>}
                      {child.categoryName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : (
                <SelectItem key={node.rowId} value={String(node.rowId)} className="text-xs">
                  {node.icon && <span className="inline-flex mr-0.5">{renderIcon(node.icon, '', 12)}</span>}
                  {node.categoryName}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isLoading || !categoryRowId || !amount}
          className="h-8 shrink-0 gap-1 px-3"
        >
          <Plus size={14} />
          {t('addTransaction')}
        </Button>

        <button
          onClick={handleOpenFull}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={t('editTransaction')}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  )
}
