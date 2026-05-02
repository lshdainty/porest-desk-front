import { useEffect, useMemo, useState } from 'react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { renderIcon } from '@/shared/lib'
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
        disabled={!canSave || submitting}
      >
        {submitting ? '저장 중…' : isNew ? '추가' : '저장'}
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 2,
          padding: 3,
          background: 'var(--pd-surface-inset)',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        {(['EXPENSE', 'INCOME'] as const).map(v => {
          const active = type === v
          const color = v === 'EXPENSE' ? 'var(--berry-700)' : 'var(--mossy-700)'
          return (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              style={{
                background: active ? 'var(--bg-surface)' : 'transparent',
                color: active ? color : 'var(--fg-secondary)',
                border: 0,
                padding: '8px 0',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: active ? 'var(--shadow-xs)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {v === 'EXPENSE' ? '지출' : '수입'}
            </button>
          )
        })}
      </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {topCategories.map(c => {
            const selectedCat = categoryRowId != null ? categories.find(x => x.rowId === categoryRowId) : null
            const selectedParentId = selectedCat ? (selectedCat.parentRowId ?? selectedCat.rowId) : null
            const active = selectedParentId === c.rowId
            const color = c.color ?? 'var(--mossy-600)'
            return (
              <button
                key={c.rowId}
                type="button"
                onClick={() => {
                  const firstChild = childrenByParent.get(c.rowId)?.[0]
                  setCategoryRowId(firstChild ? firstChild.rowId : c.rowId)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 4px',
                  background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                  border: active ? '1px solid var(--mossy-500)' : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `color-mix(in oklch, ${color} 18%, transparent)`,
                    color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderIcon(c.icon, c.categoryName.charAt(0), 16)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {c.categoryName}
                </span>
              </button>
            )
          })}
        </div>
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
      </Field>

      <div style={{ padding: 12, background: 'var(--pd-surface-inset)', borderRadius: 10, marginBottom: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={lockAmount}
            onChange={e => setLockAmount(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--fg-brand-strong)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>고정 금액 사용</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
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
                style={{ paddingRight: 36, textAlign: 'right', fontSize: 15, fontWeight: 700 }}
                inputMode="numeric"
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 13,
                  color: 'var(--fg-tertiary)',
                  fontWeight: 700,
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
