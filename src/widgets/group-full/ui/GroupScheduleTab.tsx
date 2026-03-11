import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import { useGroupEvents } from '@/features/group'

interface GroupScheduleTabProps {
  groupId: number
}

export const GroupScheduleTab = ({ groupId }: GroupScheduleTabProps) => {
  const { t } = useTranslation('group')

  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }, [])

  const { data, isLoading } = useGroupEvents(groupId, startDate, endDate)
  const events = data?.data?.events ?? data?.events ?? []

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t('noGroupEvents')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event: any) => (
        <div
          key={event.rowId}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{event.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(event.startDate).toLocaleDateString()}
              {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString()}`}
            </span>
          </div>
          {event.color && (
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: event.color }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
