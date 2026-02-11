import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/ui/dialog'
import type { Expense, ExpenseFormValues, ExpenseType, ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'

interface ExpenseFormProps {
  expense?: Expense | null
  categories: ExpenseCategory[]
  assets?: Asset[]
  onSubmit: (data: ExpenseFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const

export const ExpenseForm = ({
  expense,
  categories,
  assets = [],
  onSubmit,
  onClose,
  isLoading,
}: ExpenseFormProps) => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')

  const [expenseType, setExpenseType] = useState<ExpenseType>(expense?.expenseType ?? 'EXPENSE')
  const [categoryRowId, setCategoryRowId] = useState<number>(expense?.categoryRowId ?? 0)
  const [amount, setAmount] = useState<string>(expense?.amount?.toString() ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '')
  const [assetRowId, setAssetRowId] = useState<number>(expense?.assetRowId ?? 0)
  const [merchant, setMerchant] = useState(expense?.merchant ?? '')

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
      assetRowId: assetRowId || undefined,
      expenseType,
      amount: parseFloat(amount),
      description: description || undefined,
      expenseDate,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
    }
    onSubmit(data)
  }, [categoryRowId, assetRowId, expenseType, amount, description, expenseDate, merchant, paymentMethod, onSubmit])

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? t('editTransaction') : t('addTransaction')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type toggle - KEEP custom */}
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
          <div className="space-y-1.5">
            <Label>{t('form.amount')}</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('form.amountPlaceholder')}
              className="h-12 text-lg font-bold"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>{t('category')}</Label>
            <Select
              value={categoryRowId ? String(categoryRowId) : undefined}
              onValueChange={(val) => setCategoryRowId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.rowId} value={String(cat.rowId)}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>{t('form.date')}</Label>
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label>{t('form.paymentMethod')}</Label>
            <Select
              value={paymentMethod || '__none__'}
              onValueChange={(val) => setPaymentMethod(val === '__none__' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.paymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('form.paymentMethod')}</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {t(`form.paymentMethod.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset */}
          {assets.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('form.asset')}</Label>
              <Select
                value={assetRowId ? String(assetRowId) : '__none__'}
                onValueChange={(val) => setAssetRowId(val === '__none__' ? 0 : Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.asset')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('form.asset')}</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.rowId} value={String(asset.rowId)}>
                      {asset.assetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Merchant */}
          <div className="space-y-1.5">
            <Label>{t('form.merchant')}</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t('form.merchantPlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t('form.description')}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !categoryRowId || !amount}
            >
              {isLoading ? tc('loading') : tc('save')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
