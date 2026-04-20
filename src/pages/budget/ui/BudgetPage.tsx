import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import {
  useExpenseBudgets,
  useExpenseCategories,
  useMonthlySummary,
} from '@/features/expense'
import type { ExpenseBudget } from '@/entities/expense'

type OutletCtx = { mobile: boolean }

const getCurrentYearMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { year, month } = getCurrentYearMonth()

  const budgetsQ = useExpenseBudgets({ year, month })
  const summaryQ = useMonthlySummary(year, month)
  const categoriesQ = useExpenseCategories()

  const budgets: ExpenseBudget[] = budgetsQ.data ?? []
  const categoryNameMap = useMemo(() => {
    const map = new Map<number, { name: string; color: string | null }>()
    for (const c of categoriesQ.data ?? []) {
      map.set(c.rowId, { name: c.categoryName, color: c.color })
    }
    return map
  }, [categoriesQ.data])

  // spent per category from monthly summary
  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of summaryQ.data?.categoryBreakdown ?? []) {
      map.set(c.categoryRowId, (map.get(c.categoryRowId) ?? 0) + c.totalAmount)
    }
    return map
  }, [summaryQ.data])

  const totalExpense = summaryQ.data?.totalExpense ?? 0

  // Split budgets into overall (categoryRowId === null) and per-category
  const overallBudget = budgets.find(b => b.categoryRowId === null)
  const categoryBudgets = budgets.filter(b => b.categoryRowId !== null)

  const totalLimit = overallBudget?.budgetAmount ?? categoryBudgets.reduce((s, b) => s + b.budgetAmount, 0)
  const totalSpent = overallBudget ? totalExpense : categoryBudgets.reduce(
    (s, b) => s + (b.categoryRowId !== null ? (spentByCategory.get(b.categoryRowId) ?? 0) : 0),
    0,
  )
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const headerState = pct > 100 ? 'over' : pct > 85 ? 'warn' : ''

  const isLoading = budgetsQ.isLoading || summaryQ.isLoading

  const HeaderCard = (
    <div
      className="p-card p-card--brand"
      style={{ padding: mobile ? 18 : 24, marginBottom: mobile ? 12 : 0 }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--fg-brand-strong)',
          fontWeight: 600,
          letterSpacing: '0.02em',
          marginBottom: 6,
        }}
      >
        {month}월 전체 예산
      </div>
      {totalLimit === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--fg-secondary)', padding: '12px 0' }}>
          설정된 예산이 없어요
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <div
              className="num"
              style={{ fontSize: mobile ? 24 : 30, fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              {KRW(totalSpent)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--fg-secondary)', fontWeight: 500 }}>
              / {KRW(totalLimit)}원
            </div>
          </div>
          <div className="budget-bar" style={{ height: 10 }}>
            <div
              className={`budget-bar__fill ${headerState}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--fg-secondary)',
              marginTop: 8,
            }}
          >
            <span>{pct.toFixed(0)}% 사용</span>
            <span>
              {totalLimit - totalSpent >= 0
                ? `남은 예산 ${KRW(totalLimit - totalSpent)}원`
                : `한도 ${KRW(totalSpent - totalLimit)}원 초과`}
            </span>
          </div>
        </>
      )}
    </div>
  )

  const ListCard = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>카테고리별 예산</h2>
        <button
          className="p-btn p-btn--outline p-btn--sm"
          style={{ marginLeft: 'auto' }}
          type="button"
          onClick={() => {}}
        >
          <Plus size={13} /> 카테고리 추가
        </button>
      </div>
      {isLoading ? (
        <div
          style={{
            padding: '32px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 13,
          }}
        >
          불러오는 중…
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div
          style={{
            padding: '32px 0',
            textAlign: 'center',
            color: 'var(--fg-tertiary)',
            fontSize: 13,
          }}
        >
          카테고리별 예산이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {categoryBudgets.map((b, i) => {
            const catId = b.categoryRowId as number
            const catMeta = categoryNameMap.get(catId)
            const catName = catMeta?.name ?? `카테고리 #${catId}`
            const catColor = catMeta?.color ?? 'var(--mossy-500)'
            const spent = spentByCategory.get(catId) ?? 0
            const limit = b.budgetAmount
            const p = limit > 0 ? (spent / limit) * 100 : 0
            const state = p > 100 ? 'over' : p > 85 ? 'warn' : ''

            return (
              <div key={b.rowId ?? i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: catColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{catName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {state === 'over'
                        ? `한도 ${KRW(spent - limit)}원 초과`
                        : `남은 예산 ${KRW(Math.max(0, limit - spent))}원`}
                    </div>
                  </div>
                  <div className="num" style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: state === 'over' ? 'var(--berry-700)' : 'var(--fg-primary)',
                      }}
                    >
                      {KRW(spent)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500 }}>
                      / {KRW(limit)}
                    </div>
                  </div>
                </div>
                <div className="budget-bar" style={{ height: 7 }}>
                  <div
                    className={`budget-bar__fill ${state}`}
                    style={{ width: `${Math.min(100, p)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        {HeaderCard}
        {ListCard}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>예산</h1>
          <div className="sub">카테고리별 한도 관리</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'start' }}>
        {HeaderCard}
        {ListCard}
      </div>
    </div>
  )
}
