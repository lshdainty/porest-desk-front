import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, renderIcon } from '@/shared/lib'
import type { ExpenseType, ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'
import type { ExpenseTemplate, ExpenseTemplateFormValues } from '@/entities/expense-template'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
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

interface ExpenseTemplateFormProps {
  template?: ExpenseTemplate | null
  categories: ExpenseCategory[]
  assets: Asset[]
  onSubmit: (data: ExpenseTemplateFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const

export const ExpenseTemplateForm = ({
  template,
  categories,
  assets,
  onSubmit,
  onClose,
  isLoading,
}: ExpenseTemplateFormProps) => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')

  const [templateName, setTemplateName] = useState(template?.templateName ?? '')
  const [expenseType, setExpenseType] = useState<ExpenseType>(template?.expenseType ?? 'EXPENSE')
  const [categoryRowId, setCategoryRowId] = useState<number>(template?.categoryRowId ?? 0)
  const [assetRowId, setAssetRowId] = useState<number>(template?.assetRowId ?? 0)
  const [amount, setAmount] = useState<string>(template?.amount?.toString() ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [merchant, setMerchant] = useState(template?.merchant ?? '')
  const [paymentMethod, setPaymentMethod] = useState(template?.paymentMethod ?? '')

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)

  const handleSubmit = useCallback(() => {
    if (!templateName) return
    const data: ExpenseTemplateFormValues = {
      templateName,
      categoryRowId: categoryRowId || undefined,
      assetRowId: assetRowId || undefined,
      expenseType,
      amount: amount ? parseFloat(amount) : undefined,
      description: description || undefined,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
    }
    onSubmit(data)
  }, [templateName, categoryRowId, assetRowId, expenseType, amount, description, merchant, paymentMethod, onSubmit])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {template ? t('editTemplate') : t('addTemplate')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template name */}
          <div>
            <Label>{t('templateName')}</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t('templateNamePlaceholder')}
            />
          </div>

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
            />
          </div>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !templateName}>
            {isLoading ? tc('loading') : tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
