import { createContext, useCallback, useContext, useState } from 'react'
import { isBefore, startOfDay, isAfter, isSameDay, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Wallet } from 'lucide-react'

import { useCreateEvent } from '@/features/calendar/model/useCalendarEvents'
import { useEventLabels } from '@/features/event-label'
import { useCreateExpense, useExpenseCategories } from '@/features/expense'
import { useAssets } from '@/features/asset'
import { EventForm } from '@/widgets/calendar-view/ui/EventForm'
import { ExpenseForm } from '@/widgets/expense-full/ui/ExpenseForm'
import type { CalendarEventFormValues } from '@/entities/calendar'
import type { ExpenseFormValues } from '@/entities/expense'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/ui/dialog'

type SelectionMode = 'choose' | 'event' | 'expense'

interface DragSelectContextType {
  isDragSelecting: boolean
  selectionStart: Date | null
  selectionEnd: Date | null
  startSelection: (date: Date) => void
  updateSelection: (date: Date) => void
  endSelection: () => void
  isDateInSelection: (date: Date) => boolean
}

const DragSelectContext = createContext<DragSelectContextType | null>(null)

export const useDragSelect = () => {
  const context = useContext(DragSelectContext)
  if (!context) {
    throw new Error('useDragSelect must be used within a DragSelectProvider')
  }
  return context
}

export const DragSelectProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation('calendar')
  const [isDragSelecting, setIsDragSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null)

  const [selectionMode, setSelectionMode] = useState<SelectionMode | null>(null)
  const [dialogDateRange, setDialogDateRange] = useState<{ start: Date; end: Date } | null>(null)

  // Event (schedule) dependencies
  const createEvent = useCreateEvent()
  const { data: labels = [] } = useEventLabels()

  // Expense (transaction) dependencies
  const createExpense = useCreateExpense()
  const { data: categories = [] } = useExpenseCategories()
  const { data: assets = [] } = useAssets()

  const startSelection = useCallback((date: Date) => {
    setIsDragSelecting(true)
    setSelectionStart(date)
    setSelectionEnd(date)
  }, [])

  const updateSelection = useCallback((date: Date) => {
    if (isDragSelecting) {
      setSelectionEnd(date)
    }
  }, [isDragSelecting])

  const endSelection = useCallback(() => {
    if (isDragSelecting && selectionStart && selectionEnd) {
      setIsDragSelecting(false)

      // Calculate actual start and end (handle reverse drag)
      const start = isBefore(selectionStart, selectionEnd) || isSameDay(selectionStart, selectionEnd)
        ? selectionStart
        : selectionEnd
      const end = isBefore(selectionStart, selectionEnd) || isSameDay(selectionStart, selectionEnd)
        ? selectionEnd
        : selectionStart

      // Open selection menu instead of directly opening EventForm
      setDialogDateRange({ start, end })
      setSelectionMode('choose')

      // Reset selection visual state
      setSelectionStart(null)
      setSelectionEnd(null)
    } else {
      setIsDragSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }, [isDragSelecting, selectionStart, selectionEnd])

  const isDateInSelection = useCallback((date: Date) => {
    if (!selectionStart || !selectionEnd) return false

    const cellDate = startOfDay(date)
    const start = isBefore(selectionStart, selectionEnd) || isSameDay(selectionStart, selectionEnd)
      ? startOfDay(selectionStart)
      : startOfDay(selectionEnd)
    const end = isBefore(selectionStart, selectionEnd) || isSameDay(selectionStart, selectionEnd)
      ? startOfDay(selectionEnd)
      : startOfDay(selectionStart)

    return (isSameDay(cellDate, start) || isAfter(cellDate, start)) &&
           (isSameDay(cellDate, end) || isBefore(cellDate, end))
  }, [selectionStart, selectionEnd])

  const handleCreateEvent = useCallback((data: CalendarEventFormValues) => {
    createEvent.mutate(data, {
      onSuccess: () => {
        setSelectionMode(null)
        setDialogDateRange(null)
      },
    })
  }, [createEvent])

  const handleCreateExpense = useCallback((data: ExpenseFormValues) => {
    createExpense.mutate(data, {
      onSuccess: () => {
        setSelectionMode(null)
        setDialogDateRange(null)
      },
    })
  }, [createExpense])

  const handleClose = useCallback(() => {
    setSelectionMode(null)
    setDialogDateRange(null)
  }, [])

  const handleChooseEvent = useCallback(() => {
    setSelectionMode('event')
  }, [])

  const handleChooseExpense = useCallback(() => {
    setSelectionMode('expense')
  }, [])

  return (
    <DragSelectContext.Provider
      value={{
        isDragSelecting,
        selectionStart,
        selectionEnd,
        startSelection,
        updateSelection,
        endSelection,
        isDateInSelection,
      }}
    >
      {children}

      {/* Quick Add Selection Menu */}
      {selectionMode === 'choose' && dialogDateRange && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) handleClose() }}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>{t('quickAdd.title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <button
                onClick={handleChooseEvent}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <CalendarDays size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t('quickAdd.addSchedule')}</div>
                  <div className="text-xs text-muted-foreground">{t('quickAdd.scheduleDesc')}</div>
                </div>
              </button>
              <button
                onClick={handleChooseExpense}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Wallet size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t('quickAdd.addTransaction')}</div>
                  <div className="text-xs text-muted-foreground">{t('quickAdd.transactionDesc')}</div>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Event Form Dialog */}
      {selectionMode === 'event' && dialogDateRange && (
        <EventForm
          selectedDate={dialogDateRange.start}
          selectedEndDate={dialogDateRange.end}
          labels={labels}
          onSubmit={handleCreateEvent}
          onClose={handleClose}
          isLoading={createEvent.isPending}
        />
      )}

      {/* Expense Form Dialog */}
      {selectionMode === 'expense' && dialogDateRange && (
        <ExpenseForm
          categories={categories}
          assets={assets}
          defaultDate={format(dialogDateRange.start, 'yyyy-MM-dd')}
          onSubmit={handleCreateExpense}
          onClose={handleClose}
          isLoading={createExpense.isPending}
        />
      )}
    </DragSelectContext.Provider>
  )
}
