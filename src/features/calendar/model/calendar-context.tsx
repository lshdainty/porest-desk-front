import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
  TCalendarView,
  TBadgeVariant,
  TWorkingHours,
  TVisibleHours,
  TCalendarSourceType,
  IBuiltinSource,
} from './types'
import type { IEvent } from './interfaces'
import { BUILTIN_SOURCES } from './types'
import { useUserCalendars, useToggleCalendarVisibility } from '@/features/user-calendar'
import type { UserCalendar } from '@/entities/user-calendar'

interface CalendarContextValue {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  view: TCalendarView
  setView: (view: TCalendarView) => void
  badgeVariant: TBadgeVariant
  setBadgeVariant: (variant: TBadgeVariant) => void
  workingHours: TWorkingHours
  setWorkingHours: (hours: TWorkingHours) => void
  visibleHours: TVisibleHours
  setVisibleHours: (hours: TVisibleHours) => void
  events: IEvent[]
  setLocalEvents: (events: IEvent[]) => void
  builtinSources: IBuiltinSource[]
  toggleBuiltinSource: (sourceId: TCalendarSourceType) => void
  isBuiltinSourceEnabled: (sourceId: TCalendarSourceType) => boolean
  userCalendars: UserCalendar[]
  isCalendarVisible: (calendarRowId: number) => boolean
  toggleCalendarVisibility: (calendarRowId: number) => void
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

interface CalendarProviderProps {
  children: ReactNode
  events: IEvent[]
  initialView?: TCalendarView
  initialDate?: Date
}

export const CalendarProvider = ({
  children,
  events: externalEvents,
  initialView = 'month',
  initialDate,
}: CalendarProviderProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ?? new Date())
  const [view, setView] = useState<TCalendarView>(initialView)
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>('dot')
  const [workingHours, setWorkingHours] = useState<TWorkingHours>({
    start: 9,
    end: 18,
  })
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>({
    start: 0,
    end: 24,
  })
  const [localEvents, setLocalEvents] = useState<IEvent[]>([])
  const [builtinSources, setBuiltinSources] = useState<IBuiltinSource[]>(
    BUILTIN_SOURCES,
  )

  // Fetch user calendars
  const { data: userCalendarsData } = useUserCalendars()
  const userCalendars = useMemo(() => userCalendarsData ?? [], [userCalendarsData])

  const toggleVisibilityMutation = useToggleCalendarVisibility()

  const events = useMemo(() => {
    return localEvents.length > 0 ? localEvents : externalEvents
  }, [localEvents, externalEvents])

  const handleSetLocalEvents = useCallback((newEvents: IEvent[]) => {
    setLocalEvents(newEvents)
  }, [])

  const toggleBuiltinSource = useCallback((sourceId: TCalendarSourceType) => {
    setBuiltinSources((prev) =>
      prev.map((source) =>
        source.id === sourceId
          ? { ...source, enabled: !source.enabled }
          : source,
      ),
    )
  }, [])

  const isBuiltinSourceEnabled = useCallback(
    (sourceId: TCalendarSourceType) => {
      return builtinSources.find((s) => s.id === sourceId)?.enabled ?? false
    },
    [builtinSources],
  )

  const isCalendarVisible = useCallback(
    (calendarRowId: number) => {
      const cal = userCalendars.find((c) => c.rowId === calendarRowId)
      return cal?.isVisible ?? true
    },
    [userCalendars],
  )

  const handleToggleCalendarVisibility = useCallback(
    (calendarRowId: number) => {
      toggleVisibilityMutation.mutate(calendarRowId)
    },
    [toggleVisibilityMutation],
  )

  const value = useMemo<CalendarContextValue>(
    () => ({
      selectedDate,
      setSelectedDate,
      view,
      setView,
      badgeVariant,
      setBadgeVariant,
      workingHours,
      setWorkingHours,
      visibleHours,
      setVisibleHours,
      events,
      setLocalEvents: handleSetLocalEvents,
      builtinSources,
      toggleBuiltinSource,
      isBuiltinSourceEnabled,
      userCalendars,
      isCalendarVisible,
      toggleCalendarVisibility: handleToggleCalendarVisibility,
    }),
    [
      selectedDate,
      view,
      badgeVariant,
      workingHours,
      visibleHours,
      events,
      handleSetLocalEvents,
      builtinSources,
      toggleBuiltinSource,
      isBuiltinSourceEnabled,
      userCalendars,
      isCalendarVisible,
      handleToggleCalendarVisibility,
    ],
  )

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendarContext = (): CalendarContextValue => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider')
  }
  return context
}

export const useCalendar = useCalendarContext
