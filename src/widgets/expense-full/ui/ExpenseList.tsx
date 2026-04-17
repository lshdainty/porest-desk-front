import { useTranslation } from 'react-i18next'
import { Edit3, Trash2, Wallet, Plus } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn, formatCurrency, renderIcon } from '@/shared/lib'
import type { Expense, ExpenseCategory } from '@/entities/expense'

interface ExpenseListProps {
  expenses: Expense[]
  categories?: ExpenseCategory[]
  onEdit: (expense: Expense) => void
  onDelete: (id: number) => void
  onAdd?: () => void
  viewYear?: number
  viewMonth?: number
}

interface GroupedExpenses {
  date: string
  items: Expense[]
  dailyIncome: number
  dailyExpense: number
}

const groupByDate = (expenses: Expense[]): GroupedExpenses[] => {
  const grouped: Record<string, Expense[]> = {}
  expenses.forEach((expense) => {
    const date = expense.expenseDate
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(expense)
  })
  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => {
      const dailyIncome = items
        .filter((e) => e.expenseType === 'INCOME')
        .reduce((sum, e) => sum + e.amount, 0)
      const dailyExpense = items
        .filter((e) => e.expenseType === 'EXPENSE')
        .reduce((sum, e) => sum + e.amount, 0)
      return { date, items, dailyIncome, dailyExpense }
    })
}

const formatDateHeader = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr)
    return format(date, 'M월 d일 (EEE)', { locale: ko })
  } catch {
    return dateStr
  }
}

export const ExpenseList = ({
  expenses,
  categories = [],
  onEdit,
  onDelete,
  onAdd,
  viewYear,
  viewMonth,
}: ExpenseListProps) => {
  const { t } = useTranslation('expense')

  // Filter by the view month if provided
  const filteredExpenses = useMemo(() => {
    if (!viewYear || !viewMonth) return expenses
    return expenses.filter((e) => {
      const d = parseISO(e.expenseDate)
      return d.getFullYear() === viewYear && d.getMonth() + 1 === viewMonth
    })
  }, [expenses, viewYear, viewMonth])

  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    categories.forEach((cat) => map.set(cat.rowId, cat))
    return map
  }, [categories])

  const getCategoryName = useCallback((expense: Expense): string => {
    const cat = categoryMap.get(expense.categoryRowId)
    return cat?.categoryName || expense.categoryName || t('category')
  }, [categoryMap, t])

  const getCategoryIcon = useCallback((expense: Expense): string | null => {
    const cat = categoryMap.get(expense.categoryRowId)
    if (cat?.icon) return cat.icon
    // try parent
    if (cat?.parentRowId) {
      const parent = categoryMap.get(cat.parentRowId)
      if (parent?.icon) return parent.icon
    }
    return expense.categoryIcon || null
  }, [categoryMap])

  if (filteredExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Wallet size={48} className="mb-3 opacity-20" />
        <p className="text-sm font-medium">{t('noTransactions')}</p>
        <p className="mt-1 text-xs opacity-70">{t('createFirst')}</p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Plus size={16} />
            {t('addTransaction')}
          </button>
        )}
      </div>
    )
  }

  const grouped = groupByDate(filteredExpenses)

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items, dailyIncome, dailyExpense }) => (
        <div key={date}>
          {/* Date header - minimal */}
          <div className="sticky top-12 z-10 mb-1.5 flex items-center justify-between bg-background/95 backdrop-blur-sm py-1.5 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {formatDateHeader(date)}
            </span>
            <div className="flex items-center gap-2 text-[11px] tabular-nums">
              {dailyIncome > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(dailyIncome)}
                </span>
              )}
              {dailyExpense > 0 && (
                <span className="text-foreground/70">
                  -{formatCurrency(dailyExpense)}
                </span>
              )}
            </div>
          </div>

          {/* Transaction items */}
          <div className="space-y-1">
            {items.map((expense) => {
              const icon = getCategoryIcon(expense)
              const catName = getCategoryName(expense)
              const isIncome = expense.expenseType === 'INCOME'

              return (
                <div
                  key={expense.rowId}
                  className="group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/40 transition-colors cursor-pointer active:bg-muted/60"
                  onClick={() => onEdit(expense)}
                >
                  {/* Category icon circle */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60"
                    style={{
                      backgroundColor: categoryMap.get(expense.categoryRowId)?.color
                        ? `${categoryMap.get(expense.categoryRowId)!.color}20`
                        : undefined,
                    }}
                  >
                    {icon ? (
                      <span className="text-base">{renderIcon(icon, '', 18)}</span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {catName.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-tight">
                      {expense.description || expense.merchant || catName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      {catName}
                      {expense.assetName && (
                        <span className="ml-1.5 opacity-70">{expense.assetName}</span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <span
                    className={cn(
                      'shrink-0 text-sm font-bold tabular-nums',
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    )}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
                  </span>

                  {/* Actions - hover only on desktop */}
                  <div className="hidden shrink-0 items-center gap-0.5 md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(expense)
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(expense.rowId)
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
