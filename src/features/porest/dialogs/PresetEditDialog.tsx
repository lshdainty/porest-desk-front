import { useEffect, useMemo, useState } from 'react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
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

const PAYMENT_METHODS: { v: string; l: string }[] = [
  { v: 'CASH', l: '현금' },
  { v: 'CARD', l: '카드' },
  { v: 'TRANSFER', l: '계좌이체' },
  { v: 'OTHER', l: '기타' },
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
    <>
      <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button
        type="button"
        onClick={submit}
        disabled={!canSave}
        loading={submitting}
      >
        {isNew ? '추가' : '저장'}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={isNew ? '프리셋 추가' : '프리셋 수정'}
      onClose={onClose}
      mobile={mobile}
      size="md"
      footer={Footer}
    >
      {/* 타입 segment */}
      <ToggleGroup
        type="single"
        variant="segmented"
        value={type}
        onValueChange={(v) => v && setType(v as 'EXPENSE' | 'INCOME')}
        className="mb-4"
      >
        <ToggleGroupItem value="EXPENSE">지출</ToggleGroupItem>
        <ToggleGroupItem value="INCOME">수입</ToggleGroupItem>
      </ToggleGroup>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>프리셋 이름</FieldLabel>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 점심 도시락"
          autoFocus
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>카테고리</FieldLabel>
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
        <FieldLabel>기본 내역</FieldLabel>
        <Input
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          placeholder="예: 한솥 도시락"
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>결제 수단</FieldLabel>
        <Select
          value={paymentMethod || '__none__'}
          onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="선택 안 함" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">선택 안 함</SelectItem>
            {PAYMENT_METHODS.map(pm => (
              <SelectItem key={pm.v} value={pm.v}>
                {pm.l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>계좌·카드</FieldLabel>
        {assetsQ.isLoading ? (
          <SkeletonBase className="h-9 w-full rounded-md" />
        ) : (
          <Select
            value={assetRowId != null ? String(assetRowId) : '__none__'}
            onValueChange={(v) => setAssetRowId(v === '__none__' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택 안 함" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">선택 안 함</SelectItem>
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
            <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>고정 금액 사용</div>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              꺼두면 불러올 때 금액이 비어있어요. 매번 다른 금액일 때 편해요.
            </div>
          </div>
        </label>

        {lockAmount && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <FieldLabel style={{ marginBottom: 4 }}>
              고정 금액
            </FieldLabel>
            <div style={{ position: 'relative' }}>
              <Input
                className="num"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                style={{ paddingRight: 36, textAlign: 'right', fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)' }}
                inputMode="numeric"
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--fg-tertiary)',
                  fontWeight: 'var(--fw-bold)',
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
