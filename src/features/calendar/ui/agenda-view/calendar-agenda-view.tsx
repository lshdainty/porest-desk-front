import { differenceInDays, endOfDay, format, isSameMonth, parseISO, startOfDay } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { CalendarX2, Clock, Text } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
}

// ---- Agenda event card ---- //

const AgendaEventCard = ({
  event,
  eventCurrentDay,
  eventTotalDays,
}: {
  event: IEvent
  eventCurrentDay?: number
  eventTotalDays?: number
}) => {
  const { t, i18n } = useTranslation('calendar')
  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const timeFormat = i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a'

  const startDate = parseISO(event.startDate)
  const endDate = parseISO(event.endDate)

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex select-none items-center justify-between gap-3 rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      style={{
        backgroundColor: `${event.color}15`,
        borderColor: `${event.color}40`,
        color: event.color,
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
            <circle cx="4" cy="4" r="4" fill={event.color} />
          </svg>

          <p className="font-medium">
            {eventCurrentDay && eventTotalDays && (
              <span className="mr-1 text-xs">
                {t('event.dayOfTotal', { current: eventCurrentDay, total: eventTotalDays })} &#8226;{' '}
              </span>
            )}
            {event.title}
          </p>
        </div>

        {!event.isAllDay && (
          <div className="flex items-center gap-1">
            <Clock className="size-3 shrink-0" />
            <p className="text-xs text-foreground">
              {format(startDate, timeFormat, { locale })} - {format(endDate, timeFormat, { locale })}
            </p>
          </div>
        )}

        {event.description && (
          <div className="flex items-center gap-1">
            <Text className="size-3 shrink-0" />
            <p className="text-xs text-foreground">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Agenda day group ---- //

const AgendaDayGroup = ({
  date,
  events,
  multiDayEvents,
}: {
  date: Date
  events: IEvent[]
  multiDayEvents: IEvent[]
}) => {
  const { i18n } = useTranslation()
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const dateFormat = i18n.language.startsWith('ko') ? 'yyyy년 M월 dd일 EEEE' : 'EEEE, MMMM d, yyyy'
  const locale = i18n.language.startsWith('ko') ? ko : enUS

  return (
    <div className="space-y-4">
      <div className="sticky top-0 flex items-center gap-4 bg-background py-2">
        <p className="text-sm font-semibold">
          {format(date, dateFormat, { locale })}
        </p>
      </div>

      <div className="space-y-2">
        {multiDayEvents.length > 0 &&
          multiDayEvents.map(event => {
            const eventStart = startOfDay(parseISO(event.startDate))
            const eventEnd = startOfDay(parseISO(event.endDate))
            const currentDate = startOfDay(date)

            const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1
            const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1
            return (
              <AgendaEventCard
                key={event.id}
                event={event}
                eventCurrentDay={eventTotalDays > 1 ? eventCurrentDay : undefined}
                eventTotalDays={eventTotalDays > 1 ? eventTotalDays : undefined}
              />
            )
          })}

        {sortedEvents.length > 0 &&
          sortedEvents.map(event => <AgendaEventCard key={event.id} event={event} />)}
      </div>
    </div>
  )
}

// ---- Main agenda view ---- //

const CalendarAgendaView = ({ singleDayEvents, multiDayEvents }: IProps) => {
  const { t } = useTranslation('calendar')
  const { selectedDate } = useCalendar()

  const eventsByDay = useMemo(() => {
    const allDates = new Map<string, { date: Date, events: IEvent[], multiDayEvents: IEvent[] }>()

    singleDayEvents.forEach(event => {
      const eventDate = parseISO(event.startDate)
      if (!isSameMonth(eventDate, selectedDate)) return

      const dateKey = format(eventDate, 'yyyy-MM-dd')

      if (!allDates.has(dateKey)) {
        allDates.set(dateKey, { date: startOfDay(eventDate), events: [], multiDayEvents: [] })
      }

      allDates.get(dateKey)?.events.push(event)
    })

    multiDayEvents.forEach(event => {
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)

      let currentDate = startOfDay(eventStart)
      const lastDate = endOfDay(eventEnd)

      while (currentDate <= lastDate) {
        if (isSameMonth(currentDate, selectedDate)) {
          const dateKey = format(currentDate, 'yyyy-MM-dd')

          if (!allDates.has(dateKey)) {
            allDates.set(dateKey, { date: new Date(currentDate), events: [], multiDayEvents: [] })
          }

          allDates.get(dateKey)?.multiDayEvents.push(event)
        }
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
      }
    })

    return Array.from(allDates.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [singleDayEvents, multiDayEvents, selectedDate])

  const hasAnyEvents = singleDayEvents.length > 0 || multiDayEvents.length > 0

  return (
    <div className="w-full h-full">
      <div className="h-full overflow-y-auto">
        <div className="space-y-6 p-4">
          {eventsByDay.map(dayGroup => (
            <AgendaDayGroup
              key={format(dayGroup.date, 'yyyy-MM-dd')}
              date={dayGroup.date}
              events={dayGroup.events}
              multiDayEvents={dayGroup.multiDayEvents}
            />
          ))}

          {!hasAnyEvents && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <CalendarX2 className="size-10" />
              <p className="text-sm md:text-base">{t('agenda.noEvents')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { CalendarAgendaView }
