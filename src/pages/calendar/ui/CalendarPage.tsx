import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'

export const CalendarPage = () => {
  return (
    <div className="h-full">
      <CalendarProvider events={[]}>
        <CalendarContent />
      </CalendarProvider>
    </div>
  )
}
