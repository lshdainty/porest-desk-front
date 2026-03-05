import { useTranslation } from 'react-i18next'
import { CalendarDays, Receipt, ListTodo } from 'lucide-react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { cn } from '@/shared/lib'

import type { ICalendarSource, TCalendarSourceType } from '@/features/calendar/model/types'

const SOURCE_ICONS: Record<TCalendarSourceType, React.ElementType> = {
  schedule: CalendarDays,
  expense: Receipt,
  todo: ListTodo,
}

const CalendarSourceItem = ({ source }: { source: ICalendarSource }) => {
  const { t } = useTranslation('calendar')
  const { toggleCalendarSource } = useCalendar()

  const Icon = SOURCE_ICONS[source.id]

  return (
    <button
      type="button"
      onClick={() => toggleCalendarSource(source.id)}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        !source.enabled && 'opacity-50',
      )}
    >
      {/* 색상 인디케이터 (체크박스 역할) */}
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
        )}
        style={{
          borderColor: source.color,
          backgroundColor: source.enabled ? source.color : 'transparent',
        }}
      >
        {source.enabled && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="text-white"
          >
            <path
              d="M8.5 2.5L3.5 7.5L1.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* 아이콘 */}
      <Icon className="size-4 shrink-0" style={{ color: source.enabled ? source.color : undefined }} />

      {/* 라벨 */}
      <span className="truncate">
        {t(`source.${source.id}`)}
      </span>
    </button>
  )
}

const CalendarSourceToggle = () => {
  const { calendarSources } = useCalendar()

  return (
    <div className="flex items-center gap-1">
      {calendarSources.map((source) => (
        <CalendarSourceItem key={source.id} source={source} />
      ))}
    </div>
  )
}

export { CalendarSourceToggle }
