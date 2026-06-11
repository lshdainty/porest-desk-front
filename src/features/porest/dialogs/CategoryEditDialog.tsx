import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Icon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { IconPicker } from '@/shared/ui/icon-picker'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { CAT_PALETTE, getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import type { ExpenseCategory, ExpenseCategoryFormValues, ExpenseType } from '@/entities/expense'

// 호환 re-export — 호출처가 `@/features/porest/dialogs` 에서 import 한다.
// eslint-disable-next-line react-refresh/only-export-components
export { CAT_PALETTE, getPaletteByColor }

/** @deprecated retained only for legacy re-exports; prefer ExpenseCategory. */
export interface CategoryItem {
  id: string
  label: string
  icon: string
  color: string
  bg: string
  kind: 'expense' | 'income'
  count: number
}

const ICON_CHOICES = [
  'utensils', 'coffee', 'bus', 'shopping-bag', 'home', 'heart-pulse',
  'ticket', 'receipt-text', 'book-open', 'piggy-bank', 'arrow-down-to-line',
  'car', 'plane', 'gift', 'dumbbell', 'gamepad-2', 'film', 'music',
  'baby', 'paw-print', 'shirt', 'sparkles', 'wrench', 'fuel',
  'pill', 'phone', 'wifi', 'tv', 'briefcase', 'graduation-cap',
  'trending-up', 'hand-coins', 'landmark', 'tag',
]

export function CategoryEditDialog({
  cat,
  defaultKind,
  defaultParentRowId,
  onClose,
  onSave,
  onDelete,
  mobile,
  existing,
  submitting,
}: {
  cat: ExpenseCategory | null
  defaultKind: ExpenseType
  defaultParentRowId?: number | null
  onClose: () => void
  onSave: (values: ExpenseCategoryFormValues) => void
  onDelete?: () => void
  mobile: boolean
  existing: ExpenseCategory[]
  submitting?: boolean
}) {
  const isNew = !cat
  const [label, setLabel] = useState(cat?.categoryName || '')
  const [kind, setKind] = useState<ExpenseType>(cat?.expenseType || defaultKind)
  const [icon, setIcon] = useState(cat?.icon || 'tag')
  const [paletteIdx, setPaletteIdx] = useState(() => {
    if (!cat?.color) return 0
    const idx = CAT_PALETTE.findIndex(p => p.baseHex === cat.color)
    return idx >= 0 ? idx : 0
  })
  const [parentRowId, setParentRowId] = useState<number | null>(
    cat?.parentRowId ?? defaultParentRowId ?? null,
  )
  const [touched, setTouched] = useState(false)

  const palette = CAT_PALETTE[paletteIdx]!
  const labelTrim = label.trim()
  const duplicate = existing.some(
    c => c.categoryName === labelTrim && c.rowId !== cat?.rowId,
  )
  const valid = labelTrim.length > 0 && labelTrim.length <= 12 && !duplicate
  const err =
    touched && !valid
      ? labelTrim.length === 0
        ? '이름을 입력해 주세요.'
        : labelTrim.length > 12
        ? '이름은 12자 이내로 입력해 주세요.'
        : duplicate
        ? '같은 이름의 카테고리가 있습니다.'
        : null
      : null

  // 상위 카테고리 후보: 같은 expenseType의 최상위(parentRowId=null)이고
  // 본인 자신 제외, 본인이 이미 자식을 가진 부모인 경우는 parent 변경 불가(깊이 2+ 방지)
  const selfHasChildren = cat?.hasChildren ?? false
  const parentOptions = existing.filter(c =>
    c.expenseType === kind &&
    c.parentRowId == null &&
    c.rowId !== cat?.rowId
  )
  const parentDisabled = selfHasChildren

  const save = () => {
    setTouched(true)
    if (!valid) return
    const values: ExpenseCategoryFormValues = {
      categoryName: labelTrim,
      icon,
      color: palette.baseHex,
      expenseType: kind,
      sortOrder: cat?.sortOrder,
      parentRowId: parentDisabled ? (cat?.parentRowId ?? null) : parentRowId,
    }
    onSave(values)
  }

  const Footer = (
    <>
      {onDelete ? (
        <Button
          variant="ghost"
          onClick={onDelete}
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
          disabled={submitting}
        >
          <Trash2 size={14} />삭제
        </Button>
      ) : (
        <span style={{ marginRight: 'auto' }} />
      )}
      <Button variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button
        onClick={save}
        disabled={touched && !valid}
        loading={submitting}
      >
        {isNew ? '추가' : '저장'}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={isNew ? '카테고리 추가' : '카테고리 편집'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-tile)',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: palette.bg,
            color: palette.color,
          }}
        >
          <Icon name={icon} size={20} strokeWidth={1.9} />
        </span>
        <div>
          <div
            style={{
              font: '700 15px/1.3 var(--font-sans)',
              color: 'var(--fg-primary)',
              letterSpacing: '-0.012em',
            }}
          >
            {labelTrim || '새 카테고리'}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {kind === 'EXPENSE' ? '지출 카테고리' : '수입 카테고리'} · 미리보기
          </div>
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>구분</FieldLabel>
        <Tabs
          value={kind}
          onValueChange={(v) => v && setKind(v as ExpenseType)}
        >
          <TabsList variant="pill" size="default" className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">지출</TabsTrigger>
            <TabsTrigger value="INCOME" className="flex-1">수입</TabsTrigger>
          </TabsList>
        </Tabs>
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>
          상위 카테고리
          <span style={{ color: 'var(--fg-tertiary)', fontWeight: '400', marginLeft: 4 }}>(선택)</span>
        </FieldLabel>
        <Select
          value={parentRowId == null ? '__root__' : String(parentRowId)}
          onValueChange={(v) => setParentRowId(v === '__root__' ? null : Number(v))}
          disabled={parentDisabled || parentOptions.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="— 최상위 카테고리로 두기 —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__root__">— 최상위 카테고리로 두기 —</SelectItem>
            {parentOptions.map(p => (
              <SelectItem key={p.rowId} value={String(p.rowId)}>
                {p.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {parentDisabled && (
          <div
            style={{
              fontSize: 'var(--text-badge)',
              color: 'var(--fg-tertiary)',
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            하위 카테고리가 있어 상위를 변경할 수 없어요.
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>이름</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={label}
          onChange={e => {
            setLabel(e.target.value)
            setTouched(true)
          }}
          placeholder="예: 반려동물, 부수입"
          maxLength={14}
          autoFocus
        />
        <div
          style={{
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            marginTop: 4,
            textAlign: 'right',
          }}
        >
          {err ? (
            <span style={{ color: 'var(--fg-expense)' }}>{err}</span>
          ) : (
            <span>{labelTrim.length}/12</span>
          )}
        </div>
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>색상</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={String(paletteIdx)}
          onValueChange={v => setPaletteIdx(Number(v))}
          options={CAT_PALETTE.map((p, i) => ({
            value: String(i),
            bg: p.bg,
            fg: p.color,
            label: `색상 ${i + 1}`,
          }))}
        />
      </Field>

      <Field style={{ marginBottom: 4 }}>
        <FieldLabel>아이콘</FieldLabel>
        <IconPicker icons={ICON_CHOICES} value={icon} onChange={setIcon} />
      </Field>
    </ModalShell>
  )
}
