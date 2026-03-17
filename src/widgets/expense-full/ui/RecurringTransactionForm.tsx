import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, renderIcon } from '@/shared/lib'
import type { ExpenseType, ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'
import type { RecurringTransaction, RecurringTransactionFormValues, RecurringFrequency } from '@/entities/recurring-transaction'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'

interface RecurringTransactionFormProps {
  recurring?: RecurringTransaction | null
  categories: ExpenseCategory[]
  assets: Asset[]
  onSubmit: (data: RecurringTransactionFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const
const FREQUENCIES: RecurringFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

export const RecurringTransactionForm = ({
  recurring,
  categories,
  assets,
  onSubmit,
  onClose,
  isLoading,
}: RecurringTransactionFormProps) => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')

  const [expenseType, setExpenseType] = useState<ExpenseType>(recurring?.expenseType ?? 'EXPENSE')
  const [categoryRowId, setCategoryRowId] = useState<number>(recurring?.categoryRowId ?? 0)
  const [assetRowId, setAssetRowId] = useState<number>(recurring?.assetRowId ?? 0)
  const [amount, setAmount] = useState<string>(recurring?.amount?.toString() ?? '')
  const [description, setDescription] = useState(recurring?.description ?? '')
  const [merchant, setMerchant] = useState(recurring?.merchant ?? '')
  const [paymentMethod, setPaymentMethod] = useState(recurring?.paymentMethod ?? '')
  const [frequency, setFrequency] = useState<RecurringFrequency>(recurring?.frequency ?? 'MONTHLY')
  const [intervalValue] = useState<string>(recurring?.intervalValue?.toString() ?? '1')
  const [dayOfWeek, setDayOfWeek] = useState<string>(recurring?.dayOfWeek?.toString() ?? '')
  const [dayOfMonth, setDayOfMonth] = useState<string>(recurring?.dayOfMonth?.toString() ?? '')
  const [startDate, setStartDate] = useState(
    recurring?.startDate ?? (new Date().toISOString().split('T')[0] ?? '')
  )
  const [endDate, setEndDate] = useState(recurring?.endDate ?? '')

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)

  const handleSubmit = useCallback(() => {
    if (!amount) return
    const data: RecurringTransactionFormValues = {
      categoryRowId: categoryRowId || undefined,
      assetRowId: assetRowId || undefined,
      expenseType,
      amount: parseFloat(amount),
      description: description || undefined,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
      frequency,
      intervalValue: intervalValue ? parseInt(intervalValue) : undefined,
      dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined,
      dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
      startDate,
      endDate: endDate || undefined,
    }
    onSubmit(data)
  }, [categoryRowId, assetRowId, expenseType, amount, description, merchant, paymentMethod, frequency, intervalValue, dayOfWeek, dayOfMonth, startDate, endDate, onSubmit])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recurring ? t('editRecurring') : t('addRecurring')}
          </DialogTitle>
        </DialogHeader>

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

          {/* Frequency */}
          <div>
            <Label>{t('recurring')}</Label>
            <div className="flex rounded-lg border bg-muted/30 p-1">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
                    frequency === freq
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(`frequency.${freq}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (for WEEKLY) */}
          {frequency === 'WEEKLY' && (
            <div>
              <Label>요일</Label>
              <Select
                value={dayOfWeek || '__none__'}
                onValueChange={(value) => setDayOfWeek(value === '__none__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">선택</SelectItem>
                  <SelectItem value="1">월</SelectItem>
                  <SelectItem value="2">화</SelectItem>
                  <SelectItem value="3">수</SelectItem>
                  <SelectItem value="4">목</SelectItem>
                  <SelectItem value="5">금</SelectItem>
                  <SelectItem value="6">토</SelectItem>
                  <SelectItem value="7">일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of month (for MONTHLY) */}
          {frequency === 'MONTHLY' && (
            <div>
              <Label>매월</Label>
              <Select
                value={dayOfMonth || '__none__'}
                onValueChange={(value) => setDayOfMonth(value === '__none__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">선택</SelectItem>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>{day}일</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          <div>
            <Label>{t('category')}</Label>
            <Select
              value={categoryRowId ? String(categoryRowId) : '__none__'}
              onValueChange={(value) => setCategoryRowId(value === '__none__' ? 0 : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('category')}</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.rowId} value={String(cat.rowId)}>
                    {cat.icon && <span className="inline-flex mr-1 align-middle">{renderIcon(cat.icon, '', 14)}</span>}{cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset */}
          {assets.length > 0 && (
            <div>
              <Label>{t('form.asset')}</Label>
              <Select
                value={assetRowId ? String(assetRowId) : '__none__'}
                onValueChange={(value) => setAssetRowId(value === '__none__' ? 0 : Number(value))}
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

          {/* Payment Method */}
          <div>
            <Label>{t('form.paymentMethod')}</Label>
            <Select
              value={paymentMethod || '__none__'}
              onValueChange={(value) => setPaymentMethod(value === '__none__' ? '' : value)}
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

          {/* Merchant */}
          <div>
            <Label>{t('form.merchant')}</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={t('form.merchantPlaceholder')}
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t('form.description')}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Start date */}
          <div>
            <Label>{t('form.date')}</Label>
            <InputDatePicker
              value={startDate}
              onValueChange={(v) => setStartDate(v)}
            />
          </div>

          {/* End date (optional) */}
          <div>
            <Label>종료일 (선택)</Label>
            <InputDatePicker
              value={endDate}
              onValueChange={(v) => setEndDate(v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !amount}>
            {isLoading ? tc('loading') : tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
