import { useTranslation } from 'react-i18next'
import { Edit3, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import type { Expense } from '@/entities/expense'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: number) => void
}

interface GroupedExpenses {
  date: string
  items: Expense[]
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
    .map(([date, items]) => ({ date, items }))
}

export const ExpenseList = ({ expenses, onEdit, onDelete }: ExpenseListProps) => {
  const { t } = useTranslation('expense')

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t('noTransactions')}</p>
      </div>
    )
  }

  const grouped = groupByDate(expenses)

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items }) => (
        <div key={date}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">{date}</h3>
          <div className="space-y-1">
            {items.map((expense) => (
              <div
                key={expense.rowId}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                {/* Category color indicator */}
                <div
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: expense.categoryColor || '#6b7280' }}
                />

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {expense.categoryIcon && (
                      <span className="text-sm">{expense.categoryIcon}</span>
                    )}
                    <span className="text-sm font-medium">
                      {expense.categoryName || t('category')}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.description}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <span
                  className={cn(
                    'shrink-0 text-sm font-bold',
                    expense.expenseType === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {expense.expenseType === 'INCOME' ? '+' : '-'}
                  {formatCurrency(expense.amount)}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
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
