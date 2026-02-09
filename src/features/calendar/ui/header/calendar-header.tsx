import { CalendarRange, Columns, Grid2x2, Grid3x3, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { getEventsCount, navigateDate, rangeText } from '@/features/calendar/lib/helpers'
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces'
import type { TCalendarView } from '@/features/calendar/model/types'

interface IProps {
  events: IEvent[]
}

const CalendarHeader = ({ events }: IProps) => {
  const { t, i18n } = useTranslation('calendar')
  const { selectedDate, setSelectedDate, view, setView } = useCalendar()

  const locale = i18n.language === 'ko' ? ko : enUS
  const dateFormat = i18n.language === 'ko' ? 'yyyy년 M월' : 'MMMM yyyy'
  const formattedDate = format(selectedDate, dateFormat, { locale })

  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view]
  )

  const handlePrevious = () => setSelectedDate(navigateDate(selectedDate, view, 'previous'))
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, 'next'))

  const handleTodayClick = () => setSelectedDate(new Date())

  const viewButtons: { key: TCalendarView, icon: typeof List, label: string, roundedClass: string }[] = [
    { key: 'day', icon: List, label: 'View by day', roundedClass: 'rounded-r-none' },
    { key: 'week', icon: Columns, label: 'View by week', roundedClass: '-ml-px rounded-none' },
    { key: 'month', icon: Grid2x2, label: 'View by month', roundedClass: '-ml-px rounded-none' },
    { key: 'year', icon: Grid3x3, label: 'View by year', roundedClass: '-ml-px rounded-none' },
    { key: 'agenda', icon: CalendarRange, label: 'View by agenda', roundedClass: '-ml-px rounded-l-none' },
  ]

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {/* Today button */}
        <button
          className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onClick={handleTodayClick}
        >
          <p className="flex h-6 w-full items-center justify-center bg-primary text-center text-xs font-semibold text-primary-foreground">
            {format(new Date(), 'MMM').toUpperCase()}
          </p>
          <p className="flex w-full items-center justify-center text-lg font-bold">
            {new Date().getDate()}
          </p>
        </button>

        {/* Date navigator */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {formattedDate}
            </span>
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium">
              {t('header.eventCount', { count: eventCount })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex size-6.5 items-center justify-center rounded-md border px-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-4.5"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </button>

            <p className="text-sm text-muted-foreground">
              {rangeText(view, selectedDate, locale)}
            </p>

            <button
              className="inline-flex size-6.5 items-center justify-center rounded-md border px-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-4.5"
              onClick={handleNext}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="inline-flex">
          {viewButtons.map(({ key, icon: Icon, label, roundedClass }) => (
            <button
              key={key}
              aria-label={label}
              className={cn(
                'inline-flex size-9 items-center justify-center border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-10',
                roundedClass,
                view === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              )}
              onClick={() => setView(key)}
            >
              <Icon strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { CalendarHeader }
