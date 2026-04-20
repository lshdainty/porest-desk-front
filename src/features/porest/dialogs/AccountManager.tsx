import { useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { ACCOUNTS, CARDS, INVESTMENTS } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { AssetEditDialog, type AssetDraft, type AssetGroup } from './AssetEditDialog'
import { AssetDetailDialog } from './AssetDetailDialog'

function buildInitial(): AssetDraft[] {
  return [
    ...ACCOUNTS.map(a => ({ ...a, group: 'account' as AssetGroup })),
    ...CARDS.map(c => ({ ...c, group: 'card' as AssetGroup })),
    ...INVESTMENTS.map(i => ({ ...i, group: 'invest' as AssetGroup })),
  ]
}

export function AccountManager({ mobile }: { mobile: boolean }) {
  const [items, setItems] = useState<AssetDraft[]>(() => buildInitial())
  const [tab, setTab] = useState<AssetGroup>('account')
  const [editing, setEditing] = useState<AssetDraft | { group: AssetGroup; _new: true } | null>(null)
  const [detail, setDetail] = useState<AssetDraft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AssetDraft | null>(null)

  const counts = useMemo(
    () => ({
      account: items.filter(x => x.group === 'account').length,
      card: items.filter(x => x.group === 'card').length,
      invest: items.filter(x => x.group === 'invest').length,
    }),
    [items],
  )
  const filtered = items.filter(x => x.group === tab)

  const onSave = (draft: AssetDraft) => {
    setItems(prev => {
      const exists = prev.find(p => p.id === draft.id)
      if (exists) return prev.map(p => (p.id === draft.id ? draft : p))
      return [...prev, draft]
    })
    setEditing(null)
  }
  const onDelete = (x: AssetDraft) => {
    setItems(prev => prev.filter(p => p.id !== x.id))
    setConfirmDelete(null)
  }

  const groupLabel = (g: AssetGroup) => (g === 'account' ? '계좌' : g === 'card' ? '카드' : '투자')

  return (
    <>
      <div className="cat-mgr">
        {!mobile && (
          <div className="cat-mgr__head">
            <div>
              <h2 className="cat-mgr__title">계좌·카드 관리</h2>
              <p className="cat-mgr__sub">연결된 자산을 관리합니다. 계좌, 카드, 투자 상품을 추가하거나 편집할 수 있어요.</p>
            </div>
            <button
              className="p-btn p-btn--primary"
              onClick={() => setEditing({ group: tab, _new: true })}
            >
              <Plus size={14} strokeWidth={2.4} />
              {groupLabel(tab)} 추가
            </button>
          </div>
        )}

        <div className="cat-mgr__toolbar">
          <div className="cat-mgr__tabs">
            <button className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>
              계좌·예금 <span className="cnt">{counts.account}</span>
            </button>
            <button className={tab === 'card' ? 'active' : ''} onClick={() => setTab('card')}>
              카드 <span className="cnt">{counts.card}</span>
            </button>
            <button className={tab === 'invest' ? 'active' : ''} onClick={() => setTab('invest')}>
              투자 <span className="cnt">{counts.invest}</span>
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>
            총{' '}
            <span className="num" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
              {KRW(filtered.reduce((s, x) => s + ((x.balance ?? 0) || (x.outstanding ?? 0)), 0))}원
            </span>
          </div>
        </div>

        <div className="cat-list">
          {filtered.map(x => {
            const isCard = x.group === 'card'
            const isInv = x.group === 'invest'
            const amt = isCard ? x.outstanding ?? 0 : x.balance ?? 0
            const neg = isCard
            return (
              <div
                key={x.id}
                className="cat-row"
                style={{ cursor: 'pointer' }}
                onClick={() => setDetail(x)}
              >
                <span
                  className="cat-row__icon"
                  style={{
                    background: x.color,
                    color: x.fg || '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {(x.bank || x.name)[0]}
                </span>
                <div className="cat-row__text">
                  <div className="cat-row__label">{x.name}</div>
                  <div className="cat-row__meta">
                    {x.bank}
                    {x.number && (
                      <>
                        <span className="dot-sep" />
                        {x.number}
                      </>
                    )}
                    {isCard && x.due != null && (
                      <>
                        <span className="dot-sep" />
                        {x.due}일 결제
                      </>
                    )}
                    {isInv && x.changePct != null && (
                      <>
                        <span className="dot-sep" />
                        <span
                          style={{
                            color: x.changePct >= 0 ? 'var(--mossy-700)' : 'var(--berry-700)',
                            fontWeight: 600,
                          }}
                        >
                          {x.changePct >= 0 ? '+' : ''}
                          {x.changePct}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: mobile ? 8 : 12 }}>
                  <div
                    className="num"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: neg ? 'var(--berry-700)' : 'var(--fg-primary)',
                    }}
                  >
                    {neg ? '−' : ''}
                    {KRW(amt)}원
                  </div>
                  {isCard && x.limit != null && (
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                      한도 {KRW(x.limit)}
                    </div>
                  )}
                </div>
                {!mobile ? (
                  <div className="cat-row__actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="p-btn p-btn--ghost p-btn--sm"
                      onClick={() => setEditing(x)}
                    >
                      <Pencil size={13} />편집
                    </button>
                    <button
                      className="p-btn p-btn--ghost p-btn--sm cat-row__del"
                      onClick={() => setConfirmDelete(x)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="cat-row__more"
                    onClick={e => {
                      e.stopPropagation()
                      setDetail(x)
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="cat-list__empty">
              <Wallet size={20} style={{ color: 'var(--fg-tertiary)' }} />
              <div>등록된 {groupLabel(tab)}이 없어요.</div>
            </div>
          )}
        </div>

        {mobile && (
          <button className="cat-add-fab" onClick={() => setEditing({ group: tab, _new: true })}>
            <Plus size={20} strokeWidth={2.4} />
            <span>{groupLabel(tab)} 추가</span>
          </button>
        )}
      </div>

      {editing && (
        <AssetEditDialog
          item={'_new' in editing && editing._new ? null : (editing as AssetDraft)}
          group={editing.group}
          onClose={() => setEditing(null)}
          onSave={onSave}
          onDelete={
            '_new' in editing && editing._new
              ? undefined
              : () => {
                  setConfirmDelete(editing as AssetDraft)
                  setEditing(null)
                }
          }
          mobile={mobile}
        />
      )}
      {detail && (
        <AssetDetailDialog
          item={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail)
            setDetail(null)
          }}
          mobile={mobile}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={
            confirmDelete.group === 'account'
              ? '계좌 삭제'
              : confirmDelete.group === 'card'
              ? '카드 삭제'
              : '투자 상품 삭제'
          }
          message={`"${confirmDelete.name}"을(를) 목록에서 제거합니다. 연결된 거래 내역은 유지됩니다.`}
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}
