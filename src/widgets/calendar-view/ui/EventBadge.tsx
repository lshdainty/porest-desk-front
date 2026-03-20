import { Briefcase, User, Cake, Flag } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { CalendarEventType } from '@/entities/calendar'

interface EventBadgeProps {
  title: string
  color: string
  eventType: CalendarEventType
  compact?: boolean
}

const eventTypeIcons: Record<CalendarEventType, React.ReactNode> = {
  PERSONAL: <User size={10} />,
  WORK: <Briefcase size={10} />,
  BIRTHDAY: <Cake size={10} />,
  HOLIDAY: <Flag size={10} />,
}

export const EventBadge = ({ title, color, eventType, compact }: EventBadgeProps) => {
  if (compact) {
    return (
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate'
      )}
      style={{ backgroundColor: color }}
    >
      {eventTypeIcons[eventType]}
      <span className="truncate">{title}</span>
    </div>
  )
}
