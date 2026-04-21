import { useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Icon } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/expense'
import type {
  ExpenseCategory,
  ExpenseCategoryFormValues,
  ExpenseType,
} from '@/entities/expense'
import { CategoryEditDialog, getPaletteByColor } from './CategoryEditDialog'

export function CategoryManager({ mobile }: { mobile: boolean }) {
  const { data: categories, isLoading } = useExpenseCategories()
  const createMut = useCreateExpenseCategory()
  const updateMut = useUpdateExpenseCategory()
  const deleteMut = useDeleteExpenseCategory()

  const [tab, setTab] = useState<ExpenseType>('EXPENSE')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ExpenseCategory | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseCategory | null>(null)

  const list = categories ?? []

  const filtered = useMemo(
    () =>
      list.filter(
        c =>
          c.expenseType === tab &&
          (query === '' || c.categoryName.includes(query)),
      ),
    [list, tab, query],
  )

  const counts = useMemo(
    () => ({
      expense: list.filter(c => c.expenseType === 'EXPENSE').length,
      income: list.filter(c => c.expenseType === 'INCOME').length,
    }),
    [list],
  )

  const submitting = createMut.isPending || updateMut.isPending

  const onSave = (values: ExpenseCategoryFormValues) => {
    if (editing && editing !== 'new') {
      updateMut.mutate(
        { id: editing.rowId, data: values },
        { onSuccess: () => setEditing(null) },
      )
    } else {
      createMut.mutate(values, { onSuccess: () => setEditing(null) })
    }
  }

  const onDelete = (c: ExpenseCategory) => {
    deleteMut.mutate(c.rowId, { onSuccess: () => setConfirmDelete(null) })
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
            <button className={tab === 'EXPENSE' ? 'active' : ''} onClick={() => setTab('EXPENSE')}>
              지출 <span className="cnt">{counts.expense}</span>
            </button>
            <button className={tab === 'INCOME' ? 'active' : ''} onClick={() => setTab('INCOME')}>
              수입 <span className="cnt">{counts.income}</span>
            </button>
          </div>
          <div className="cat-mgr__search">
            <Search size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="카테고리 검색" />
          </div>
        </div>

        <div className="cat-list">
          {isLoading ? (
            <div className="cat-list__empty">
              <span>불러오는 중…</span>
            </div>
          ) : list.length === 0 ? (
            <div className="cat-list__empty">
              <span>카테고리가 없어요</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="cat-list__empty">
              <span>검색 결과가 없습니다.</span>
            </div>
          ) : (
            filtered.map(c => {
              const palette = getPaletteByColor(c.color)
              return (
                <div key={c.rowId} className="cat-row">
                  <span
                    className="cat-row__icon"
                    style={{ background: palette.bg, color: palette.color }}
                  >
                    <Icon name={c.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div className="cat-row__text">
                    <div className="cat-row__label">{c.categoryName}</div>
                    <div className="cat-row__meta">
                      {c.expenseType === 'EXPENSE' ? '지출' : '수입'}
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
              )
            })
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
          existing={list}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="카테고리 삭제"
          message={`"${confirmDelete.categoryName}" 카테고리를 삭제하시겠어요?`}
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}
