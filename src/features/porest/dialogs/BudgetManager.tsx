import { useMemo, useState } from 'react'
import { AlertTriangle, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useExpenseBudgets,
  useExpenseCategories,
  useRangeSummary,
  useCreateExpenseBudget,
  useUpdateExpenseBudget,
  useDeleteExpenseBudget,
} from '@/features/expense'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Icon, MonthPicker } from '@/shared/ui/porest/primitives'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { MANAGE_ROW } from '@/shared/ui/porest/manage-row'
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import { BudgetEditDialog, MonthlyBudgetDialog, type BudgetDraft } from './BudgetEditDialog'
import { getPaletteByColor } from './CategoryEditDialog'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

const currentMonthKey = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const prevMonthKey = (key: string): string => {
  const [y, m] = key.split('-').map(Number) as [number, number]
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

export function BudgetManager({ mobile }: { mobile: boolean }) {
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey())
  const [year, month] = monthKey.split('-').map(Number) as [number, number]
  const prevKey = prevMonthKey(monthKey)
  const [prevY, prevM] = prevKey.split('-').map(Number) as [number, number]

  const { data: budgets, isLoading: loadingBudgets } = useExpenseBudgets({ year, month })
  const prevBudgetsQ = useExpenseBudgets({ year: prevY, month: prevM })
  const { data: categories, isLoading: loadingCategories } = useExpenseCategories()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndDate = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(monthEndDate).padStart(2, '0')}`
  const { data: monthlySummary, isLoading: loadingSummary } = useRangeSummary(monthStart, monthEnd)

  const createMut = useCreateExpenseBudget()
  const updateMut = useUpdateExpenseBudget()
  const deleteMut = useDeleteExpenseBudget()

  const [editing, setEditing] = useState<ExpenseBudget | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseBudget | null>(null)
  const [editMonthly, setEditMonthly] = useState(false)
  const [confirmCopy, setConfirmCopy] = useState(false)

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

  // 예산 추가 가능 카테고리 = EXPENSE top-level(BudgetEditDialog 의 selectable 과 동일).
  // 전부 예산 보유 시 "예산 추가" 버튼 비활성화.
  const allCategoriesBudgeted = useMemo(() => {
    const top = categoryList.filter(c => c.expenseType === 'EXPENSE' && c.parentRowId == null)
    const used = new Set(categoryBudgets.map(b => b.categoryRowId))
    return top.length > 0 && top.every(c => used.has(c.rowId))
  }, [categoryList, categoryBudgets])

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

  const copyFromLastMonth = () => {
    const prevList = prevBudgetsQ.data ?? []
    if (prevList.length === 0) {
      setConfirmCopy(false)
      return
    }
    const existingByKey = new Map<string, ExpenseBudget>()
    for (const b of budgetList) existingByKey.set(`${b.categoryRowId ?? 'overall'}`, b)
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

  const submitting = createMut.isPending || updateMut.isPending || deleteMut.isPending

  return (
    <>
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="예산 설정"
            description="월간 총 예산과 카테고리별 한도를 설정합니다. 예산의 85% 이상 사용하면 알림을 보내드려요."
            actions={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <MonthPicker value={monthKey} onChange={setMonthKey} />
                <Button
                  variant="secondary"
                  size="sm"
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
                </Button>
              </div>
            }
          />
        )}

        {mobile && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <MonthPicker value={monthKey} onChange={setMonthKey} />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setConfirmCopy(true)}
              disabled={prevBudgetsQ.isLoading || (prevBudgetsQ.data?.length ?? 0) === 0}
            >
              <Copy size={12} /> 지난달 복사
            </Button>
          </div>
        )}

        {loading ? (
          <BudgetManagerSkeleton mobile={mobile} />
        ) : (
        <>
        <Card style={{ background: 'linear-gradient(var(--bg-brand-tint), var(--bg-brand-tint)), var(--bg-surface)' }}>
          <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: 'var(--text-badge)',
                  color: 'var(--fg-brand-strong)',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {month}월 총 예산
              </div>
              {monthlyBudget ? (
                <div className="num" style={{ fontSize: 'var(--text-display-md)', fontWeight: '800', letterSpacing: '-0.022em' }}>
                  <MaskAmount>{KRW(monthlyLimit)}</MaskAmount>
                  <HideUnit>
                    <span style={{ fontSize: 'var(--text-body-lg)', marginLeft: 3 }}>원</span>
                  </HideUnit>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-body-lg)', color: 'var(--fg-tertiary)', fontWeight: '600' }}>
                  설정되지 않음
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
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
            </Button>
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
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                사용
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(totalSpent)}</MaskAmount>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                할당됨
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(totalAssigned)}</MaskAmount>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                할당 가능
              </div>
              <div
                className="num"
                style={{
                  fontSize: 'var(--text-body-lg)',
                  fontWeight: '700',
                  color: remaining < 0 ? 'var(--fg-expense)' : 'var(--fg-income)',
                }}
              >
                <MaskAmount mask="••••">
                  {remaining >= 0 ? '+' : ''}
                  {KRW(remaining)}
                </MaskAmount>
              </div>
            </div>
          </div>
          {monthlyBudget != null && remaining < 0 && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'var(--status-danger-subtle)',
                border: '1px solid color-mix(in oklch, var(--fg-expense) 30%, transparent)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-caption)',
                color: 'var(--status-danger-fg)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={13} />
              카테고리 한도 합이 전체 상한을 <MaskAmount mask="••••">{KRW(Math.abs(remaining))}</MaskAmount><HideUnit>원</HideUnit> 초과했어요.
              전체 상한을 올리거나 카테고리 한도를 줄여주세요.
            </div>
          )}
          </CardContent>
        </Card>

        {/* 헤더+리스트를 한 그룹으로 묶어 ManagerShell gap-4 영향에서 분리, 내부 간격은 여기서 제어 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
              카테고리별 예산 · {categoryBudgets.length}개
            </div>
            <Button
              variant="accent"
              size="sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditing('new')}
              disabled={loading || allCategoriesBudgeted}
              title={allCategoriesBudgeted ? '모든 카테고리에 이미 예산이 설정되어 있어요' : undefined}
            >
              <Plus size={14} /> 예산 추가
            </Button>
          </div>

          <div className="cat-list">
          {categoryBudgets.length === 0 ? (
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
                  className={MANAGE_ROW.className}
                  style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14, cursor: mobile ? 'pointer' : undefined }}
                  onClick={mobile ? () => setEditing(b) : undefined}
                  role={mobile ? 'button' : undefined}
                >
                  <span
                    style={{ ...MANAGE_ROW.iconStyle, background: palette.bg, color: palette.color }}
                  >
                    <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{label}</div>
                      <div
                        className="num"
                        style={{
                          marginLeft: 'auto',
                          fontSize: 'var(--text-label-sm)',
                          fontWeight: '700',
                          color: state === 'over' ? 'var(--fg-expense)' : 'var(--fg-primary)',
                        }}
                      >
                        <MaskAmount mask="••••">{KRW(spent)}</MaskAmount>
                        <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}>
                          {' '}
                          / <MaskAmount mask="••••">{KRW(limitAmt)}</MaskAmount>
                        </span>
                      </div>
                    </div>
                    <div className="budget-bar" style={{ height: 6 }}>
                      <div
                        className={`budget-bar__fill ${state}`}
                        style={{ width: `${Math.min(100, p)}%` }}
                      />
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
                      {state === 'over' ? (
                        <>
                          <MaskAmount mask="••••">{KRW(spent - limitAmt)}</MaskAmount>
                          <HideUnit>원</HideUnit> 초과
                        </>
                      ) : (
                        <>
                          남은 예산 <MaskAmount mask="••••">{KRW(Math.max(0, limitAmt - spent))}</MaskAmount>
                          <HideUnit>원</HideUnit>
                        </>
                      )}
                    </div>
                  </div>
                  {!mobile && (
                    <div className={MANAGE_ROW.actionsClassName}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(b)}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={MANAGE_ROW.delClassName}
                        onClick={() => setConfirmDelete(b)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        </div>
        </>
        )}
      </ManagerShell>

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
          loading={deleteMut.isPending}
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
          loading={createMut.isPending || updateMut.isPending}
          onCancel={() => setConfirmCopy(false)}
          onConfirm={copyFromLastMonth}
        />
      )}
    </>
  )
}

/** BudgetManager skeleton — 월 총 예산 카드(brand-tint) + 카테고리별 예산 row 리스트. */
function BudgetManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <>
      <Card style={{ background: 'linear-gradient(var(--bg-brand-tint), var(--bg-brand-tint)), var(--bg-surface)' }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div>
              <SkeletonBase className="h-3 w-20 mb-2" />
              <SkeletonBase className="h-10 w-48" />
            </div>
            <SkeletonBase className="h-8 w-16 rounded-md ml-auto" />
          </div>
          <SkeletonBase className="h-2.5 w-full rounded-full mt-3.5" />
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <SkeletonBase className="h-3 w-12 mb-1.5" />
                <SkeletonBase className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
        <SkeletonBase className="h-4 w-36" />
      </div>

      <div className="cat-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={MANAGE_ROW.className}
            style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}
          >
            <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-4 w-28 ml-auto" />
              </div>
              <SkeletonBase className="h-1.5 w-full rounded-full" />
              <SkeletonBase className="h-3 w-32 mt-2" />
            </div>
            {!mobile && (
              <div className="flex gap-1">
                <SkeletonBase className="h-7 w-7 rounded-md" />
                <SkeletonBase className="h-7 w-7 rounded-md" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
