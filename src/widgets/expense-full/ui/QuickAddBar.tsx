import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
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

/** 최근 사용 카테고리 상위 N개 추출 (빈도 기반) */
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
  const [expanded, setExpanded] = useState(true)

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

  // 모바일: 접혀있을 때 탭하면 펼쳐지는 형태
  if (isMobile && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border bg-card p-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Plus size={16} className="text-primary" />
        {t('addTransaction')}
        <ChevronDown size={14} />
      </button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      {/* 모바일 접기 버튼 */}
      {isMobile && (
        <button
          onClick={() => setExpanded(false)}
          className="mb-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground"
        >
          <ChevronUp size={12} />
        </button>
      )}

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

      {/* 최근 사용 카테고리 칩 */}
      {recentCategories.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {recentCategories.map((cat) => (
            <button
              key={cat.rowId}
              onClick={() => setCategoryRowId(cat.rowId)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                categoryRowId === cat.rowId
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {cat.icon && <span className="inline-flex">{renderIcon(cat.icon, '', 12)}</span>}
              {cat.categoryName}
            </button>
          ))}
        </div>
      )}

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
