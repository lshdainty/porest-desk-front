import { useTranslation } from 'react-i18next'
import { Edit3, Trash2, Wallet, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn, formatCurrency } from '@/shared/lib'
import type { Expense, ExpenseCategory } from '@/entities/expense'

interface ExpenseListProps {
  expenses: Expense[]
  categories?: ExpenseCategory[]
  onEdit: (expense: Expense) => void
  onDelete: (id: number) => void
  onAdd?: () => void
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

export const ExpenseList = ({ expenses, categories = [], onEdit, onDelete, onAdd }: ExpenseListProps) => {
  const { t } = useTranslation('expense')

  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    categories.forEach((cat) => map.set(cat.rowId, cat))
    return map
  }, [categories])

  const getCategoryDisplayName = (expense: Expense): string => {
    const cat = categoryMap.get(expense.categoryRowId)
    if (cat?.parentRowId) {
      const parent = categoryMap.get(cat.parentRowId)
      if (parent) {
        return `${parent.categoryName} > ${cat.categoryName}`
      }
    }
    return expense.categoryName || t('category')
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Wallet size={48} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">{t('noTransactions')}</p>
        <p className="mt-1 text-xs">{t('createFirst')}</p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            {t('addTransaction')}
          </button>
        )}
      </div>
    )
  }

  const grouped = groupByDate(expenses)

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items, dailyIncome, dailyExpense }) => (
        <div key={date}>
          {/* Enhanced date header with daily totals */}
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {formatDateHeader(date)}
            </h3>
            <div className="flex items-center gap-2 text-xs">
              {dailyIncome > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  +{formatCurrency(dailyIncome)}
                </span>
              )}
              {dailyExpense > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  -{formatCurrency(dailyExpense)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {items.map((expense) => (
              <div
                key={expense.rowId}
                className="group flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                {/* Category color indicator */}
                <div
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryMap.get(expense.categoryRowId)?.color || '#6b7280' }}
                />

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {expense.categoryIcon && (
                      <span className="text-sm">{expense.categoryIcon}</span>
                    )}
                    <span className="text-sm font-medium truncate">
                      {getCategoryDisplayName(expense)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {expense.description && (
                      <span className="truncate">{expense.description}</span>
                    )}
                    {expense.description && expense.merchant && (
                      <span>·</span>
                    )}
                    {expense.merchant && (
                      <span className="shrink-0">{expense.merchant}</span>
                    )}
                  </div>
                </div>

                {/* Amount - larger and more prominent */}
                <span
                  className={cn(
                    'shrink-0 text-base font-bold tabular-nums',
                    expense.expenseType === 'INCOME'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {expense.expenseType === 'INCOME' ? '+' : '-'}
                  {formatCurrency(expense.amount)}
                </span>

                {/* Actions - visible on hover (desktop), always visible on mobile */}
                <div className="flex shrink-0 items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(expense)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(expense.rowId)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
