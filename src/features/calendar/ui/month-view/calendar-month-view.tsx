import { isToday, startOfDay, endOfDay, format, isSameDay, parseISO } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useDragSelect, DragSelectProvider } from '@/features/calendar/model/drag-select-context'
import { calculateMonthEventPositions, eventBadgeColor, getCalendarCells, getMonthCellEvents } from '@/features/calendar/lib/helpers'
import { cn, formatNumber } from '@/shared/lib'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'

import type { ICalendarCell, IEvent } from '@/features/calendar/model/interfaces'

/** expense 이벤트의 title에서 금액(숫자)을 추출 */
function parseExpenseAmount(title: string): number {
  const match = title.match(/[+-]?([\d,]+)/)
  if (!match?.[1]) return 0
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

    if (event.color === '#0147ad') {
      summary.income += amount
    } else {
      summary.expense += amount
    }

    map.set(dayKey, summary)
  }

  return map
}

interface IPropsExt {
  /** 셀 클릭 콜백 — 지정 시 drag-select 우선순위 양보 (가계부 캘린더의 DayDetail 트리거). */
  onDayClick?: (date: Date) => void
}

interface IProps extends IPropsExt {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
  onEventClick?: (event: IEvent, el: HTMLElement) => void
  /** 모바일에서 요일 헤더 하단 border-b 표시 여부. 가계부는 true(기본), 캘린더는 false. */
  mobileHeaderBorder?: boolean
}

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const MOBILE_MAX_EVENTS = 3

const MonthDayCell = ({
  cell,
  events,
  eventPositions,
  expenseSummary,
  holidayDateSet,
  maxVisibleEvents,
  onEventClick,
  onDayClick,
}: {
  cell: ICalendarCell
  events: IEvent[]
  eventPositions: Record<string, number>
  expenseSummary?: IDayExpenseSummary
  holidayDateSet: Set<string>
  maxVisibleEvents: number
  onEventClick?: (event: IEvent, el: HTMLElement) => void
  onDayClick?: (date: Date) => void
}) => {
  const { t } = useTranslation('calendar')
  const { setSelectedDate, setView } = useCalendar()
  const { startSelection, updateSelection, endSelection, isDateInSelection } = useDragSelect()
  // 금액 숨김 — 셀 합계가 formatNumber 로 직접 렌더돼 마스킹이 누락되던 버그 fix.
  // masked 면 부호 없이 점(compact 4개)만 — 다른 화면 MaskAmount 정합.
  const hideAmounts = useHideAmounts()

  const { day, currentMonth, date } = cell

  const cellEvents = useMemo(
    () => getMonthCellEvents(date, events, eventPositions),
    [date, events, eventPositions]
  )
  const isSunday = date.getDay() === 0
  const isSaturday = date.getDay() === 6
  const isHoliday = holidayDateSet.has(startOfDay(date).toISOString())

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

    // onDayClick prop 있으면 drag-select 우선순위 양보 — 단순 셀 클릭 처리만.
    if (onDayClick) {
      onDayClick(date)
      return
    }

    startSelection(date)
  }, [date, startSelection, onDayClick])

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
        // 모바일 (< 1024px) 에선 셀 사이 grid line 제거 (사용자 요청). lg 이상만 표시.
        'flex h-full flex-col gap-1 lg:border-l lg:border-t py-1.5 lg:pb-2 lg:pt-1 select-none',
        isSunday && 'lg:border-l-0',
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
              // 오늘 — 앱 bgBrand 정합: 라이트 primary / 다크 primary-light (var(--fg-brand) 가 자동 swap)
              isToday(date) && 'bg-[var(--fg-brand)] font-bold text-primary-foreground hover:bg-[var(--fg-brand)]'
            )}
            style={{
              // 토요일 — 앱 fgBrand 정합(--color-info 아님). 일요일/공휴일 = fg-expense(빨강).
              color: isToday(date) ? undefined : (isHoliday || isSunday ? 'var(--fg-expense)' : isSaturday ? 'var(--fg-brand)' : undefined),
            }}
          >
            {day}
          </button>

          {/* 수입/지출 합계는 날짜 옆이 아닌 셀 본문에 큰 글씨로 표시
              (좁은 모바일 셀에서 truncate 되지 않게 — 아래 본문 영역으로 옮김) */}
        </div>

        {cellEvents.length > maxVisibleEvents && (
          <button
            onClick={handleClick}
            className={cn(
              'text-xs font-semibold text-muted-foreground flex-shrink-0 px-0.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded',
              !currentMonth && 'opacity-50'
            )}
          >
            <span className="sm:hidden">+{cellEvents.length - maxVisibleEvents}</span>
            <span className="hidden sm:inline">{t('monthView.more', { count: cellEvents.length - maxVisibleEvents })}</span>
          </button>
        )}
      </div>

      <div className={cn('flex flex-col flex-1 min-h-0 gap-1', !currentMonth && 'opacity-50')}>
        {/* 셀 본문 상단에 수입/지출 합계 — 글자 수 따라 fontSize 동적 축소.
            셀 폭이 좁아 +3,500,000 같은 긴 숫자가 옆 셀 침범하던 버그 fix.
            step: <=6 11px / <=8 10px / <=10 9px / 그 외 8px (App 정합).
            flex-shrink-0 — 아래 event slot 들이 expense 자르지 않게. */}
        {hasExpense && (
          <div className="flex flex-col items-start gap-0.5 px-1 lg:px-2 leading-none font-semibold overflow-hidden flex-shrink-0">
            {/* 모바일: 글자 수별 step text-[NNpx] (11/10/9/8). lg+: text-base (16px) 고정.
                inline style fontSize 사용 시 className lg:text-base 가 override 안 됨 — Tailwind class 만 사용. */}
            {expenseSummary.expense > 0 && (() => {
              const text = hideAmounts ? '••••' : `−${formatNumber(expenseSummary.expense)}`
              // 셀 폭 좁아 +3,500,000 (10) 9px 도 잘림 — 단계 한 칸씩 축소.
              const mobileFs =
                text.length <= 6 ? 'text-[11px]' :
                text.length <= 8 ? 'text-[10px]' :
                text.length <= 9 ? 'text-[9px]' :
                text.length <= 10 ? 'text-[8px]' : 'text-[7px]'
              return (
                <span
                  className={cn(mobileFs, 'lg:text-base whitespace-nowrap leading-tight num')}
                  style={{ color: 'var(--fg-expense)' }}
                >{text}</span>
              )
            })()}
            {expenseSummary.income > 0 && (() => {
              const text = hideAmounts ? '••••' : `+${formatNumber(expenseSummary.income)}`
              // 셀 폭 좁아 +3,500,000 (10) 9px 도 잘림 — 단계 한 칸씩 축소.
              const mobileFs =
                text.length <= 6 ? 'text-[11px]' :
                text.length <= 8 ? 'text-[10px]' :
                text.length <= 9 ? 'text-[9px]' :
                text.length <= 10 ? 'text-[8px]' : 'text-[7px]'
              return (
                <span
                  className={cn(mobileFs, 'lg:text-base whitespace-nowrap leading-tight num')}
                  style={{ color: 'var(--fg-income)' }}
                >{text}</span>
              )
            })()}
          </div>
        )}
        {/* expense-only 셀 (regular event 없음) 일 때 빈 event slot 들 그리지 않음
            — 빈 slot 이 expense summary 자리 침범 + truncate 방지. */}
        {cellEvents.length > 0 && Array.from({ length: maxVisibleEvents }, (_, i) => i).map(position => {
          const event = cellEvents.find(e => e.position === position)
          const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`

          return (
            <div key={eventKey} className="h-5.5 lg:h-6.5">
              {event && (
                <MonthEventBadge
                  event={event}
                  cellDate={startOfDay(date)}
                  onEventClick={onEventClick}
                />
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
  onEventClick,
}: {
  event: IEvent
  cellDate: Date
  className?: string
  onEventClick?: (event: IEvent, el: HTMLElement) => void
}) => {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const timeFormat = i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a'
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
  const isMultiDay = !isSameDay(parseISO(event.startDate), parseISO(event.endDate))
  const badgeColor = eventBadgeColor(event)

  const positionClasses = {
    // 멀티데이 바: 시작/종료(외곽)만 round, 중간은 full-bleed 연속. 보이는 border 의존 제거 →
    // 연결 변(邊) margin 0 + lg border-l(1px) 은 -ml-px 로 bridge. lg 라운딩도 명시 override
    // (base rounded-none 만으론 base 의 lg:rounded-md 가 안 덮여 중간이 둥글어지는 버그 fix).
    first: 'relative z-10 mr-0 lg:mr-0 rounded-r-none lg:rounded-r-none [&>span]:mr-2.5',
    middle: 'relative z-10 mx-0 lg:mx-0 lg:-ml-px rounded-none lg:rounded-none',
    last: 'relative z-10 ml-0 lg:ml-0 lg:-ml-px rounded-l-none lg:rounded-l-none',
    none: '',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'mx-0.5 lg:mx-1 flex size-auto h-5.5 lg:h-6.5 select-none items-center justify-between gap-1 overflow-hidden whitespace-nowrap rounded-sm lg:rounded-md border px-1 lg:px-2 text-[length:var(--text-badge)] lg:text-[length:var(--text-caption)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        positionClasses[position],
        className
      )}
      style={{
        // 클로드 디자인 정합: 알파(투명) 틴트 대신 surface 와 섞은 불투명 bg +
        // fg-primary 와 섞은 적응형 텍스트(다크에서 자동 light → 가독성). border 없음.
        background: `color-mix(in oklab, ${badgeColor} 17%, var(--bg-surface))`,
        borderColor: 'transparent',
        color: `color-mix(in oklab, ${badgeColor} 70%, var(--fg-primary))`,
      }}
      onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e.currentTarget) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick?.(event, e.currentTarget) } }}
    >
      {position === 'last' && !event.isAllDay && (
        <div className="ml-auto hidden lg:block">
          <span>{format(new Date(event.startDate), timeFormat, { locale })}</span>
        </div>
      )}

      {position !== 'last' && position !== 'middle' && (
        <>
          {renderBadgeText && (
            <p className="flex-1 overflow-hidden whitespace-nowrap font-semibold">
              {event.title}
            </p>
          )}

          {renderBadgeText && !isMultiDay && !event.isAllDay && (
            <span className="hidden lg:inline">{format(new Date(event.startDate), timeFormat, { locale })}</span>
          )}
        </>
      )}
    </div>
  )
}

const MonthViewContent = ({ singleDayEvents, multiDayEvents, onEventClick, onDayClick, mobileHeaderBorder = true }: IProps) => {
  const { i18n } = useTranslation()
  const { selectedDate } = useCalendar()
  const { endSelection } = useDragSelect()

  const weekDays = i18n.language.startsWith('ko') ? WEEK_DAYS_KO : WEEK_DAYS_EN

  // expense 이벤트를 일반 이벤트와 분리 (expense는 이벤트 슬롯을 차지하지 않음)
  const regularSingleDayEvents = useMemo(
    () => singleDayEvents.filter(e => e.sourceType !== 'expense'),
    [singleDayEvents]
  )
  const regularMultiDayEvents = useMemo(
    () => multiDayEvents.filter(e => e.sourceType !== 'expense'),
    [multiDayEvents]
  )
  const expenseEvents = useMemo(
    () => [...singleDayEvents, ...multiDayEvents].filter(e => e.sourceType === 'expense'),
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

  // 공휴일 날짜 셋
  const holidayDateSet = useMemo(() => {
    const set = new Set<string>()
    for (const e of [...singleDayEvents, ...multiDayEvents]) {
      if (e.sourceType === 'holiday') {
        set.add(startOfDay(parseISO(e.startDate)).toISOString())
      }
    }
    return set
  }, [singleDayEvents, multiDayEvents])

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate])

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(regularMultiDayEvents, regularSingleDayEvents, selectedDate),
    [regularMultiDayEvents, regularSingleDayEvents, selectedDate]
  )

  // 그리드 래퍼 높이 기반 동적 이벤트 표시 개수 계산
  const gridWrapperRef = useRef<HTMLDivElement>(null)
  const [maxVisibleEvents, setMaxVisibleEvents] = useState(MOBILE_MAX_EVENTS)

  useEffect(() => {
    const el = gridWrapperRef.current
    if (!el) return

    const calculate = () => {
      const wrapperHeight = el.clientHeight
      const numRows = Math.ceil(cells.length / 7)
      const rowHeight = wrapperHeight / numRows
      // 셀 내부: 헤더(날짜번호) 24px + padding(top 4 + bottom 8) + cell gap 4px = 40px
      const availableForEvents = rowHeight - 40
      // 이벤트 배지 26px(h-6.5) + gap 4px(gap-1) = 30px per slot
      const count = Math.max(0, Math.floor((availableForEvents + 4) / 30))
      setMaxVisibleEvents(count)
    }

    const observer = new ResizeObserver(calculate)
    observer.observe(el)
    return () => observer.disconnect()
  }, [cells.length])

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
      <div className={cn('grid grid-cols-7 flex-shrink-0', mobileHeaderBorder && 'border-b lg:border-b-0')}>
        {weekDays.map((day, index) => {
          const isSunday = index === 0
          const isSaturday = index === 6

          return (
            <div key={day} className="flex items-center justify-center py-2">
              <span
                className="text-xs font-medium"
                style={{ color: isSunday ? 'var(--fg-expense)' : isSaturday ? 'var(--fg-brand)' : undefined }}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-hidden" ref={gridWrapperRef}>
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
                holidayDateSet={holidayDateSet}
                maxVisibleEvents={maxVisibleEvents}
                onEventClick={onEventClick}
                onDayClick={onDayClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const CalendarMonthView = ({ singleDayEvents, multiDayEvents, onEventClick, onDayClick, mobileHeaderBorder = true }: IProps) => {
  return (
    <DragSelectProvider>
      <MonthViewContent
        singleDayEvents={singleDayEvents}
        multiDayEvents={multiDayEvents}
        onEventClick={onEventClick}
        onDayClick={onDayClick}
        mobileHeaderBorder={mobileHeaderBorder}
      />
    </DragSelectProvider>
  )
}

export { CalendarMonthView }
