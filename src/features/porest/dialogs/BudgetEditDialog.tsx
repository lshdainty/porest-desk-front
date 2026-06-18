import { useState } from 'react'
import { Icon } from '@/shared/ui/porest/primitives'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { KRW } from '@/shared/lib/porest/format'
import { tileRadius } from '@/shared/lib'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { getPaletteByColor } from './CategoryEditDialog'

export interface BudgetDraft {
  categoryRowId: number
  budgetAmount: number
}

const PRESETS = [100_000, 200_000, 300_000, 500_000, 800_000, 1_000_000]

export function BudgetEditDialog({
  budget,
  categories,
  existing,
  onClose,
  onSave,
  onDelete,
  mobile,
  submitting,
}: {
  budget: ExpenseBudget | null
  categories: ExpenseCategory[]
  existing: ExpenseBudget[]
  onClose: () => void
  onSave: (draft: BudgetDraft) => void
  onDelete?: () => void
  mobile: boolean
  submitting?: boolean
}) {
  const isNew = !budget

  // 선택 가능한 카테고리 = EXPENSE 타입의 **부모 카테고리(top-level)** 만.
  // 자식 leaf 는 현재 허용 안 함 — 자식의 지출은 부모로 roll-up 되어 집계됨.
  // 향후 leaf 단위 예산 요청 들어오면 제한을 풀면 됨.
  const selectableCats = categories.filter(
    c => c.expenseType === 'EXPENSE' && c.parentRowId == null,
  )

  const usedCatIds = new Set(
    existing
      .filter(b => b.categoryRowId !== null)
      .map(b => b.categoryRowId as number),
  )

  const initialCatId: number | null =
    budget?.categoryRowId ??
    selectableCats.find(c => !usedCatIds.has(c.rowId))?.rowId ??
    selectableCats[0]?.rowId ??
    null

  const [categoryRowId, setCategoryRowId] = useState<number | null>(initialCatId)
  const [limit, setLimit] = useState(String(budget?.budgetAmount ?? 300_000))
  const [touched, setTouched] = useState(false)

  const selectedCat = categories.find(c => c.rowId === categoryRowId) ?? null
  const palette = getPaletteByColor(selectedCat?.color)

  const dupCat = isNew && categoryRowId != null && usedCatIds.has(categoryRowId)
  const valid = categoryRowId != null && !dupCat && parseInt(limit) > 0

  const save = () => {
    setTouched(true)
    if (!valid || categoryRowId == null) return
    onSave({ categoryRowId, budgetAmount: parseInt(limit) || 0 })
  }

  const availableCats = isNew
    ? selectableCats.filter(c => !usedCatIds.has(c.rowId))
    : selectableCats

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={isNew ? '추가' : '저장'}
      saving={submitting}
      saveDisabled={touched && !valid}
      onCancel={onClose}
      onDelete={onDelete}
      deleting={submitting}
    />
  )

  return (
    <ModalShell
      title={isNew ? '카테고리 예산 추가' : '카테고리 예산 수정'}
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
            borderRadius: tileRadius(44),
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: palette.bg,
            color: palette.color,
          }}
        >
          <Icon name={selectedCat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
        </span>
        <div>
          <div
            style={{
              font: '700 15px/1.3 var(--font-sans)',
              color: 'var(--fg-primary)',
              letterSpacing: '-0.012em',
            }}
          >
            {selectedCat?.categoryName ?? '카테고리 선택'}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            월 한도 {KRW(parseInt(limit) || 0)}원
          </div>
        </div>
      </div>

      {isNew && (
        <Field style={{ marginBottom: 14 }}>
          <FieldLabel>카테고리</FieldLabel>
          {availableCats.length === 0 ? (
            <div
              style={{
                padding: 12,
                background: 'var(--bg-muted)',
                borderRadius: 'var(--radius-tile)',
                fontSize: 'var(--text-caption)',
                color: 'var(--fg-secondary)',
              }}
            >
              모든 지출 카테고리에 이미 예산이 설정되어 있어요.
            </div>
          ) : (
            <CategoryGrid>
              {availableCats.map(c => (
                <CategoryTile
                  key={c.rowId}
                  name={c.categoryName}
                  color={getPaletteByColor(c.color).color}
                  icon={c.icon}
                  active={categoryRowId === c.rowId}
                  onClick={() => setCategoryRowId(c.rowId)}
                />
              ))}
            </CategoryGrid>
          )}
        </Field>
      )}

      <Field style={{ marginBottom: 10 }}>
        <FieldLabel>월 한도 (원)</FieldLabel>
        <Input
          className="num"
          value={limit}
          onChange={e => {
            setLimit(e.target.value.replace(/[^0-9]/g, ''))
            setTouched(true)
          }}
          inputMode="numeric"
        />
      </Field>
      <ToggleGroup
        type="single"
        size="sm"
        value={PRESETS.includes(parseInt(limit)) ? limit : ''}
        onValueChange={(v) => v && setLimit(v)}
        className="mb-2.5 flex-wrap justify-start"
      >
        {PRESETS.map((p) => (
          <ToggleGroupItem key={p} value={String(p)} className="rounded-full">
            {(p / 10_000).toFixed(0)}만원
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ModalShell>
  )
}

export function MonthlyBudgetDialog({
  value,
  onClose,
  onSave,
  mobile,
  submitting,
}: {
  value: number
  onClose: () => void
  onSave: (v: number) => void
  mobile: boolean
  submitting?: boolean
}) {
  const [v, setV] = useState(String(value))
  const presets = [1_500_000, 2_000_000, 2_500_000, 3_000_000]

  const Footer = (
    <ModalFooter
      onSave={() => onSave(parseInt(v) || 0)}
      saveLabel="저장"
      saving={submitting}
      saveDisabled={(parseInt(v) || 0) <= 0}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title="월 예산 수정" onClose={onClose} size="sm" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 10 }}>
        <FieldLabel>월 총 예산 (원)</FieldLabel>
        <Input
          className="num"
          style={{ fontSize: 'var(--text-title-lg)', fontWeight: '700' }}
          value={v}
          onChange={e => setV(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          autoFocus
        />
      </Field>
      <ToggleGroup
        type="single"
        size="sm"
        value={presets.includes(parseInt(v)) ? v : ''}
        onValueChange={(val) => val && setV(val)}
        className="flex-wrap justify-start"
      >
        {presets.map((p) => (
          <ToggleGroupItem key={p} value={String(p)} className="rounded-full">
            {(p / 10_000).toFixed(0)}만원
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ModalShell>
  )
}
