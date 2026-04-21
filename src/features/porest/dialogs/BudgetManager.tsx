import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useExpenseBudgets,
  useExpenseCategories,
  useMonthlySummary,
  useCreateExpenseBudget,
  useUpdateExpenseBudget,
  useDeleteExpenseBudget,
} from '@/features/expense'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { KRW } from '@/shared/lib/porest/format'
import { Icon } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { BudgetEditDialog, MonthlyBudgetDialog, type BudgetDraft } from './BudgetEditDialog'
import { getPaletteByColor } from './CategoryEditDialog'

export function BudgetManager({ mobile }: { mobile: boolean }) {
  const now = new Date()
  const [year] = useState<number>(now.getFullYear())
  const [month] = useState<number>(now.getMonth() + 1)

  const { data: budgets, isLoading: loadingBudgets } = useExpenseBudgets({ year, month })
  const { data: categories, isLoading: loadingCategories } = useExpenseCategories()
  const { data: monthlySummary, isLoading: loadingSummary } = useMonthlySummary(year, month)

  const createMut = useCreateExpenseBudget()
  const updateMut = useUpdateExpenseBudget()
  const deleteMut = useDeleteExpenseBudget()

  const [editing, setEditing] = useState<ExpenseBudget | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseBudget | null>(null)
  const [editMonthly, setEditMonthly] = useState(false)

  const budgetList = budgets ?? []
  const categoryList: ExpenseCategory[] = categories ?? []

  // 월 전체 예산 = categoryRowId === null 인 항목
  const monthlyBudget = useMemo(
    () => budgetList.find(b => b.categoryRowId === null) ?? null,
    [budgetList],
  )
  const monthlyLimit = monthlyBudget?.budgetAmount ?? 0

  // 카테고리별 예산 (categoryRowId !== null)
  const categoryBudgets = useMemo(
    () => budgetList.filter(b => b.categoryRowId !== null),
    [budgetList],
  )

  // 카테고리별 실제 사용 금액: monthlySummary.categoryBreakdown 을 categoryRowId + 부모 카테고리(roll-up) 기준으로 집계
  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    const breakdown = monthlySummary?.categoryBreakdown ?? []
    for (const item of breakdown) {
      map.set(item.categoryRowId, (map.get(item.categoryRowId) ?? 0) + item.totalAmount)
      // 부모에도 누적 (예: 예산은 부모 카테고리에 걸려 있을 수 있음)
      if (item.parentCategoryRowId != null) {
        map.set(
          item.parentCategoryRowId,
          (map.get(item.parentCategoryRowId) ?? 0) + item.totalAmount,
        )
      }
    }
    return map
  }, [monthlySummary])

  const totalAssigned = useMemo(
    () => categoryBudgets.reduce((s, b) => s + b.budgetAmount, 0),
    [categoryBudgets],
  )
  const totalSpent = monthlySummary?.totalExpense ?? 0
  const remaining = monthlyLimit - totalAssigned

  const categoryMap = useMemo(() => {
    const m = new Map<number, ExpenseCategory>()
    categoryList.forEach(c => m.set(c.rowId, c))
    return m
  }, [categoryList])

  const loading = loadingBudgets || loadingCategories || loadingSummary

  const saveCategoryBudget = (draft: BudgetDraft) => {
    const existing =
      editing !== 'new' && editing ? editing : null
    if (existing) {
      updateMut.mutate(
        { id: existing.rowId, budgetAmount: draft.budgetAmount },
        { onSuccess: () => setEditing(null) },
      )
    } else {
      // 새 카테고리 예산 생성 — 중복 시 update
      const dup = categoryBudgets.find(b => b.categoryRowId === draft.categoryRowId)
      if (dup) {
        updateMut.mutate(
          { id: dup.rowId, budgetAmount: draft.budgetAmount },
          { onSuccess: () => setEditing(null) },
        )
      } else {
        createMut.mutate(
          {
            categoryRowId: draft.categoryRowId,
            budgetAmount: draft.budgetAmount,
            budgetYear: year,
            budgetMonth: month,
          },
          { onSuccess: () => setEditing(null) },
        )
      }
    }
  }

  const saveMonthlyBudget = (value: number) => {
    if (monthlyBudget) {
      updateMut.mutate(
        { id: monthlyBudget.rowId, budgetAmount: value },
        { onSuccess: () => setEditMonthly(false) },
      )
    } else {
      createMut.mutate(
        {
          categoryRowId: null,
          budgetAmount: value,
          budgetYear: year,
          budgetMonth: month,
        },
        { onSuccess: () => setEditMonthly(false) },
      )
    }
  }

  const onDelete = (b: ExpenseBudget) => {
    deleteMut.mutate(b.rowId, { onSuccess: () => setConfirmDelete(null) })
  }

  const submitting = createMut.isPending || updateMut.isPending || deleteMut.isPending

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
            <button
              className="p-btn p-btn--primary"
              onClick={() => setEditing('new')}
              disabled={loading}
            >
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
                {month}월 총 예산
              </div>
              {monthlyBudget ? (
                <div className="num" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {KRW(monthlyLimit)}
                  <span style={{ fontSize: 16, marginLeft: 3 }}>원</span>
                </div>
              ) : (
                <div style={{ fontSize: 15, color: 'var(--fg-tertiary)', fontWeight: 600 }}>
                  설정되지 않음
                </div>
              )}
            </div>
            <button
              className="p-btn p-btn--ghost p-btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditMonthly(true)}
              disabled={loading}
            >
              {monthlyBudget ? (
                <>
                  <Pencil size={13} />수정
                </>
              ) : (
                <>
                  <Plus size={13} />예산 설정
                </>
              )}
            </button>
          </div>
          {monthlyBudget && (
            <div className="budget-bar" style={{ height: 10, marginTop: 14 }}>
              <div
                className="budget-bar__fill"
                style={{
                  width: `${Math.min(100, monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0)}%`,
                }}
              />
            </div>
          )}
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
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            카테고리별 예산 · {categoryBudgets.length}개
          </div>
          {mobile && (
            <button
              className="p-btn p-btn--ghost p-btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditing('new')}
              disabled={loading}
            >
              <Plus size={12} />추가
            </button>
          )}
        </div>

        <div className="cat-list">
          {loading ? (
            <div className="cat-list__empty">
              <span>불러오는 중…</span>
            </div>
          ) : categoryBudgets.length === 0 ? (
            <div className="cat-list__empty">
              <span>설정된 카테고리 예산이 없어요</span>
            </div>
          ) : (
            categoryBudgets.map(b => {
              const catId = b.categoryRowId as number
              const cat = categoryMap.get(catId)
              const palette = getPaletteByColor(cat?.color)
              const spent = spentByCategory.get(catId) ?? 0
              const limitAmt = b.budgetAmount
              const p = limitAmt > 0 ? (spent / limitAmt) * 100 : 0
              const state = p > 100 ? 'over' : p > 85 ? 'warn' : ''
              const label = cat?.categoryName ?? b.categoryName ?? `카테고리 #${catId}`
              return (
                <div
                  key={b.rowId}
                  className="cat-row"
                  style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}
                >
                  <span
                    className="cat-row__icon"
                    style={{ background: palette.bg, color: palette.color }}
                  >
                    <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                      <div
                        className="num"
                        style={{
                          marginLeft: 'auto',
                          fontSize: 13,
                          fontWeight: 700,
                          color: state === 'over' ? 'var(--berry-700)' : 'var(--fg-primary)',
                        }}
                      >
                        {KRW(spent)}
                        <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}>
                          {' '}
                          / {KRW(limitAmt)}
                        </span>
                      </div>
                    </div>
                    <div className="budget-bar" style={{ height: 6 }}>
                      <div
                        className={`budget-bar__fill ${state}`}
                        style={{ width: `${Math.min(100, p)}%` }}
                      />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 6 }}>
                      {state === 'over'
                        ? `${KRW(spent - limitAmt)}원 초과`
                        : `남은 예산 ${KRW(Math.max(0, limitAmt - spent))}원`}
                    </div>
                  </div>
                  {!mobile && (
                    <div className="cat-row__actions">
                      <button
                        className="p-btn p-btn--ghost p-btn--sm"
                        onClick={() => setEditing(b)}
                      >
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
            })
          )}
        </div>

        {mobile && (
          <button
            className="cat-add-fab"
            onClick={() => setEditing('new')}
            disabled={loading}
          >
            <Plus size={20} strokeWidth={2.4} />
            <span>카테고리 예산 추가</span>
          </button>
        )}
      </div>

      {editing && (
        <BudgetEditDialog
          budget={editing === 'new' ? null : editing}
          categories={categoryList}
          existing={categoryBudgets}
          onClose={() => setEditing(null)}
          onSave={saveCategoryBudget}
          onDelete={
            editing !== 'new'
              ? () => {
                  setConfirmDelete(editing)
                  setEditing(null)
                }
              : undefined
          }
          mobile={mobile}
          submitting={submitting}
        />
      )}
      {editMonthly && (
        <MonthlyBudgetDialog
          value={monthlyLimit}
          onClose={() => setEditMonthly(false)}
          onSave={saveMonthlyBudget}
          mobile={mobile}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="예산 삭제"
          message={`"${
            (confirmDelete.categoryRowId != null
              ? categoryMap.get(confirmDelete.categoryRowId)?.categoryName
              : null) ??
            confirmDelete.categoryName ??
            '이'
          }" 카테고리 예산을 삭제하시겠어요?`}
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}
