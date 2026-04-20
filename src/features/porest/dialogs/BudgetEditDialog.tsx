import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CATEGORIES, type CategoryKey } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { CatIcon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'

export interface BudgetItem {
  cat: CategoryKey
  spent: number
  limit: number
}

const PRESETS = [100_000, 200_000, 300_000, 500_000, 800_000, 1_000_000]

export function BudgetEditDialog({
  budget,
  existing,
  onClose,
  onSave,
  onDelete,
  mobile,
}: {
  budget: BudgetItem | null
  existing: BudgetItem[]
  onClose: () => void
  onSave: (b: BudgetItem) => void
  onDelete?: () => void
  mobile: boolean
}) {
  const isNew = !budget
  const [cat, setCat] = useState<CategoryKey>(budget?.cat || 'food')
  const [limit, setLimit] = useState(String(budget?.limit ?? 300_000))
  const [touched, setTouched] = useState(false)

  const dupCat = isNew && existing.some(b => b.cat === cat)
  const valid = !dupCat && parseInt(limit) > 0

  const save = () => {
    setTouched(true)
    if (!valid) return
    onSave({ cat, limit: parseInt(limit) || 0, spent: budget?.spent ?? 0 })
  }

  const availableCats = (Object.keys(CATEGORIES) as CategoryKey[])
    .filter(c => CATEGORIES[c].label !== '수입')
    .filter(c => (isNew ? !existing.some(b => b.cat === c) : true))

  const Footer = (
    <>
      {onDelete ? (
        <button
          className="p-btn p-btn--ghost"
          onClick={onDelete}
          style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
        >
          <Trash2 size={14} />삭제
        </button>
      ) : (
        <span style={{ marginRight: 'auto' }} />
      )}
      <button className="p-btn p-btn--ghost" onClick={onClose}>
        취소
      </button>
      <button className="p-btn p-btn--primary" onClick={save} disabled={touched && !valid}>
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
          style={{ background: CATEGORIES[cat].bg, color: CATEGORIES[cat].color }}
        >
          <CatIcon cat={cat} size="sm" />
        </span>
        <div>
          <div className="cat-edit__preview-label">{CATEGORIES[cat].label}</div>
          <div className="cat-edit__preview-sub">월 한도 {KRW(parseInt(limit) || 0)}원</div>
        </div>
      </div>

      {isNew && (
        <div className="p-field" style={{ marginBottom: 14 }}>
          <label className="p-field__label">카테고리</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {availableCats.map(c => {
              const active = cat === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 4px',
                    background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                    border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <CatIcon cat={c} size="sm" />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                    }}
                  >
                    {CATEGORIES[c].label.split('·')[0]}
                  </span>
                </button>
              )
            })}
          </div>
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
                background: active ? 'var(--mossy-100)' : 'var(--mist-50)',
                color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
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
      {!isNew && budget && budget.spent > 0 && (
        <div
          style={{
            padding: 12,
            background: 'var(--mist-100)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--fg-secondary)',
          }}
        >
          이번 달 이미 <b className="num">{KRW(budget.spent)}원</b> 사용했어요.
        </div>
      )}
    </ModalShell>
  )
}

export function MonthlyBudgetDialog({
  value,
  onClose,
  onSave,
  mobile,
}: {
  value: number
  onClose: () => void
  onSave: (v: number) => void
  mobile: boolean
}) {
  const [v, setV] = useState(String(value))
  const presets = [1_500_000, 2_000_000, 2_500_000, 3_000_000]

  const Footer = (
    <>
      <span style={{ marginRight: 'auto' }} />
      <button className="p-btn p-btn--ghost" onClick={onClose}>
        취소
      </button>
      <button className="p-btn p-btn--primary" onClick={() => onSave(parseInt(v) || 0)}>
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
                background: active ? 'var(--mossy-100)' : 'var(--mist-50)',
                color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
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
