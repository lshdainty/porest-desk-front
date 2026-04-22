import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { Icon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { ExpenseCategory, ExpenseCategoryFormValues, ExpenseType } from '@/entities/expense'

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

// eslint-disable-next-line react-refresh/only-export-components
export const CAT_PALETTE: { color: string; bg: string }[] = [
  { color: 'oklch(0.55 0.12 55)',   bg: 'oklch(0.96 0.03 70)' },
  { color: 'oklch(0.50 0.08 50)',   bg: 'oklch(0.96 0.03 60)' },
  { color: 'oklch(0.50 0.1 230)',   bg: 'oklch(0.96 0.02 230)' },
  { color: 'oklch(0.50 0.12 340)',  bg: 'oklch(0.96 0.035 340)' },
  { color: 'oklch(0.50 0.1 140)',   bg: 'oklch(0.96 0.025 135)' },
  { color: 'oklch(0.55 0.13 25)',   bg: 'oklch(0.96 0.03 25)' },
  { color: 'oklch(0.50 0.12 290)',  bg: 'oklch(0.96 0.035 290)' },
  { color: 'oklch(0.48 0.012 195)', bg: 'var(--mist-200)' },
  { color: 'oklch(0.52 0.1 215)',   bg: 'oklch(0.96 0.03 210)' },
  { color: 'var(--bark-700)',       bg: 'var(--bark-100)' },
  { color: 'var(--mossy-800)',      bg: 'var(--mossy-100)' },
  { color: 'oklch(0.50 0.14 15)',   bg: 'oklch(0.96 0.035 15)' },
]

// eslint-disable-next-line react-refresh/only-export-components
export const getPaletteByColor = (color: string | null | undefined) => {
  if (!color) return CAT_PALETTE[0]!
  // 1) CAT_PALETTE 와 정확히 일치하는 oklch/var 문자열이면 그 팔레트 사용
  const found = CAT_PALETTE.find(p => p.color === color)
  if (found) return found
  // 2) hex(#RRGGBB) 로 들어오면 그 색을 그대로 아이콘 색으로 쓰고
  //    배경은 같은 hex 의 10% 알파로 파생 — DB 시드/외부 입력 호환.
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color)) {
    const hex = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color
    return { color: hex, bg: `${hex}1a` }
  }
  // 3) 알 수 없는 형식은 첫 팔레트 폴백
  return CAT_PALETTE[0]!
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
    const idx = CAT_PALETTE.findIndex(p => p.color === cat.color)
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
      color: palette.color,
      expenseType: kind,
      sortOrder: cat?.sortOrder,
      parentRowId: parentDisabled ? (cat?.parentRowId ?? null) : parentRowId,
    }
    onSave(values)
  }

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
        {submitting ? '저장 중…' : isNew ? '추가' : '저장'}
      </button>
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
      <div className="cat-edit__preview">
        <span
          className="cat-edit__preview-chip"
          style={{ background: palette.bg, color: palette.color }}
        >
          <Icon name={icon} size={20} strokeWidth={1.9} />
        </span>
        <div>
          <div className="cat-edit__preview-label">{labelTrim || '새 카테고리'}</div>
          <div className="cat-edit__preview-sub">
            {kind === 'EXPENSE' ? '지출 카테고리' : '수입 카테고리'} · 미리보기
          </div>
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">구분</label>
        <div className="p-seg">
          <button
            type="button"
            className={`p-seg__btn ${kind === 'EXPENSE' ? 'active' : ''}`}
            onClick={() => setKind('EXPENSE')}
          >
            지출
          </button>
          <button
            type="button"
            className={`p-seg__btn ${kind === 'INCOME' ? 'active' : ''}`}
            onClick={() => setKind('INCOME')}
          >
            수입
          </button>
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">
          상위 카테고리
          <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400, marginLeft: 4 }}>(선택)</span>
        </label>
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
          <div className="cat-edit__help" style={{ color: 'var(--fg-tertiary)', marginTop: 4 }}>
            하위 카테고리가 있어 상위를 변경할 수 없어요.
          </div>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">이름</label>
        <input
          className={`p-input ${err ? 'p-input--error' : ''}`}
          value={label}
          onChange={e => {
            setLabel(e.target.value)
            setTouched(true)
          }}
          placeholder="예: 반려동물, 부수입"
          maxLength={14}
          autoFocus
        />
        <div className="cat-edit__help">
          {err ? <span className="err">{err}</span> : <span>{labelTrim.length}/12</span>}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">색상</label>
        <div className="cat-edit__colors">
          {CAT_PALETTE.map((p, i) => (
            <button
              type="button"
              key={i}
              className={`cat-edit__color ${paletteIdx === i ? 'active' : ''}`}
              onClick={() => setPaletteIdx(i)}
              style={{ background: p.bg, color: p.color }}
              aria-label={`색상 ${i + 1}`}
            >
              {paletteIdx === i && <Check size={14} strokeWidth={2.6} />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 4 }}>
        <label className="p-field__label">아이콘</label>
        <div className="cat-edit__icons">
          {ICON_CHOICES.map(ic => {
            const active = icon === ic
            return (
              <button
                type="button"
                key={ic}
                className={`cat-edit__icon ${active ? 'active' : ''}`}
                onClick={() => setIcon(ic)}
                style={active ? { background: palette.bg, color: palette.color, borderColor: palette.color } : {}}
                aria-label={ic}
              >
                <Icon name={ic} size={16} strokeWidth={1.9} />
              </button>
            )
          })}
        </div>
      </div>
    </ModalShell>
  )
}
