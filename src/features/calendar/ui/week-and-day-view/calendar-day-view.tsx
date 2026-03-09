import { areIntervalsOverlapping, differenceInDays, differenceInMinutes, endOfDay, format, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { getCurrentEvents, getEventBlockStyle, getVisibleHours, groupEvents, isWorkingHour } from '@/features/calendar/lib/helpers'
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
  onEventClick?: (event: IEvent, el: HTMLElement) => void
}

// ---- Multi-day events row for day view ---- //

const DayViewMultiDayEventsRow = ({
  selectedDate,
  multiDayEvents,
  onEventClick,
}: {
  selectedDate: Date
  multiDayEvents: IEvent[]
  onEventClick?: (event: IEvent, el: HTMLElement) => void
}) => {
  const { t } = useTranslation('calendar')
  const dayStart = startOfDay(selectedDate)
  const dayEnd = endOfDay(selectedDate)

  const multiDayEventsInDay = multiDayEvents
    .filter(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)

      const isOverlapping =
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)

      return isOverlapping
    })
    .sort((a, b) => {
      const durationA = differenceInDays(parseISO(a.endDate), parseISO(a.startDate))
      const durationB = differenceInDays(parseISO(b.endDate), parseISO(b.startDate))
      return durationB - durationA
    })

  if (multiDayEventsInDay.length === 0) return null

  return (
    <div className="flex border-b">
      <div className="w-18" />
      <div className="flex flex-1 flex-col gap-1 border-l py-1">
        {multiDayEventsInDay.map(event => {
          const eventStart = startOfDay(parseISO(event.startDate))
          const eventEnd = startOfDay(parseISO(event.endDate))
          const currentDate = startOfDay(selectedDate)

          const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1
          const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1

          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              className="mx-1 flex h-6.5 cursor-pointer select-none items-center gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              style={{
                backgroundColor: `${event.color}15`,
                borderColor: `${event.color}40`,
                color: event.color,
              }}
              onClick={(e) => onEventClick?.(event, e.currentTarget)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick?.(event, e.currentTarget) } }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
                <circle cx="4" cy="4" r="4" fill={event.color} />
              </svg>
              <p className="truncate font-semibold">
                {eventTotalDays > 1 && (
                  <span className="text-xs">
                    {t('event.dayOfTotal', { current: eventCurrentDay, total: eventTotalDays })} &#8226;{' '}
                  </span>
                )}
                {event.title}
              </p>
            </div>
          )
        })}
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
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const timeFormat = i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a'

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
        {format(now, timeFormat, { locale })}
      </div>
    </div>
  )
}

// ---- Event block for time grid ---- //

const EventBlock = ({ event, onEventClick }: { event: IEvent; onEventClick?: (event: IEvent, el: HTMLElement) => void }) => {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const timeFormat = i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a'

  const start = parseISO(event.startDate)
  const end = parseISO(event.endDate)
  const durationInMinutes = differenceInMinutes(end, start)
  const heightInPixels = (durationInMinutes / 60) * 96 - 8

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        durationInMinutes < 35 && 'py-0 justify-center'
      )}
      style={{
        height: `${heightInPixels}px`,
        backgroundColor: `${event.color}15`,
        borderColor: `${event.color}40`,
        color: event.color,
      }}
      onClick={(e) => onEventClick?.(event, e.currentTarget)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick?.(event, e.currentTarget) } }}
    >
      <div className="flex items-center gap-1.5 truncate">
        <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
          <circle cx="4" cy="4" r="4" fill={event.color} />
        </svg>
        <p className="truncate font-semibold">{event.title}</p>
      </div>

      {durationInMinutes > 25 && (
        <p>
          {format(start, timeFormat, { locale })} - {format(end, timeFormat, { locale })}
        </p>
      )}
    </div>
  )
}

// ---- Main day view ---- //

const CalendarDayView = ({ singleDayEvents, multiDayEvents, onEventClick }: IProps) => {
  const { t, i18n } = useTranslation('calendar')
  const { selectedDate, setSelectedDate, visibleHours, workingHours } = useCalendar()

  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const hourFormat = i18n.language.startsWith('ko') ? 'a hh시' : 'hh a'
  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents)

  const currentEvents = getCurrentEvents(singleDayEvents)

  const isSunday = selectedDate.getDay() === 0
  const isSaturday = selectedDate.getDay() === 6

  const dayEvents = singleDayEvents.filter(event => {
    const eventDate = parseISO(event.startDate)
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  const groupedEvents = groupEvents(dayEvents)

  return (
    <div className="w-full h-full flex">
      <div className="flex flex-1 flex-col h-full">
        <div>
          <DayViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} onEventClick={onEventClick} />

          {/* Day header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18" />
            <div className="flex-1 border-l py-2 text-center text-xs font-medium">
              <div style={{ color: isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined }}>
                {format(selectedDate, 'EE', { locale })}{' '}
                <span className="font-semibold">{format(selectedDate, 'd')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: '96px' }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date().setHours(hour, 0, 0, 0), hourFormat, { locale })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="relative flex-1 border-l">
              <div className="relative">
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
                      selectedDate,
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
                        <EventBlock event={event} onEventClick={onEventClick} />
                      </div>
                    )
                  })
                )}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="hidden w-64 divide-y border-l md:block">
        <div className="flex-1 space-y-3">
          {currentEvents.length > 0 ? (
            <div className="flex items-start gap-2 px-4 pt-4">
              <span className="relative mt-[5px] flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green-600" />
              </span>
              <p className="text-sm font-semibold text-foreground">{t('dayView.happeningNow')}</p>
            </div>
          ) : (
            <p className="p-4 text-center text-sm italic text-muted-foreground">
              {t('dayView.noAppointments')}
            </p>
          )}

          {currentEvents.length > 0 && (
            <div className="h-[422px] overflow-y-auto px-4">
              <div className="space-y-6 pb-4">
                {currentEvents.map(event => (
                  <div key={event.id} className="space-y-1.5">
                    <p className="line-clamp-2 text-sm font-semibold">{event.title}</p>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarIcon className="size-3.5" />
                      <span className="text-sm">
                        {format(
                          new Date(),
                          i18n.language.startsWith('ko') ? 'yyyy년 M월 d일' : 'MMM d, yyyy',
                          { locale }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span className="text-sm">
                        {format(
                          parseISO(event.startDate),
                          i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a',
                          { locale }
                        )}{' '}
                        -{' '}
                        {format(
                          parseISO(event.endDate),
                          i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a',
                          { locale }
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { CalendarDayView }
