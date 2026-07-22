import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlignLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloudy,
  FilterX,
  Sparkles,
  SlidersHorizontal,
  Star,
  Telescope,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import {
  constellationColorVar,
  constellationName,
  type ConstellationToday,
  type SkyDay,
} from '@/features/constellation'
import { NightSkyHero } from '@/widgets/constellation'
import type { Todo, TodoPriority } from '@/entities/todo'

type PrioKey = TodoPriority

/** 모바일 원장 우선순위 색 — design TDM_PRIO(중요 red · 보통 blue · 여유 yellow). */
const TDM_PRIO: Record<PrioKey, { color: string }> = {
  HIGH: { color: 'var(--color-chart-red)' },
  MEDIUM: { color: 'var(--color-chart-blue)' },
  LOW: { color: 'var(--color-chart-yellow)' },
}
const PRIO_KEYS: PrioKey[] = ['HIGH', 'MEDIUM', 'LOW']

const PAD = (n: number) => String(n).padStart(2, '0')
const NO_DUE = '9999-99-99'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`
}
function shiftYm(ym: string, dir: -1 | 1): string {
  const [y = 0, m = 1] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + dir, 1)
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}`
}
function isDone(t: Todo): boolean {
  return t.status === 'COMPLETED'
}
function dueOf(t: Todo): string | null {
  return t.dueDate ? t.dueDate.slice(0, 10) : null
}
function tagOf(t: Todo): string {
  return t.category || ''
}

/**
 * 모바일 할일 원장 — 캘린더 + 일별 리스트 통합(가계부 tx-mobile 문법 재사용).
 * 상단 고정: 월네비+필터 / 오늘 상태+별빛 인사이트+[밤하늘] 토글 / 접이식 캘린더.
 * 디자인 SoT: todo-mobile.jsx TodoMobileLedger(v3).
 */
export function TodoMobileLedger({
  todos,
  tags,
  constellationToday,
  sky,
  doneToday,
  pinTop,
  onToggle,
  onRowClick,
  openNightSky,
  openReport,
}: {
  todos: Todo[]
  tags: string[]
  constellationToday: ConstellationToday | undefined
  sky: SkyDay[]
  doneToday: number
  /** 상단 백 헤더 높이(px) — sticky pin·스크롤 보정 offset. */
  pinTop: number
  onToggle: (todo: Todo) => void
  onRowClick: (todo: Todo) => void
  openNightSky: () => void
  openReport: () => void
}) {
  const { t, i18n } = useTranslation('todo')
  const today = useMemo(() => todayISO(), [])

  const [ym, setYm] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(today)
  const [expanded, setExpanded] = useState(false)
  const [skyOpen, setSkyOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [fTags, setFTags] = useState<string[]>([])
  const [fPrios, setFPrios] = useState<PrioKey[]>([])
  const [hideDone, setHideDone] = useState(false)
  const filterActive = fTags.length > 0 || fPrios.length > 0 || hideDone

  const rootRef = useRef<HTMLDivElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const lockRef = useRef(false)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedRef = useRef<string | null>(selected)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])
  const lock = (ms: number) => {
    lockRef.current = true
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => {
      lockRef.current = false
    }, ms)
  }

  // 월 + 필터 적용 목록. 기한 없는 할 일은 월과 무관하게 꼬리 그룹으로 노출.
  const monthTodos = useMemo(() => {
    const pass = (td: Todo) =>
      (fTags.length === 0 || fTags.includes(tagOf(td))) &&
      (fPrios.length === 0 || fPrios.includes(td.priority)) &&
      (!hideDone || !isDone(td))
    return todos.filter(td => {
      const due = dueOf(td)
      return (due ? due.startsWith(ym) : true) && pass(td)
    })
  }, [todos, ym, fTags, fPrios, hideDone])

  const byDay = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const td of monthTodos) {
      const k = dueOf(td) ?? NO_DUE
      const arr = map.get(k)
      if (arr) arr.push(td)
      else map.set(k, [td])
    }
    return map
  }, [monthTodos])
  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay])
  const todayLeft = todos.filter(td => !isDone(td) && dueOf(td) === today).length

  const skyByDate = useMemo(() => new Map(sky.map(d => [d.date, d])), [sky])

  // 캘린더 주 구성
  const weeks = useMemo(() => {
    const [y = 0, m = 1] = ym.split('-').map(Number)
    const firstDow = new Date(y, m - 1, 1).getDay()
    const dim = new Date(y, m, 0).getDate()
    const cells: ({ d: number; ds: string } | null)[] = []
    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= dim; d++) cells.push({ d, ds: `${ym}-${PAD(d)}` })
    while (cells.length % 7) cells.push(null)
    const out: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7))
    return out
  }, [ym])
  let selWeek = weeks.findIndex(w => w.some(c => c && c.ds === selected))
  if (selWeek < 0) selWeek = weeks.findIndex(w => w.some(c => c && c.ds === today))
  if (selWeek < 0) selWeek = 0

  // 스크롤 스파이 — compact(72/24 히스테리시스) + 최상단 날짜 그룹 → 선택 동기 (txm 미러)
  useEffect(() => {
    const p = rootRef.current?.closest('.m-scroll, .overflow-y-auto') as HTMLElement | null
    if (!p) return
    const onScroll = () => {
      const st = p.scrollTop
      setCompact(prev => {
        const next = prev ? st > 24 : st > 72
        if (next && !prev) setExpanded(false)
        return next
      })
      if (lockRef.current || !pinRef.current || !rootRef.current) return
      const bottom = pinRef.current.getBoundingClientRect().bottom
      const groupEls = rootRef.current.querySelectorAll('[data-tdm-day]')
      if (!groupEls.length) return
      let cur = groupEls[0]!.getAttribute('data-tdm-day')
      for (const g of groupEls) {
        if (g.getBoundingClientRect().top <= bottom + 28) cur = g.getAttribute('data-tdm-day')
        else break
      }
      if (cur && selectedRef.current !== cur) {
        selectedRef.current = cur
        setSelected(cur)
      }
    }
    p.addEventListener('scroll', onScroll, { passive: true })
    return () => p.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToDay = (ds: string) => {
    const el = rootRef.current?.querySelector(`[data-tdm-day="${ds}"]`)
    const p = rootRef.current?.closest('.m-scroll, .overflow-y-auto') as HTMLElement | null
    if (!el || !p) return
    const pinH = (pinRef.current?.offsetHeight ?? 0) + pinTop
    p.scrollTo({
      top: p.scrollTop + el.getBoundingClientRect().top - p.getBoundingClientRect().top - pinH - 6,
      behavior: 'smooth',
    })
  }
  const goMonth = (dir: -1 | 1) => {
    const next = shiftYm(ym, dir)
    setYm(next)
    setSelected(today.startsWith(next) ? today : null)
    setExpanded(false)
    lock(800)
    rootRef.current?.closest('.m-scroll, .overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const numColor = (ds: string, dow: number): string => {
    if (ds > today) return 'var(--fg-tertiary)'
    if (dow === 0) return 'var(--color-chart-red)'
    if (dow === 6) return 'var(--fg-brand)'
    return 'var(--fg-primary)'
  }
  const dowLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2026, 1, i + 1).toLocaleDateString(
          i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US',
          { weekday: i18n.language.startsWith('ko') ? 'narrow' : 'short' },
        ),
      ),
    [i18n.language],
  )

  const lit = constellationToday ? Math.min(constellationToday.points, constellationToday.goal) : 0
  const goal = constellationToday?.goal ?? 7
  const skyDone = constellationToday?.collected ?? false
  const conName = constellationToday
    ? constellationName(constellationToday.constellation, i18n.language)
    : ''
  const todayColor = constellationToday
    ? constellationColorVar(constellationToday.constellation.colorKey)
    : 'var(--fg-brand)'

  // 캘린더 셀 마크 — 오늘: 남은 건수/수집★, 과거: 수집★(색)/구름/N건/체크
  const cellMark = (ds: string) => {
    const items = byDay.get(ds)
    const left = items ? items.filter(td => !isDone(td)).length : 0
    if (ds === today) {
      if (skyDone)
        return <Star size={10} strokeWidth={0} fill="currentColor" style={{ color: todayColor }} />
      return left > 0 ? (
        <span style={{ color: 'var(--fg-brand)', fontWeight: 700 }}>
          {t('tdm.countN', { count: left })}
        </span>
      ) : null
    }
    const log = skyByDate.get(ds)
    if (log?.status === 'GROWN' && log.colorKey) {
      return (
        <Star
          size={10}
          strokeWidth={0}
          fill="currentColor"
          style={{ color: constellationColorVar(log.colorKey) }}
        />
      )
    }
    if (log?.status === 'WITHERED') {
      return <Cloudy size={10} strokeWidth={2} style={{ color: 'var(--fg-tertiary)' }} />
    }
    if (items) {
      return left > 0 ? (
        <span>{t('tdm.countN', { count: left })}</span>
      ) : (
        <Check size={10} strokeWidth={3} style={{ color: 'var(--color-chart-green)' }} />
      )
    }
    return null
  }

  const relOf = (d: string): string | null => {
    const diff = Math.round((Date.parse(d) - Date.parse(today)) / 86400000)
    if (diff === 0) return t('tdm.relToday')
    if (diff === 1) return t('tdm.relTomorrow')
    if (diff === -1) return t('tdm.relYesterday')
    return null
  }
  const dowOf = (ds: string) =>
    new Date(`${ds}T00:00:00`).toLocaleDateString(
      i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US',
      { weekday: i18n.language.startsWith('ko') ? 'narrow' : 'short' },
    )

  const monthNum = Number(ym.split('-')[1])

  return (
    <div ref={rootRef} style={{ padding: '0 0 28px' }}>
      <div
        ref={pinRef}
        className={`txm-pin ${compact ? 'txm-pin--compact' : ''}`}
        style={{ top: pinTop }}
      >
        {/* 월 네비 + 필터 */}
        <div className="txm-monthnav">
          <button
            type="button"
            className="txm-monthnav__btn"
            onClick={() => goMonth(-1)}
            aria-label={t('tdm.prevMonth')}
          >
            <ChevronLeft size={19} />
          </button>
          <span className="txm-monthnav__label">{t('tdm.monthLabel', { month: monthNum })}</span>
          <button
            type="button"
            className="txm-monthnav__btn"
            onClick={() => goMonth(1)}
            aria-label={t('tdm.nextMonth')}
          >
            <ChevronRight size={19} />
          </button>
          <button
            type="button"
            className="txm-monthnav__btn"
            onClick={() => setFilterOpen(true)}
            aria-label={t('tdm.filter')}
            style={{
              marginLeft: 'auto',
              background: filterActive ? 'var(--bg-brand-subtle)' : 'transparent',
              color: filterActive ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
            }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* 오늘 상태 + 별빛 인사이트 + [밤하늘] 토글 — 스크롤 시 접힘 */}
        <div className="txm-collapse">
          <div className="txm-head">
            <div style={{ minWidth: 0 }}>
              <div className="txm-total">
                {todayLeft > 0 ? t('tdm.todayLeft', { count: todayLeft }) : t('tdm.todayDone')}
              </div>
              {constellationToday && (
                <div className="txm-sub">
                  {skyDone
                    ? t('tdm.insightDone', { name: conName, streak: constellationToday.streak })
                    : t('tdm.insightProgress', { lit, goal, left: goal - lit, name: conName })}
                </div>
              )}
            </div>
            <button
              type="button"
              className={`txm-sumbtn ${skyOpen ? 'txm-sumbtn--on' : ''}`}
              onClick={() => setSkyOpen(v => !v)}
              aria-expanded={skyOpen}
            >
              <Sparkles size={13} style={{ marginRight: 4, verticalAlign: '-2px' }} />
              {t('tdm.nightSky')}
            </button>
          </div>
          {skyOpen && constellationToday && (
            <div className="tdm-sky">
              <NightSkyHero today={constellationToday} doneToday={doneToday} mobile />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button variant="outline" size="sm" style={{ flex: 1 }} onClick={openReport}>
                  <Telescope size={13} /> {t('tdm.report')}
                </Button>
                <Button variant="outline" size="sm" style={{ flex: 1 }} onClick={openNightSky}>
                  <Sparkles size={13} /> {t('tdm.collection')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 캘린더 — 접힘: 선택 주 1줄 / 펼침: 월 전체 */}
        <div className="txm-cal">
          <div className="txm-dow">
            {dowLabels.map((d, i) => (
              <span
                key={i}
                style={{
                  color:
                    i === 0 ? 'var(--color-chart-red)' : i === 6 ? 'var(--fg-brand)' : undefined,
                }}
              >
                {d}
              </span>
            ))}
          </div>
          {(expanded ? weeks : [weeks[selWeek] ?? []]).map((w, wi) => (
            <div key={wi} className="txm-week">
              {w.map((c, i) => {
                if (!c) return <div key={`e${i}`} className="txm-cell" style={{ cursor: 'default' }} />
                const isSel = c.ds === selected
                const items = byDay.get(c.ds)
                return (
                  <button
                    type="button"
                    key={c.ds}
                    className={`txm-cell ${isSel ? 'txm-cell--sel' : ''}`}
                    onClick={() => {
                      setSelected(c.ds)
                      if (items) {
                        lock(800)
                        scrollToDay(c.ds)
                      }
                    }}
                  >
                    <span
                      className="txm-cell__num"
                      style={
                        isSel
                          ? undefined
                          : { color: numColor(c.ds, i % 7), opacity: c.ds > today ? 0.55 : 1 }
                      }
                    >
                      {c.d}
                    </span>
                    <span
                      className="txm-cell__amt"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {cellMark(c.ds)}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
          <button
            type="button"
            className="txm-expand"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? t('tdm.collapse') : t('tdm.expand')}
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        <div className="txm-divider" />
      </div>

      {/* 일별 할 일 리스트 */}
      <div className="txm-list">
        {dayKeys.map(d => {
          const items = byDay.get(d)!
          const doneN = items.filter(isDone).length
          const noDue = d === NO_DUE
          const rel = noDue ? null : relOf(d)
          const [yy = '', mm = '', dd = ''] = d.split('-')
          return (
            <div key={d} className="txm-group" data-tdm-day={noDue ? undefined : d}>
              <div className="txm-dayhead">
                <span className="txm-dayhead__date">
                  {noDue
                    ? t('tdm.noDue')
                    : `${yy.slice(2)}. ${Number(mm)}. ${Number(dd)}(${dowOf(d)})`}
                </span>
                {rel && <span className="txm-dayhead__rel"> · {rel}</span>}
                <span
                  className="txm-dayhead__sum num"
                  style={{
                    color: doneN === items.length ? 'var(--color-chart-green)' : 'var(--fg-tertiary)',
                    fontWeight: 600,
                    marginLeft: 'auto',
                  }}
                >
                  {t('tdm.doneRatio', { done: doneN, total: items.length })}
                </span>
              </div>
              <div>
                {items.map((td, i) => {
                  const prio = TDM_PRIO[td.priority]
                  const due = dueOf(td)
                  const overdue = !isDone(td) && !!due && due < today
                  const done = isDone(td)
                  return (
                    <div
                      key={td.rowId}
                      className="tdm-row"
                      style={{
                        borderBottom:
                          i === items.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                        opacity: done ? 0.55 : 1,
                      }}
                      onClick={() => onRowClick(td)}
                    >
                      <button
                        type="button"
                        className="tdm-check"
                        onClick={e => {
                          e.stopPropagation()
                          onToggle(td)
                        }}
                        aria-label={done ? t('uncomplete') : t('status.COMPLETED')}
                        aria-pressed={done}
                        style={{
                          border: done
                            ? '0'
                            : `2px solid ${overdue ? 'var(--color-chart-red)' : 'var(--border-strong)'}`,
                          background: done ? 'var(--color-primary)' : 'transparent',
                        }}
                      >
                        {done && <Check size={13} color="#fff" strokeWidth={3} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="tdm-row__title"
                          style={{ textDecoration: done ? 'line-through' : 'none' }}
                        >
                          {td.title}
                        </div>
                        <div className="tdm-row__meta">
                          {tagOf(td) && <span>{tagOf(td)}</span>}
                          {td.content && (
                            <>
                              {tagOf(td) && <i />}
                              <AlignLeft size={11} />
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className="tdm-prio"
                        style={{
                          background: `color-mix(in oklab, ${prio.color} 12%, var(--bg-surface))`,
                          color: prio.color,
                        }}
                      >
                        {t(`prio.${td.priority}`)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {monthTodos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
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
              {filterActive ? <FilterX size={24} /> : <CheckCheck size={24} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 4 }}>
              {filterActive ? t('tdm.emptyFilter') : t('tdm.emptyMonth', { month: monthNum })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>
              {filterActive ? t('tdm.emptyFilterDesc') : t('tdm.emptyMonthDesc')}
            </div>
          </div>
        )}
      </div>

      {/* 필터 시트 */}
      {filterOpen && (
        <ModalShell title={t('tdm.filter')} onClose={() => setFilterOpen(false)} size="sm" mobile>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 8 }}>
            <div>
              <div className="tdm-filter__label">{t('tag')}</div>
              <div className="tdm-chips">
                {tags.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    className={`tdm-chip ${fTags.includes(tag) ? 'tdm-chip--on' : ''}`}
                    onClick={() =>
                      setFTags(prev =>
                        prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="tdm-filter__label">{t('form.priority')}</div>
              <div className="tdm-chips">
                {PRIO_KEYS.map(k => (
                  <button
                    type="button"
                    key={k}
                    className={`tdm-chip ${fPrios.includes(k) ? 'tdm-chip--on' : ''}`}
                    onClick={() =>
                      setFPrios(prev =>
                        prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k],
                      )
                    }
                  >
                    <i style={{ background: TDM_PRIO[k].color }} />
                    {t(`prio.${k}`)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={`tdm-chip ${hideDone ? 'tdm-chip--on' : ''}`}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setHideDone(v => !v)}
            >
              <Check size={12} strokeWidth={3} /> {t('tdm.hideDone')}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                disabled={!filterActive}
                onClick={() => {
                  setFTags([])
                  setFPrios([])
                  setHideDone(false)
                }}
              >
                {t('tdm.reset')}
              </Button>
              <Button style={{ flex: 1.6 }} onClick={() => setFilterOpen(false)}>
                {t('tdm.apply')}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
