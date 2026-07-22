import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Moon,
  MoonStar,
  Sparkles,
  Telescope,
  Trophy,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import {
  constellationColorVar,
  constellationName,
  useConstellationCollection,
  useConstellationSky,
  useConstellationToday,
  type CollectionEntry,
} from '@/features/constellation'
import { useTodos } from '@/features/todo'
import type { Todo, TodoPriority } from '@/entities/todo'
import { ConstellationSVG } from './ConstellationSVG'

/** 우선순위 별빛 가중치 — 서버 적립 규칙 미러(중요 3 · 보통 2 · 여유 1). */
const WEIGHT: Record<TodoPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
const PRIO_ORDER: TodoPriority[] = ['HIGH', 'MEDIUM', 'LOW']
/** 리포트 우선순위 색 — design FRP_PRIO(중요 red · 보통 blue · 여유 yellow). */
const PRIO_COLOR: Record<TodoPriority, string> = {
  HIGH: 'var(--color-chart-red)',
  MEDIUM: 'var(--color-chart-blue)',
  LOW: 'var(--color-chart-yellow)',
}

function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return isoOf(d)
}
/** 해당 날짜가 속한 주의 월요일. */
function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return isoOf(d)
}
function doneKey(t: Todo): string | null {
  return t.status === 'COMPLETED' ? (t.completedAt ?? '').slice(0, 10) || null : null
}

/**
 * 관측 리포트 — 주간 스트립 + 일별 관측 결과/별빛 모으기/별빛 분석/못다 켠 별.
 * mobile: 풀스크린 서브페이지 / desktop: 모달. 디자인 SoT: forest-report.jsx ForestReport.
 */
export function ForestReport({ mobile, onClose }: { mobile: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation('constellation')
  const { t: tTodo } = useTranslation('todo')
  const todayQ = useConstellationToday()
  const skyQ = useConstellationSky(28)
  const collectionQ = useConstellationCollection()
  const todosQ = useTodos()

  const todayISO = useMemo(() => isoOf(new Date()), [])
  // 주 오프셋(0=이번 주, 최대 3주 전) + 선택일.
  const [weekOffset, setWeekOffset] = useState(0)
  const [sel, setSel] = useState(todayISO)

  const todos = useMemo(() => todosQ.data ?? [], [todosQ.data])
  const sky = useMemo(() => skyQ.data ?? [], [skyQ.data])
  const skyByDate = useMemo(() => new Map(sky.map(d => [d.date, d])), [sky])
  const entryByKey = useMemo(() => {
    const map = new Map<string, CollectionEntry>()
    collectionQ.data?.entries.forEach(entry => map.set(entry.constellation.constellationKey, entry))
    return map
  }, [collectionQ.data])

  const weekStart = addDays(mondayOf(todayISO), -7 * weekOffset)
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  // 일별 완료 브레이크다운(완료일 기준) + 못다 켠 별(그날 마감·미완료).
  const doneByDay = useMemo(() => {
    const map = new Map<string, Record<TodoPriority, number>>()
    for (const todo of todos) {
      const key = doneKey(todo)
      if (!key) continue
      const rec = map.get(key) ?? { HIGH: 0, MEDIUM: 0, LOW: 0 }
      rec[todo.priority] += 1
      map.set(key, rec)
    }
    return map
  }, [todos])
  const missedOf = (ds: string): Todo[] =>
    todos.filter(td => td.status !== 'COMPLETED' && (td.dueDate ?? '').slice(0, 10) === ds)

  const ptsOf = (ds: string): number => {
    if (ds === todayISO) return todayQ.data?.points ?? 0
    const skyDay = skyByDate.get(ds)
    if (skyDay) return skyDay.points
    const done = doneByDay.get(ds)
    return done ? PRIO_ORDER.reduce((s, k) => s + done[k] * WEIGHT[k], 0) : 0
  }

  const isToday = sel === todayISO
  const isFuture = sel > todayISO
  const selSky = skyByDate.get(sel)
  const selDone = doneByDay.get(sel) ?? { HIGH: 0, MEDIUM: 0, LOW: 0 }
  const doneCount = PRIO_ORDER.reduce((s, k) => s + selDone[k], 0)
  const pts = ptsOf(sel)
  const grownEntry =
    selSky?.status === 'GROWN' && selSky.constellationKey
      ? entryByKey.get(selSky.constellationKey) ?? null
      : null
  const goal = isToday
    ? todayQ.data?.goal ?? 7
    : grownEntry?.constellation.starCount ?? todayQ.data?.goal ?? 7
  const pct = Math.min(100, Math.round((pts / Math.max(1, goal)) * 100))
  const missed = missedOf(sel)
  const weekMax = Math.max(goal, ...days.map(ptsOf), 1)

  const todayName = todayQ.data ? constellationName(todayQ.data.constellation, i18n.language) : ''
  const dowOf = (ds: string) =>
    new Date(`${ds}T00:00:00`).toLocaleDateString(
      i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US',
      { weekday: 'short' },
    )
  const [selY = '', selM = '', selD = ''] = sel.split('-')

  const rangeLabel = `${weekStart.split('-').join('.')} ~ ${(days[6] ?? weekStart).split('-').join('.')}`
  const asOf = new Date().toLocaleTimeString(i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const body = (
    <>
      {/* 주간 네비 + 스트립 */}
      <div className="frp-weeknav">
        <button
          type="button"
          className="frp-weeknav__btn"
          onClick={() => setWeekOffset(o => Math.min(3, o + 1))}
          disabled={weekOffset >= 3}
          aria-label={t('report.prevWeek')}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="num">{rangeLabel}</span>
        <button
          type="button"
          className="frp-weeknav__btn"
          onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
          disabled={weekOffset <= 0}
          aria-label={t('report.nextWeek')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="frp-strip">
        {days.map(ds => {
          const future = ds > todayISO
          const isTodayCell = ds === todayISO
          return (
            <button
              type="button"
              key={ds}
              className={`frp-strip__day ${sel === ds ? 'frp-strip__day--sel' : ''}`}
              disabled={future}
              onClick={() => setSel(ds)}
            >
              <span
                className="frp-strip__dow"
                style={isTodayCell ? { color: 'var(--fg-brand)', fontWeight: 700 } : undefined}
              >
                {isTodayCell ? t('report.today') : dowOf(ds)}
              </span>
              <span className="frp-strip__num num">{Number(ds.slice(8))}</span>
            </button>
          )
        })}
      </div>

      <div className="frp-datehead">
        <span>
          {selY.slice(2)}.{selM}.{selD} {dowOf(sel)}
        </span>
        {isToday && <span className="frp-datehead__asof num">{t('report.asOf', { time: asOf })}</span>}
      </div>

      {isFuture ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--fg-tertiary)' }}>
          <Moon size={30} style={{ opacity: 0.6 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', marginTop: 10 }}>
            {t('report.future')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 관측 결과 */}
          <Card variant="raised" style={{ padding: '15px 16px' }}>
            <div className="frp-card__row">
              <span className="frp-card__ico">
                <Telescope size={15} />
              </span>
              <span className="frp-card__label">{t('report.result')}</span>
              {isToday ? (
                <b>{t('report.resultProgress', { name: todayName, lit: Math.min(pts, goal), goal })}</b>
              ) : grownEntry ? (
                <b
                  style={{
                    color: constellationColorVar(grownEntry.constellation.colorKey),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ConstellationSVG starMap={grownEntry.constellation.starMap} size={20} />
                  {t('report.resultCollected', {
                    name: constellationName(grownEntry.constellation, i18n.language),
                  })}
                </b>
              ) : selSky?.status === 'WITHERED' ? (
                <b style={{ color: 'var(--fg-tertiary)' }}>
                  {selSky.guardUsed ? t('report.resultWitheredGuard') : t('report.resultWithered')}
                </b>
              ) : (
                <b style={{ color: 'var(--fg-tertiary)' }}>{t('report.resultRest')}</b>
              )}
              {isToday && (todayQ.data?.streak ?? 0) > 0 && (
                <span className="frp-stamp">
                  <span>{t('report.stampDays', { count: todayQ.data?.streak ?? 0 })}</span>
                  {t('report.stampLabel')}
                </span>
              )}
            </div>
          </Card>

          {/* 별빛 모으기 */}
          <Card variant="raised" style={{ padding: '15px 16px' }}>
            <div className="frp-card__row">
              <span className="frp-card__ico">
                <Trophy size={15} />
              </span>
              <span className="frp-card__label" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
                {t('report.starlight')}
              </span>
              <span className="frp-pill num">
                {pct >= 100 ? t('report.pctBang', { pct }) : t('report.pct', { pct })}
              </span>
            </div>
            <div className="frp-tiles">
              <div className="frp-tile">
                <span
                  className="frp-tile__ico"
                  style={{ background: 'var(--bg-brand-subtle)', color: 'var(--fg-brand)' }}
                >
                  <Sparkles size={15} />
                </span>
                <span className="frp-tile__label">{t('report.earned')}</span>
                <span className="frp-tile__num num">{t('report.earnedCount', { count: pts })}</span>
              </div>
              <div className="frp-tile">
                <span
                  className="frp-tile__ico"
                  style={{
                    background: 'color-mix(in oklab, var(--color-chart-green) 14%, var(--bg-surface))',
                    color: 'var(--color-chart-green)',
                  }}
                >
                  <CheckCheck size={15} />
                </span>
                <span className="frp-tile__label">{t('report.doneTodos')}</span>
                <span className="frp-tile__num num">{t('report.doneCount', { count: doneCount })}</span>
              </div>
            </div>
          </Card>

          {/* 별빛 분석 — 우선순위 stacked 주간 바 */}
          <Card variant="raised" style={{ padding: '15px 16px' }}>
            <div className="frp-card__row">
              <span className="frp-card__ico">
                <BarChart3 size={15} />
              </span>
              <span className="frp-card__label" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
                {t('report.analysis')}
              </span>
            </div>
            <div className="frp-legend">
              {PRIO_ORDER.map(k => (
                <span key={k}>
                  <i style={{ background: PRIO_COLOR[k] }} />
                  {t('report.legendDone', { label: tTodo(`prio.${k}`), count: selDone[k] })}{' '}
                  <em className="num">+{WEIGHT[k]}</em>
                </span>
              ))}
            </div>
            <div className="frp-bars">
              {days.map(ds => {
                const total = ds > todayISO ? 0 : ptsOf(ds)
                const done = doneByDay.get(ds)
                const partsSum = done
                  ? PRIO_ORDER.reduce((s, k) => s + done[k] * WEIGHT[k], 0)
                  : 0
                const memoRest = Math.max(0, total - partsSum)
                return (
                  <div key={ds} className="frp-bars__col">
                    <div
                      className="frp-bars__stack"
                      style={{ height: total ? `${Math.max(8, (total / weekMax) * 100)}%` : 0 }}
                    >
                      {done &&
                        PRIO_ORDER.map(
                          k =>
                            done[k] > 0 && (
                              <span key={k} style={{ flex: done[k] * WEIGHT[k], background: PRIO_COLOR[k] }} />
                            ),
                        )}
                      {memoRest > 0 && <span style={{ flex: memoRest, background: 'var(--bg-brand)' }} />}
                    </div>
                    <span className={`frp-bars__dow ${sel === ds ? 'frp-bars__dow--sel' : ''}`}>
                      {dowOf(ds)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 못다 켠 별 */}
          {(missed.length > 0 || isToday) && (
            <Card variant="raised" style={{ padding: '15px 16px' }}>
              <div className="frp-card__row">
                <span className="frp-card__ico">
                  <MoonStar size={15} />
                </span>
                <span className="frp-card__label" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
                  {t('report.missed')}
                </span>
              </div>
              {missed.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--fg-secondary)', padding: '8px 2px 4px' }}>
                  {t('report.missedNone')}
                </div>
              ) : (
                <>
                  <div className="frp-missed__count num">{t('report.missedCount', { count: missed.length })}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {missed.map(td => (
                      <div key={td.rowId} className="frp-missed__row">
                        <span className="frp-missed__corner" style={{ background: PRIO_COLOR[td.priority] }}>
                          {tTodo(`prio.${td.priority}`).slice(0, 1)}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--fg-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {td.title}
                        </span>
                        <span
                          className="num"
                          style={{ fontSize: 11.5, color: PRIO_COLOR[td.priority], fontWeight: 700 }}
                        >
                          +{WEIGHT[td.priority]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  )

  if (mobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 45,
          background: 'var(--bg-surface)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '12px 8px',
            background: 'var(--bg-surface)',
          }}
        >
          <Button variant="ghost" size="icon" aria-label={t('nightSky.back')} onClick={onClose}>
            <ChevronLeft size={22} />
          </Button>
          <h1
            style={{
              flex: 1,
              fontSize: 'var(--text-title-md)',
              fontWeight: 600,
              letterSpacing: '-0.012em',
              color: 'var(--fg-primary)',
              margin: 0,
            }}
          >
            {t('report.title')}
          </h1>
        </div>
        <div style={{ padding: '2px 20px 36px' }}>{body}</div>
      </div>
    )
  }

  return (
    <ModalShell title={t('report.title')} onClose={onClose} size="lg" mobile={false}>
      {body}
    </ModalShell>
  )
}
