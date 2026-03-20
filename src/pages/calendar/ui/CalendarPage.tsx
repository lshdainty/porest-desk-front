import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseISO, isValid } from 'date-fns'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import type { TCalendarView } from '@/features/calendar/model/types'

const VALID_VIEWS: TCalendarView[] = ['day', 'week', 'month', 'year', 'agenda']

export const CalendarPage = () => {
  const [searchParams] = useSearchParams()

  const { initialDate, initialView } = useMemo(() => {
    const dateParam = searchParams.get('date')
    const viewParam = searchParams.get('view') as TCalendarView | null

    let date: Date | undefined
    if (dateParam) {
      const parsed = parseISO(dateParam)
      if (isValid(parsed)) date = parsed
    }

    const view = viewParam && VALID_VIEWS.includes(viewParam) ? viewParam : undefined

    return { initialDate: date, initialView: view }
  }, [searchParams])

  return (
    <div className="h-full">
      <CalendarProvider events={[]} initialDate={initialDate} initialView={initialView}>
        <CalendarContent />
      </CalendarProvider>
    </div>
  )
}
