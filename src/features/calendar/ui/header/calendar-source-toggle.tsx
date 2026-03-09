import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, ListTodo, Flag, Plus, Settings } from 'lucide-react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib'

import type { IBuiltinSource, TCalendarSourceType } from '@/features/calendar/model/types'
import type { UserCalendar } from '@/entities/user-calendar'
import { CalendarManagementDialog } from './CalendarManagementDialog'
import { HolidayManagementDialog } from './HolidayManagementDialog'

const SOURCE_ICONS: Record<TCalendarSourceType, React.ElementType> = {
  holiday: Flag,
  expense: Receipt,
  todo: ListTodo,
}

const CheckboxIndicator = ({
  checked,
  color,
}: {
  checked: boolean
  color: string
}) => (
  <span
    className={cn(
      'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
    )}
    style={{
      borderColor: color,
      backgroundColor: checked ? color : 'transparent',
    }}
  >
    {checked && (
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
)

const UserCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { toggleCalendarVisibility } = useCalendar()

  return (
    <button
      type="button"
      onClick={() => toggleCalendarVisibility(calendar.rowId)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        !calendar.isVisible && 'opacity-50',
      )}
    >
      <CheckboxIndicator checked={calendar.isVisible} color={calendar.color} />
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: calendar.color }}
      />
      <span className="truncate">{calendar.calendarName}</span>
    </button>
  )
}

const BuiltinSourceItem = ({ source, onSettings }: { source: IBuiltinSource; onSettings?: () => void }) => {
  const { t } = useTranslation('calendar')
  const { toggleBuiltinSource } = useCalendar()

  const Icon = SOURCE_ICONS[source.id]

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => toggleBuiltinSource(source.id)}
        className={cn(
          'flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !source.enabled && 'opacity-50',
        )}
      >
        <CheckboxIndicator checked={source.enabled} color={source.color} />
        <Icon className="size-4 shrink-0" style={{ color: source.enabled ? source.color : undefined }} />
        <span className="truncate">
          {t(`source.${source.id}`)}
        </span>
      </button>
      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings size={14} />
        </button>
      )}
    </div>
  )
}

const CalendarSourceToggle = () => {
  const { t } = useTranslation('calendar')
  const { builtinSources, userCalendars } = useCalendar()
  const [managementOpen, setManagementOpen] = useState(false)
  const [holidayManagementOpen, setHolidayManagementOpen] = useState(false)

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            {t('title')}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          {/* Section 1: User Calendars */}
          <div className="p-3 pb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('title')}
              </span>
              <button
                type="button"
                onClick={() => setManagementOpen(true)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title={t('manage')}
              >
                <Settings size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {userCalendars.map((calendar) => (
                <UserCalendarItem key={calendar.rowId} calendar={calendar} />
              ))}
              {userCalendars.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">-</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setManagementOpen(true)}
              className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus size={14} />
              {t('add')}
            </button>
          </div>

          <Separator />

          {/* Section 2: Builtin Sources */}
          <div className="p-3 pt-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('otherSources')}
            </span>
            <div className="space-y-0.5">
              {builtinSources.map((source) => (
                <BuiltinSourceItem
                  key={source.id}
                  source={source}
                  onSettings={source.id === 'holiday' ? () => setHolidayManagementOpen(true) : undefined}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CalendarManagementDialog
        open={managementOpen}
        onOpenChange={setManagementOpen}
      />

      <HolidayManagementDialog
        open={holidayManagementOpen}
        onOpenChange={setHolidayManagementOpen}
      />
    </>
  )
}

export { CalendarSourceToggle }
