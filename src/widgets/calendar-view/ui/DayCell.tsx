import { isToday, isSameDay, isSameMonth } from '@/shared/lib/date'
import { cn } from '@/shared/lib'
import type { CalendarEvent } from '@/entities/calendar'
import { EventBadge } from './EventBadge'

interface DayCellProps {
  date: Date
  currentMonth: Date
  selectedDate: Date
  events: CalendarEvent[]
  onClick: (date: Date) => void
  compact?: boolean
}

export const DayCell = ({
  date,
  currentMonth,
  selectedDate,
  events,
  onClick,
  compact,
}: DayCellProps) => {
  const today = isToday(date)
  const selected = isSameDay(date, selectedDate)
  const inMonth = isSameMonth(date, currentMonth)
  const dayEvents = events.slice(0, 3)
  const moreCount = events.length - 3

  return (
    <button
      onClick={() => onClick(date)}
      className={cn(
        'flex flex-col items-center p-1 transition-colors',
        compact
          ? 'min-w-[40px] gap-1 rounded-lg py-2'
          : 'min-h-[80px] items-start rounded-md md:min-h-[100px]',
        !inMonth && 'opacity-40',
        selected && 'bg-primary/10 ring-1 ring-primary/30',
        !selected && 'hover:bg-muted'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
          today && 'bg-primary text-primary-foreground',
          selected && !today && 'bg-primary/20 text-primary',
          !today && !selected && 'text-foreground'
        )}
      >
        {date.getDate()}
      </span>

      {!compact && (
        <div className="mt-0.5 flex w-full flex-col gap-0.5 px-0.5">
          {dayEvents.map((event) => (
            <EventBadge
              key={event.rowId}
              title={event.title}
              color={event.color}
              eventType={event.eventType}
            />
          ))}
          {moreCount > 0 && (
            <span className="text-[10px] text-muted-foreground pl-1">
              +{moreCount}
            </span>
          )}
        </div>
      )}

      {compact && events.length > 0 && (
        <div className="flex gap-0.5">
          {events.slice(0, 3).map((event) => (
            <EventBadge
              key={event.rowId}
              title={event.title}
              color={event.color}
              eventType={event.eventType}
              compact
            />
          ))}
        </div>
      )}
    </button>
  )
}
