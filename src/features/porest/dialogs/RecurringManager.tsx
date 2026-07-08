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
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

type FilterKey = 'all' | 'expense' | 'income' | 'paused'

const DROP_ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '10px 14px',
  border: 'none', background: 'transparent',
  cursor: 'pointer', textAlign: 'left' as const, fontFamily: 'inherit',
  fontSize: 'var(--text-body-sm)', color: 'var(--fg-primary)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <Card style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <CardContent>
          {mobile ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <RecStat label={t('statActive')} value={t('countItems', { count: stats.count })} Icon={Repeat} />
                <RecStat label={t('paused')} value={t('countItems', { count: stats.paused })} Icon={PauseCircle} tone="muted" />
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <RecStat label={t('statMonthlyExpense')} value={<MaskAmount>-{KRW(stats.monthlyExpense)}</MaskAmount>} Icon={TrendingDown} tone="expense" />
                <RecStat label={t('statMonthlyIncome')} value={<MaskAmount>+{KRW(stats.monthlyIncome)}</MaskAmount>} Icon={TrendingUp} tone="income" />
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <RecStat label={t('statActive')} value={t('countItems', { count: stats.count })} Icon={Repeat} />
              <RecStat label={t('statMonthlyExpense')} value={<MaskAmount>-{KRW(stats.monthlyExpense)}</MaskAmount>} Icon={TrendingDown} tone="expense" />
              <RecStat label={t('statMonthlyIncome')} value={<MaskAmount>+{KRW(stats.monthlyIncome)}</MaskAmount>} Icon={TrendingUp} tone="income" />
              <RecStat label={t('paused')} value={t('countItems', { count: stats.paused })} Icon={PauseCircle} tone="muted" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next 7 days */}
      {stats.next7.length > 0 && (
        <Card style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
          <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)', margin: 0 }}>{t('next7Days')}</h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('scheduledCount', { count: stats.next7.length })}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    gap: 12,
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
                      {displayTitle(it)}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                      {it.assetName ?? t('noAccount')} · {recurringSummary(it, t)}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: isExpense ? 'var(--fg-expense)' : 'var(--fg-income)' }}>
                    <MaskAmount>{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
                  </div>
                </div>
              )
            })}
          </div>
          </CardContent>
        </Card>
      )}

      {/* Filter chips + list */}
      <Card style={{ overflow: mobile ? 'visible' : 'hidden', background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ padding: mobile ? '14px 16px 0' : '16px 20px 0' }}>
          {/* 1행: 전체 목록 (좌) + 추가 버튼 (우, accent 강조) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)', margin: 0 }}>{t('listTitle')}</h3>
            <div style={{ flex: 1 }} />
            <Button variant="accent" size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} /> {tCommon('add')}
            </Button>
          </div>
          {/* 2행: 필터 개별 single toggle (배경 없음 — 앱 PToggle row 정합, active=surface-input pill) */}
          <ToggleGroup
            type="single"
            variant="default"
            size="sm"
            value={filter}
            onValueChange={(v) => v && setFilter(v as FilterKey)}
            style={{ marginTop: 10 }}
            className="justify-start gap-1"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.k} value={f.k} className="h-7 min-h-7 px-2">
                {f.label} {f.count}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          {recurringsQ.isLoading && (
            <>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: mobile ? '40px 1fr auto' : '40px 1fr auto auto',
                    alignItems: 'center',
                    gap: mobile ? 12 : 16,
                    padding: mobile ? '14px 16px' : '14px 20px',
                    borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <SkeletonBase className="h-8 w-8 rounded-md" />
                  <div style={{ minWidth: 0 }}>
                    <SkeletonBase className="h-4 w-2/5 mb-1.5" />
                    <SkeletonBase className="h-3 w-3/4" />
                  </div>
                  {!mobile && <SkeletonBase className="h-4 w-20 ml-auto" />}
                  <SkeletonBase className="h-6 w-6 rounded-md" />
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
                  padding: mobile ? '12px 12px' : '14px 20px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
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
                      {displayTitle(it)}
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
                    <MaskAmount>{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                        <MaskAmount>{isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}</MaskAmount>
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
      </Card>

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <Card style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
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

      {/* Next 7 days */}
      <Card style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-3 w-16" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
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
        </CardContent>
      </Card>

      {/* Filter chips + list */}
      <Card style={{ overflow: 'hidden', background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: mobile ? '14px 16px 0' : '16px 20px 0', flexWrap: 'wrap' }}>
          <SkeletonBase className="h-4 w-20 mr-auto" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="h-7 w-14 rounded-full" />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '40px 1fr auto' : '40px 1fr auto auto',
                alignItems: 'center',
                gap: mobile ? 12 : 16,
                padding: mobile ? '14px 16px' : '14px 20px',
                borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <SkeletonBase className="h-8 w-8 rounded-md" />
              <div style={{ minWidth: 0 }}>
                <SkeletonBase className="h-4 w-32 mb-1.5" />
                <SkeletonBase className="h-3 w-2/3" />
              </div>
              {!mobile && <SkeletonBase className="h-4 w-24 ml-auto" />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {mobile && <SkeletonBase className="h-4 w-20 mr-1" />}
                <SkeletonBase className="h-8 w-8 rounded-md" />
                <SkeletonBase className="h-8 w-8 rounded-md" />
                <SkeletonBase className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Card>
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
