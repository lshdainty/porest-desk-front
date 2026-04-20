import { useState } from 'react'
import { Check } from 'lucide-react'
import { ACCOUNTS, CARDS, CATEGORIES, type CategoryKey } from '@/shared/lib/porest/data'
import { CatIcon } from '@/shared/ui/porest/primitives'
import { ModalShell } from '@/shared/ui/porest/dialogs'

export type FilterPeriod = 'week' | 'month' | '3m' | 'custom'
export type TxKind = 'expense' | 'income' | 'transfer'

export interface FilterValue {
  period: FilterPeriod
  types: TxKind[]
  cats: CategoryKey[]
  accounts: string[]
  min: string
  max: string
}

export const DEFAULT_FILTER: FilterValue = {
  period: 'month',
  types: ['expense', 'income'],
  cats: [],
  accounts: [],
  min: '',
  max: '',
}

const PERIODS: { v: FilterPeriod; l: string }[] = [
  { v: 'week', l: '이번 주' },
  { v: 'month', l: '이번 달' },
  { v: '3m', l: '3개월' },
  { v: 'custom', l: '직접 선택' },
]

const TYPES: { v: TxKind; l: string; c: string }[] = [
  { v: 'expense', l: '지출', c: 'var(--berry-700)' },
  { v: 'income', l: '수입', c: 'var(--mossy-700)' },
  { v: 'transfer', l: '이체', c: 'var(--fg-secondary)' },
]

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

export function FilterDialog({
  initial,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null
  onClose: () => void
  onApply: (v: FilterValue) => void
  mobile: boolean
}) {
  const start = initial ?? DEFAULT_FILTER
  const [period, setPeriod] = useState<FilterPeriod>(start.period)
  const [types, setTypes] = useState<TxKind[]>(start.types)
  const [cats, setCats] = useState<CategoryKey[]>(start.cats)
  const [accounts, setAccounts] = useState<string[]>(start.accounts)
  const [min, setMin] = useState(start.min)
  const [max, setMax] = useState(start.max)

  const reset = () => {
    setPeriod('month')
    setTypes(['expense', 'income'])
    setCats([])
    setAccounts([])
    setMin('')
    setMax('')
  }

  const apply = () => onApply({ period, types, cats, accounts, min, max })

  const catKeys = Object.keys(CATEGORIES) as CategoryKey[]
  const accNames = Array.from(new Set([...ACCOUNTS.map(a => a.name), ...CARDS.map(c => c.name)]))

  const Footer = (
    <>
      <button className="p-btn p-btn--ghost" onClick={reset} style={{ marginRight: 'auto' }}>
        초기화
      </button>
      <button className="p-btn p-btn--ghost" onClick={onClose}>
        취소
      </button>
      <button className="p-btn p-btn--primary" onClick={apply}>
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
              onClick={() => setPeriod(o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
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

      <div className="p-field" style={{ marginBottom: 16 }}>
        <label className="p-field__label">
          카테고리
          {cats.length > 0 && (
            <span style={{ color: 'var(--fg-brand-strong)', fontWeight: 600, marginLeft: 4 }}>
              · {cats.length}개 선택
            </span>
          )}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {catKeys.map(c => {
            const active = cats.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCats(toggleIn(cats, c))}
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

      <div className="p-field" style={{ marginBottom: 16 }}>
        <label className="p-field__label">
          계좌·카드
          {accounts.length > 0 && (
            <span style={{ color: 'var(--fg-brand-strong)', fontWeight: 600, marginLeft: 4 }}>
              · {accounts.length}개 선택
            </span>
          )}
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {accNames.map(a => {
            const active = accounts.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAccounts(toggleIn(accounts, a))}
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
                {a}
              </button>
            )
          })}
        </div>
      </div>

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
