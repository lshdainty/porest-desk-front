import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Icon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { KRW } from '@/shared/lib/porest/format'
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
    <>
      {onDelete ? (
        <button
          className="p-btn p-btn--ghost"
          onClick={onDelete}
          style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
          disabled={submitting}
        >
          <Trash2 size={14} />삭제
        </button>
      ) : (
        <span style={{ marginRight: 'auto' }} />
      )}
      <button className="p-btn p-btn--ghost" onClick={onClose} disabled={submitting}>
        취소
      </button>
      <button
        className="p-btn p-btn--primary"
        onClick={save}
        disabled={(touched && !valid) || submitting}
      >
        {isNew ? '추가' : '저장'}
      </button>
    </>
  )

  return (
    <ModalShell
      title={isNew ? '카테고리 예산 추가' : '카테고리 예산 수정'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <div className="cat-edit__preview">
        <span
          className="cat-edit__preview-chip"
          style={{ background: palette.bg, color: palette.color }}
        >
          <Icon name={selectedCat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
        </span>
        <div>
          <div className="cat-edit__preview-label">
            {selectedCat?.categoryName ?? '카테고리 선택'}
          </div>
          <div className="cat-edit__preview-sub">월 한도 {KRW(parseInt(limit) || 0)}원</div>
        </div>
      </div>

      {isNew && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label className="p-field__label">카테고리</label>
          {availableCats.length === 0 ? (
            <div
              style={{
                padding: 12,
                background: 'var(--pd-surface-subtle)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--fg-secondary)',
              }}
            >
              모든 지출 카테고리에 이미 예산이 설정되어 있어요.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {availableCats.map(c => {
                const active = categoryRowId === c.rowId
                const p = getPaletteByColor(c.color)
                return (
                  <button
                    key={c.rowId}
                    type="button"
                    onClick={() => setCategoryRowId(c.rowId)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 4px',
                      background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                      border: active
                        ? '1px solid var(--mossy-500)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      className="cat-ico cat-ico--sm"
                      style={{ background: p.bg, color: p.color }}
                    >
                      <Icon name={c.icon ?? 'tag'} size={16} strokeWidth={1.9} />
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: active ? 700 : 500,
                        color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                      }}
                    >
                      {c.categoryName}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="p-field" style={{ marginBottom: 10 }}>
        <label className="p-field__label">월 한도 (원)</label>
        <input
          className="p-input num"
          value={limit}
          onChange={e => {
            setLimit(e.target.value.replace(/[^0-9]/g, ''))
            setTouched(true)
          }}
          inputMode="numeric"
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {PRESETS.map(p => {
          const active = parseInt(limit) === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setLimit(String(p))}
              style={{
                padding: '6px 12px',
                background: active ? 'var(--bg-brand-subtle)' : 'var(--pd-surface-inset)',
                color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                border: active ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {(p / 10_000).toFixed(0)}만원
            </button>
          )
        })}
      </div>
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
    <>
      <span style={{ marginRight: 'auto' }} />
      <button className="p-btn p-btn--ghost" onClick={onClose} disabled={submitting}>
        취소
      </button>
      <button
        className="p-btn p-btn--primary"
        onClick={() => onSave(parseInt(v) || 0)}
        disabled={submitting || (parseInt(v) || 0) <= 0}
      >
        저장
      </button>
    </>
  )

  return (
    <ModalShell title="월 예산 수정" onClose={onClose} size="sm" footer={Footer} mobile={mobile}>
      <div className="p-field" style={{ marginBottom: 10 }}>
        <label className="p-field__label">월 총 예산 (원)</label>
        <input
          className="p-input num"
          style={{ fontSize: 20, fontWeight: 700 }}
          value={v}
          onChange={e => setV(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          autoFocus
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {presets.map(p => {
          const active = parseInt(v) === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setV(String(p))}
              style={{
                padding: '6px 12px',
                background: active ? 'var(--bg-brand-subtle)' : 'var(--pd-surface-inset)',
                color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                border: active ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {(p / 10_000).toFixed(0)}만원
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}
