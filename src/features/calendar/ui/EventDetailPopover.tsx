import { format, parseISO } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { Bell, Calendar, Clock, MapPin, Pencil, Repeat, Tag, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface EventDetailPopoverProps {
  event: IEvent
  onEdit: () => void
  onDelete: () => void
}

function getRruleText(rrule: string, t: (key: string) => string): string {
  if (rrule.includes('FREQ=DAILY')) return t('recurrence.daily')
  if (rrule.includes('FREQ=WEEKLY')) return t('recurrence.weekly')
  if (rrule.includes('FREQ=MONTHLY')) return t('recurrence.monthly')
  if (rrule.includes('FREQ=YEARLY')) return t('recurrence.yearly')
  return rrule
}

function getReminderText(minutes: number, t: (key: string) => string): string {
  if (minutes === 5) return t('reminder.5min')
  if (minutes === 15) return t('reminder.15min')
  if (minutes === 30) return t('reminder.30min')
  if (minutes === 60) return t('reminder.1hour')
  if (minutes === 1440) return t('reminder.1day')
  return `${minutes}min`
}

const EventDetailPopover = ({ event, onEdit, onDelete }: EventDetailPopoverProps) => {
  const { t, i18n } = useTranslation('calendar')
  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const timeFormat = i18n.language.startsWith('ko') ? 'a h:mm' : 'h:mm a'
  const dateFormat = i18n.language.startsWith('ko') ? 'yyyy년 M월 d일 (EE)' : 'EEE, MMM d, yyyy'

  const startDate = parseISO(event.startDate)
  const endDate = parseISO(event.endDate)

  const isCalendarSource = event.sourceType === 'calendar'

  return (
    <div className="flex flex-col gap-3">
      {/* Title */}
      <div className="flex items-start gap-2">
        <svg width="10" height="10" viewBox="0 0 10 10" className="mt-1 shrink-0">
          <circle cx="5" cy="5" r="5" fill={event.color} />
        </svg>
        <h3 className="text-sm font-semibold leading-snug break-words">{event.title}</h3>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        <div>
          {event.isAllDay ? (
            <span>{t('allDay')} &middot; {format(startDate, dateFormat, { locale })}</span>
          ) : (
            <span>
              {format(startDate, dateFormat, { locale })}
              {' '}
              {format(startDate, timeFormat, { locale })} - {format(endDate, timeFormat, { locale })}
            </span>
          )}
        </div>
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span>{event.location}</span>
        </div>
      )}

      {/* Calendar */}
      {event.calendarName && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <div className="flex items-center gap-1.5">
            {event.calendarColor && (
              <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
                <circle cx="4" cy="4" r="4" fill={event.calendarColor} />
              </svg>
            )}
            <span>{event.calendarName}</span>
          </div>
        </div>
      )}

      {/* Group */}
      {event.groupRowId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          <span className="rounded-full border px-2 py-0.5">{event.groupName}</span>
        </div>
      )}

      {/* Label */}
      {event.labelName && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Tag className="size-3.5 shrink-0" />
          <div className="flex items-center gap-1.5">
            {event.labelColor && (
              <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
                <circle cx="4" cy="4" r="4" fill={event.labelColor} />
              </svg>
            )}
            <span>{event.labelName}</span>
          </div>
        </div>
      )}

      {/* Recurrence */}
      {event.rrule && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Repeat className="size-3.5 shrink-0" />
          <span>{getRruleText(event.rrule, t)}</span>
        </div>
      )}

      {/* Reminders */}
      {event.reminders.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="size-3.5 shrink-0" />
          <span>{event.reminders.map(r => getReminderText(r.minutesBefore, t)).join(', ')}</span>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words line-clamp-4">
            {event.description}
          </p>
        </>
      )}

      {/* Actions - only for calendar events */}
      {isCalendarSource && (
        <>
          <Separator />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1 size-3.5" />
              {t('editEvent')}
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1 size-3.5" />
              {t('deleteEvent')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export { EventDetailPopover }
