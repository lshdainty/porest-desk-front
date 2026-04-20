import { useState } from 'react'
import { X } from 'lucide-react'
import { CATEGORIES, type CategoryKey } from '@/shared/lib/porest/data'
import { CatIcon } from '@/shared/ui/porest/primitives'

export type TxType = 'expense' | 'income' | 'transfer'

export function AddTxSheet({ onClose, mobile }: { onClose: () => void; mobile: boolean }) {
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('28500')
  const [cat, setCat] = useState<CategoryKey>('food')
  const [title, setTitle] = useState('이촌돈까스')
  const [account, setAccount] = useState('신한 Deep Dream')

  const formatted = amount ? parseInt(amount || '0', 10).toLocaleString('ko-KR') : '0'

  const cats: CategoryKey[] = ['food', 'cafe', 'transport', 'shopping', 'living', 'medical', 'leisure', 'bill', 'edu', 'saving']

  const Content = (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          padding: 3,
          background: 'var(--mist-200)',
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        {[
          { v: 'expense', l: '지출' },
          { v: 'income', l: '수입' },
          { v: 'transfer', l: '이체' },
        ].map(o => (
          <button
            key={o.v}
            onClick={() => setType(o.v as TxType)}
            style={{
              background: type === o.v ? 'var(--bg-surface)' : 'transparent',
              color: type === o.v
                ? o.v === 'expense' ? 'var(--berry-700)' : o.v === 'income' ? 'var(--mossy-700)' : 'var(--fg-primary)'
                : 'var(--fg-secondary)',
              border: 0,
              padding: '8px 0',
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: type === o.v ? 'var(--shadow-xs)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            {o.l}
          </button>
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '20px 0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8 }}>
          금액
        </div>
        <div
          className="num"
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: type === 'expense' ? 'var(--berry-700)' : type === 'income' ? 'var(--mossy-700)' : 'var(--fg-primary)',
          }}
        >
          {type === 'expense' ? '−' : type === 'income' ? '+' : ''}
          {formatted}
          <span style={{ fontSize: 20, color: 'var(--fg-tertiary)', marginLeft: 4, fontWeight: 700 }}>원</span>
        </div>
        <input
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          className="p-input"
          style={{ maxWidth: 240, margin: '12px auto 0', textAlign: 'center' }}
          placeholder="금액 입력"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          카테고리
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 4px',
                background: cat === c ? 'var(--bg-brand-subtle)' : 'transparent',
                border: cat === c ? '1px solid var(--border-brand)' : '1px solid transparent',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <CatIcon cat={c} size="sm" />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: cat === c ? 700 : 500,
                  color: cat === c ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                }}
              >
                {CATEGORIES[c].label.split('·')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--fg-primary)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          내역
        </label>
        <input className="p-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 스타벅스 강남점" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--fg-primary)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          결제 수단
        </label>
        <select className="p-input p-select" value={account} onChange={e => setAccount(e.target.value)}>
          <option>신한 Deep Dream</option>
          <option>현대 M Boost</option>
          <option>신한 체크</option>
          <option>토스 체크</option>
          <option>현금</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--fg-primary)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          날짜
        </label>
        <input className="p-input" defaultValue="2026-04-20 13:42" />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--fg-primary)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          메모
        </label>
        <textarea className="p-textarea" placeholder="선택 사항" style={{ minHeight: 64 }} />
      </div>
    </>
  )

  if (mobile) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()}>
          <div className="sheet__handle" />
          <div className="sheet__head">
            <h3>내역 추가</h3>
            <button className="close" onClick={onClose} aria-label="닫기">
              <X size={18} />
            </button>
          </div>
          <div className="sheet__body">
            {Content}
            <button className="p-btn p-btn--primary p-btn--lg" style={{ width: '100%' }} onClick={onClose}>
              저장
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <h3>내역 추가</h3>
          <button className="close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{Content}</div>
        <div className="modal__foot">
          <button className="p-btn p-btn--ghost" onClick={onClose}>취소</button>
          <button className="p-btn p-btn--primary" onClick={onClose}>저장</button>
        </div>
      </div>
    </div>
  )
}
