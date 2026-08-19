import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Bell,
  MoreVertical,
  PauseCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  TrendingDown,
  TrendingUp,
  Trash2,
  Zap,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { renderIcon, tileRadius } from '@/shared/lib'
import { KRW } from '@/shared/lib/porest/format'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import {
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useToggleRecurringTransaction,
} from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import type { RecurringTransaction } from '@/entities/recurring-transaction'
import { getPaletteByColor } from './CategoryEditDialog'
import { RecurringAddDialog } from './RecurringAddDialog'
import { RecurringEditDialog } from './RecurringEditDialog'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type FilterKey = 'all' | 'expense' | 'income' | 'paused'

const DROP_ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
  width: '100%', padding: '10px 14px',
  border: 'none', background: 'transparent',
  cursor: 'pointer', textAlign: 'left' as const, fontFamily: 'inherit',
  fontSize: 'var(--text-body-sm)', color: 'var(--fg-primary)',
}

// 모바일 카드 다이어트 — CardContent 조건부: 모바일은 패딩 없는 평문, 데스크톱은 CardContent.
function MaybeContent({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile ? <div>{children}</div> : <CardContent>{children}</CardContent>
}

// 모바일 카드 다이어트 — 섹션 셸: 모바일은 카드 없이(.m-subpage 플랫), 데스크톱은 Card.
function FlatShell({ mobile, children, cardStyle }: { mobile: boolean; children: React.ReactNode; cardStyle?: React.CSSProperties }) {
  return mobile ? <section>{children}</section> : <Card style={cardStyle}>{children}</Card>
}

export function RecurringManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('recurring')
  const { t: tExpense } = useTranslation('expense')
  const { t: tCommon } = useTranslation('common')
  const recurringsQ = useRecurringTransactions()
  const categoriesQ = useExpenseCategories()
  const toggleMut = useToggleRecurringTransaction()
  const deleteMut = useDeleteRecurringTransaction()

  const isLoading = recurringsQ.isLoading || categoriesQ.isLoading

  const items = recurringsQ.data ?? []
  const categories = categoriesQ.data ?? []

  const [filter, setFilter] = useState<FilterKey>('all')
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [toast, setToast] = useState<string>('')
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const filtered = useMemo(() => {
    return items.filter(it => {
      const isActive = it.isActive === 'Y'
      if (filter === 'expense') return it.expenseType === 'EXPENSE' && isActive
      if (filter === 'income') return it.expenseType === 'INCOME' && isActive
      if (filter === 'paused') return !isActive
      return true
    })
  }, [items, filter])

  const stats = useMemo(() => {
    const active = items.filter(i => i.isActive === 'Y')
    const monthlyExpense = active
      .filter(i => i.expenseType === 'EXPENSE' && i.frequency === 'MONTHLY')
      .reduce((s, i) => s + Math.abs(i.amount), 0)
    const monthlyIncome = active
      .filter(i => i.expenseType === 'INCOME' && i.frequency === 'MONTHLY')
      .reduce((s, i) => s + i.amount, 0)
    const today = startOfDay(new Date())
    const next7 = active
      .filter(i => {
        const due = startOfDay(new Date(i.nextExecutionDate))
        const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000)
        return diff >= 0 && diff <= 7
      })
      .sort((a, b) => a.nextExecutionDate.localeCompare(b.nextExecutionDate))
    return {
      monthlyExpense,
      monthlyIncome,
      count: active.length,
      paused: items.length - active.length,
      next7,
    }
  }, [items])

  const counts = useMemo(() => ({
    all: items.length,
    expense: items.filter(i => i.expenseType === 'EXPENSE' && i.isActive === 'Y').length,
    income: items.filter(i => i.expenseType === 'INCOME' && i.isActive === 'Y').length,
    paused: items.filter(i => i.isActive !== 'Y').length,
  }), [items])

  const togglePause = (it: RecurringTransaction) => {
    if (pendingToggleId !== null) return
    setPendingToggleId(it.rowId)
    toggleMut.mutate(it.rowId, {
      onSuccess: () => showToast(it.isActive === 'Y' ? t('toastPaused', { name: displayTitle(it, t) }) : t('toastResumed', { name: displayTitle(it, t) })),
      onSettled: () => setPendingToggleId(null),
    })
  }

  const removeItem = (id: number) => {
    const it = items.find(i => i.rowId === id)
    setPendingDeleteId(id)
    deleteMut.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null)
        if (it) showToast(t('toastDeleted', { name: displayTitle(it, t) }))
      },
      onSettled: () => setPendingDeleteId(null),
    })
  }

  const FILTERS: { k: FilterKey; label: string; count: number }[] = [
    { k: 'all', label: t('filterAll'), count: counts.all },
    { k: 'expense', label: tExpense('expense'), count: counts.expense },
    { k: 'income', label: tExpense('income'), count: counts.income },
    { k: 'paused', label: t('paused'), count: counts.paused },
  ]

  if (isLoading) {
    return <RecurringManagerSkeleton mobile={mobile} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Summary stats — raised 카드(가계부 취합·예산 히어로 정합, 사용자 결정) */}
      <Card variant="raised">
        <CardContent>
          {mobile ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <RecStat label={t('statActive')} value={t('countItems', { count: stats.count })} Icon={Repeat} />
                <RecStat label={t('paused')} value={t('countItems', { count: stats.paused })} Icon={PauseCircle} tone="muted" />
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <RecStat label={t('statMonthlyExpense')} value={<MaskAmount card="etc.recurring">-{KRW(stats.monthlyExpense)}</MaskAmount>} Icon={TrendingDown} tone="expense" />
                <RecStat label={t('statMonthlyIncome')} value={<MaskAmount card="etc.recurring">+{KRW(stats.monthlyIncome)}</MaskAmount>} Icon={TrendingUp} tone="income" />
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-xl)' }}>
              <RecStat label={t('statActive')} value={t('countItems', { count: stats.count })} Icon={Repeat} />
              <RecStat label={t('statMonthlyExpense')} value={<MaskAmount card="etc.recurring">-{KRW(stats.monthlyExpense)}</MaskAmount>} Icon={TrendingDown} tone="expense" />
              <RecStat label={t('statMonthlyIncome')} value={<MaskAmount card="etc.recurring">+{KRW(stats.monthlyIncome)}</MaskAmount>} Icon={TrendingUp} tone="income" />
              <RecStat label={t('paused')} value={t('countItems', { count: stats.paused })} Icon={PauseCircle} tone="muted" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next 7 days — 모바일 카드 다이어트: 셸 카드 벗김 (내부 sunken 타일 유지) */}
      {stats.next7.length > 0 && (
        <FlatShell mobile={mobile} cardStyle={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
          <MaybeContent mobile={mobile}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)', margin: 0 }}>{t('next7Days')}</h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('scheduledCount', { count: stats.next7.length })}</span>
          </div>
          {/* 다가오는 7일 타일은 헤더와 좌우 정렬(inset 0) — 추가 좌우 inset 제거(사용자 결정) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {stats.next7.map(it => {
              const today = startOfDay(new Date())
              const due = startOfDay(new Date(it.nextExecutionDate))
              const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
              const isToday = days === 0
              const cat = categories.find(c => c.rowId === it.categoryRowId)
              const palette = getPaletteByColor(cat?.color)
              const isExpense = it.expenseType === 'EXPENSE'
              return (
                <div
                  key={it.rowId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isToday ? 'color-mix(in oklch, var(--fg-expense) 8%, transparent)' : 'var(--bg-sunken)',
                    border: isToday ? '1px solid color-mix(in oklch, var(--fg-expense) 25%, transparent)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="num"
                    style={{
                      minWidth: 44,
                      textAlign: 'center',
                      fontSize: 'var(--text-badge)',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: isToday ? 'var(--fg-expense)' : 'var(--bg-surface)',
                      color: isToday ? 'var(--fg-on-danger)' : 'var(--fg-secondary)',
                    }}
                  >
                    {isToday ? t('today') : t('date:dday', { count: days })}
                  </span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: tileRadius(28),
                      background: palette.bg,
                      color: palette.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderIcon(cat?.icon ?? 'tag', cat?.categoryName?.charAt(0) ?? '·', 14)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayTitle(it, t)}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                      {it.assetName ?? t('noAccount')} · {recurringSummary(it, t)}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: isExpense ? 'var(--fg-expense)' : 'var(--fg-income)' }}>
                    <MaskAmount card="etc.recurring">{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
                  </div>
                </div>
              )
            })}
          </div>
          </MaybeContent>
        </FlatShell>
      )}

      {/* 헤더(전체 목록·추가) + 필터 토글 + 리스트 — label·toggle 은 카드 밖(사용자 결정,
          계좌·카드/예산 관리 정합). 셋은 한 묶음이라 사이 간격은 여기서 제어. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 0 : 12 }}>
        <div>
          {/* 1행: 라벨만 */}
          <h3 style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)', margin: 0 }}>{t('listTitle')}</h3>
          {/* 2행: 필터 토글(좌, 넘치면 가로 스크롤·스크롤바 숨김) + 추가 버튼(우) — 사용자 결정 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 4 }}>
            <div className="scrollbar-hide" style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
              <Tabs value={filter} onValueChange={(v) => v && setFilter(v as FilterKey)}>
                <TabsList variant="pills" size="sm" className="w-max">
                  {FILTERS.map((f) => (
                    <TabsTrigger key={f.k} value={f.k} className="shrink-0">
                      {f.label} {f.count}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Button variant="accent" size="sm" className="shrink-0" onClick={() => setAdding(true)}>
              <Plus size={14} /> {tCommon('add')}
            </Button>
          </div>
        </div>

      <FlatShell mobile={mobile} cardStyle={{ overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recurringsQ.isLoading && (
            <>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  // 실제 행과 같은 그리드·여백 — 아이콘 36, 모바일 패딩 '12px 0'.
                  style={{
                    display: 'grid',
                    gridTemplateColumns: mobile ? '36px 1fr auto' : '36px 1fr auto auto',
                    alignItems: 'center',
                    gap: mobile ? 12 : 16,
                    padding: mobile ? '12px 0' : '14px 20px',
                    borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <SkeletonBase className="h-9 w-9 rounded-[var(--radius-md)]" />
                  <div style={{ minWidth: 0 }}>
                    {/* 제목 줄 — 실렌더 marginBottom 2 */}
                    <SkeletonBase className="h-4 w-2/5" style={{ marginBottom: 2 }} />
                    <SkeletonBase className="h-3 w-3/4" />
                  </div>
                  {/* 데스크톱 금액 열 — 실렌더 minWidth 110 */}
                  {!mobile && <SkeletonBase className="h-4 ml-auto" style={{ width: 110 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    {mobile ? (
                      <>
                        <SkeletonBase className="h-4 w-16" style={{ marginRight: 4 }} />
                        <SkeletonBase className="h-8 w-8 rounded-[var(--radius-md)]" />
                      </>
                    ) : (
                      /* RecAction(Button size=icon, h-9) 3개 — 재생/편집/삭제 */
                      [0, 1, 2].map(a => <SkeletonBase key={a} className="h-9 w-9 rounded-[var(--radius-md)]" />)
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          {!recurringsQ.isLoading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              {t('empty')}
            </div>
          )}
          {filtered.map((it, idx) => {
            const isActive = it.isActive === 'Y'
            const isExpense = it.expenseType === 'EXPENSE'
            const cat = categories.find(c => c.rowId === it.categoryRowId)
            const palette = getPaletteByColor(cat?.color)
            return (
              <div
                key={it.rowId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: mobile ? '36px 1fr auto' : '36px 1fr auto auto',
                  alignItems: 'center',
                  gap: mobile ? 12 : 16,
                  // 행 좌우 inset 4(사용자 결정) — 라벨·토글은 inset 0.
                  // 모바일 좌우 0 — 페이지가 24 를 쥔다(설정 리스트 공통 규칙).
                  padding: mobile ? '12px 0' : '14px 20px',
                  borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: tileRadius(36),
                    background: palette.bg,
                    color: palette.color,
                    opacity: isActive ? 1 : 0.55,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderIcon(cat?.icon ?? 'tag', cat?.categoryName?.charAt(0) ?? '·', 18)}
                </span>
                <div style={{ minWidth: 0, opacity: isActive ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: '600',
                        color: 'var(--fg-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayTitle(it, t)}
                    </span>
                    {!isActive && (
                      <span
                        style={{
                          fontSize: 'var(--text-badge)',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-sunken)',
                          color: 'var(--fg-tertiary)',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t('paused')}
                      </span>
                    )}
                    {it.maxOccurrences != null && (
                      <span
                        className="num"
                        style={{
                          fontSize: 'var(--text-badge)',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--status-warning-subtle)',
                          color: 'var(--status-warning-fg)',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t('occurrencesBadge', { done: it.executedCount, total: it.maxOccurrences })}
                      </span>
                    )}
                    {it.autoLog && (
                      <span title={t('autoLog')} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--fg-brand-strong)', flexShrink: 0 }}>
                        <Zap size={11} strokeWidth={2.4} />
                      </span>
                    )}
                    {it.notifyDayBefore && (
                      <span title={t('notifyDayBefore')} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--fg-tertiary)', flexShrink: 0 }}>
                        <Bell size={11} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                    {recurringSummary(it, t)} · {it.assetName ?? t('noAccount')} · {t('nextDate', { date: it.nextExecutionDate.slice(5).replace('-', '/') })}
                  </div>
                </div>
                {!mobile && (
                  <div
                    className="num"
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: '700',
                      color: isExpense ? 'var(--fg-expense)' : 'var(--fg-income)',
                      textAlign: 'right',
                      minWidth: 110,
                      opacity: isActive ? 1 : 0.55,
                    }}
                  >
                    <MaskAmount card="etc.recurring">{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  {mobile ? (
                    <>
                      <span
                        className="num"
                        style={{
                          fontSize: 'var(--text-label-sm)',
                          fontWeight: '700',
                          color: isExpense ? 'var(--fg-expense)' : 'var(--fg-income)',
                          marginRight: 4,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0.55,
                        }}
                      >
                        <MaskAmount card="etc.recurring">{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
                      </span>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === it.rowId ? null : it.rowId)}
                          style={{
                            width: 32, height: 32,
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: openMenuId === it.rowId ? 'var(--bg-sunken)' : 'transparent',
                            color: 'var(--fg-tertiary)',
                            cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <MoreVertical size={16} strokeWidth={1.9} />
                        </button>
                        {openMenuId === it.rowId && (
                          <div style={{
                            position: 'absolute', right: 0, top: 36,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 51, minWidth: 140, overflow: 'hidden',
                          }}>
                            <button
                              type="button"
                              onClick={() => { togglePause(it); setOpenMenuId(null) }}
                              style={DROP_ITEM_STYLE}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              {isActive ? <Pause size={14} strokeWidth={1.9} /> : <Play size={14} strokeWidth={1.9} />}
                              <span>{isActive ? t('pause') : t('start')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditing(it); setOpenMenuId(null) }}
                              style={DROP_ITEM_STYLE}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              <Pencil size={14} strokeWidth={1.9} />
                              <span>{tCommon('edit')}</span>
                            </button>
                            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                            <button
                              type="button"
                              onClick={() => { setConfirmDeleteId(it.rowId); setOpenMenuId(null) }}
                              style={{ ...DROP_ITEM_STYLE, color: 'var(--fg-expense)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklch, var(--fg-expense) 8%, transparent)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              <Trash2 size={14} strokeWidth={1.9} />
                              <span>{tCommon('delete')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <RecAction
                        Icon={isActive ? Pause : Play}
                        title={isActive ? t('pause') : t('resume')}
                        onClick={() => togglePause(it)}
                        loading={pendingToggleId === it.rowId}
                        disabled={pendingToggleId !== null && pendingToggleId !== it.rowId}
                      />
                      <RecAction
                        Icon={Pencil}
                        title={t('editAction')}
                        onClick={() => setEditing(it)}
                        disabled={pendingToggleId === it.rowId || pendingDeleteId === it.rowId}
                      />
                      <RecAction
                        Icon={Trash2}
                        title={tCommon('delete')}
                        tone="danger"
                        onClick={() => setConfirmDeleteId(it.rowId)}
                        loading={pendingDeleteId === it.rowId}
                        disabled={pendingToggleId === it.rowId}
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </FlatShell>
      </div>

      {editing && (
        <RecurringEditDialog
          recurring={editing}
          mobile={mobile}
          onClose={() => setEditing(null)}
          onSaved={() => showToast(t('toastSaved'))}
        />
      )}

      {adding && (
        <RecurringAddDialog
          mobile={mobile}
          onClose={() => setAdding(false)}
          onCreated={() => showToast(t('toastAdded'))}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDialog
          title={t('deleteTitle')}
          message={t('deleteConfirmMessage', { name: displayTitle(items.find(i => i.rowId === confirmDeleteId)!, t) })}
          confirmLabel={tCommon('delete')}
          danger
          loading={deleteMut.isPending}
          onConfirm={() => removeItem(confirmDeleteId)}
          onCancel={() => !deleteMut.isPending && setConfirmDeleteId(null)}
        />
      )}

      {openMenuId !== null && (
        <div
          onClick={() => setOpenMenuId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        />
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            background: 'var(--fg-primary)',
            color: 'var(--bg-surface)',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-label-sm)',
            fontWeight: '600',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-sticky)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/** RecurringManager skeleton — summary 4 stat 카드 + 다가오는 7일 + 전체 목록. */
function RecurringManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Summary stats — raised(실제와 동일) */}
      <Card variant="raised">
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: mobile ? 12 : 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonBase className="h-3 w-16" />
                <SkeletonBase className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next 7 days — 실제와 동일: 모바일 플랫(라벨 0 + 타일 inset 10) / 데스크톱 카드 */}
      <FlatShell mobile={mobile} cardStyle={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <MaybeContent mobile={mobile}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-3 w-16" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-tile)',
                  background: 'var(--bg-sunken)',
                }}
              >
                <SkeletonBase className="h-6 w-11 rounded-md shrink-0" />
                <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/2" />
                </div>
                <SkeletonBase className="h-4 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </MaybeContent>
      </FlatShell>

      {/* Filter chips + list — 실제와 동일: 모바일 플랫(라벨 0 + 행 inset 10) */}
      {/* 헤더·토글은 카드 밖(실제 렌더 정합) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 0 : 12 }}>
        <div>
          <SkeletonBase className="h-4 w-20" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBase key={i} className="h-7 w-14 rounded-full shrink-0" />
            ))}
            <SkeletonBase className="h-8 w-16 rounded-md ml-auto shrink-0" />
          </div>
        </div>
      <FlatShell mobile={mobile} cardStyle={{ overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              // 실제 행과 같은 그리드·여백 — 아이콘 36, 모바일 패딩 '12px 0'.
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '36px 1fr auto' : '36px 1fr auto auto',
                alignItems: 'center',
                gap: mobile ? 12 : 16,
                padding: mobile ? '12px 0' : '14px 20px',
                borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <SkeletonBase className="h-9 w-9 rounded-[var(--radius-md)]" />
              <div style={{ minWidth: 0 }}>
                {/* 제목 줄 — 실렌더 marginBottom 2 */}
                <SkeletonBase className="h-4 w-32" style={{ marginBottom: 2 }} />
                <SkeletonBase className="h-3 w-2/3" />
              </div>
              {/* 데스크톱 금액 열 — 실렌더 minWidth 110 */}
              {!mobile && <SkeletonBase className="h-4 ml-auto" style={{ width: 110 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                {mobile ? (
                  <>
                    <SkeletonBase className="h-4 w-16" style={{ marginRight: 4 }} />
                    <SkeletonBase className="h-8 w-8 rounded-[var(--radius-md)]" />
                  </>
                ) : (
                  /* RecAction(Button size=icon, h-9) 3개 */
                  [0, 1, 2].map(a => <SkeletonBase key={a} className="h-9 w-9 rounded-[var(--radius-md)]" />)
                )}
              </div>
            </div>
          ))}
        </div>
      </FlatShell>
      </div>
    </div>
  )
}

function RecStat({
  label,
  value,
  Icon,
  tone,
}: {
  label: string
  value: React.ReactNode
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  tone?: 'expense' | 'income' | 'muted'
}) {
  const color =
    tone === 'expense' ? 'var(--fg-expense)'
    : tone === 'income' ? 'var(--fg-income)'
    : tone === 'muted' ? 'var(--fg-tertiary)'
    : 'var(--fg-primary)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--text-caption)',
          fontWeight: '600',
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Icon size={12} strokeWidth={2} />
        {label}
      </div>
      <div className="num" style={{ fontSize: 'var(--text-title-lg)', fontWeight: '700', color, lineHeight: '1.15' }}>
        {value}
      </div>
    </div>
  )
}

function RecAction({
  Icon,
  title,
  onClick,
  tone,
  loading,
  disabled,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  title: string
  onClick: () => void
  tone?: 'danger'
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      aria-label={title}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={tone === 'danger' ? '!text-[var(--fg-expense)]' : undefined}
    >
      {!loading && <Icon size={16} strokeWidth={1.9} />}
    </Button>
  )
}

function displayTitle(it: RecurringTransaction, t: TFunction): string {
  return it.merchant || it.description || it.categoryName || t('defaultTitle')
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function recurringSummary(it: RecurringTransaction, t: TFunction): string {
  let core = t(`freq.${it.frequency}`)
  if (it.frequency === 'WEEKLY' && it.dayOfWeek != null) {
    // 백엔드 ISO 1=월~7=일 → recurring dow 키 매핑
    const isoToDow = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const dowKey = isoToDow[it.dayOfWeek]
    core = t('summaryWeekly', { day: dowKey ? t(`dow.${dowKey}`) : '' })
  } else if (it.frequency === 'MONTHLY' && it.dayOfMonth != null) {
    core = t('summaryMonthly', { day: it.dayOfMonth })
  }
  const end = it.endDate ? `~${it.endDate}` : t('endNone')
  return `${core} · ${end}${it.notifyDayBefore ? ` · ${t('alarmTag')}` : ''}`
}
