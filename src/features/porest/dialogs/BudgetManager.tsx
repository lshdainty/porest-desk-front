import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useExpenseBudgets,
  useExpenseCategories,
  useRangeSummary,
  useCreateExpenseBudget,
  useUpdateExpenseBudget,
  useDeleteExpenseBudget,
} from '@/features/expense'
import type { ExpenseBudget, ExpenseCategory } from '@/entities/expense'
import { KRW, isEn } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount, WonUnit, wonPre } from '@/shared/lib/porest/hide-amounts'
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
  const { t } = useTranslation('budget')
  const { t: tCommon } = useTranslation('common')
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
  const [copyingPrev, setCopyingPrev] = useState(false)

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

  const copyFromLastMonth = async () => {
    const prevList = prevBudgetsQ.data ?? []
    if (prevList.length === 0) {
      setConfirmCopy(false)
      return
    }
    const existingByKey = new Map<string, ExpenseBudget>()
    for (const b of budgetList) existingByKey.set(`${b.categoryRowId ?? 'overall'}`, b)
    // 다이얼로그를 연 채 '복사' 버튼 스피너 — 모든 mutation 완료까지 대기 후 닫기 (앱 정합).
    setCopyingPrev(true)
    try {
      await Promise.all(
        prevList.map(p => {
          const key = `${p.categoryRowId ?? 'overall'}`
          const exists = existingByKey.get(key)
          return exists
            ? updateMut.mutateAsync({ id: exists.rowId, budgetAmount: p.budgetAmount })
            : createMut.mutateAsync({
                categoryRowId: p.categoryRowId ?? null,
                budgetAmount: p.budgetAmount,
                budgetYear: year,
                budgetMonth: month,
              })
        }),
      )
      setConfirmCopy(false)
    } finally {
      setCopyingPrev(false)
    }
  }

  const submitting = createMut.isPending || updateMut.isPending || deleteMut.isPending

  // 앱 _MonthBar 정합 — 모바일은 prev/next 화살표로 월 ±1 이동 (BudgetPage 개요와 동일).
  const adjustMonth = (delta: number) => {
    let ny = year
    let nm = month + delta
    if (nm < 1) {
      ny -= 1
      nm = 12
    }
    if (nm > 12) {
      ny += 1
      nm = 1
    }
    setMonthKey(`${ny}-${String(nm).padStart(2, '0')}`)
  }

  return (
    <>
      {/* 월 바는 ManagerShell(flex-col gap-4=16px) 밖에 둬서 카드와의 간격을
          marginBottom 12 로 직접 제어 — 앱 _MonthBar→카드 SizedBox(PSpace.x12) 정합.
          (쉘 안에 두면 gap 16 + marginBottom 이 더해져 간격이 과하게 벌어짐) */}
      {mobile && (
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 12 }}>
          <Button variant="ghost" size="icon" type="button" aria-label={t('prevMonth')} onClick={() => adjustMonth(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <MonthPicker value={monthKey} onChange={setMonthKey} variant="borderless" />
          <Button variant="ghost" size="icon" type="button" aria-label={t('nextMonth')} onClick={() => adjustMonth(1)}>
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            style={{ marginLeft: 'auto' }}
            onClick={() => setConfirmCopy(true)}
            disabled={prevBudgetsQ.isLoading || (prevBudgetsQ.data?.length ?? 0) === 0}
          >
            <Copy size={12} /> {t('copyLastMonth')}
          </Button>
        </div>
      )}
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title={t('manager.title')}
            description={t('manager.description')}
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
                      ? t('manager.noPrevBudget')
                      : t('manager.copyPrevTitle')
                  }
                >
                  <Copy size={13} /> {t('copyLastMonth')}
                </Button>
              </div>
            }
          />
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
                {t('manager.monthlyTotal', { month })}
              </div>
              {monthlyBudget ? (
                <div className="num" style={{ fontSize: 'var(--text-display-md)', fontWeight: '800', letterSpacing: '-0.022em' }}>
                  <MaskAmount>{wonPre()}{KRW(monthlyLimit)}</MaskAmount>
                  {!isEn() && (
                    <HideUnit>
                      <span style={{ fontSize: 'var(--text-body-lg)', marginLeft: 3 }}>원</span>
                    </HideUnit>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-body-lg)', color: 'var(--fg-tertiary)', fontWeight: '600' }}>
                  {t('manager.notSet')}
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
                  <Pencil size={13} />{tCommon('edit')}
                </>
              ) : (
                <>
                  <Plus size={13} />{t('manager.setBudget')}
                </>
              )}
            </Button>
          </div>
          {monthlyBudget && (
            <div className="budget-bar" style={{ height: 10, marginTop: 12 }}>
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
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('manager.spent')}
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(totalSpent)}</MaskAmount>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('manager.assigned')}
              </div>
              <div className="num" style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700' }}>
                <MaskAmount mask="••••">{KRW(totalAssigned)}</MaskAmount>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 2 }}>
                {t('manager.assignable')}
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
                marginTop: 8,
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
              {t('manager.overCapPre')} <MaskAmount mask="••••">{wonPre()}{KRW(Math.abs(remaining))}</MaskAmount><WonUnit /> {t('manager.overCapPost')}
            </div>
          )}
          </CardContent>
        </Card>

        {/* 헤더+리스트를 한 그룹으로 묶어 ManagerShell gap-4 영향에서 분리, 내부 간격은 여기서 제어 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
              {t('manager.categoryBudgets', { count: categoryBudgets.length })}
            </div>
            <Button
              variant="accent"
              size="sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setEditing('new')}
              disabled={loading || allCategoriesBudgeted}
              title={allCategoriesBudgeted ? t('manager.allBudgetedTooltip') : undefined}
            >
              <Plus size={14} /> {t('addBudget')}
            </Button>
          </div>

          <div className="cat-list">
          {categoryBudgets.length === 0 ? (
            <div className="cat-list__empty">
              <span>{t('manager.emptyCategory')}</span>
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
              const label = cat?.categoryName ?? b.categoryName ?? t('manager.categoryFallback', { id: catId })
              // 행 레이아웃 — 앱 _CategoryRow 정합:
              // [icon | 이름+상태(좌) | 사용액 위·/한도 아래(우)] + 하단 풀폭 진행바.
              return (
                <div
                  key={b.rowId}
                  className={MANAGE_ROW.className}
                  style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingTop: 14, paddingBottom: 14, cursor: mobile ? 'pointer' : undefined }}
                  onClick={mobile ? () => setEditing(b) : undefined}
                  role={mobile ? 'button' : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{ ...MANAGE_ROW.iconStyle, background: palette.bg, color: palette.color, marginRight: 12 }}
                    >
                      <Icon name={cat?.icon ?? 'tag'} size={18} strokeWidth={1.9} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 앱 PTypo.body(14px)/caption(12px·w500) 정합 */}
                      <div
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-caption)',
                          fontWeight: '500',
                          color: state === 'over' ? 'var(--fg-expense)' : 'var(--fg-tertiary)',
                          marginTop: 2,
                        }}
                      >
                        {state === 'over' ? (
                          <>
                            {t('manager.overLimit')} <MaskAmount mask="••••">{wonPre()}{KRW(spent - limitAmt)}</MaskAmount>
                            <WonUnit />
                          </>
                        ) : (
                          <>
                            {t('manager.remaining')} <MaskAmount mask="••••">{wonPre()}{KRW(Math.max(0, limitAmt - spent))}</MaskAmount>
                            <WonUnit />
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div
                        className="num"
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: '700',
                          color: state === 'over' ? 'var(--fg-expense)' : 'var(--fg-primary)',
                        }}
                      >
                        <MaskAmount mask="••••">{KRW(spent)}</MaskAmount>
                      </div>
                      <div
                        className="num"
                        style={{ fontSize: 'var(--text-badge)', fontWeight: '500', color: 'var(--fg-tertiary)' }}
                      >
                        / <MaskAmount mask="••••">{KRW(limitAmt)}</MaskAmount>
                      </div>
                    </div>
                    {!mobile && (
                      <div className={MANAGE_ROW.actionsClassName} style={{ marginLeft: 8 }}>
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
                  <div className="budget-bar" style={{ height: 7 }}>
                    <div
                      className={`budget-bar__fill ${state}`}
                      style={{ width: `${Math.min(100, p)}%` }}
                    />
                  </div>
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
          title={t('deleteTitle')}
          message={t('deleteMessage', {
            name: `"${
              (confirmDelete.categoryRowId != null
                ? categoryMap.get(confirmDelete.categoryRowId)?.categoryName
                : null) ??
              confirmDelete.categoryName ??
              t('thisFallback')
            }"`,
          })}
          confirmLabel={tCommon('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
      {confirmCopy && (
        <ConfirmDialog
          title={t('copyTitle')}
          message={t('copyMessage', {
            prevYear: prevY,
            prevMonth: prevM,
            count: prevBudgetsQ.data?.length ?? 0,
            year,
            month,
          })}
          confirmLabel={t('copy')}
          loading={copyingPrev}
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
          <SkeletonBase className="h-2.5 w-full rounded-full mt-3" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 12,
              paddingTop: 12,
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
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingTop: 14, paddingBottom: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SkeletonBase className="h-9 w-9 rounded-md shrink-0 mr-3" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-3 w-32 mt-1" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 }}>
                <SkeletonBase className="h-4 w-20" />
                <SkeletonBase className="h-3 w-14 mt-1" />
              </div>
              {!mobile && (
                <div className="flex gap-1 ml-2">
                  <SkeletonBase className="h-7 w-7 rounded-md" />
                  <SkeletonBase className="h-7 w-7 rounded-md" />
                </div>
              )}
            </div>
            <SkeletonBase className="h-[7px] w-full rounded-full" />
          </div>
        ))}
      </div>
    </>
  )
}
