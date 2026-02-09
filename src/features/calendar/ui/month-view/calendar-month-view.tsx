import { isToday, startOfDay, endOfDay, format, isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { calculateMonthEventPositions, getCalendarCells, getMonthCellEvents } from '@/features/calendar/lib/helpers'
import { cn } from '@/shared/lib'

import type { ICalendarCell, IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
}

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const MAX_VISIBLE_EVENTS = 3

const MonthDayCell = ({
  cell,
  events,
  eventPositions,
}: {
  cell: ICalendarCell
  events: IEvent[]
  eventPositions: Record<string, number>
}) => {
  const { setSelectedDate, setView } = useCalendar()

  const { day, currentMonth, date } = cell

  const cellEvents = useMemo(
    () => getMonthCellEvents(date, events, eventPositions),
    [date, events, eventPositions]
  )
  const isSunday = date.getDay() === 0
  const isSaturday = date.getDay() === 6

  const handleClick = () => {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col gap-1 border-l border-t py-1.5 lg:pb-2 lg:pt-1',
        isSunday && 'border-l-0'
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            onClick={handleClick}
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-shrink-0',
              !currentMonth && 'opacity-20',
              isToday(date) && 'bg-primary font-bold text-primary-foreground hover:bg-primary'
            )}
            style={{
              color: isToday(date) ? undefined : (isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined),
            }}
          >
            {day}
          </button>
        </div>

        {cellEvents.length > MAX_VISIBLE_EVENTS && (
          <button
            onClick={handleClick}
            className={cn(
              'text-xs font-semibold text-muted-foreground flex-shrink-0 px-0.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded',
              !currentMonth && 'opacity-50'
            )}
          >
            <span className="sm:hidden">+{cellEvents.length - MAX_VISIBLE_EVENTS}</span>
            <span className="hidden sm:inline">{cellEvents.length - MAX_VISIBLE_EVENTS} more</span>
          </button>
        )}
      </div>

      <div className={cn('flex flex-1 h-6 gap-1 px-2 lg:flex-col lg:gap-2 lg:px-0', !currentMonth && 'opacity-50')}>
        {[0, 1, 2].map(position => {
          const event = cellEvents.find(e => e.position === position)
          const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`

          return (
            <div key={eventKey} className="lg:min-h-[28px]">
              {event && (
                <>
                  {/* Mobile: color dot */}
                  <div
                    className="size-2 rounded-full lg:hidden"
                    style={{ backgroundColor: event.color }}
                  />
                  {/* Desktop: event badge */}
                  <MonthEventBadge
                    className="hidden lg:flex"
                    event={event}
                    cellDate={startOfDay(date)}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MonthEventBadge = ({
  event,
  cellDate,
  className,
}: {
  event: IEvent
  cellDate: Date
  className?: string
}) => {
  const itemStart = startOfDay(parseISO(event.startDate))
  const itemEnd = endOfDay(parseISO(event.endDate))

  if (cellDate < itemStart || cellDate > itemEnd) return null

  let position: 'first' | 'middle' | 'last' | 'none'

  if (isSameDay(itemStart, itemEnd)) {
    position = 'none'
  } else if (isSameDay(cellDate, itemStart)) {
    position = 'first'
  } else if (isSameDay(cellDate, startOfDay(parseISO(event.endDate)))) {
    position = 'last'
  } else {
    position = 'middle'
  }

  const renderBadgeText = ['first', 'none'].includes(position)
  const isMultiDay = !isSameDay(itemStart, endOfDay(parseISO(event.endDate)) > itemEnd ? itemEnd : startOfDay(parseISO(event.endDate)))

  const positionClasses = {
    first: 'relative z-10 mr-0 w-[calc(100%_-_3px)] rounded-r-none border-r-0 [&>span]:mr-2.5',
    middle: 'relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0',
    last: 'ml-0 rounded-l-none border-l-0',
    none: '',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'mx-1 flex size-auto h-6.5 select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        positionClasses[position],
        className
      )}
      style={{
        backgroundColor: `${event.color}15`,
        borderColor: `${event.color}40`,
        color: event.color,
      }}
    >
      {position === 'last' && (
        <div className="ml-auto">
          <span>{format(new Date(event.startDate), 'h:mm a')}</span>
        </div>
      )}

      {position !== 'last' && (
        <>
          <div className="flex items-center gap-1.5 truncate">
            <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
              <circle cx="4" cy="4" r="4" fill={event.color} />
            </svg>

            {renderBadgeText && (
              <p className="flex-1 truncate font-semibold">
                {event.title}
              </p>
            )}
          </div>

          {renderBadgeText && !isMultiDay && (
            <span>{format(new Date(event.startDate), 'h:mm a')}</span>
          )}
        </>
      )}
    </div>
  )
}

const CalendarMonthView = ({ singleDayEvents, multiDayEvents }: IProps) => {
  const { i18n } = useTranslation()
  const { selectedDate } = useCalendar()

  const weekDays = i18n.language === 'ko' ? WEEK_DAYS_KO : WEEK_DAYS_EN
  const allEvents = [...multiDayEvents, ...singleDayEvents]

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate])

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 divide-x border-b flex-shrink-0">
        {weekDays.map((day, index) => {
          const isSunday = index === 0
          const isSaturday = index === 6

          return (
            <div key={day} className="flex items-center justify-center py-2">
              <span
                className="text-xs font-medium"
                style={{ color: isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined }}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-7 auto-rows-fr h-full">
          {cells.map(cell => (
            <MonthDayCell
              key={cell.date.toISOString()}
              cell={cell}
              events={allEvents}
              eventPositions={eventPositions}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { CalendarMonthView }
