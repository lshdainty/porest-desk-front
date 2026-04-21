import { useState, type ReactNode } from 'react'
import { Pencil, Plus, Repeat, Scissors, Trash2, Users } from 'lucide-react'
import {
  ACCOUNTS, CARDS, CATEGORIES, TX,
  type CategoryKey, type Tx,
} from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { CatIcon, TxRow } from '@/shared/ui/porest/primitives'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export interface TxDraft extends Tx {
  memo?: string
  tags?: string[]
}

export function TxDetailDialog({
  tx,
  onClose,
  onDelete,
  mobile,
}: {
  tx: Tx
  onClose: () => void
  onDelete?: (tx: Tx) => void
  mobile: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<TxDraft>({ ...tx })

  const cur: TxDraft = editing ? draft : { ...tx }
  const c = CATEGORIES[cur.cat]
  const isIncome = cur.amt > 0

  const merchantKey = (cur.title || '').split(/[·\s]/)[0] || ''
  const history =
    merchantKey.length > 1
      ? TX.filter(t => t.id !== cur.id && t.title.includes(merchantKey)).slice(0, 5)
      : []
  const merchantMonthCount =
    merchantKey.length > 1 ? TX.filter(t => t.title.includes(merchantKey)).length : 0
  const merchantMonthTotal =
    merchantKey.length > 1
      ? TX.filter(t => t.title.includes(merchantKey)).reduce((s, t) => s + Math.abs(t.amt), 0)
      : 0

  const Footer = editing ? (
    <>
      <button
        className="p-btn p-btn--ghost"
        style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 size={14} />삭제
      </button>
      <button
        className="p-btn p-btn--ghost"
        onClick={() => {
          setEditing(false)
          setDraft({ ...tx })
        }}
      >
        취소
      </button>
      <button className="p-btn p-btn--primary" onClick={() => setEditing(false)}>
        저장
      </button>
    </>
  ) : (
    <>
      <button
        className="p-btn p-btn--ghost"
        style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 size={14} />삭제
      </button>
      <button className="p-btn p-btn--ghost" onClick={() => setEditing(true)}>
        <Pencil size={14} />편집
      </button>
      <button className="p-btn p-btn--primary" onClick={onClose}>
        확인
      </button>
    </>
  )

  return (
    <>
      <ModalShell
        title={isIncome ? '수입 상세' : '지출 상세'}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${c.bg}, var(--bg-surface))`,
            border: `1px solid ${c.color}33`,
            borderRadius: 16,
            padding: 22,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <CatIcon cat={cur.cat} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500, marginBottom: 4 }}>
            {cur.title}
          </div>
          <div
            className="num"
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: isIncome ? 'var(--mossy-700)' : 'var(--fg-primary)',
            }}
          >
            {isIncome ? '+' : '−'}
            {KRW(cur.amt, { abs: true })}
            <span style={{ fontSize: 18, marginLeft: 2 }}>원</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 6 }}>
            {cur.d} {cur.time && `· ${cur.time}`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'var(--border-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Field
            label="카테고리"
            editing={editing}
            render={() => (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <span style={{ fontWeight: 600 }}>{c.label}</span>
              </div>
            )}
            editor={() => (
              <Select
                value={draft.cat}
                onValueChange={(v) => setDraft({ ...draft, cat: v as CategoryKey })}
              >
                <SelectTrigger className="w-[180px] h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIES) as CategoryKey[]).map(k => (
                    <SelectItem key={k} value={k}>
                      {CATEGORIES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Field
            label="금액"
            editing={editing}
            render={() => (
              <span className="num" style={{ fontWeight: 700 }}>
                {isIncome ? '+' : '−'}
                {KRW(cur.amt, { abs: true })}원
              </span>
            )}
            editor={() => (
              <input
                className="p-input num"
                style={{ padding: '6px 10px', fontSize: 13, textAlign: 'right', width: 140 }}
                value={Math.abs(draft.amt)}
                onChange={e => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                  setDraft({ ...draft, amt: draft.amt < 0 ? -v : v })
                }}
                inputMode="numeric"
              />
            )}
          />
          <Field
            label="계좌"
            editing={editing}
            render={() => <span style={{ fontWeight: 500 }}>{cur.account}</span>}
            editor={() => (
              <Select
                value={draft.account}
                onValueChange={(v) => setDraft({ ...draft, account: v })}
              >
                <SelectTrigger className="w-[180px] h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...ACCOUNTS.map(a => a.name), ...CARDS.map(ca => ca.name)].map(a => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Field
            label="날짜·시간"
            editing={editing}
            render={() => (
              <span style={{ fontWeight: 500 }}>
                {cur.d} {cur.time}
              </span>
            )}
            editor={() => (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="p-input"
                  type="date"
                  value={draft.d}
                  onChange={e => setDraft({ ...draft, d: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: 13, width: 140 }}
                />
                <input
                  className="p-input"
                  type="time"
                  value={draft.time}
                  onChange={e => setDraft({ ...draft, time: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: 13, width: 110 }}
                />
              </div>
            )}
          />
          <Field
            label="메모"
            editing={editing}
            render={() => (
              <span style={{ fontWeight: 500, color: cur.memo ? 'var(--fg-primary)' : 'var(--fg-tertiary)' }}>
                {cur.memo || '없음'}
              </span>
            )}
            editor={() => (
              <input
                className="p-input"
                value={draft.memo || ''}
                onChange={e => setDraft({ ...draft, memo: e.target.value })}
                style={{ padding: '6px 10px', fontSize: 13 }}
                placeholder="메모 추가"
              />
            )}
          />

          {!editing && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--bg-surface)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--fg-tertiary)', minWidth: 72 }}>태그</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
                {(cur.tags ?? ['개인']).map(t => (
                  <span key={t} className="pill" style={{ fontSize: 11, padding: '3px 9px' }}>
                    {t}
                  </span>
                ))}
                <button
                  className="pill"
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    border: '1px dashed var(--border-subtle)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={10} /> 추가
                </button>
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 16 }}>
            <QuickBtn Icon={Scissors} label="내역 분할" />
            <QuickBtn Icon={Repeat} label="반복 설정" />
            <QuickBtn Icon={Users} label="더치페이" />
          </div>
        )}

        {!editing && history.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{merchantKey}에서의 이전 거래</h4>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
                이번 달{' '}
                <b className="num" style={{ color: 'var(--fg-secondary)' }}>
                  {merchantMonthCount}회 · {KRW(merchantMonthTotal)}원
                </b>
              </span>
            </div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '4px 14px',
              }}
            >
              {history.map(t => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          </div>
        )}
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title="거래 삭제"
          message={`"${cur.title}" 거래를 삭제하시겠어요? 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            onDelete?.(tx)
            onClose()
          }}
        />
      )}
    </>
  )
}

function Field({
  label,
  editing,
  render,
  editor,
}: {
  label: string
  editing: boolean
  render: () => ReactNode
  editor: () => ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        fontSize: 13,
        gap: 12,
      }}
    >
      <span style={{ color: 'var(--fg-tertiary)', minWidth: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ marginLeft: 'auto' }}>{editing ? editor() : render()}</div>
    </div>
  )
}

function QuickBtn({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
}) {
  return (
    <button
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '14px 4px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'var(--mist-100)',
          color: 'var(--fg-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} strokeWidth={1.9} />
      </span>
      <span style={{ fontSize: 11.5, color: 'var(--fg-secondary)', fontWeight: 600 }}>{label}</span>
    </button>
  )
}
