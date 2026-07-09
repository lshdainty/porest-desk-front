import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatMonthDay, formatMonthDayDow } from '@/shared/lib/date'
import { i18n } from '@/shared/i18n/config'
import {
  Plus,
  Check,
  Sparkles,
  CheckCheck,
  AlignLeft,
  Settings2,
  Flame,
  CircleDot,
  Leaf,
} from 'lucide-react'
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodoStatus,
  useDeleteTodo,
} from '@/features/todo'
import {
  useConstellationCollection,
  useConstellationSky,
  useConstellationToday,
} from '@/features/constellation'
import { CollectionCard, MySkyCard, NightSkyHero } from '@/widgets/constellation'
import type { Todo, TodoFormValues, TodoPriority } from '@/entities/todo'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Card } from '@/shared/ui/card'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// 태그 select 옵션 7종 (양 플랫폼 공통 확정). category 필드에 저장. 기본값 '개인'.
const TAG_OPTIONS = ['가계부', '자산', '결제', '업무', '개인', '건강', '고정비'] as const
const DEFAULT_TAG = '개인'

// 우선순위 칩/아이콘 스타일 (양 플랫폼 공통 확정).
//  high = chart-red + bg 14% 틴트 / med = chart-orange + 14% 틴트 /
//  low  = fg-tertiary + bg-sunken.
const PRIO: Record<
  TodoPriority,
  { labelKey: string; color: string; bg: string; order: number }
> = {
  HIGH: {
    labelKey: 'prio.HIGH',
    color: 'var(--color-chart-red)',
    bg: 'color-mix(in oklab, var(--color-chart-red) 14%, var(--bg-surface))',
    order: 0,
  },
  MEDIUM: {
    labelKey: 'prio.MEDIUM',
    color: 'var(--color-chart-orange)',
    bg: 'color-mix(in oklab, var(--color-chart-orange) 14%, var(--bg-surface))',
    order: 1,
  },
  LOW: {
    labelKey: 'prio.LOW',
    color: 'var(--fg-tertiary)',
    bg: 'var(--bg-sunken)',
    order: 2,
  },
}
const PRIO_ORDER: TodoPriority[] = ['HIGH', 'MEDIUM', 'LOW']

type FilterKey = 'today' | 'week' | 'all' | 'done'

// ── 날짜 유틸 ──────────────────────────────────────────────────────────────
/** 로컬 오늘 'YYYY-MM-DD'. */
function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** dueDate(날짜 또는 datetime) → 'YYYY-MM-DD'. nullable. */
function dueKey(due: string | null | undefined): string | null {
  if (!due) return null
  return due.slice(0, 10)
}

/** 두 'YYYY-MM-DD' 사이 일수 차이 (b - a). */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

/** 'YYYY-MM-DD' → { full: 'M월 D일 (요일)' }. */
function kDate(s: string): { md: string; full: string } {
  return { md: formatMonthDay(s), full: formatMonthDayDow(s) }
}

/** 상대 시간: 오늘/내일/어제/N일 후/N일 전(±7) · 그 외 'M월 D일'. */
function relativeDate(due: string, today: string): string {
  const diff = dayDiff(today, due)
  if (diff === 0) return i18n.t('date:today')
  if (diff === 1) return i18n.t('date:tomorrow')
  if (diff === -1) return i18n.t('date:yesterday')
  if (diff > 0 && diff <= 7) return i18n.t('date:daysLater', { count: diff })
  if (diff < 0 && diff >= -7) return i18n.t('date:daysAgo', { count: -diff })
  return kDate(due).md
}

const NO_DUE_KEY = '￿' // 그룹 정렬 시 맨 뒤로 보내기 위한 sentinel

function isDone(t: Todo): boolean {
  return t.status === 'COMPLETED'
}
/** Todo.category → 태그 라벨 (없으면 '개인'). */
function todoTag(t: Todo): string {
  return t.category || DEFAULT_TAG
}

/** TodoPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useTodoPageData() {
  const todosQ = useTodos()
  return { isLoading: todosQ.isLoading }
}

export const TodoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useTodoPageData()
  if (isLoading) return <TodoPageSkeleton mobile={mobile} />
  return <TodoPageInner mobile={mobile} />
}

const TodoPageInner = ({ mobile }: { mobile: boolean }) => {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const todosQ = useTodos()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const toggleStatus = useToggleTodoStatus()
  const deleteTodo = useDeleteTodo()

  const todos: Todo[] = useMemo(() => todosQ.data ?? [], [todosQ.data])
  const today = useMemo(() => todayISO(), [])

  // ── 별자리 게이미피케이션 (밤하늘 히어로 · 나의 밤하늘 · 도감) ────────────
  const constellationTodayQ = useConstellationToday()
  const skyQ = useConstellationSky(14)
  const collectionQ = useConstellationCollection()
  // 오늘 완료 건수 — 완료 이벤트(completedAt) 기준 (히어로 캡션용)
  const doneToday = useMemo(
    () => todos.filter(td => isDone(td) && (td.completedAt ?? '').slice(0, 10) === today).length,
    [todos, today],
  )

  const [filter, setFilter] = useState<FilterKey>('today')
  const [quickAdd, setQuickAdd] = useState('')
  // editing: Todo(편집) | { _new: true }(신규) | null(닫힘)
  const [editing, setEditing] = useState<Todo | { _new: true } | null>(null)

  const inSevenDays = (key: string | null): boolean => {
    if (!key) return false
    const diff = dayDiff(today, key)
    return diff >= 0 && diff <= 7
  }

  // 필터별 카운트 (칩 뱃지).
  const counts = useMemo(() => {
    let t = 0
    let w = 0
    let a = 0
    let d = 0
    for (const todo of todos) {
      if (isDone(todo)) {
        d++
        continue
      }
      a++
      const key = dueKey(todo.dueDate)
      if (key === today) t++
      if (inSevenDays(key)) w++
    }
    return { today: t, week: w, all: a, done: d }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, today])

  // 필터 → 정렬(우선순위 desc → due asc) → 마감일별 그룹.
  const groups = useMemo(() => {
    let visible: Todo[]
    if (filter === 'today')
      visible = todos.filter(t => !isDone(t) && dueKey(t.dueDate) === today)
    else if (filter === 'week')
      visible = todos.filter(t => !isDone(t) && inSevenDays(dueKey(t.dueDate)))
    else if (filter === 'all') visible = todos.filter(t => !isDone(t))
    else visible = todos.filter(isDone)

    const sorted = [...visible].sort((a, b) => {
      const pa = PRIO[a.priority].order
      const pb = PRIO[b.priority].order
      if (pa !== pb) return pa - pb
      const da = dueKey(a.dueDate) ?? NO_DUE_KEY
      const db = dueKey(b.dueDate) ?? NO_DUE_KEY
      return da.localeCompare(db)
    })

    const map = new Map<string, Todo[]>()
    for (const t of sorted) {
      const k = dueKey(t.dueDate) ?? NO_DUE_KEY
      const arr = map.get(k)
      if (arr) arr.push(t)
      else map.set(k, [t])
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, filter, today])

  const handleQuickAdd = () => {
    const v = quickAdd.trim()
    if (!v) return
    createTodo.mutate(
      {
        title: v,
        priority: 'MEDIUM',
        category: DEFAULT_TAG,
        dueDate: today,
      },
      { onSuccess: () => setQuickAdd('') },
    )
  }

  const onSave = (values: TodoFormValues, id?: number) => {
    if (id != null)
      updateTodo.mutate({ id, data: values }, { onSuccess: () => setEditing(null) })
    else createTodo.mutate(values, { onSuccess: () => setEditing(null) })
  }
  const onDelete = (id: number) => {
    deleteTodo.mutate(id, { onSuccess: () => setEditing(null) })
  }

  // ── 밤하늘 히어로 / 나의 밤하늘 / 도감 (별자리 게이미피케이션) ─────────────
  const SkyHero = constellationTodayQ.data ? (
    <NightSkyHero today={constellationTodayQ.data} doneToday={doneToday} mobile={mobile} />
  ) : null
  const MySky =
    skyQ.data && constellationTodayQ.data && collectionQ.data ? (
      <MySkyCard
        sky={skyQ.data}
        today={constellationTodayQ.data}
        entries={collectionQ.data.entries}
        mobile={mobile}
      />
    ) : null
  const Collection =
    collectionQ.data && constellationTodayQ.data ? (
      <CollectionCard
        collection={collectionQ.data}
        todayKey={constellationTodayQ.data.constellation.constellationKey}
        mobile={mobile}
      />
    ) : null

  // ── 퀵추가 ────────────────────────────────────────────────────────────────
  const QuickAdd = (
    <Card
      className="focus-within:[outline:2px_solid_var(--border-focus)]"
      style={{ padding: 6, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg-tertiary)',
          flexShrink: 0,
        }}
      >
        <Plus size={18} />
      </span>
      <input
        value={quickAdd}
        onChange={e => setQuickAdd(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleQuickAdd()
        }}
        placeholder={t('quickAddPlaceholder')}
        aria-label={t('quickAddLabel')}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: 'none',
          background: 'transparent',
          fontSize: 14,
          color: 'var(--fg-primary)',
          padding: '8px 0',
          fontFamily: 'inherit',
        }}
      />
      <Button
        size="sm"
        onClick={handleQuickAdd}
        loading={createTodo.isPending}
        style={{ flexShrink: 0 }}
      >
        {tc('add')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing({ _new: true })}
        style={{ flexShrink: 0 }}
      >
        <Settings2 size={13} /> {t('detail')}
      </Button>
    </Card>
  )

  // ── 필터 칩 4종 + 카운트 ──────────────────────────────────────────────────
  const FilterChips = (
    <Tabs value={filter} onValueChange={v => v && setFilter(v as FilterKey)}>
      <TabsList variant="pills" size="sm">
        {(
          [
            { id: 'today', label: t('today'), count: counts.today },
            { id: 'week', label: t('thisWeek'), count: counts.week },
            { id: 'all', label: t('status.ALL'), count: counts.all },
            { id: 'done', label: t('status.COMPLETED'), count: counts.done },
          ] as const
        ).map(f => {
          const active = filter === f.id
          return (
            <TabsTrigger key={f.id} variant="pills" size="sm" value={f.id}>
              {f.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  fontVariantNumeric: 'tabular-nums',
                  opacity: active ? 0.85 : 0.55,
                  marginLeft: 2,
                }}
              >
                {f.count}
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )

  // ── 행 ────────────────────────────────────────────────────────────────────
  const Row = ({ t, last }: { t: Todo; last: boolean }) => {
    const prio = PRIO[t.priority]
    const done = isDone(t)
    const key = dueKey(t.dueDate)
    const overdue = !done && !!key && key < today
    return (
      <div
        onClick={() => setEditing(t)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 4px',
          cursor: 'pointer',
          borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
          transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
          opacity: done ? 0.55 : 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            toggleStatus.mutate(t.rowId)
          }}
          aria-label={done ? t('uncomplete') : t('status.COMPLETED')}
          aria-pressed={done}
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: done
              ? '0'
              : `2px solid ${overdue ? 'var(--color-chart-red)' : 'var(--border-strong)'}`,
            background: done ? 'var(--color-primary)' : 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all var(--motion-duration-fast) var(--motion-ease-out)',
          }}
        >
          {done && <Check size={13} color="#fff" strokeWidth={3} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
              textDecoration: done ? 'line-through' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
              fontSize: 12,
            }}
          >
            <span
              style={{
                color: overdue ? 'var(--color-chart-red)' : 'var(--fg-tertiary)',
                fontWeight: overdue ? '600' : '500',
              }}
            >
              {key ? relativeDate(key, today) : t('noDueDate')}
            </span>
            <span style={dot} />
            <span style={{ color: 'var(--fg-tertiary)' }}>{todoTag(t)}</span>
            {t.content && (
              <>
                <span style={dot} />
                <AlignLeft size={11} color="var(--fg-tertiary)" />
              </>
            )}
          </div>
        </div>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: prio.bg,
            color: prio.color,
            fontSize: 11,
            fontWeight: '600',
            flexShrink: 0,
          }}
        >
          {t(prio.labelKey)}
        </span>
      </div>
    )
  }

  // ── 빈 상태 ───────────────────────────────────────────────────────────────
  const EmptyState = (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--bg-sunken)',
          color: 'var(--fg-tertiary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {filter === 'done' ? <CheckCheck size={24} /> : <Sparkles size={24} />}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: 'var(--fg-primary)',
          marginBottom: 4,
        }}
      >
        {filter === 'today'
          ? t('empty.today')
          : filter === 'week'
            ? t('empty.week')
            : filter === 'done'
              ? t('empty.done')
              : t('empty.all')}
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>
        {filter === 'done'
          ? t('emptyDesc.done')
          : t('emptyDesc.default')}
      </div>
    </div>
  )

  // ── 그룹 리스트 ───────────────────────────────────────────────────────────
  const ListCard = (
    <Card style={{ padding: mobile ? '8px 16px' : '8px 20px' }}>
      {groups.length === 0
        ? EmptyState
        : groups.map(([k, items]) => (
            <div key={k}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: 'var(--fg-tertiary)',
                  letterSpacing: '0.04em',
                  padding: mobile ? '12px 0 6px' : '14px 0 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 4,
                }}
              >
                {k === NO_DUE_KEY ? t('noDueDate') : kDate(k).full} · {t('kanban.count', { count: items.length })}
              </div>
              {items.map((t, i) => (
                <Row key={t.rowId} t={t} last={i === items.length - 1} />
              ))}
            </div>
          ))}
    </Card>
  )

  // ── 데스크톱 우측: 태그별 분포 ────────────────────────────────────────────
  const TagDistribution = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: '700', marginBottom: 14 }}>{t('tagDistribution')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TAG_OPTIONS.map(tag => {
          const tagged = todos.filter(t => todoTag(t) === tag)
          const total = tagged.length
          if (total === 0) return null
          const done = tagged.filter(isDone).length
          return (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: 'var(--fg-primary)',
                  width: 60,
                  flexShrink: 0,
                }}
              >
                {tag}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: 'var(--bg-sunken)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(done / total) * 100}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: 999,
                  }}
                />
              </div>
              <span
                className="num"
                style={{
                  fontSize: 12,
                  color: 'var(--fg-tertiary)',
                  minWidth: 36,
                  textAlign: 'right',
                }}
              >
                {done}/{total}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )

  // ── 데스크톱 우측: 우선순위 ───────────────────────────────────────────────
  const PriorityCard = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: '700', marginBottom: 12 }}>{t('form.priority')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PRIO_ORDER.map(k => {
          const p = PRIO[k]
          const n = todos.filter(t => !isDone(t) && t.priority === k).length
          const PIcon = k === 'HIGH' ? Flame : k === 'MEDIUM' ? CircleDot : Leaf
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 'var(--radius-sm)',
                  background: p.bg,
                  color: p.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PIcon size={14} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: '600' }}>{t(p.labelKey)}</span>
              <span
                className="num"
                style={{
                  marginLeft: 'auto',
                  fontSize: 13,
                  fontWeight: '700',
                  color: p.color,
                }}
              >
                {n}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )

  const dialog =
    editing != null ? (
      <TodoEditDialog
        todo={'_new' in editing ? null : editing}
        mobile={mobile}
        today={today}
        onClose={() => setEditing(null)}
        onSave={onSave}
        onDelete={onDelete}
        submitting={createTodo.isPending || updateTodo.isPending}
        deleting={deleteTodo.isPending}
      />
    ) : null

  // ── 모바일 ────────────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('pageTitle')} />
        <div style={{ padding: '16px 16px 96px', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SkyHero}
          {QuickAdd}
          {FilterChips}
          {ListCard}
          {MySky}
          {Collection}
        </div>
        <button
          type="button"
          aria-label={t('addTodoLabel')}
          onClick={() => setEditing({ _new: true })}
          style={{
            position: 'fixed',
            // 풀스크린 페이지(탭바 없음) — 하단 여백 24 (앱 FAB 기본 위치 미러)
            bottom: 24,
            right: 18,
            width: 52,
            height: 52,
            borderRadius: 999,
            border: 0,
            background: 'var(--bg-brand)',
            color: 'var(--fg-on-brand)',
            boxShadow: 'var(--shadow-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        {dialog}
        </div>
      </>
    )
  }

  // ── 데스크톱 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>{t('pageTitle')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">
          <Button size="sm" onClick={() => setEditing({ _new: true })}>
            <Plus size={14} /> {t('newTodo')}
          </Button>
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>
        {SkyHero}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            alignItems: 'flex-start',
            marginTop: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {QuickAdd}
            {FilterChips}
            {ListCard}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MySky}
            {Collection}
            {TagDistribution}
            {PriorityCard}
          </div>
        </div>
      </div>
      {dialog}
    </div>
  )
}

const dot = {
  width: 2,
  height: 2,
  borderRadius: 999,
  background: 'var(--border-strong)',
  flexShrink: 0,
} as const

// ───────────────────────────── 편집 다이얼로그 ─────────────────────────────

function TodoEditDialog({
  todo,
  mobile,
  today,
  onClose,
  onSave,
  onDelete,
  submitting,
  deleting,
}: {
  todo: Todo | null
  mobile: boolean
  today: string
  onClose: () => void
  onSave: (values: TodoFormValues, id?: number) => void
  onDelete: (id: number) => void
  submitting?: boolean
  deleting?: boolean
}) {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const isNew = !todo
  const [title, setTitle] = useState(todo?.title ?? '')
  const [due, setDue] = useState(dueKey(todo?.dueDate) ?? today)
  const [tag, setTag] = useState(todo?.category || DEFAULT_TAG)
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'MEDIUM')
  const [note, setNote] = useState(todo?.content ?? '')
  const [error, setError] = useState(false)

  const save = () => {
    if (!title.trim()) {
      setError(true)
      return
    }
    onSave(
      {
        title: title.trim(),
        content: note,
        priority,
        category: tag,
        dueDate: due || undefined,
      },
      todo?.rowId,
    )
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={tc('save')}
      saving={submitting}
      onCancel={onClose}
      onDelete={todo ? () => onDelete(todo.rowId) : undefined}
      deleting={deleting}
    />
  )

  return (
    <ModalShell
      title={isNew ? t('newTodo') : t('editTodoTitle')}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 14 }}>
        <Input
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            if (error) setError(false)
          }}
          placeholder={t('editTitlePlaceholder')}
          aria-invalid={error}
          autoFocus
        />
        {error && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'var(--status-danger-subtle)',
              color: 'var(--status-danger-fg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
            }}
          >
            {t('form.titleRequired')}
          </div>
        )}
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>{t('form.dueDate')}</FieldLabel>
          <InputDatePicker value={due} onValueChange={setDue} placeholder="yyyy-mm-dd" />
        </Field>
        <Field>
          <FieldLabel>{t('tag')}</FieldLabel>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('form.priority')}</FieldLabel>
        <div
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 3,
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {PRIO_ORDER.map(k => {
            const p = PRIO[k]
            const active = priority === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPriority(k)}
                style={{
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? p.color : 'var(--fg-secondary)',
                  border: 0,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {t(p.labelKey)}
              </button>
            )
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('form.memo')}</FieldLabel>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('form.memoPlaceholder')}
          rows={3}
        />
      </Field>
    </ModalShell>
  )
}

// ───────────────────────────── 로딩 스켈레톤 ─────────────────────────────

/** Todo 행 1줄 skeleton — 원형 체크 + 제목/메타 + 우선순위 칩. */
function TodoRowSkeleton({ last }: { last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 4px',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <SkeletonBase className="h-[22px] w-[22px] rounded-full shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBase className="h-4 w-3/5 mb-1.5" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="h-5 w-10 rounded-sm shrink-0" />
    </div>
  )
}

/** 통계 카드 1장 skeleton — 라벨/숫자 placeholder. progress=true 면 3번째 완료율 카드의 진행바도 미러. */
function StatCardSkeleton({ mobile, progress }: { mobile: boolean; progress?: boolean }) {
  return (
    <Card style={{ padding: mobile ? 14 : 18 }}>
      <SkeletonBase className="h-3 w-10 mb-1.5" />
      <SkeletonBase className={mobile ? 'h-[22px] w-12' : 'h-[26px] w-14'} />
      {progress && (
        <div className="budget-bar" style={{ marginTop: 8, height: 6 }}>
          <SkeletonBase className="h-full w-2/5 rounded-full" />
        </div>
      )}
    </Card>
  )
}

/** 데스크톱 우측 분포/우선순위 카드 skeleton — 실제 타이틀 + 막대 행 구조 미러. */
function RatioCardSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: '700', marginBottom: 14 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SkeletonBase className="h-4 w-[60px] shrink-0" />
            <SkeletonBase className="h-1.5 flex-1 rounded-full" />
            <SkeletonBase className="h-3 w-9 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Todo 페이지 skeleton — 정적 틀(페이지 헤더 / 퀵추가 / 필터 칩)은 실제 렌더,
 * 서버 쿼리(useTodos) 의존 데이터 영역(통계 숫자 / 리스트 / 분포)만 skeleton.
 */
function TodoPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  // ── 통계 3카드 (데이터: 숫자/완료율) ──
  const Stats = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: mobile ? 8 : 12,
      }}
    >
      <StatCardSkeleton mobile={mobile} />
      <StatCardSkeleton mobile={mobile} />
      <StatCardSkeleton mobile={mobile} progress />
    </div>
  )

  // ── 퀵추가 (정적 틀 — 실제 렌더, 비활성) ──
  const QuickAdd = (
    <Card style={{ padding: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          width: 36,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg-tertiary)',
          flexShrink: 0,
        }}
      >
        <Plus size={18} />
      </span>
      <input
        disabled
        placeholder={t('quickAddPlaceholder')}
        aria-label={t('quickAddLabel')}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: 'none',
          background: 'transparent',
          fontSize: 14,
          color: 'var(--fg-primary)',
          padding: '8px 0',
          fontFamily: 'inherit',
        }}
      />
      <Button size="sm" disabled style={{ flexShrink: 0 }}>
        {tc('add')}
      </Button>
      <Button variant="outline" size="sm" disabled style={{ flexShrink: 0 }}>
        <Settings2 size={13} /> {t('detail')}
      </Button>
    </Card>
  )

  // ── 필터 칩 (정적 틀 — 실제 렌더, 카운트만 skeleton) ──
  const Chips = (
    <Tabs value={t('today')}>
      <TabsList variant="pills" size="sm">
        {[t('today'), t('thisWeek'), t('status.ALL'), t('status.COMPLETED')].map(label => (
          <TabsTrigger
            key={label}
            variant="pills"
            size="sm"
            value={label}
            disabled
          >
            {label}
            <SkeletonBase className="h-3 w-3 ml-0.5 rounded-sm" />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  // ── 그룹 리스트 (데이터) — 실제 그룹 헤더 + 행 구조 미러 ──
  const List = (
    <Card style={{ padding: mobile ? '8px 16px' : '8px 20px' }}>
      <div
        style={{
          padding: mobile ? '12px 0 6px' : '14px 0 8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 4,
        }}
      >
        <SkeletonBase className="h-3 w-28" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <TodoRowSkeleton key={i} last={i === 3} />
      ))}
    </Card>
  )

  const Left = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Stats}
      {QuickAdd}
      {Chips}
      {List}
    </div>
  )

  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('pageTitle')} />
        <div style={{ padding: '16px 16px 96px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Stats}
            {QuickAdd}
            {Chips}
            {List}
          </div>
        </div>
      </>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      {/* 정적 페이지 헤더 — 실제 렌더 */}
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>{t('pageTitle')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">
          <Button size="sm" disabled>
            <Plus size={14} /> {t('newTodo')}
          </Button>
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          {Left}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RatioCardSkeleton title={t('tagDistribution')} rows={4} />
            <RatioCardSkeleton title={t('form.priority')} rows={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
