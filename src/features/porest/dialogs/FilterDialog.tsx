import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import type { Asset } from '@/entities/asset'
import type { ExpenseCategory, ExpenseType } from '@/entities/expense'
import { renderIcon } from '@/shared/lib'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { InputDatePicker } from '@/shared/ui/input-date-picker'

export type FilterPeriod = 'week' | 'month' | '3m' | 'custom'

export interface FilterValue {
  period: FilterPeriod
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  startDate: string
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  endDate: string
  types: ExpenseType[]
  categoryIds: number[]
  assetIds: number[]
  min: string
  max: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTER: FilterValue = {
  period: 'custom',
  startDate: '',
  endDate: '',
  types: ['EXPENSE', 'INCOME'],
  categoryIds: [],
  assetIds: [],
  min: '',
  max: '',
}

const PERIODS: { v: FilterPeriod; l: string }[] = [
  { v: 'week', l: '이번 주' },
  { v: 'month', l: '이번 달' },
  { v: '3m', l: '3개월' },
  { v: 'custom', l: '직접 선택' },
]

const TYPES: { v: ExpenseType; l: string; c: string }[] = [
  { v: 'EXPENSE', l: '지출', c: 'var(--berry-700)' },
  { v: 'INCOME', l: '수입', c: 'var(--mossy-700)' },
]

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

function pad2(n: number): string { return String(n).padStart(2, '0') }
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
/** 종료일=오늘, 시작일=오늘 − 1개월 */
function defaultCustomRange(): { startDate: string; endDate: string } {
  const today = new Date()
  const start = new Date(today)
  start.setMonth(start.getMonth() - 1)
  return { startDate: fmtYmd(start), endDate: fmtYmd(today) }
}

export function FilterDialog({
  initial,
  categories,
  assets,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null
  categories: ExpenseCategory[]
  assets: Asset[]
  onClose: () => void
  onApply: (v: FilterValue) => void
  mobile: boolean
}) {
  const start = initial ?? DEFAULT_FILTER
  const [period, setPeriod] = useState<FilterPeriod>(start.period)
  const initialRange = useMemo(() => {
    if (start.startDate && start.endDate) {
      return { startDate: start.startDate, endDate: start.endDate }
    }
    return defaultCustomRange()
  }, [start.startDate, start.endDate])
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)

  // 'custom' 전환 시 값 비어있으면 기본(오늘~-1개월) 세팅
  const selectPeriod = (p: FilterPeriod) => {
    if (p === 'custom') {
      const def = defaultCustomRange()
      if (!startDate) setStartDate(def.startDate)
      if (!endDate) setEndDate(def.endDate)
    }
    setPeriod(p)
  }
  const [types, setTypes] = useState<ExpenseType[]>(start.types)
  const [categoryIds, setCategoryIds] = useState<number[]>(start.categoryIds)
  const [assetIds, setAssetIds] = useState<number[]>(start.assetIds)
  const [min, setMin] = useState(start.min)
  const [max, setMax] = useState(start.max)

  // 탑레벨(부모 없는) 카테고리만 필터 그리드로 노출
  const parentCategories = useMemo(
    () => categories.filter(c => c.parentRowId == null).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  )

  const reset = () => {
    setPeriod(DEFAULT_FILTER.period)
    setStartDate('')
    setEndDate('')
    setTypes(DEFAULT_FILTER.types)
    setCategoryIds([])
    setAssetIds([])
    setMin('')
    setMax('')
  }

  const apply = () => onApply({
    period,
    startDate: period === 'custom' ? startDate : '',
    endDate: period === 'custom' ? endDate : '',
    types,
    categoryIds,
    assetIds,
    min,
    max,
  })

  const customInvalid = period === 'custom'
    && startDate !== '' && endDate !== '' && startDate > endDate

  const Footer = (
    <>
      <button className="p-btn p-btn--ghost" onClick={reset} style={{ marginRight: 'auto' }}>
        초기화
      </button>
      <button className="p-btn p-btn--ghost" onClick={onClose}>
        취소
      </button>
      <button className="p-btn p-btn--primary" onClick={apply} disabled={customInvalid}>
        필터 적용
      </button>
    </>
  )

  return (
    <ModalShell title="필터" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <div className="p-field" style={{ marginBottom: 16 }}>
        <label className="p-field__label">기간</label>
        <div className="p-seg">
          {PERIODS.map(o => (
            <button
              key={o.v}
              type="button"
              className={`p-seg__btn ${period === o.v ? 'active' : ''}`}
              onClick={() => selectPeriod(o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <InputDatePicker
                value={startDate}
                onValueChange={setStartDate}
                placeholder="시작일"
              />
              <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
              <InputDatePicker
                value={endDate}
                onValueChange={setEndDate}
                placeholder="종료일"
              />
            </div>
            {customInvalid && (
              <div style={{ fontSize: 11.5, color: 'var(--berry-700)', marginTop: 6 }}>
                시작일이 종료일보다 늦을 수 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: 16 }}>
        <label className="p-field__label">거래 종류</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {TYPES.map(o => {
            const active = types.includes(o.v)
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => setTypes(toggleIn(types, o.v))}
                style={{
                  flex: 1,
                  padding: 10,
                  background: active ? 'var(--bg-brand-subtle)' : 'var(--mist-50)',
                  border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: active ? o.c : 'var(--fg-tertiary)',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {active && <Check size={12} />}
                {o.l}
              </button>
            )
          })}
        </div>
      </div>

      {parentCategories.length > 0 && (
        <div className="p-field" style={{ marginBottom: 16 }}>
          <label className="p-field__label">
            카테고리
            {categoryIds.length > 0 && (
              <span style={{ color: 'var(--fg-brand-strong)', fontWeight: 600, marginLeft: 4 }}>
                · {categoryIds.length}개 선택
              </span>
            )}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {parentCategories.map(c => {
              const active = categoryIds.includes(c.rowId)
              const color = c.color ?? 'var(--mossy-600)'
              return (
                <button
                  key={c.rowId}
                  type="button"
                  onClick={() => setCategoryIds(toggleIn(categoryIds, c.rowId))}
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
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `oklch(from ${color} l c h / 0.14)`,
                      color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderIcon(c.icon, c.categoryName.charAt(0), 18)}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
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
        </div>
      )}

      {assets.length > 0 && (
        <div className="p-field" style={{ marginBottom: 16 }}>
          <label className="p-field__label">
            계좌·카드
            {assetIds.length > 0 && (
              <span style={{ color: 'var(--fg-brand-strong)', fontWeight: 600, marginLeft: 4 }}>
                · {assetIds.length}개 선택
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {assets.map(a => {
              const active = assetIds.includes(a.rowId)
              return (
                <button
                  key={a.rowId}
                  type="button"
                  onClick={() => setAssetIds(toggleIn(assetIds, a.rowId))}
                  style={{
                    padding: '8px 12px',
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
                  {a.assetName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-field">
        <label className="p-field__label">금액 범위</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <input
            className="p-input num"
            value={min}
            onChange={e => setMin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="최소 금액"
            inputMode="numeric"
          />
          <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
          <input
            className="p-input num"
            value={max}
            onChange={e => setMax(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="최대 금액"
            inputMode="numeric"
          />
        </div>
      </div>
    </ModalShell>
  )
}
