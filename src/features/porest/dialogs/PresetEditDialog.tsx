import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Input } from '@/shared/ui/input'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field, FieldLabel } from '@/shared/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  useCreateExpenseTemplate,
  useExpenseCategories,
  useUpdateExpenseTemplate,
} from '@/features/expense'
import { useAssets } from '@/features/asset'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import type { ExpenseTemplate, ExpenseTemplateFormValues } from '@/entities/expense-template'
import type { ExpenseType } from '@/entities/expense'

const PAYMENT_METHODS: { v: string; lKey: string }[] = [
  { v: 'CASH', lKey: 'form.paymentMethod.CASH' },
  { v: 'CARD', lKey: 'form.paymentMethod.CARD' },
  { v: 'TRANSFER', lKey: 'paymentTransferFull' },
  { v: 'OTHER', lKey: 'form.paymentMethod.OTHER' },
]

export function PresetEditDialog({
  preset,
  mobile,
  onClose,
}: {
  preset: ExpenseTemplate | null
  mobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('expense')
  const { t: tCommon } = useTranslation('common')
  const isNew = !preset
  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const createMut = useCreateExpenseTemplate()
  const updateMut = useUpdateExpenseTemplate()

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data])
  const assets = useMemo(() => assetsQ.data?.assets ?? [], [assetsQ.data])

  const [type, setType] = useState<ExpenseType>(preset?.expenseType ?? 'EXPENSE')
  const [name, setName] = useState(preset?.templateName ?? '')
  const [categoryRowId, setCategoryRowId] = useState<number | null>(preset?.categoryRowId ?? null)
  const [merchant, setMerchant] = useState(preset?.merchant ?? '')
  const [paymentMethod, setPaymentMethod] = useState(preset?.paymentMethod ?? '')
  const [assetRowId, setAssetRowId] = useState<number | null>(preset?.assetRowId ?? null)
  const [lockAmount, setLockAmount] = useState(preset?.lockAmount === 'Y')
  const [amount, setAmount] = useState(preset?.amount != null ? String(preset.amount) : '')

  // 타입이 바뀌면 해당 타입의 카테고리가 아닌 경우 초기화
  useEffect(() => {
    if (categoryRowId == null) return
    const cat = categories.find(c => c.rowId === categoryRowId)
    if (!cat || cat.expenseType !== type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryRowId(null)
    }
  }, [type, categoryRowId, categories])

  const topCategories = useMemo(
    () =>
      categories
        .filter(c => c.expenseType === type && c.parentRowId == null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, type],
  )

  const childrenByParent = useMemo(() => {
    const map = new Map<number, typeof categories>()
    for (const c of categories) {
      if (c.parentRowId == null || c.expenseType !== type) continue
      const arr = map.get(c.parentRowId) ?? []
      arr.push(c)
      map.set(c.parentRowId, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder)
    return map
  }, [categories, type])

  const canSave = name.trim().length > 0 && categoryRowId != null
  const submitting = createMut.isPending || updateMut.isPending

  const submit = () => {
    if (!canSave) return
    const payload: ExpenseTemplateFormValues = {
      templateName: name.trim(),
      categoryRowId,
      assetRowId: assetRowId ?? undefined,
      expenseType: type,
      amount: lockAmount ? Number(amount || 0) : undefined,
      merchant: merchant.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
      lockAmount: lockAmount ? 'Y' : 'N',
    }
    if (preset) {
      updateMut.mutate({ id: preset.rowId, data: payload }, { onSuccess: onClose })
    } else {
      createMut.mutate(payload, { onSuccess: onClose })
    }
  }

  const Footer = (
    <ModalFooter
      onSave={submit}
      saveLabel={isNew ? tCommon('add') : tCommon('save')}
      saving={submitting}
      saveDisabled={!canSave}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell
      title={isNew ? t('preset.add') : t('preset.edit')}
      onClose={onClose}
      mobile={mobile}
      size="md"
      footer={Footer}
    >
      {/* 타입 segment */}
      <Tabs
        value={type}
        onValueChange={(v) => v && setType(v as 'EXPENSE' | 'INCOME')}
        className="mb-4"
      >
        <TabsList variant="pill" size="sm" className="w-full">
          <TabsTrigger value="EXPENSE" className="flex-1">{t('expense')}</TabsTrigger>
          <TabsTrigger value="INCOME" className="flex-1">{t('income')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('savePreset.name')}</FieldLabel>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('preset.namePlaceholder')}
          autoFocus
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('category')}</FieldLabel>
        {categoriesQ.isLoading ? (
          <CategoryGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBase key={i} className="h-16 w-full rounded-md" />
            ))}
          </CategoryGrid>
        ) : (
          <CategoryGrid>
            {topCategories.map(c => {
              const selectedCat = categoryRowId != null ? categories.find(x => x.rowId === categoryRowId) : null
              const selectedParentId = selectedCat ? (selectedCat.parentRowId ?? selectedCat.rowId) : null
              return (
                <CategoryTile
                  key={c.rowId}
                  name={c.categoryName}
                  color={c.color ?? undefined}
                  icon={c.icon}
                  active={selectedParentId === c.rowId}
                  onClick={() => {
                    const firstChild = childrenByParent.get(c.rowId)?.[0]
                    setCategoryRowId(firstChild ? firstChild.rowId : c.rowId)
                  }}
                />
              )
            })}
          </CategoryGrid>
        )}
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('preset.defaultMerchant')}</FieldLabel>
        <Input
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          placeholder={t('preset.merchantPlaceholder')}
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('paymentMethodLabel')}</FieldLabel>
        <Select
          value={paymentMethod || '__none__'}
          onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectNone')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t('selectNone')}</SelectItem>
            {PAYMENT_METHODS.map(pm => (
              <SelectItem key={pm.v} value={pm.v}>
                {t(pm.lKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('accountCard')}</FieldLabel>
        {assetsQ.isLoading ? (
          <SkeletonBase className="h-9 w-full rounded-md" />
        ) : (
          <Select
            value={assetRowId != null ? String(assetRowId) : '__none__'}
            onValueChange={(v) => setAssetRowId(v === '__none__' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('selectNone')}</SelectItem>
              {assets.map(a => (
                <SelectItem key={a.rowId} value={String(a.rowId)}>
                  {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <div style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-tile)', marginBottom: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Checkbox
            size="sm"
            checked={lockAmount}
            onCheckedChange={(c) => setLockAmount(c === true)}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>{t('preset.lockAmountTitle')}</div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {t('preset.lockAmountDesc')}
            </div>
          </div>
        </label>

        {lockAmount && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <FieldLabel style={{ marginBottom: 4 }}>
              {t('preset.lockAmountLabel')}
            </FieldLabel>
            <div style={{ position: 'relative' }}>
              <Input
                className="num"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                style={{ paddingRight: 36, textAlign: 'right', fontSize: 'var(--text-body-lg)', fontWeight: '700' }}
                inputMode="numeric"
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 'var(--text-label-sm)',
                  color: 'var(--fg-tertiary)',
                  fontWeight: '700',
                  pointerEvents: 'none',
                }}
              >
                원
              </span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
