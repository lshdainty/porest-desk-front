import { isSameDay, parseISO } from 'date-fns'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useDeleteEvent, useUpdateEvent } from '@/features/calendar/model/useCalendarEvents'
import { useEventLabels } from '@/features/event-label'

import { DndProviderWrapper } from '@/features/calendar/ui/dnd/dnd-provider'
import { EventDetailPopover } from '@/features/calendar/ui/EventDetailPopover'

import { CalendarAgendaView } from '@/features/calendar/ui/agenda-view/calendar-agenda-view'
import { CalendarAgendaViewSkeleton } from '@/features/calendar/ui/agenda-view/calendar-agenda-view-skeleton'
import { CalendarHeader } from '@/features/calendar/ui/header/calendar-header'
import { CalendarMonthView } from '@/features/calendar/ui/month-view/calendar-month-view'
import { CalendarMonthViewSkeleton } from '@/features/calendar/ui/month-view/calendar-month-view-skeleton'
import { CalendarDayView } from '@/features/calendar/ui/week-and-day-view/calendar-day-view'
import { CalendarDayViewSkeleton } from '@/features/calendar/ui/week-and-day-view/calendar-day-view-skeleton'
import { CalendarWeekView } from '@/features/calendar/ui/week-and-day-view/calendar-week-view'
import { CalendarWeekViewSkeleton } from '@/features/calendar/ui/week-and-day-view/calendar-week-view-skeleton'
import { CalendarYearView } from '@/features/calendar/ui/year-view/calendar-year-view'
import { CalendarYearViewSkeleton } from '@/features/calendar/ui/year-view/calendar-year-view-skeleton'

import { EventForm } from '@/widgets/calendar-view/ui/EventForm'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'
import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  events: IEvent[]
  isLoading?: boolean
}

function iEventToCalendarEvent(event: IEvent): CalendarEvent {
  return {
    rowId: event.id,
    title: event.title,
    description: event.description || null,
    eventType: 'PERSONAL',
    color: event.color,
    startDate: event.startDate,
    endDate: event.endDate,
    isAllDay: event.isAllDay,
    labelRowId: event.labelRowId,
    labelName: event.labelName,
    labelColor: event.labelColor,
    location: event.location,
    rrule: event.rrule,
    recurrenceId: event.recurrenceId,
    isException: false,
    reminders: event.reminders,
    calendarRowId: event.calendarRowId,
    calendarName: event.calendarName,
    calendarColor: event.calendarColor,
    createAt: '',
    modifyAt: '',
  }
}

const CalendarContainer = ({ events, isLoading = false }: IProps) => {
  const { t } = useTranslation('calendar')
  const { selectedDate, view, isBuiltinSourceEnabled, isCalendarVisible } = useCalendar()
  // Event detail popover state
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  // Edit/Delete state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null)

  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const { data: labels = [] } = useEventLabels()

  const handleEventClick = useCallback((event: IEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    if (anchorRef.current) {
      anchorRef.current.style.top = `${rect.top}px`
      anchorRef.current.style.left = `${rect.left}px`
      anchorRef.current.style.width = `${rect.width}px`
      anchorRef.current.style.height = `${rect.height}px`
    }
    setSelectedEvent(event)
  }, [])

  const handleClosePopover = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  const handleEditEvent = useCallback(() => {
    if (!selectedEvent) return
    setEditingEvent(iEventToCalendarEvent(selectedEvent))
    setSelectedEvent(null)
  }, [selectedEvent])

  const handleDeleteEvent = useCallback(() => {
    if (!selectedEvent) return
    setDeletingEventId(selectedEvent.id)
    setSelectedEvent(null)
  }, [selectedEvent])

  const handleSubmitEdit = useCallback((data: CalendarEventFormValues) => {
    if (!editingEvent) return
    updateEvent.mutate({ id: editingEvent.rowId, data }, {
      onSuccess: () => setEditingEvent(null),
    })
  }, [editingEvent, updateEvent])

  const handleConfirmDelete = useCallback(() => {
    if (deletingEventId === null) return
    deleteEvent.mutate(deletingEventId, {
      onSuccess: () => setDeletingEventId(null),
    })
  }, [deletingEventId, deleteEvent])

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventStartDate = parseISO(event.startDate)
      const eventEndDate = parseISO(event.endDate)

      // Source filtering
      if (event.sourceType === 'expense' && !isBuiltinSourceEnabled('expense')) return false
      if (event.sourceType === 'todo' && !isBuiltinSourceEnabled('todo')) return false
      if (event.sourceType === 'calendar' && event.calendarRowId && !isCalendarVisible(event.calendarRowId)) return false

      if (view === 'year') {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1)
        const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        const isInSelectedYear = eventStartDate <= yearEnd && eventEndDate >= yearStart
        return isInSelectedYear
      }

      if (view === 'month' || view === 'agenda') {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
        const isInSelectedMonth = eventStartDate <= monthEnd && eventEndDate >= monthStart
        return isInSelectedMonth
      }

      if (view === 'week') {
        const dayOfWeek = selectedDate.getDay()

        const weekStart = new Date(selectedDate)
        weekStart.setDate(selectedDate.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const isInSelectedWeek = eventStartDate <= weekEnd && eventEndDate >= weekStart
        return isInSelectedWeek
      }

      if (view === 'day') {
        const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0)
        const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59)
        const isInSelectedDay = eventStartDate <= dayEnd && eventEndDate >= dayStart
        return isInSelectedDay
      }

      return true
    })
  }, [selectedDate, events, view, isBuiltinSourceEnabled, isCalendarVisible])

  const singleDayEvents = filteredEvents.filter(event => {
    if (event.isAllDay) return false
    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return isSameDay(startDate, endDate)
  })

  const multiDayEvents = filteredEvents.filter(event => {
    if (event.isAllDay) return true
    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return !isSameDay(startDate, endDate)
  })

  const eventStartDates = useMemo(() => {
    return filteredEvents.map(event => ({ ...event, endDate: event.startDate }))
  }, [filteredEvents])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <CalendarHeader events={filteredEvents} />

      <div className="flex-1 overflow-hidden">
        <DndProviderWrapper>
          {view === 'day' && (
            isLoading
              ? <CalendarDayViewSkeleton />
              : <CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={handleEventClick} />
          )}
          {view === 'month' && (
            isLoading
              ? <CalendarMonthViewSkeleton />
              : <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={handleEventClick} />
          )}
          {view === 'week' && (
            isLoading
              ? <CalendarWeekViewSkeleton />
              : <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={handleEventClick} />
          )}
          {view === 'year' && (
            isLoading
              ? <CalendarYearViewSkeleton />
              : <CalendarYearView allEvents={eventStartDates} />
          )}
          {view === 'agenda' && (
            isLoading
              ? <CalendarAgendaViewSkeleton />
              : <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={handleEventClick} />
          )}
        </DndProviderWrapper>
      </div>

      {/* Event Detail Popover */}
      <Popover open={!!selectedEvent} onOpenChange={(open) => { if (!open) handleClosePopover() }}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }} />
        </PopoverAnchor>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-h-[80vh] overflow-y-auto" sideOffset={8} collisionPadding={16}>
          {selectedEvent && (
            <EventDetailPopover
              event={selectedEvent}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          )}
        </PopoverContent>
      </Popover>

      {/* Edit Event Form */}
      {editingEvent && (
        <EventForm
          event={editingEvent}
          labels={labels}
          onSubmit={handleSubmitEdit}
          onClose={() => setEditingEvent(null)}
          isLoading={updateEvent.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deletingEventId !== null} onOpenChange={(open) => { if (!open) setDeletingEventId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { CalendarContainer }
