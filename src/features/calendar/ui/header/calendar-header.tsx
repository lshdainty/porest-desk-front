import { CalendarRange, Columns, Grid2x2, Grid3x3, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { getEventsCount, navigateDate, rangeText } from '@/features/calendar/lib/helpers'
import { Button } from '@/shared/ui/button'
import { CalendarSourceToggle } from '@/features/calendar/ui/header/calendar-source-toggle'

import type { IEvent } from '@/features/calendar/model/interfaces'

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
            <Button
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </Button>

            <p className="text-sm text-muted-foreground">
              {rangeText(view, selectedDate, locale)}
            </p>

            <Button
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handleNext}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Calendar source toggles */}
        <CalendarSourceToggle />

        {/* Separator */}
        <div className="hidden h-6 w-px bg-border lg:block" />

        <div className="inline-flex">
          <Button
            aria-label="View by day"
            size="icon"
            variant={view === 'day' ? 'default' : 'outline'}
            className="rounded-r-none"
            onClick={() => setView('day')}
          >
            <List strokeWidth={1.8} />
          </Button>
          <Button
            aria-label="View by week"
            size="icon"
            variant={view === 'week' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('week')}
          >
            <Columns strokeWidth={1.8} />
          </Button>
          <Button
            aria-label="View by month"
            size="icon"
            variant={view === 'month' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('month')}
          >
            <Grid2x2 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label="View by year"
            size="icon"
            variant={view === 'year' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('year')}
          >
            <Grid3x3 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label="View by agenda"
            size="icon"
            variant={view === 'agenda' ? 'default' : 'outline'}
            className="-ml-px rounded-l-none"
            onClick={() => setView('agenda')}
          >
            <CalendarRange strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { CalendarHeader }
