import { isToday, startOfDay, endOfDay, format, isSameDay, parseISO } from 'date-fns'
import { useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useDragSelect, DragSelectProvider } from '@/features/calendar/model/drag-select-context'
import { calculateMonthEventPositions, getCalendarCells, getMonthCellEvents } from '@/features/calendar/lib/helpers'
import { cn, formatNumber } from '@/shared/lib'

import type { ICalendarCell, IEvent } from '@/features/calendar/model/interfaces'

/** expense 이벤트의 title에서 금액(숫자)을 추출 */
function parseExpenseAmount(title: string): number {
  const match = title.match(/[+-]?([\d,]+)/)
  if (!match) return 0
  return Number(match[1].replace(/,/g, ''))
}

/** 날짜별 수입/지출 합계 */
interface IDayExpenseSummary {
  income: number
  expense: number
}

/** expense 이벤트 목록에서 날짜별 수입/지출 합계를 계산 */
function buildExpenseSummaryMap(expenseEvents: IEvent[]): Map<string, IDayExpenseSummary> {
  const map = new Map<string, IDayExpenseSummary>()

  for (const event of expenseEvents) {
    const dayKey = startOfDay(parseISO(event.startDate)).toISOString()
    const summary = map.get(dayKey) ?? { income: 0, expense: 0 }
    const amount = parseExpenseAmount(event.title)

    if (event.color === '#22c55e') {
      summary.income += amount
    } else {
      summary.expense += amount
    }

    map.set(dayKey, summary)
  }

  return map
}

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
  expenseSummary,
}: {
  cell: ICalendarCell
  events: IEvent[]
  eventPositions: Record<string, number>
  expenseSummary?: IDayExpenseSummary
}) => {
  const { setSelectedDate, setView } = useCalendar()
  const { startSelection, updateSelection, endSelection, isDateInSelection, isDragSelecting } = useDragSelect()

  const { day, currentMonth, date } = cell

  const cellEvents = useMemo(
    () => getMonthCellEvents(date, events, eventPositions),
    [date, events, eventPositions]
  )
  const isSunday = date.getDay() === 0
  const isSaturday = date.getDay() === 6

  const isSelected = isDateInSelection(date)

  const handleClick = () => {
    setSelectedDate(date)
    setView('day')
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only respond to left mouse button
    if (e.button !== 0) return

    // Prevent selection if clicking on a button, event badge, or draggable element
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('[draggable]')
    ) {
      return
    }

    startSelection(date)
  }, [date, startSelection])

  const handleMouseEnter = useCallback(() => {
    updateSelection(date)
  }, [date, updateSelection])

  const handleMouseUp = useCallback(() => {
    endSelection()
  }, [endSelection])

  const hasExpense = expenseSummary && (expenseSummary.income > 0 || expenseSummary.expense > 0)

  return (
    <div
      className={cn(
        'flex h-full flex-col gap-1 border-l border-t py-1.5 lg:pb-2 lg:pt-1 select-none',
        isSunday && 'border-l-0',
        isSelected && 'bg-blue-100/50 dark:bg-blue-900/20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]'
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
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

      {/* 수입/지출 합계 표시 (날짜 헤더와 이벤트 뱃지 사이) */}
      {hasExpense && (
        <div className={cn('hidden lg:flex flex-col gap-0 px-2 text-[10px] leading-tight font-medium', !currentMonth && 'opacity-50')}>
          {expenseSummary.income > 0 && (
            <span style={{ color: '#22c55e' }}>+{formatNumber(expenseSummary.income)}</span>
          )}
          {expenseSummary.expense > 0 && (
            <span style={{ color: '#ef4444' }}>-{formatNumber(expenseSummary.expense)}</span>
          )}
        </div>
      )}

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

const MonthViewContent = ({ singleDayEvents, multiDayEvents }: IProps) => {
  const { i18n } = useTranslation()
  const { selectedDate } = useCalendar()
  const { endSelection } = useDragSelect()

  const weekDays = i18n.language === 'ko' ? WEEK_DAYS_KO : WEEK_DAYS_EN

  // expense 이벤트를 일반 이벤트와 분리 (expense는 이벤트 슬롯을 차지하지 않음)
  const regularSingleDayEvents = useMemo(
    () => singleDayEvents.filter(e => e.calendarSource !== 'expense'),
    [singleDayEvents]
  )
  const regularMultiDayEvents = useMemo(
    () => multiDayEvents.filter(e => e.calendarSource !== 'expense'),
    [multiDayEvents]
  )
  const expenseEvents = useMemo(
    () => [...singleDayEvents, ...multiDayEvents].filter(e => e.calendarSource === 'expense'),
    [singleDayEvents, multiDayEvents]
  )

  const allRegularEvents = useMemo(
    () => [...regularMultiDayEvents, ...regularSingleDayEvents],
    [regularMultiDayEvents, regularSingleDayEvents]
  )

  // 날짜별 수입/지출 합계 맵
  const expenseSummaryMap = useMemo(
    () => buildExpenseSummaryMap(expenseEvents),
    [expenseEvents]
  )

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate])

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(regularMultiDayEvents, regularSingleDayEvents, selectedDate),
    [regularMultiDayEvents, regularSingleDayEvents, selectedDate]
  )

  // Handle mouse up on the grid container (catches mouseup outside cells)
  const handleGridMouseUp = useCallback(() => {
    endSelection()
  }, [endSelection])

  // Handle mouse leaving the grid area to end selection
  const handleGridMouseLeave = useCallback(() => {
    endSelection()
  }, [endSelection])

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
        <div
          className="grid grid-cols-7 auto-rows-fr h-full"
          onMouseUp={handleGridMouseUp}
          onMouseLeave={handleGridMouseLeave}
        >
          {cells.map(cell => {
            const dayKey = startOfDay(cell.date).toISOString()
            return (
              <MonthDayCell
                key={cell.date.toISOString()}
                cell={cell}
                events={allRegularEvents}
                eventPositions={eventPositions}
                expenseSummary={expenseSummaryMap.get(dayKey)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const CalendarMonthView = ({ singleDayEvents, multiDayEvents }: IProps) => {
  return (
    <DragSelectProvider>
      <MonthViewContent singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
    </DragSelectProvider>
  )
}

export { CalendarMonthView }
