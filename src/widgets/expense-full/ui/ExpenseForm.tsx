import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown, Search, Loader2 } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { toLocalIso } from '@/shared/lib/porest/format'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Label } from '@/shared/ui/label'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/ui/dialog'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerBody,
} from '@/shared/ui/drawer'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/shared/ui/popover'
import { useExpenseTemplates } from '@/features/expense-template'
import { useGroups } from '@/features/group'
import { useAvailableBenefits } from '@/features/card-catalog'
import type { ExpenseTemplate } from '@/entities/expense-template'
import type { Expense, ExpenseFormValues, ExpenseType, ExpenseCategory } from '@/entities/expense'
import { buildCategoryTree, getSelectableCategories } from '@/entities/expense'
import type { Asset } from '@/entities/asset'
import { Sparkles } from 'lucide-react'

interface ExpenseFormProps {
  expense?: Expense | null
  categories: ExpenseCategory[]
  assets?: Asset[]
  defaultDate?: string
  defaultValues?: Partial<ExpenseFormValues>
  recentMerchants?: string[]
  onSubmit: (data: ExpenseFormValues) => void
  onClose: () => void
  isLoading: boolean
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const

export const ExpenseForm = ({
  expense,
  categories,
  assets = [],
  defaultDate,
  defaultValues,
  recentMerchants = [],
  onSubmit,
  onClose,
  isLoading,
}: ExpenseFormProps) => {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const { data: groups = [] } = useGroups()

  const [expenseType, setExpenseType] = useState<ExpenseType>(expense?.expenseType ?? defaultValues?.expenseType ?? 'EXPENSE')
  const [categoryRowId, setCategoryRowId] = useState<number>(expense?.categoryRowId ?? defaultValues?.categoryRowId ?? 0)
  const [amount, setAmount] = useState<string>(expense?.amount?.toString() ?? defaultValues?.amount?.toString() ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? defaultDate ?? toLocalIso()
  )
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '')
  const [assetRowId, setAssetRowId] = useState<number>(expense?.assetRowId ?? 0)
  const [merchant, setMerchant] = useState(expense?.merchant ?? '')
  const [groupRowId, setGroupRowId] = useState<number>(expense?.groupRowId ?? 0)

  // Merchant autocomplete
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false)
  const merchantRef = useRef<HTMLDivElement>(null)

  const merchantSuggestions = useMemo(() => {
    if (!merchant.trim() || recentMerchants.length === 0) return []
    const lower = merchant.toLowerCase()
    return recentMerchants
      .filter((m) => m.toLowerCase().includes(lower) && m.toLowerCase() !== lower)
      .slice(0, 5)
  }, [merchant, recentMerchants])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (merchantRef.current && !merchantRef.current.contains(e.target as Node)) {
        setShowMerchantSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Template loading
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const { data: templates, isLoading: templatesLoading } = useExpenseTemplates()

  const filteredTemplates = (templates ?? []).filter((tpl) =>
    tpl.templateName.toLowerCase().includes(templateSearch.toLowerCase())
  )

  const handleLoadTemplate = useCallback((template: ExpenseTemplate) => {
    setExpenseType(template.expenseType)
    if (template.categoryRowId) setCategoryRowId(template.categoryRowId)
    if (template.amount) setAmount(String(template.amount))
    if (template.description) setDescription(template.description)
    if (template.merchant) setMerchant(template.merchant)
    if (template.paymentMethod) setPaymentMethod(template.paymentMethod)
    if (template.assetRowId) setAssetRowId(template.assetRowId)
    setTemplatePopoverOpen(false)
    setTemplateSearch('')
  }, [])

  const filteredCategories = categories.filter((c) => c.expenseType === expenseType)
  const categoryTree = buildCategoryTree(filteredCategories)
  const selectableCategories = getSelectableCategories(filteredCategories)

  // 선택된 asset에 cardCatalog가 있고 expense 타입이면 해당 카드의 혜택 자동 조회
  const selectedAsset = useMemo(
    () => assets.find((a) => a.rowId === assetRowId),
    [assets, assetRowId]
  )
  const cardCatalogRowId = selectedAsset?.cardCatalog?.rowId ?? null
  const { data: availableBenefits = [] } = useAvailableBenefits(
    expenseType === 'EXPENSE' ? cardCatalogRowId : null,
    expenseType === 'EXPENSE' && categoryRowId > 0 ? categoryRowId : null
  )

  useEffect(() => {
    if (selectableCategories.length > 0 && categoryRowId === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryRowId(selectableCategories[0]?.rowId ?? 0)
    }
  }, [selectableCategories, categoryRowId])

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
      groupRowId: groupRowId || undefined,
    }
    onSubmit(data)
  }, [categoryRowId, assetRowId, expenseType, amount, description, expenseDate, merchant, paymentMethod, groupRowId, onSubmit])

  const formContent = (
    <div className="space-y-4">
      {/* Load from template - only for new transactions */}
      {!expense && (
        <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <FileDown size={16} />
              {t('loadFromTemplate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder={t('searchTemplatePlaceholder')}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl) => (
                  <button
                    key={tpl.rowId}
                    onClick={() => handleLoadTemplate(tpl)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{tpl.templateName}</span>
                        <span
                          className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                            tpl.expenseType === 'EXPENSE'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          )}
                        >
                          {t(tpl.expenseType === 'EXPENSE' ? 'expense' : 'income')}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {tpl.categoryName && <span>{tpl.categoryName}</span>}
                        {tpl.amount && <span>{tpl.amount.toLocaleString()}원</span>}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('noTemplatesFound')}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

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
            {categoryTree.map((node, index) =>
              node.children.length > 0 ? (
                <SelectGroup key={node.rowId}>
                  {index > 0 && <SelectSeparator />}
                  <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                    {node.color && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: node.color }}
                      />
                    )}
                    {node.icon && <span className="inline-flex mr-1 align-middle">{renderIcon(node.icon, '', 14)}</span>}{node.categoryName}
                  </SelectLabel>
                  {node.children.map((child) => (
                    <SelectItem key={child.rowId} value={String(child.rowId)} className="pl-11">
                      {child.icon && <span className="inline-flex mr-1 align-middle">{renderIcon(child.icon, '', 14)}</span>}{child.categoryName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : (
                <SelectItem key={node.rowId} value={String(node.rowId)}>
                  {node.icon && <span className="inline-flex mr-1 align-middle">{renderIcon(node.icon, '', 14)}</span>}{node.categoryName}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>{t('form.date')}</Label>
        <InputDatePicker
          value={expenseDate.slice(0, 10)}
          onValueChange={(v) => setExpenseDate(v)}
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

      {/* Available benefits banner (카드 자산 + 지출 카테고리 선택 시) */}
      {availableBenefits.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
            <Sparkles size={14} />
            이 결제에 적용될 수 있는 혜택
          </div>
          <ul className="space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
            {availableBenefits.slice(0, 3).map((b) => (
              <li key={b.rowId}>
                <span className="font-medium">[{b.category}]</span> {b.summary ?? b.title ?? ''}
              </li>
            ))}
            {availableBenefits.length > 3 && (
              <li className="text-muted-foreground">그 외 {availableBenefits.length - 3}개…</li>
            )}
          </ul>
        </div>
      )}

      {/* Merchant with autocomplete */}
      <div className="space-y-1.5" ref={merchantRef}>
        <Label>{t('form.merchant')}</Label>
        <div className="relative">
          <Input
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value)
              setShowMerchantSuggestions(true)
            }}
            onFocus={() => setShowMerchantSuggestions(true)}
            placeholder={t('form.merchantPlaceholder')}
          />
          {showMerchantSuggestions && merchantSuggestions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {merchantSuggestions.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMerchant(m)
                    setShowMerchantSuggestions(false)
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
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

      {/* Group */}
      {groups.length > 0 && (
        <div className="space-y-1.5">
          <Label>{t('selectGroup')}</Label>
          <Select
            value={groupRowId ? String(groupRowId) : '__none__'}
            onValueChange={(val) => setGroupRowId(val === '__none__' ? 0 : Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('personal')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('personal')}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.rowId} value={String(group.rowId)}>
                  {group.groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  const footerContent = (
    <>
      <Button variant="outline" onClick={onClose}>
        {tc('cancel')}
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !categoryRowId || !amount}
      >
        {isLoading ? tc('loading') : tc('save')}
      </Button>
    </>
  )

  // 모바일: vaul 기반 Drawer (swipe-to-dismiss 지원)
  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={(open) => { if (!open) onClose() }}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {expense ? t('editTransaction') : t('addTransaction')}
            </DrawerTitle>
          </DrawerHeader>
          <DrawerBody>{formContent}</DrawerBody>
          <DrawerFooter>{footerContent}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  // 데스크톱: 기존 Dialog 유지
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? t('editTransaction') : t('addTransaction')}
          </DialogTitle>
        </DialogHeader>
        {formContent}
        <DialogFooter>
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
