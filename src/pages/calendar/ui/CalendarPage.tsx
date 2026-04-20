import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCalendarEvents } from '@/features/calendar'
import type { CalendarEvent } from '@/entities/calendar'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const DOW = ['일', '월', '화', '수', '목', '금', '토']

const pad2 = (n: number) => String(n).padStart(2, '0')
const toISO = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`

export const CalendarPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [picked, setPicked] = useState<string | null>(null)

  const { year, month } = cursor
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const startDate = toISO(year, month, 1)
  const endDate = toISO(year, month, daysInMonth)

  const eventsQ = useCalendarEvents(startDate, endDate)
  const events: CalendarEvent[] = eventsQ.data ?? []

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Map day -> events that occur on that day (handle spanning ranges)
  const dayEventsMap = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = []
    }
    for (const ev of events) {
      const evStart = ev.startDate.slice(0, 10)
      const evEnd = (ev.endDate ?? ev.startDate).slice(0, 10)
      for (let d = 1; d <= daysInMonth; d++) {
        const dayISO = toISO(year, month, d)
        if (dayISO >= evStart && dayISO <= evEnd) {
          map[d]!.push(ev)
        }
      }
    }
    return map
  }, [events, year, month, daysInMonth])

  const prevMonth = () => {
    setCursor(c => (c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 }))
    setPicked(null)
  }
  const nextMonth = () => {
    setCursor(c => (c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 }))
    setPicked(null)
  }

  const pickedKey = picked
  const pickedDay = pickedKey ? Number(pickedKey.split('-')[2]) : null
  const pickedItems: CalendarEvent[] = pickedDay != null ? dayEventsMap[pickedDay] ?? [] : []

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = today.getDate()

  const MAX_VISIBLE = mobile ? 2 : 3

  const Grid = (
    <div className="p-card" style={{ padding: mobile ? 16 : 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: 'var(--fg-secondary)' }}
        >
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 12px' }}>
          {year}년 {month}월
        </div>
        <button
          onClick={nextMonth}
          style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: 'var(--fg-tertiary)' }}
        >
          <ChevronRight size={18} />
        </button>
        {eventsQ.isLoading && (
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>불러오는 중…</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW.map((d, i) => (
          <div
            key={d}
            style={{
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: i === 0 ? 'var(--berry-500)' : i === 6 ? 'var(--sky-500)' : 'var(--fg-tertiary)',
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday = d === todayDate && isCurrentMonth
          const dayEvs = d ? dayEventsMap[d] ?? [] : []
          const dow = i % 7
          const key = d ? toISO(year, month, d) : null
          const isPicked = key && picked === key
          const visible = dayEvs.slice(0, MAX_VISIBLE)
          const extra = dayEvs.length - visible.length
          return (
            <div
              key={i}
              onClick={() => d && setPicked(key)}
              style={{
                aspectRatio: mobile ? '1 / 1.1' : '1 / 0.9',
                padding: 4,
                background: isPicked
                  ? 'var(--mossy-100)'
                  : isToday
                  ? 'var(--bg-brand-subtle)'
                  : 'var(--bg-surface)',
                border: isPicked
                  ? '1px solid var(--mossy-500)'
                  : isToday
                  ? '1px solid var(--border-brand)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                fontSize: mobile ? 10 : 11,
                minHeight: mobile ? 56 : 72,
                cursor: d ? 'pointer' : 'default',
                opacity: d ? 1 : 0.3,
                gap: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: mobile ? 11 : 12,
                  fontWeight: isToday ? 700 : 500,
                  color: dow === 0 ? 'var(--berry-500)' : dow === 6 ? 'var(--sky-500)' : 'var(--fg-primary)',
                  marginBottom: 2,
                }}
              >
                {d || ''}
              </div>
              {visible.map(ev => (
                <div
                  key={ev.rowId}
                  title={ev.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: mobile ? 9.5 : 10.5,
                    lineHeight: 1.2,
                    padding: '1px 4px',
                    borderRadius: 4,
                    background: `${ev.color}22`,
                    color: ev.color,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: ev.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                </div>
              ))}
              {extra > 0 && (
                <div
                  style={{
                    fontSize: mobile ? 9 : 10,
                    color: 'var(--fg-tertiary)',
                    fontWeight: 600,
                    paddingLeft: 4,
                  }}
                >
                  +{extra}개
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const Detail = pickedKey ? (
    <div className="p-card" style={{ padding: mobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>
          {Number(pickedKey.split('-')[1])}월 {Number(pickedKey.split('-')[2])}일
        </h2>
        <button
          onClick={() => setPicked(null)}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 0,
            padding: 4,
            cursor: 'pointer',
            color: 'var(--fg-tertiary)',
            display: 'inline-flex',
          }}
        >
          <X size={16} />
        </button>
      </div>
      {pickedItems.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', padding: '20px 0', textAlign: 'center' }}>
          일정이 없어요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pickedItems.map(ev => (
            <div
              key={ev.rowId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  minHeight: 24,
                  borderRadius: 999,
                  background: ev.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{ev.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ev.isAllDay ? (
                    <span>종일</span>
                  ) : (
                    <span>
                      {ev.startDate.slice(11, 16)}
                      {ev.endDate && ev.endDate !== ev.startDate && ` ~ ${ev.endDate.slice(11, 16)}`}
                    </span>
                  )}
                  {ev.location && (
                    <>
                      <span>·</span>
                      <span>{ev.location}</span>
                    </>
                  )}
                </div>
                {ev.description && (
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>{ev.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Grid}
        {Detail}
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 0', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>캘린더</h1>
          <div className="sub">일정 한눈에 보기</div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: picked ? '1.6fr 1fr' : '1fr',
          gap: 20,
          padding: '20px 28px',
          maxWidth: 1320,
          alignItems: 'start',
        }}
      >
        {Grid}
        {Detail}
      </div>
    </div>
  )
}
