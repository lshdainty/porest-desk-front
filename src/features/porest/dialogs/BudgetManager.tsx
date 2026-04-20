import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { BUDGETS, CATEGORIES } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { Icon } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { BudgetEditDialog, MonthlyBudgetDialog, type BudgetItem } from './BudgetEditDialog'

export function BudgetManager({ mobile }: { mobile: boolean }) {
  const [monthlyLimit, setMonthlyLimit] = useState(2_200_000)
  const [budgets, setBudgets] = useState<BudgetItem[]>(() => BUDGETS.map(b => ({ ...b })))
  const [editing, setEditing] = useState<BudgetItem | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<BudgetItem | null>(null)
  const [editMonthly, setEditMonthly] = useState(false)

  const totalAssigned = useMemo(() => budgets.reduce((s, b) => s + b.limit, 0), [budgets])
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + b.spent, 0), [budgets])
  const remaining = monthlyLimit - totalAssigned

  const onSave = (draft: BudgetItem) => {
    setBudgets(prev => {
      const exists = prev.find(b => b.cat === draft.cat)
      if (exists) return prev.map(b => (b.cat === draft.cat ? draft : b))
      return [...prev, draft]
    })
    setEditing(null)
  }
  const onDelete = (b: BudgetItem) => {
    setBudgets(prev => prev.filter(x => x.cat !== b.cat))
    setConfirmDelete(null)
  }

  return (
    <>
      <div className="cat-mgr">
        {!mobile && (
          <div className="cat-mgr__head">
            <div>
              <h2 className="cat-mgr__title">예산 설정</h2>
              <p className="cat-mgr__sub">
                월간 총 예산과 카테고리별 한도를 설정합니다. 예산의 85% 이상 사용하면 알림을 보내드려요.
              </p>
            </div>
            <button className="p-btn p-btn--primary" onClick={() => setEditing('new')}>
              <Plus size={14} strokeWidth={2.4} />카테고리 예산 추가
            </button>
          </div>
        )}

        <div className="p-card p-card--brand" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-brand-strong)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                4월 총 예산
              </div>
              <div className="num" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {KRW(monthlyLimit)}
                <span style={{ fontSize: 16, marginLeft: 3 }}>원</span>
              </div>
            </div>
            <button
              className="p-btn p-btn--ghost p-btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditMonthly(true)}
            >
              <Pencil size={13} />수정
            </button>
          </div>
          <div className="budget-bar" style={{ height: 10, marginTop: 14 }}>
            <div
              className="budget-bar__fill"
              style={{ width: `${Math.min(100, (totalSpent / monthlyLimit) * 100)}%` }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                사용
              </div>
              <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                {KRW(totalSpent)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                할당됨
              </div>
              <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                {KRW(totalAssigned)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                할당 가능
              </div>
              <div
                className="num"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: remaining < 0 ? 'var(--berry-700)' : 'var(--mossy-700)',
                }}
              >
                {remaining >= 0 ? '+' : ''}
                {KRW(remaining)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>카테고리별 예산 · {budgets.length}개</div>
          {mobile && (
            <button
              className="p-btn p-btn--ghost p-btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditing('new')}
            >
              <Plus size={12} />추가
            </button>
          )}
        </div>

        <div className="cat-list">
          {budgets.map(b => {
            const c = CATEGORIES[b.cat]
            const p = (b.spent / b.limit) * 100
            const state = p > 100 ? 'over' : p > 85 ? 'warn' : ''
            return (
              <div key={b.cat} className="cat-row" style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}>
                <span className="cat-row__icon" style={{ background: c.bg, color: c.color }}>
                  <Icon name={c.icon} size={18} strokeWidth={1.9} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
                    <div
                      className="num"
                      style={{
                        marginLeft: 'auto',
                        fontSize: 13,
                        fontWeight: 700,
                        color: state === 'over' ? 'var(--berry-700)' : 'var(--fg-primary)',
                      }}
                    >
                      {KRW(b.spent)}
                      <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}> / {KRW(b.limit)}</span>
                    </div>
                  </div>
                  <div className="budget-bar" style={{ height: 6 }}>
                    <div className={`budget-bar__fill ${state}`} style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 6 }}>
                    {state === 'over'
                      ? `${KRW(b.spent - b.limit)}원 초과`
                      : `남은 예산 ${KRW(b.limit - b.spent)}원`}
                  </div>
                </div>
                {!mobile && (
                  <div className="cat-row__actions">
                    <button className="p-btn p-btn--ghost p-btn--sm" onClick={() => setEditing(b)}>
                      <Pencil size={13} />
                    </button>
                    <button
                      className="p-btn p-btn--ghost p-btn--sm cat-row__del"
                      onClick={() => setConfirmDelete(b)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {mobile && (
          <button className="cat-add-fab" onClick={() => setEditing('new')}>
            <Plus size={20} strokeWidth={2.4} />
            <span>카테고리 예산 추가</span>
          </button>
        )}
      </div>

      {editing && (
        <BudgetEditDialog
          budget={editing === 'new' ? null : editing}
          existing={budgets}
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
        />
      )}
      {editMonthly && (
        <MonthlyBudgetDialog
          value={monthlyLimit}
          onClose={() => setEditMonthly(false)}
          onSave={v => {
            setMonthlyLimit(v)
            setEditMonthly(false)
          }}
          mobile={mobile}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="예산 삭제"
          message={`"${CATEGORIES[confirmDelete.cat].label}" 카테고리 예산을 삭제하시겠어요?`}
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}
