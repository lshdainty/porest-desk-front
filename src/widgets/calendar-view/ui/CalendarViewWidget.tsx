import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Loader2, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { cn, getLocale } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useCalendarEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/features/calendar'
import { useEventLabels } from '@/features/event-label'
import { useTodos, useToggleTodoStatus } from '@/features/todo'
import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'
import { useCalendarNavigation } from '../model/useCalendarNavigation'
import type { CalendarViewMode } from '../model/useCalendarNavigation'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { IntegratedEventList } from './IntegratedEventList'
import { EventForm } from './EventForm'
import { LabelManagementDialog } from './LabelManagementDialog'

export const CalendarViewWidget = () => {
  const { t } = useTranslation('calendar')
  const isMobile = useIsMobile()
  const locale = getLocale()

  const {
    currentDate,
    viewMode,
    selectedDate,
    dateRange,
    setViewMode,
    setSelectedDate,
    navigateForward,
    navigateBackward,
    goToToday,
  } = useCalendarNavigation()

  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showLabelDialog, setShowLabelDialog] = useState(false)

  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(
    dateRange.startDate,
    dateRange.endDate
  )

  const { data: labels = [] } = useEventLabels()

  const { data: todos = [] } = useTodos({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const toggleTodoStatus = useToggleTodoStatus()

  const handleCreateEvent = useCallback((data: CalendarEventFormValues) => {
    createEvent.mutate(data, {
      onSuccess: () => {
        setShowEventForm(false)
      },
    })
  }, [createEvent])

  const handleUpdateEvent = useCallback((data: CalendarEventFormValues) => {
    if (!editingEvent) return
    updateEvent.mutate(
      { id: editingEvent.rowId, data },
      {
        onSuccess: () => {
          setEditingEvent(null)
          setShowEventForm(false)
        },
      }
    )
  }, [editingEvent, updateEvent])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setShowEventForm(false)
    setEditingEvent(null)
  }, [])

  const handleFormSubmit = useCallback((data: CalendarEventFormValues) => {
    if (editingEvent) {
      handleUpdateEvent(data)
    } else {
      handleCreateEvent(data)
    }
  }, [editingEvent, handleUpdateEvent, handleCreateEvent])

  const handleTodoToggle = useCallback((id: number) => {
    toggleTodoStatus.mutate(id)
  }, [toggleTodoStatus])

  const handleDeleteEvent = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteEvent.mutate(showDeleteConfirm, {
      onSuccess: () => {
        setShowDeleteConfirm(null)
      },
    })
  }, [showDeleteConfirm, deleteEvent])

  const headerTitle = viewMode === 'month'
    ? format(currentDate, 'yyyy MMMM', { locale })
    : format(currentDate, 'yyyy MMMM', { locale })

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateBackward}>
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-base font-semibold md:text-lg">{headerTitle}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateForward}>
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEventForm(true)}
            >
              <Plus size={14} className="mr-1" />
              {t('addEvent')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setShowLabelDialog(true)}
            title={t('labels')}
          >
            <Tag size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={goToToday}
          >
            {t('today')}
          </Button>
          <div className="flex rounded-md border">
            {(['month', 'week'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                  mode === 'month' && 'rounded-l-md',
                  mode === 'week' && 'rounded-r-md'
                )}
              >
                {t(`view.${mode}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {eventsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={events}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={events}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Integrated event list for selected date */}
      <div className="border-t pt-4">
        <IntegratedEventList
          selectedDate={selectedDate}
          events={events}
          todos={todos}
          expenses={[]}
          onEventClick={handleEventClick}
          onTodoToggle={handleTodoToggle}
        />
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={() => setShowEventForm(true)}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
            'rounded-full bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Event form */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedDate}
          labels={labels}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createEvent.isPending || updateEvent.isPending}
        />
      )}

      {/* Label management dialog */}
      <LabelManagementDialog
        open={showLabelDialog}
        onClose={() => setShowLabelDialog(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} loading={deleteEvent.isPending}>
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
