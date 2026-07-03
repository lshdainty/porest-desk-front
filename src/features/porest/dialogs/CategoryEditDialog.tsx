import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
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
  const { t } = useTranslation('category')
  const { t: tc } = useTranslation('common')
  const { t: te } = useTranslation('expense')
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
        ? t('nameRequired')
        : labelTrim.length > 12
        ? t('nameTooLong')
        : duplicate
        ? t('nameDuplicate')
        : null
      : null

  // 상위 카테고리 후보: 같은 expenseType의 최상위(parentRowId=null)이고 본인 자신 제외.
  // (자식 보유 부모는 애초에 '상위 카테고리' 필드를 숨기므로 여기서 따로 막지 않음.)
  const parentOptions = existing.filter(c =>
    c.expenseType === kind &&
    c.parentRowId == null &&
    c.rowId !== cat?.rowId
  )

  const save = () => {
    setTouched(true)
    if (!valid) return
    const values: ExpenseCategoryFormValues = {
      categoryName: labelTrim,
      icon,
      color: palette.baseHex,
      expenseType: kind,
      sortOrder: cat?.sortOrder,
      parentRowId: parentRowId,
    }
    onSave(values)
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={isNew ? t('add') : tc('save')}
      saving={submitting}
      saveDisabled={touched && !valid}
      onCancel={onClose}
      onDelete={onDelete}
      deleteLabel={tc('delete')}
      deleting={submitting}
    />
  )

  return (
    <ModalShell
      title={isNew ? te('addCategory') : t('editTitle')}
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
            {labelTrim || t('newCategory')}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {kind === 'EXPENSE' ? t('expenseCategory') : t('incomeCategory')} · {t('preview')}
          </div>
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('type')}</FieldLabel>
        <Tabs
          value={kind}
          onValueChange={(v) => v && setKind(v as ExpenseType)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">{te('expense')}</TabsTrigger>
            <TabsTrigger value="INCOME" className="flex-1">{te('income')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </Field>

      {/* 상위 카테고리 정책:
          - 신규: 최상위 또는 특정 부모 아래로 생성 가능(루트 옵션 포함).
          - 자식 편집: 다른 부모로만 이동(승격='최상위로 두기' 금지 → 루트 옵션 제거).
          - 최상위 편집: 강등 불가 → 필드 자체를 숨김. */}
      {(isNew || cat?.parentRowId != null) && (
        <Field style={{ marginBottom: 14 }}>
          <FieldLabel>
            {t('parentCategory')}
            {isNew && (
              <span style={{ color: 'var(--fg-tertiary)', fontWeight: '400', marginLeft: 4 }}>{t('optional')}</span>
            )}
          </FieldLabel>
          <Select
            value={parentRowId == null ? '__root__' : String(parentRowId)}
            onValueChange={(v) => setParentRowId(v === '__root__' ? null : Number(v))}
            disabled={parentOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={isNew ? t('rootOption') : t('selectParent')} />
            </SelectTrigger>
            <SelectContent>
              {isNew && <SelectItem value="__root__">{t('rootOption')}</SelectItem>}
              {parentOptions.map(p => (
                <SelectItem key={p.rowId} value={String(p.rowId)}>
                  {p.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isNew && (
            <div
              style={{
                fontSize: 'var(--text-badge)',
                color: 'var(--fg-tertiary)',
                marginTop: 4,
              }}
            >
              {t('parentMoveHint')}
            </div>
          )}
        </Field>
      )}

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('name')}</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={label}
          onChange={e => {
            setLabel(e.target.value)
            setTouched(true)
          }}
          placeholder={t('namePlaceholder')}
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
        <FieldLabel>{te('form.color')}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={String(paletteIdx)}
          onValueChange={v => setPaletteIdx(Number(v))}
          options={CAT_PALETTE.map((p, i) => ({
            value: String(i),
            bg: p.bg,
            fg: p.color,
            label: t('colorN', { n: i + 1 }),
          }))}
        />
      </Field>

      <Field style={{ marginBottom: 4 }}>
        <FieldLabel>{te('form.icon')}</FieldLabel>
        <IconPicker value={icon} onChange={setIcon} />
      </Field>
    </ModalShell>
  )
}
