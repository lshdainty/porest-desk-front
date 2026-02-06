import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import type { Expense, ExpenseFormValues, ExpenseType, ExpenseCategory } from '@/entities/expense'

interface ExpenseFormProps {
  expense?: Expense | null
  categories: ExpenseCategory[]
  onSubmit: (data: ExpenseFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const

export const ExpenseForm = ({
  expense,
  categories,
  onSubmit,
  onClose,
  isLoading,
}: ExpenseFormProps) => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [expenseType, setExpenseType] = useState<ExpenseType>(expense?.expenseType ?? 'EXPENSE')
  const [categoryRowId, setCategoryRowId] = useState<number>(expense?.categoryRowId ?? 0)
  const [amount, setAmount] = useState<string>(expense?.amount?.toString() ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '')

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)

  useEffect(() => {
    if (filteredCategories.length > 0 && categoryRowId === 0) {
      setCategoryRowId(filteredCategories[0].rowId)
    }
  }, [filteredCategories, categoryRowId])

  const handleSubmit = useCallback(() => {
    if (!categoryRowId || !amount) return
    const data: ExpenseFormValues = {
      categoryRowId,
      expenseType,
      amount: parseFloat(amount),
      description: description || undefined,
      expenseDate,
      paymentMethod: paymentMethod || undefined,
    }
    onSubmit(data)
  }, [categoryRowId, expenseType, amount, description, expenseDate, paymentMethod, onSubmit])

  const formContent = (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border bg-muted/30 p-1">
        <button
          onClick={() => setExpenseType('EXPENSE')}
          className={cn(
            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
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
            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
            expenseType === 'INCOME'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('income')}
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.amount')}</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('form.amountPlaceholder')}
          className="h-12 w-full rounded-lg border bg-background px-3 text-lg font-bold outline-none focus:border-primary"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('category')}</label>
        <select
          value={categoryRowId}
          onChange={(e) => setCategoryRowId(parseInt(e.target.value))}
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value={0} disabled>
            {t('category')}
          </option>
          {filteredCategories.map((cat) => (
            <option key={cat.rowId} value={cat.rowId}>
              {cat.icon ? `${cat.icon} ` : ''}{cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.date')}</label>
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.paymentMethod')}</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">{t('form.paymentMethod')}</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(`form.paymentMethod.${method}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.description')}</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          {tc('cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !categoryRowId || !amount}
          className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? tc('loading') : tc('save')}
        </button>
      </div>
    </div>
  )

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      >
        <div
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-4 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {expense ? t('editTransaction') : t('addTransaction')}
            </h3>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
              <X size={20} />
            </button>
          </div>
          {formContent}
        </div>
      </div>
    )
  }

  // Desktop: dialog
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {expense ? t('editTransaction') : t('addTransaction')}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X size={20} />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  )
}
