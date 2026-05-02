import { useOutletContext } from 'react-router-dom'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

export const CalendarPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()

  return (
    <div
      style={{
        height: mobile ? 'calc(100dvh - 132px)' : 'calc(100dvh - 56px)',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <CalendarProvider events={[]} initialView={mobile ? 'agenda' : 'month'}>
        <CalendarContent />
      </CalendarProvider>
    </div>
  )
}
