import { useMemo, useState } from 'react'
import {
  Bell,
  Loader2,
  PauseCircle,
  Pause,
  Pencil,
  Play,
  Repeat,
  TrendingDown,
  TrendingUp,
  Trash2,
  Zap,
} from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { renderIcon } from '@/shared/lib'
import { KRW } from '@/shared/lib/porest/format'
import {
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useToggleRecurringTransaction,
} from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import type { RecurringTransaction } from '@/entities/recurring-transaction'
import { getPaletteByColor } from './CategoryEditDialog'
import { RecurringEditDialog } from './RecurringEditDialog'
import { Card } from '@/shared/ui/card'

type FilterKey = 'all' | 'expense' | 'income' | 'paused'

export function RecurringManager({ mobile }: { mobile: boolean }) {
  const recurringsQ = useRecurringTransactions()
  const categoriesQ = useExpenseCategories()
  const toggleMut = useToggleRecurringTransaction()
  const deleteMut = useDeleteRecurringTransaction()

  const items = recurringsQ.data ?? []
  const categories = categoriesQ.data ?? []

  const [filter, setFilter] = useState<FilterKey>('all')
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [toast, setToast] = useState<string>('')
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

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
      onSuccess: () => showToast(it.isActive === 'Y' ? `${displayTitle(it)} 일시정지` : `${displayTitle(it)} 재개됨`),
      onSettled: () => setPendingToggleId(null),
    })
  }

  const removeItem = (id: number) => {
    const it = items.find(i => i.rowId === id)
    setPendingDeleteId(id)
    deleteMut.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null)
        if (it) showToast(`${displayTitle(it)} 삭제됨`)
      },
      onSettled: () => setPendingDeleteId(null),
    })
  }

  const FILTERS: { k: FilterKey; label: string; count: number }[] = [
    { k: 'all', label: '전체', count: counts.all },
    { k: 'expense', label: '지출', count: counts.expense },
    { k: 'income', label: '수입', count: counts.income },
    { k: 'paused', label: '일시정지', count: counts.paused },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <Card style={{ padding: mobile ? 16 : 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: mobile ? 12 : 20 }}>
          <RecStat label="활성 반복" value={`${stats.count}개`} Icon={Repeat} />
          <RecStat label="매월 고정 지출" value={`-${KRW(stats.monthlyExpense)}`} Icon={TrendingDown} tone="expense" />
          <RecStat label="매월 고정 수입" value={`+${KRW(stats.monthlyIncome)}`} Icon={TrendingUp} tone="income" />
          <RecStat label="일시정지" value={`${stats.paused}개`} Icon={PauseCircle} tone="muted" />
        </div>
      </Card>

      {/* Next 7 days */}
      {stats.next7.length > 0 && (
        <Card style={{ padding: mobile ? 16 : 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>다가오는 7일</h3>
            <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>{stats.next7.length}건 예정</span>
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
                    borderRadius: 10,
                    background: isToday ? 'color-mix(in oklch, var(--berry-600) 8%, transparent)' : 'var(--pd-surface-inset)',
                    border: isToday ? '1px solid color-mix(in oklch, var(--berry-600) 25%, transparent)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="num"
                    style={{
                      minWidth: 44,
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: isToday ? 'var(--berry-600)' : 'var(--bg-surface)',
                      color: isToday ? '#fff' : 'var(--fg-secondary)',
                    }}
                  >
                    {isToday ? '오늘' : `D-${days}`}
                  </span>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: palette.bg,
                      color: palette.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderIcon(cat?.icon ?? 'tag', cat?.categoryName?.charAt(0) ?? '·', 16)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayTitle(it)}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
                      {it.assetName ?? '계좌 없음'} · {recurringSummary(it)}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 700, color: isExpense ? 'var(--berry-700)' : 'var(--mossy-700)' }}>
                    {isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Filter chips + list */}
      <Card style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: mobile ? '14px 16px 0' : '16px 20px 0', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', margin: 0, marginRight: 'auto' }}>전체 목록</h3>
          {FILTERS.map(f => {
            const active = filter === f.k
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className="num"
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid ' + (active ? 'transparent' : 'var(--border-subtle)'),
                  background: active ? 'var(--bg-brand)' : 'var(--bg-surface)',
                  color: active ? 'var(--fg-on-brand)' : 'var(--fg-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {f.label}
                <span style={{ opacity: 0.7, marginLeft: 3 }}>{f.count}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          {recurringsQ.isLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              불러오는 중…
            </div>
          )}
          {!recurringsQ.isLoading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              해당하는 반복 거래가 없어요
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
                  gridTemplateColumns: mobile ? '40px 1fr auto' : '40px 1fr auto auto',
                  alignItems: 'center',
                  gap: mobile ? 12 : 16,
                  padding: mobile ? '14px 16px' : '14px 20px',
                  borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                  opacity: isActive ? 1 : 0.55,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: palette.bg,
                    color: palette.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderIcon(cat?.icon ?? 'tag', cat?.categoryName?.charAt(0) ?? '·', 16)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
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
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--pd-surface-inset)',
                          color: 'var(--fg-tertiary)',
                        }}
                      >
                        일시정지
                      </span>
                    )}
                    {it.autoLog && (
                      <span title="자동 기록" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--mossy-600)' }}>
                        <Zap size={11} strokeWidth={2.4} />
                      </span>
                    )}
                    {it.notifyDayBefore && (
                      <span title="하루 전 알림" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--fg-tertiary)' }}>
                        <Bell size={11} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
                    {recurringSummary(it)} · {it.assetName ?? '계좌 없음'} · 다음 {it.nextExecutionDate.slice(5).replace('-', '/')}
                  </div>
                </div>
                {!mobile && (
                  <div
                    className="num"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isExpense ? 'var(--berry-700)' : 'var(--mossy-700)',
                      textAlign: 'right',
                      minWidth: 110,
                    }}
                  >
                    {isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {mobile && (
                    <span
                      className="num"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isExpense ? 'var(--berry-700)' : 'var(--mossy-700)',
                        marginRight: 4,
                      }}
                    >
                      {isExpense ? '−' : '+'}{KRW(Math.abs(it.amount))}
                    </span>
                  )}
                  <RecAction
                    Icon={isActive ? Pause : Play}
                    title={isActive ? '일시정지' : '재개'}
                    onClick={() => togglePause(it)}
                    loading={pendingToggleId === it.rowId}
                    disabled={pendingToggleId !== null && pendingToggleId !== it.rowId}
                  />
                  <RecAction
                    Icon={Pencil}
                    title="편집"
                    onClick={() => setEditing(it)}
                    disabled={pendingToggleId === it.rowId || pendingDeleteId === it.rowId}
                  />
                  <RecAction
                    Icon={Trash2}
                    title="삭제"
                    tone="danger"
                    onClick={() => setConfirmDeleteId(it.rowId)}
                    loading={pendingDeleteId === it.rowId}
                    disabled={pendingToggleId === it.rowId}
                  />
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
          onSaved={() => showToast('변경사항이 저장됐어요')}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDialog
          title="반복 거래 삭제"
          message={`"${displayTitle(items.find(i => i.rowId === confirmDeleteId)!)}" 반복 설정을 삭제할까요? 이미 기록된 거래는 그대로 남아요.`}
          confirmLabel={deleteMut.isPending ? '삭제 중…' : '삭제'}
          danger
          onConfirm={() => removeItem(confirmDeleteId)}
          onCancel={() => !deleteMut.isPending && setConfirmDeleteId(null)}
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
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 28px -10px rgba(0,0,0,0.25)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
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
  value: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  tone?: 'expense' | 'income' | 'muted'
}) {
  const color =
    tone === 'expense' ? 'var(--berry-700)'
    : tone === 'income' ? 'var(--mossy-700)'
    : tone === 'muted' ? 'var(--fg-tertiary)'
    : 'var(--fg-primary)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Icon size={12} strokeWidth={2} />
        {label}
      </div>
      <div className="num" style={{ fontSize: 19, fontWeight: 700, color, lineHeight: 1.1 }}>
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
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid transparent',
        background: 'transparent',
        color: tone === 'danger' ? 'var(--berry-600)' : 'var(--fg-secondary)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled && !loading ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        transition: 'background 0.15s, opacity 0.15s',
      }}
      onMouseEnter={e => {
        if (isDisabled) return
        e.currentTarget.style.background = tone === 'danger'
          ? 'color-mix(in oklch, var(--berry-500) 10%, transparent)'
          : 'var(--pd-surface-inset)'
      }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {loading
        ? <Loader2 size={15} strokeWidth={2.2} className="animate-spin" />
        : <Icon size={15} strokeWidth={1.9} />}
    </button>
  )
}

function displayTitle(it: RecurringTransaction): string {
  return it.merchant || it.description || it.categoryName || '반복 거래'
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function recurringSummary(it: RecurringTransaction): string {
  const freqLabel: Record<string, string> = {
    DAILY: '매일',
    WEEKLY: '매주',
    MONTHLY: '매월',
    YEARLY: '매년',
  }
  let core = freqLabel[it.frequency] ?? it.frequency
  if (it.frequency === 'WEEKLY' && it.dayOfWeek != null) {
    const days = ['', '월', '화', '수', '목', '금', '토', '일']
    core = `매주 ${days[it.dayOfWeek] ?? ''}`
  } else if (it.frequency === 'MONTHLY' && it.dayOfMonth != null) {
    core = `매월 ${it.dayOfMonth}일`
  }
  const end = it.endDate ? `~${it.endDate}` : '무기한'
  return `${core} · ${end}${it.notifyDayBefore ? ' · 알림' : ''}`
}
