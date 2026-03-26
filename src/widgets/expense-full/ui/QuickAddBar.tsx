import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Input } from '@/shared/ui/input'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import type { Expense, ExpenseFormValues, ExpenseType, ExpenseCategory } from '@/entities/expense'
import { buildCategoryTree, getSelectableCategories } from '@/entities/expense'

interface QuickAddBarProps {
  categories: ExpenseCategory[]
  expenses?: Expense[]
  onCreateExpense: (data: ExpenseFormValues) => void
  onOpenFullForm: (partial: Partial<ExpenseFormValues>) => void
  isLoading: boolean
}

/** Most-used categories by frequency */
function getRecentCategories(
  expenses: Expense[],
  selectableCategories: ExpenseCategory[],
  expenseType: ExpenseType,
  limit = 3,
): ExpenseCategory[] {
  const freq = new Map<number, number>()
  expenses
    .filter((e) => e.expenseType === expenseType)
    .forEach((e) => freq.set(e.categoryRowId, (freq.get(e.categoryRowId) ?? 0) + 1))

  const selectableIds = new Set(selectableCategories.map((c) => c.rowId))
  return [...freq.entries()]
    .filter(([id]) => selectableIds.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => selectableCategories.find((c) => c.rowId === id)!)
    .filter(Boolean)
}

export const QuickAddBar = ({
  categories,
  expenses = [],
  onCreateExpense,
  onOpenFullForm,
  isLoading,
}: QuickAddBarProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()

  const [expenseType, setExpenseType] = useState<ExpenseType>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [categoryRowId, setCategoryRowId] = useState<number>(0)
  const [expanded, setExpanded] = useState(!isMobile)

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)
  const categoryTree = buildCategoryTree(filteredCategories)
  const selectableCategories = getSelectableCategories(filteredCategories)

  const recentCategories = useMemo(
    () => getRecentCategories(expenses, selectableCategories, expenseType),
    [expenses, selectableCategories, expenseType],
  )

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

  // Mobile collapsed state
  if (isMobile && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors active:scale-[0.99]"
      >
        <Plus size={18} />
        {t('quickAdd.collapsed')}
      </button>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      {/* Mobile collapse button */}
      {isMobile && (
        <button
          onClick={() => setExpanded(false)}
          className="mb-2 flex w-full items-center justify-center text-muted-foreground"
        >
          <ChevronUp size={14} />
        </button>
      )}

      {/* Single line: Type toggle + Amount + Category + Submit */}
      <div className="flex items-center gap-2">
        {/* Type toggle - compact pill */}
        <div className="flex shrink-0 rounded-lg border bg-muted/30 p-0.5">
          <button
            onClick={() => setExpenseType('EXPENSE')}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs font-medium transition-all',
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
              'rounded-md px-2 py-1.5 text-xs font-medium transition-all',
              expenseType === 'INCOME'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('income')}
          </button>
        </div>

        {/* Amount input */}
        <Input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('form.amountPlaceholder')}
          className="h-9 flex-1 min-w-0 text-sm font-bold"
        />

        {/* Category select (desktop only - mobile uses chips below) */}
        {!isMobile && (
          <Select
            value={categoryRowId ? String(categoryRowId) : undefined}
            onValueChange={(val) => setCategoryRowId(Number(val))}
          >
            <SelectTrigger className="h-9 w-[140px] shrink-0 text-xs">
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
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !categoryRowId || !amount}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all active:scale-95',
            categoryRowId && amount
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <Send size={16} />
        </button>

        {/* Full form link */}
        <button
          onClick={handleOpenFull}
          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={t('editTransaction')}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Recent category chips */}
      {recentCategories.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {recentCategories.map((cat) => (
            <button
              key={cat.rowId}
              onClick={() => setCategoryRowId(cat.rowId)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all active:scale-95',
                categoryRowId === cat.rowId
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {cat.icon && <span className="inline-flex">{renderIcon(cat.icon, '', 12)}</span>}
              {cat.categoryName}
            </button>
          ))}

          {/* Mobile: full category select trigger */}
          {isMobile && (
            <Select
              value={categoryRowId ? String(categoryRowId) : undefined}
              onValueChange={(val) => setCategoryRowId(Number(val))}
            >
              <SelectTrigger className="h-7 shrink-0 rounded-full border-dashed px-2.5 text-xs w-auto">
                <span className="text-muted-foreground">{t('category')}...</span>
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
          )}
        </div>
      )}
    </div>
  )
}
