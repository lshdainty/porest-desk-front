import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertTriangle, Calendar, CheckCircle2, Copy, Plus } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import {
  useBudgetCompliance,
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
  const complianceQ = useBudgetCompliance(6)

  const budgets: ExpenseBudget[] = budgetsQ.data ?? []
  const categoryNameMap = useMemo(() => {
    const map = new Map<number, { name: string; color: string | null }>()
    for (const c of categoriesQ.data ?? []) {
      map.set(c.rowId, { name: c.categoryName, color: c.color })
    }
    return map
  }, [categoriesQ.data])

  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of summaryQ.data?.categoryBreakdown ?? []) {
      map.set(c.categoryRowId, (map.get(c.categoryRowId) ?? 0) + c.totalAmount)
    }
    return map
  }, [summaryQ.data])

  const totalExpense = summaryQ.data?.totalExpense ?? 0

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

  // Pace 계산
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

  // 상태 타일
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
            <div className="num" style={{ fontSize: mobile ? 24 : 30, fontWeight: 800, letterSpacing: '-0.03em' }}>
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
            {data.map((b, i) => {
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
                  {i === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${100 - 90}%`,
                        height: 1,
                        borderTop: '1px dashed var(--border-default)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
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
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          불러오는 중…
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
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
        {PaceCard}
        {StatusTiles}
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
        <div className="right">
          <button className="p-btn p-btn--secondary p-btn--sm" type="button">
            <Calendar size={13} /> {year}년 {month}월
          </button>
          <button className="p-btn p-btn--secondary p-btn--sm" type="button">
            <Copy size={13} /> 지난달 복사
          </button>
          <button className="p-btn p-btn--primary p-btn--sm" type="button">
            <Plus size={14} /> 카테고리 예산
          </button>
        </div>
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
    </div>
  )
}
