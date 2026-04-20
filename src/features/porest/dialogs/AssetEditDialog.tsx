import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'

export const BANK_PRESETS: { k: string; color: string }[] = [
  { k: '신한', color: '#0046FF' },
  { k: 'KB국민', color: '#FFBC00' },
  { k: '우리', color: '#0067AC' },
  { k: '하나', color: '#008C74' },
  { k: 'NH농협', color: '#00A149' },
  { k: '토스뱅크', color: '#0064FF' },
  { k: '카카오뱅크', color: '#FEE500' },
  { k: '케이뱅크', color: '#1E1E1E' },
  { k: '현대', color: '#1C2951' },
  { k: '삼성', color: '#1428A0' },
]

export type AssetGroup = 'account' | 'card' | 'invest'

export interface AssetDraft {
  id: string
  group: AssetGroup
  bank: string
  name: string
  color: string
  type?: string
  number?: string
  balance?: number
  outstanding?: number
  limit?: number
  due?: number
  changePct?: number
  changeAmt?: number
  fg?: string
}

export function AssetEditDialog({
  item,
  group,
  onClose,
  onSave,
  onDelete,
  mobile,
}: {
  item: AssetDraft | null
  group: AssetGroup
  onClose: () => void
  onSave: (draft: AssetDraft) => void
  onDelete?: () => void
  mobile: boolean
}) {
  const isNew = !item
  const [bank, setBank] = useState(item?.bank || BANK_PRESETS[0]!.k)
  const [color, setColor] = useState(item?.color || BANK_PRESETS[0]!.color)
  const [name, setName] = useState(item?.name || '')
  const [number, setNumber] = useState(item?.number || '')
  const [type, setType] = useState(item?.type || '입출금')
  const [balance, setBalance] = useState(String(item?.balance ?? item?.outstanding ?? 0))
  const [due, setDue] = useState(String(item?.due ?? 15))
  const [limit, setLimit] = useState(String(item?.limit ?? 3_000_000))
  const [changePct, setChangePct] = useState(String(item?.changePct ?? 0))
  const [touched, setTouched] = useState(false)

  const nameTrim = name.trim()
  const valid = nameTrim.length > 0 && bank.trim().length > 0

  const save = () => {
    setTouched(true)
    if (!valid) return
    const base: AssetDraft = {
      id: item?.id || `${group}-${Date.now()}`,
      group,
      bank,
      name: nameTrim,
      color,
    }
    if (group === 'account') {
      onSave({ ...base, type, number, balance: parseInt(balance) || 0 })
    } else if (group === 'card') {
      onSave({
        ...base,
        number,
        outstanding: parseInt(balance) || 0,
        limit: parseInt(limit) || 0,
        due: parseInt(due) || 1,
      })
    } else {
      onSave({
        ...base,
        balance: parseInt(balance) || 0,
        changePct: parseFloat(changePct) || 0,
        changeAmt: 0,
      })
    }
  }

  const title = isNew
    ? group === 'account' ? '계좌 추가' : group === 'card' ? '카드 추가' : '투자 상품 추가'
    : group === 'account' ? '계좌 편집' : group === 'card' ? '카드 편집' : '투자 상품 편집'

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
      <button
        className="p-btn p-btn--primary"
        onClick={save}
        disabled={touched && !valid}
      >
        {isNew ? '추가' : '저장'}
      </button>
    </>
  )

  return (
    <ModalShell title={title} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <div className="cat-edit__preview">
        <span
          className="cat-edit__preview-chip"
          style={{ background: color, color: '#fff', fontWeight: 700, fontSize: 16 }}
        >
          {(bank || '?')[0]}
        </span>
        <div>
          <div className="cat-edit__preview-label">
            {name || (group === 'account' ? '새 계좌' : group === 'card' ? '새 카드' : '새 투자')}
          </div>
          <div className="cat-edit__preview-sub">{bank} · 미리보기</div>
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">기관·브랜드</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {BANK_PRESETS.map(b => {
            const active = bank === b.k
            return (
              <button
                key={b.k}
                type="button"
                onClick={() => {
                  setBank(b.k)
                  setColor(b.color)
                }}
                style={{
                  padding: '10px 4px',
                  background: active ? b.color : 'var(--mist-50)',
                  color: active ? '#fff' : 'var(--fg-secondary)',
                  border: active ? `1px solid ${b.color}` : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  fontFamily: 'inherit',
                }}
              >
                {b.k}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">{group === 'invest' ? '상품명' : '별칭'}</label>
        <input
          className="p-input"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder={
            group === 'account'
              ? '예: 신한 주거래'
              : group === 'card'
              ? '예: 신한 Deep Dream'
              : '예: KODEX 200'
          }
          maxLength={30}
          autoFocus
        />
      </div>

      {group === 'account' && (
        <>
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">계좌 종류</label>
            <div className="p-seg">
              {['입출금', '적금', '예금', '대출'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`p-seg__btn ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="p-field">
              <label className="p-field__label">계좌번호</label>
              <input
                className="p-input"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="110-***-123456"
              />
            </div>
            <div className="p-field">
              <label className="p-field__label">잔액 (원)</label>
              <input
                className="p-input num"
                value={balance}
                onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
          </div>
        </>
      )}

      {group === 'card' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="p-field">
              <label className="p-field__label">카드번호</label>
              <input
                className="p-input"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="5137-****-7745"
              />
            </div>
            <div className="p-field">
              <label className="p-field__label">결제일</label>
              <input
                className="p-input num"
                value={due}
                onChange={e => setDue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="28"
                inputMode="numeric"
                maxLength={2}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="p-field">
              <label className="p-field__label">이번 달 사용액 (원)</label>
              <input
                className="p-input num"
                value={balance}
                onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
              />
            </div>
            <div className="p-field">
              <label className="p-field__label">한도 (원)</label>
              <input
                className="p-input num"
                value={limit}
                onChange={e => setLimit(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
              />
            </div>
          </div>
        </>
      )}

      {group === 'invest' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="p-field">
            <label className="p-field__label">평가액 (원)</label>
            <input
              className="p-input num"
              value={balance}
              onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
            />
          </div>
          <div className="p-field">
            <label className="p-field__label">수익률 (%)</label>
            <input
              className="p-input num"
              value={changePct}
              onChange={e => setChangePct(e.target.value)}
              inputMode="decimal"
              placeholder="3.8"
            />
          </div>
        </div>
      )}
    </ModalShell>
  )
}
