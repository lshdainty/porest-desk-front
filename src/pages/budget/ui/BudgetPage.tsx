import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Copy, Plus } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import {
  useBudgetCompliance,
  useCreateExpenseBudget,
  useDeleteExpenseBudget,
  useExpenseBudgets,
  useExpenseCategories,
  useMonthlySummary,
  useUpdateExpenseBudget,
} from '@/features/expense'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import {
  BudgetEditDialog,
  MonthlyBudgetDialog,
  type BudgetDraft,
  getPaletteByColor,
} from '@/features/porest/dialogs'

type OutletCtx = { mobile: boolean }

const currentMonthKey = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const prevMonthKey = (key: string): string => {
  const [y, m] = key.split('-').map(Number) as [number, number]
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey())
  const [year, month] = monthKey.split('-').map(Number) as [number, number]
  const prevKey = prevMonthKey(monthKey)
  const [prevY, prevM] = prevKey.split('-').map(Number) as [number, number]

  const budgetsQ = useExpenseBudgets({ year, month })
  const prevBudgetsQ = useExpenseBudgets({ year: prevY, month: prevM })
  const summaryQ = useMonthlySummary(year, month)
  const categoriesQ = useExpenseCategories()
  const complianceQ = useBudgetCompliance(6)

  const createMut = useCreateExpenseBudget()
  const updateMut = useUpdateExpenseBudget()
  const deleteMut = useDeleteExpenseBudget()

  const [editing, setEditing] = useState<ExpenseBudget | 'new' | null>(null)
  const [editMonthly, setEditMonthly] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseBudget | null>(null)
  const [confirmCopy, setConfirmCopy] = useState(false)

  const budgets: ExpenseBudget[] = budgetsQ.data ?? []
  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    for (const c of categoriesQ.data ?? []) map.set(c.rowId, c)
    return map
  }, [categoriesQ.data])

  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of summaryQ.data?.categoryBreakdown ?? []) {
      map.set(c.categoryRowId, (map.get(c.categoryRowId) ?? 0) + c.totalAmount)
      if (c.parentCategoryRowId != null) {
        map.set(c.parentCategoryRowId, (map.get(c.parentCategoryRowId) ?? 0) + c.totalAmount)
      }
    }
    return map
  }, [summaryQ.data])

  const totalExpense = summaryQ.data?.totalExpense ?? 0
  const overallBudget = budgets.find(b => b.categoryRowId === null)
  const categoryBudgets = budgets.filter(b => b.categoryRowId !== null)

  // 카테고리 한도 합
  const categoryLimitSum = categoryBudgets.reduce((s, b) => s + b.budgetAmount, 0)
  // 월 전체 상한(overall). 없으면 카테고리 합을 대체 값으로 사용.
  const totalLimit = overallBudget?.budgetAmount ?? categoryLimitSum
  // 전체 지출은 언제나 이번 달 EXPENSE 총합 (미분류 포함)
  const totalSpent = totalExpense
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const headerState = pct > 100 ? 'over' : pct > 85 ? 'warn' : ''
  const isLoading = budgetsQ.isLoading || summaryQ.isLoading

  // 전체 상한 대비 카테고리 할당 상태
  const overallLimit = overallBudget?.budgetAmount ?? 0
  const allocable = overallLimit - categoryLimitSum
  const overAllocated = overallBudget != null && categoryLimitSum > overallLimit

  // Pace
  const today = new Date()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayOfMonth = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate()
    : daysInMonth
  const daysElapsedPct = (dayOfMonth / daysInMonth) * 100
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth)
  const dailyActual = Math.round(totalSpent / Math.max(1, dayOfMonth))
  const dailyTarget = Math.round(Math.max(0, totalLimit - totalSpent) / daysRemaining)
  const onTrack = pct <= daysElapsedPct + 5

  // 상태 집계
  const overList = categoryBudgets.filter(b => {
    if (b.categoryRowId == null) return false
    const spent = spentByCategory.get(b.categoryRowId) ?? 0
    return spent > b.budgetAmount
  })
  const healthyList = categoryBudgets.filter(b => {
    if (b.categoryRowId == null) return false
    const spent = spentByCategory.get(b.categoryRowId) ?? 0
    return b.budgetAmount > 0 && spent / b.budgetAmount <= 0.85
  })

  const submitting = createMut.isPending || updateMut.isPending || deleteMut.isPending

  // ---- Mutations ----
  const saveCategoryBudget = (draft: BudgetDraft) => {
    const target = editing !== 'new' && editing ? editing : null
    if (target) {
      updateMut.mutate(
        { id: target.rowId, budgetAmount: draft.budgetAmount },
        { onSuccess: () => setEditing(null) },
      )
      return
    }
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

  const saveMonthlyBudget = (value: number) => {
    if (overallBudget) {
      updateMut.mutate(
        { id: overallBudget.rowId, budgetAmount: value },
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

  const copyFromLastMonth = () => {
    const prevList = prevBudgetsQ.data ?? []
    if (prevList.length === 0) {
      setConfirmCopy(false)
      return
    }
    const existingByKey = new Map<string, ExpenseBudget>()
    for (const b of budgets) {
      existingByKey.set(`${b.categoryRowId ?? 'overall'}`, b)
    }
    for (const p of prevList) {
      const key = `${p.categoryRowId ?? 'overall'}`
      const exists = existingByKey.get(key)
      if (exists) {
        updateMut.mutate({ id: exists.rowId, budgetAmount: p.budgetAmount })
      } else {
        createMut.mutate({
          categoryRowId: p.categoryRowId ?? null,
          budgetAmount: p.budgetAmount,
          budgetYear: year,
          budgetMonth: month,
        })
      }
    }
    setConfirmCopy(false)
  }

  // ---- Cards ----
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
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {month}월 전체 상한
        <button
          type="button"
          className="p-btn p-btn--ghost p-btn--sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setEditMonthly(true)}
        >
          {overallBudget ? '수정' : '설정'}
        </button>
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--fg-tertiary)',
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        이번 달 전체 지출의 상한이에요 (카테고리 예산이 없는 지출도 포함).
      </div>
      {overallBudget ? (
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              paddingTop: 14,
              marginTop: 14,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                전체 상한
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                {KRW(overallLimit)}원
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                카테고리 할당
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                {KRW(categoryLimitSum)}원
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 2 }}>
                할당 가능
              </div>
              <div
                className="num"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: overAllocated ? 'var(--berry-700)' : 'var(--mossy-700)',
                }}
              >
                {overAllocated ? '−' : '+'}
                {KRW(Math.abs(allocable))}원
              </div>
            </div>
          </div>
          {overAllocated && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'oklch(0.96 0.04 20)',
                border: '1px solid var(--berry-300)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--berry-700)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={13} />
              카테고리 한도 합이 전체 상한을 {KRW(categoryLimitSum - overallLimit)}원 초과했어요.
              전체 상한을 올리거나 카테고리 한도를 줄여주세요.
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: '14px 0 2px',
            fontSize: 13,
            color: 'var(--fg-secondary)',
            lineHeight: 1.6,
          }}
        >
          전체 상한이 아직 설정되지 않았어요. 우측 상단 <strong>설정</strong> 버튼으로 이번 달 최대 지출 한도를 지정할 수 있어요.
          {categoryLimitSum > 0 && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
              현재 카테고리 한도 합계: {KRW(categoryLimitSum)}원
            </div>
          )}
        </div>
      )}
    </div>
  )

  const PaceCard = (
    <div className="p-card" style={{ padding: 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>지출 페이스</h2>
        <span
          className={`p-badge ${onTrack ? 'p-badge--success' : 'p-badge--warning'}`}
          style={{ marginLeft: 'auto' }}
        >
          {onTrack ? '정상 속도' : '빠른 속도'}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 12,
          background: 'var(--mist-100)',
          borderRadius: 99,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            background: pct > 100 ? 'var(--berry-500)' : 'var(--bg-brand)',
            borderRadius: 99,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${daysElapsedPct}%`,
            top: -3,
            width: 2,
            height: 18,
            background: 'var(--fg-primary)',
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--fg-tertiary)',
          marginBottom: 16,
        }}
      >
        <span>{pct.toFixed(0)}% 사용</span>
        <span>이번 달 {daysElapsedPct.toFixed(0)}% 경과 ↑</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>
            일평균 지출
          </div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {KRW(dailyActual)}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>
            남은 일 권장 지출
          </div>
          <div
            className="num"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--fg-brand-strong)',
            }}
          >
            {KRW(dailyTarget)}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 2 }}>원</span>
          </div>
        </div>
      </div>
    </div>
  )

  const StatusTiles = (
    <div className="p-card" style={{ padding: 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>예산 현황</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div
          style={{
            padding: 14,
            background: overList.length > 0 ? 'oklch(0.96 0.04 20)' : 'var(--bg-surface)',
            border: `1px solid ${overList.length > 0 ? 'var(--berry-300)' : 'var(--border-subtle)'}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: overList.length > 0 ? 'var(--berry-700)' : 'var(--fg-tertiary)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <AlertTriangle size={13} /> 초과
          </div>
          <div
            className="num"
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: overList.length > 0 ? 'var(--berry-700)' : 'var(--fg-primary)',
            }}
          >
            {overList.length}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              카테고리
            </span>
          </div>
        </div>
        <div
          style={{
            padding: 14,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'var(--mossy-700)',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <CheckCircle2 size={13} /> 여유
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {healthyList.length}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-tertiary)', marginLeft: 4 }}>
              카테고리
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const ComplianceCard = (() => {
    const data = complianceQ.data ?? []
    return (
      <div className="p-card" style={{ padding: 22 }}>
        <div className="sec-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15 }}>최근 6개월 예산 이행률</h2>
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
            한도 대비 지출 %
          </span>
        </div>
        {complianceQ.isLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
            불러오는 중…
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
            아직 이행률 데이터가 없어요
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              height: 140,
              paddingBottom: 28,
              position: 'relative',
            }}
          >
            {data.map(b => {
              const active = b.year === year && b.month === month
              const p = b.compliancePercent
              const barH = Math.min(100, p) * 0.9
              return (
                <div
                  key={`${b.year}-${b.month}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                >
                  <div
                    className="num"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: p > 100 ? 'var(--berry-700)' : active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                    }}
                  >
                    {p.toFixed(0)}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      height: `${barH}%`,
                      background: p > 100
                        ? 'var(--berry-400)'
                        : active
                          ? 'var(--bg-brand)'
                          : 'var(--mist-300)',
                      borderRadius: '6px 6px 0 0',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -22,
                      fontSize: 11,
                      color: active ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {b.month}월
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  })()

  const ListCard = (
    <div className="p-card" style={{ padding: mobile ? 18 : 22 }}>
      <div className="sec-head" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15 }}>카테고리별 예산</h2>
        <span style={{ marginLeft: 8, fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
          {categoryBudgets.length}개 설정됨
        </span>
        <button
          className="p-btn p-btn--ghost p-btn--sm"
          style={{ marginLeft: 'auto' }}
          type="button"
          onClick={() => setEditing('new')}
        >
          <Plus size={13} /> 추가
        </button>
      </div>
      {isLoading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          불러오는 중…
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          카테고리별 예산이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {categoryBudgets.map(b => {
            const catId = b.categoryRowId as number
            const cat = categoryMap.get(catId)
            const palette = getPaletteByColor(cat?.color)
            const name = cat?.categoryName ?? b.categoryName ?? `카테고리 #${catId}`
            const spent = spentByCategory.get(catId) ?? 0
            const limit = b.budgetAmount
            const p = limit > 0 ? (spent / limit) * 100 : 0
            const state = p > 100 ? 'over' : p > 85 ? 'warn' : ''

            return (
              <div key={b.rowId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    className="cat-row__icon"
                    style={{
                      background: palette.bg,
                      color: palette.color,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                      {state === 'over'
                        ? `한도 ${KRW(spent - limit)}원 초과`
                        : `남은 예산 ${KRW(Math.max(0, limit - spent))}원`}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-btn p-btn--ghost p-btn--sm"
                    onClick={() => setEditing(b)}
                  >
                    수정
                  </button>
                  <div className="num" style={{ textAlign: 'right', minWidth: 90 }}>
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

  const PageControls = (
    <>
      <MonthPicker value={monthKey} onChange={setMonthKey} />
      <button
        className="p-btn p-btn--secondary p-btn--sm"
        type="button"
        onClick={() => setConfirmCopy(true)}
        disabled={prevBudgetsQ.isLoading || (prevBudgetsQ.data?.length ?? 0) === 0}
        title={
          (prevBudgetsQ.data?.length ?? 0) === 0
            ? '복사할 지난달 예산이 없어요'
            : '지난달 한도를 이번 달로 복사'
        }
      >
        <Copy size={13} /> 지난달 복사
      </button>
      <button
        className="p-btn p-btn--primary p-btn--sm"
        type="button"
        onClick={() => setEditing('new')}
      >
        <Plus size={14} /> 카테고리 예산
      </button>
    </>
  )

  const Dialogs = (
    <>
      {editing && (
        <BudgetEditDialog
          budget={editing === 'new' ? null : editing}
          categories={categoriesQ.data ?? []}
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
          value={overallBudget?.budgetAmount ?? 0}
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
      {confirmCopy && (
        <ConfirmDialog
          title="지난달 예산 복사"
          message={`${prevY}년 ${prevM}월 예산 한도(${
            prevBudgetsQ.data?.length ?? 0
          }개)를 ${year}년 ${month}월로 복사해요. 이번 달에 이미 있는 예산은 덮어써집니다.`}
          confirmLabel="복사"
          onCancel={() => setConfirmCopy(false)}
          onConfirm={copyFromLastMonth}
        />
      )}
    </>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {PageControls}
        </div>
        {HeaderCard}
        {PaceCard}
        {StatusTiles}
        {ListCard}
        {ComplianceCard}
        {Dialogs}
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
        <div className="right">{PageControls}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {HeaderCard}
          {PaceCard}
          {StatusTiles}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ListCard}
          {ComplianceCard}
        </div>
      </div>
      {Dialogs}
    </div>
  )
}
