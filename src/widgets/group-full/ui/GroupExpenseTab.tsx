import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { useGroupExpenses } from '@/features/group'
import { formatCurrency } from '@/shared/lib'

interface GroupExpenseTabProps {
  groupId: number
}

export const GroupExpenseTab = ({ groupId }: GroupExpenseTabProps) => {
  const { t } = useTranslation('group')

  const { data, isLoading } = useGroupExpenses(groupId)
  const expenses = data?.data?.expenses ?? data?.expenses ?? []

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Receipt className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t('noGroupExpenses')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense: any) => (
        <div
          key={expense.rowId}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {expense.description || expense.categoryName}
            </span>
            <span className="text-xs text-muted-foreground">
              {expense.expenseDate}
              {expense.merchant ? ` · ${expense.merchant}` : ''}
            </span>
          </div>
          <span
            className={`shrink-0 text-sm font-medium ${
              expense.expenseType === 'INCOME' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {expense.expenseType === 'INCOME' ? '+' : '-'}
            {formatCurrency(expense.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
