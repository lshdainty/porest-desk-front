import { useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { CATEGORIES, type CategoryKey } from '@/shared/lib/porest/data'
import { Icon } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { CategoryEditDialog, type CategoryItem } from './CategoryEditDialog'

function buildInitial(): CategoryItem[] {
  const expense: CategoryKey[] = [
    'food', 'cafe', 'transport', 'shopping', 'living',
    'medical', 'leisure', 'bill', 'edu', 'saving',
  ]
  const list: CategoryItem[] = []
  expense.forEach(k => {
    const c = CATEGORIES[k]
    list.push({ id: k, label: c.label, icon: c.icon, color: c.color, bg: c.bg, kind: 'expense', count: 5 })
  })
  const c = CATEGORIES['income']
  list.push({ id: 'income', label: c.label, icon: c.icon, color: c.color, bg: c.bg, kind: 'income', count: 2 })
  list.push({
    id: 'custom-1',
    label: '반려동물',
    icon: 'paw-print',
    color: 'oklch(0.50 0.14 15)',
    bg: 'oklch(0.96 0.035 15)',
    kind: 'expense',
    count: 6,
  })
  list.push({
    id: 'custom-2',
    label: '부수입',
    icon: 'hand-coins',
    color: 'var(--bark-700)',
    bg: 'var(--bark-100)',
    kind: 'income',
    count: 3,
  })
  return list
}

export function CategoryManager({ mobile }: { mobile: boolean }) {
  const [cats, setCats] = useState<CategoryItem[]>(() => buildInitial())
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CategoryItem | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CategoryItem | null>(null)

  const filtered = useMemo(
    () => cats.filter(c => c.kind === tab && (query === '' || c.label.includes(query))),
    [cats, tab, query],
  )
  const counts = useMemo(
    () => ({
      expense: cats.filter(c => c.kind === 'expense').length,
      income: cats.filter(c => c.kind === 'income').length,
    }),
    [cats],
  )

  const onSave = (draft: CategoryItem) => {
    setCats(prev => {
      const exists = prev.find(c => c.id === draft.id)
      if (exists) return prev.map(c => (c.id === draft.id ? draft : c))
      return [...prev, { ...draft, count: 0 }]
    })
    setEditing(null)
  }
  const onDelete = (c: CategoryItem) => {
    setCats(prev => prev.filter(x => x.id !== c.id))
    setConfirmDelete(null)
  }

  return (
    <>
      <div className="cat-mgr">
        {!mobile && (
          <div className="cat-mgr__head">
            <div>
              <h2 className="cat-mgr__title">카테고리 관리</h2>
              <p className="cat-mgr__sub">
                지출·수입 내역을 분류할 카테고리를 관리합니다. 기본 카테고리도 이름·색상·아이콘을 자유롭게 바꿀 수 있어요.
              </p>
            </div>
            <button className="p-btn p-btn--primary" onClick={() => setEditing('new')}>
              <Plus size={14} strokeWidth={2.4} />
              카테고리 추가
            </button>
          </div>
        )}

        <div className="cat-mgr__toolbar">
          <div className="cat-mgr__tabs">
            <button className={tab === 'expense' ? 'active' : ''} onClick={() => setTab('expense')}>
              지출 <span className="cnt">{counts.expense}</span>
            </button>
            <button className={tab === 'income' ? 'active' : ''} onClick={() => setTab('income')}>
              수입 <span className="cnt">{counts.income}</span>
            </button>
          </div>
          <div className="cat-mgr__search">
            <Search size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="카테고리 검색" />
          </div>
        </div>

        <div className="cat-list">
          {filtered.map(c => (
            <div key={c.id} className="cat-row">
              <span className="cat-row__icon" style={{ background: c.bg, color: c.color }}>
                <Icon name={c.icon} size={18} strokeWidth={1.9} />
              </span>
              <div className="cat-row__text">
                <div className="cat-row__label">{c.label}</div>
                <div className="cat-row__meta">
                  {c.kind === 'expense' ? '지출' : '수입'}
                  <span className="dot-sep" />
                  거래 {c.count}건
                </div>
              </div>
              {!mobile ? (
                <div className="cat-row__actions">
                  <button className="p-btn p-btn--ghost p-btn--sm" onClick={() => setEditing(c)}>
                    <Pencil size={13} />편집
                  </button>
                  <button
                    className="p-btn p-btn--ghost p-btn--sm cat-row__del"
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <button className="cat-row__more" onClick={() => setEditing(c)}>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cat-list__empty">
              <span>검색 결과가 없습니다.</span>
            </div>
          )}
        </div>

        {mobile && (
          <button className="cat-add-fab" onClick={() => setEditing('new')}>
            <Plus size={20} strokeWidth={2.4} />
            <span>카테고리 추가</span>
          </button>
        )}
      </div>

      {editing && (
        <CategoryEditDialog
          cat={editing === 'new' ? null : editing}
          defaultKind={tab}
          onClose={() => setEditing(null)}
          onSave={onSave}
          onDelete={
            editing !== 'new'
              ? () => {
                  setConfirmDelete(editing)
                  setEditing(null)
                }
              : undefined
          }
          mobile={mobile}
          existing={cats}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="카테고리 삭제"
          message={
            `"${confirmDelete.label}" 카테고리를 삭제하시겠어요?` +
            (confirmDelete.count > 0
              ? ` 이 카테고리의 거래 ${confirmDelete.count}건은 '미분류'로 이동합니다.`
              : ' 연결된 거래가 없습니다.')
          }
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}
