import { addDays, areIntervalsOverlapping, differenceInDays, differenceInMinutes, endOfWeek, format, isAfter, isBefore, isSameDay, parseISO, startOfDay, startOfWeek } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { getEventBlockStyle, getVisibleHours, groupEvents, isWorkingHour } from '@/features/calendar/lib/helpers'
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
}

// ---- Multi-day events row for week view ---- //

const WeekViewMultiDayEventsRow = ({
  selectedDate,
  multiDayEvents,
}: {
  selectedDate: Date
  multiDayEvents: IEvent[]
}) => {
  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const processedEvents = useMemo(() => {
    return multiDayEvents
      .map(event => {
        const start = parseISO(event.startDate)
        const end = parseISO(event.endDate)
        const adjustedStart = isBefore(start, weekStart) ? weekStart : start
        const adjustedEnd = isAfter(end, weekEnd) ? weekEnd : end
        const startIndex = differenceInDays(adjustedStart, weekStart)
        const endIndex = differenceInDays(adjustedEnd, weekStart)

        return {
          ...event,
          adjustedStart,
          adjustedEnd,
          startIndex,
          endIndex,
        }
      })
      .sort((a, b) => {
        const startDiff = a.adjustedStart.getTime() - b.adjustedStart.getTime()
        if (startDiff !== 0) return startDiff
        return b.endIndex - b.startIndex - (a.endIndex - a.startIndex)
      })
  }, [multiDayEvents, weekStart, weekEnd])

  const eventRows = useMemo(() => {
    const rows: (typeof processedEvents)[] = []

    processedEvents.forEach(event => {
      let rowIndex = rows.findIndex(row =>
        row.every(e => e.endIndex < event.startIndex || e.startIndex > event.endIndex)
      )

      if (rowIndex === -1) {
        rowIndex = rows.length
        rows.push([])
      }

      rows[rowIndex].push(event)
    })

    return rows
  }, [processedEvents])

  const hasEventsInWeek = useMemo(() => {
    return multiDayEvents.some(event => {
      const start = parseISO(event.startDate)
      const end = parseISO(event.endDate)
      return (
        (start >= weekStart && start <= weekEnd) ||
        (end >= weekStart && end <= weekEnd) ||
        (start <= weekStart && end >= weekEnd)
      )
    })
  }, [multiDayEvents, weekStart, weekEnd])

  if (!hasEventsInWeek) return null

  return (
    <div className="hidden overflow-hidden sm:flex">
      <div className="w-18 border-b" />
      <div className="grid flex-1 grid-cols-7 divide-x border-b border-l">
        {weekDays.map((day, dayIndex) => (
          <div key={day.toISOString()} className="flex h-full flex-col gap-1 py-1">
            {eventRows.map((row, rowIndex) => {
              const event = row.find(e => e.startIndex <= dayIndex && e.endIndex >= dayIndex)

              if (!event) {
                return <div key={`${rowIndex}-${dayIndex}`} className="h-6.5" />
              }

              let position: 'first' | 'middle' | 'last' | 'none' = 'none'

              if (dayIndex === event.startIndex && dayIndex === event.endIndex) {
                position = 'none'
              } else if (dayIndex === event.startIndex) {
                position = 'first'
              } else if (dayIndex === event.endIndex) {
                position = 'last'
              } else {
                position = 'middle'
              }

              const positionClasses = {
                first: 'relative z-10 mr-0 w-[calc(100%_-_3px)] rounded-r-none border-r-0',
                middle: 'relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0',
                last: 'ml-0 rounded-l-none border-l-0',
                none: '',
              }

              const showText = ['first', 'none'].includes(position)

              return (
                <div
                  key={`${event.id}-${dayIndex}`}
                  className={cn(
                    'mx-1 flex size-auto h-6.5 select-none items-center gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs',
                    positionClasses[position]
                  )}
                  style={{
                    backgroundColor: `${event.color}15`,
                    borderColor: `${event.color}40`,
                    color: event.color,
                  }}
                >
                  {showText && (
                    <p className="truncate font-semibold">{event.title}</p>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Timeline indicator ---- //

const CalendarTimeline = ({
  firstVisibleHour,
  lastVisibleHour,
}: {
  firstVisibleHour: number
  lastVisibleHour: number
}) => {
  const now = new Date()
  const currentHour = now.getHours()

  if (currentHour < firstVisibleHour || currentHour >= lastVisibleHour) return null

  const minutes = now.getHours() * 60 + now.getMinutes()
  const visibleStartMinutes = firstVisibleHour * 60
  const visibleEndMinutes = lastVisibleHour * 60
  const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes
  const position = ((minutes - visibleStartMinutes) / visibleRangeMinutes) * 100

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 border-t border-primary"
      style={{ top: `${position}%` }}
    >
      <div className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      <div className="absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-background pr-1 text-xs font-medium text-primary">
        {format(now, 'h:mm a')}
      </div>
    </div>
  )
}

// ---- Event block for time grid ---- //

const EventBlock = ({ event }: { event: IEvent }) => {
  const start = parseISO(event.startDate)
  const end = parseISO(event.endDate)
  const durationInMinutes = differenceInMinutes(end, start)
  const heightInPixels = (durationInMinutes / 60) * 96 - 8

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        durationInMinutes < 35 && 'py-0 justify-center'
      )}
      style={{
        height: `${heightInPixels}px`,
        backgroundColor: `${event.color}15`,
        borderColor: `${event.color}40`,
        color: event.color,
      }}
    >
      <div className="flex items-center gap-1.5 truncate">
        <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
          <circle cx="4" cy="4" r="4" fill={event.color} />
        </svg>
        <p className="truncate font-semibold">{event.title}</p>
      </div>

      {durationInMinutes > 25 && (
        <p>
          {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
        </p>
      )}
    </div>
  )
}

// ---- Main week view ---- //

const CalendarWeekView = ({ singleDayEvents, multiDayEvents }: IProps) => {
  const { t, i18n } = useTranslation()
  const { selectedDate, workingHours, visibleHours } = useCalendar()

  const locale = i18n.language === 'ko' ? ko : enUS
  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents)

  const weekStart = startOfWeek(selectedDate, { locale })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="w-full h-full">
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>{t('calendar:weekView.notAvailable')}</p>
        <p>{t('calendar:weekView.switchView')}</p>
      </div>

      <div className="hidden h-full flex-col sm:flex">
        <div>
          <WeekViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          {/* Week header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18" />
            <div className="grid flex-1 grid-cols-7 divide-x border-l">
              {weekDays.map((day, index) => {
                const dayOfWeek = day.getDay()
                const isSunday = dayOfWeek === 0
                const isSaturday = dayOfWeek === 6
                const textColor = isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined

                return (
                  <div key={index} className="py-2 text-center text-xs font-medium">
                    <div style={{ color: textColor }}>
                      {format(day, 'EE', { locale })} <span className="ml-1 font-semibold">{format(day, 'd')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex overflow-hidden">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: '96px' }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date().setHours(hour, 0, 0, 0), 'hh a')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Week grid */}
            <div className="relative flex-1 border-l">
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(event =>
                    isSameDay(parseISO(event.startDate), day) || isSameDay(parseISO(event.endDate), day)
                  )
                  const groupedEvents = groupEvents(dayEvents)

                  return (
                    <div key={dayIndex} className="relative">
                      {hours.map((hour, index) => {
                        const isDisabled = !isWorkingHour(hour, workingHours)

                        return (
                          <div
                            key={hour}
                            className={cn('relative', isDisabled && 'bg-muted/30')}
                            style={{ height: '96px' }}
                          >
                            {index !== 0 && (
                              <div className="pointer-events-none absolute inset-x-0 top-0 border-b" />
                            )}
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                          </div>
                        )
                      })}

                      {groupedEvents.map((group, groupIndex) =>
                        group.map(event => {
                          let style = getEventBlockStyle(
                            event,
                            day,
                            groupIndex,
                            groupedEvents.length,
                            { from: earliestEventHour, to: latestEventHour }
                          )
                          const hasOverlap = groupedEvents.some(
                            (otherGroup, otherIndex) =>
                              otherIndex !== groupIndex &&
                              otherGroup.some(otherEvent =>
                                areIntervalsOverlapping(
                                  { start: parseISO(event.startDate), end: parseISO(event.endDate) },
                                  { start: parseISO(otherEvent.startDate), end: parseISO(otherEvent.endDate) }
                                )
                              )
                          )

                          if (!hasOverlap) style = { ...style, width: '100%', left: '0%' }

                          return (
                            <div key={event.id} className="absolute p-1" style={style}>
                              <EventBlock event={event} />
                            </div>
                          )
                        })
                      )}
                    </div>
                  )
                })}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CalendarWeekView }
