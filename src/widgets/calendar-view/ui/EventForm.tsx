import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MapPin, Repeat, Bell, Tag, ChevronDown, Check, Users } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'
import type { EventLabel } from '@/entities/event-label'
import type { UserCalendar } from '@/entities/user-calendar'
import { useUserCalendars } from '@/features/user-calendar'
import { useGroups } from '@/features/group'
import { format } from 'date-fns'

interface EventFormProps {
  event?: CalendarEvent | null
  selectedDate?: Date
  selectedEndDate?: Date
  labels?: EventLabel[]
  onSubmit: (data: CalendarEventFormValues) => void
  onClose: () => void
  isLoading?: boolean
}

const colorOptions = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

type RecurrenceOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

const recurrenceToRrule: Record<RecurrenceOption, string | undefined> = {
  none: undefined,
  daily: 'FREQ=DAILY',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
  yearly: 'FREQ=YEARLY',
}

const rruleToRecurrence = (rrule: string | null | undefined): RecurrenceOption => {
  if (!rrule) return 'none'
  if (rrule.includes('FREQ=DAILY')) return 'daily'
  if (rrule.includes('FREQ=WEEKLY')) return 'weekly'
  if (rrule.includes('FREQ=MONTHLY')) return 'monthly'
  if (rrule.includes('FREQ=YEARLY')) return 'yearly'
  return 'none'
}

const reminderOptions = [5, 15, 30, 60, 1440] // minutes

export const EventForm = ({
  event,
  selectedDate,
  selectedEndDate,
  labels = [],
  onSubmit,
  onClose,
  isLoading,
}: EventFormProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const { data: userCalendars = [] } = useUserCalendars()
  const { data: groups = [] } = useGroups()
  const isMobile = useIsMobile()

  const defaultDate = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')

  const defaultEndDate = selectedEndDate
    ? format(selectedEndDate, 'yyyy-MM-dd')
    : defaultDate

  const defaultCalendar = userCalendars.find((c) => c.isDefault) ?? userCalendars[0]

  const [recurrence, setRecurrence] = useState<RecurrenceOption>('none')
  const [selectedReminders, setSelectedReminders] = useState<number[]>([])
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false)
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CalendarEventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      eventType: 'PERSONAL',
      color: defaultCalendar?.color ?? '#3b82f6',
      startDate: defaultDate,
      endDate: defaultEndDate,
      isAllDay: true,
      labelRowId: undefined,
      location: '',
      rrule: undefined,
      reminderMinutes: [],
      calendarRowId: defaultCalendar?.rowId,
      groupRowId: undefined,
    },
  })

  const selectedColor = watch('color')
  const isAllDay = watch('isAllDay')
  const selectedLabelRowId = watch('labelRowId')
  const selectedCalendarRowId = watch('calendarRowId')
  const selectedGroupRowId = watch('groupRowId')

  const selectedLabel = labels.find(l => l.rowId === selectedLabelRowId)
  const selectedCalendar = userCalendars.find(c => c.rowId === selectedCalendarRowId)
  const selectedGroup = groups.find(g => g.rowId === selectedGroupRowId)

  // Update default calendar when userCalendars load
  useEffect(() => {
    if (userCalendars.length > 0 && !selectedCalendarRowId) {
      const defCal = userCalendars.find((c) => c.isDefault) ?? userCalendars[0]
      if (defCal) {
        setValue('calendarRowId', defCal.rowId)
        if (!event) {
          setValue('color', defCal.color)
        }
      }
    }
  }, [userCalendars, selectedCalendarRowId, setValue, event])

  useEffect(() => {
    if (event) {
      const reminderMins = event.reminders?.map(r => r.minutesBefore) ?? []
      reset({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        color: event.color,
        startDate: event.startDate.substring(0, event.isAllDay ? 10 : 16),
        endDate: event.endDate.substring(0, event.isAllDay ? 10 : 16),
        isAllDay: event.isAllDay,
        labelRowId: event.labelRowId ?? undefined,
        location: event.location || '',
        rrule: event.rrule ?? undefined,
        reminderMinutes: reminderMins,
        calendarRowId: event.calendarRowId ?? defaultCalendar?.rowId,
        groupRowId: event.groupRowId ?? undefined,
      })
      setRecurrence(rruleToRecurrence(event.rrule))
      setSelectedReminders(reminderMins)
    } else {
      reset({
        title: '',
        description: '',
        eventType: 'PERSONAL',
        color: defaultCalendar?.color ?? '#3b82f6',
        startDate: defaultDate,
        endDate: defaultEndDate,
        isAllDay: true,
        labelRowId: undefined,
        location: '',
        rrule: undefined,
        reminderMinutes: [],
        calendarRowId: defaultCalendar?.rowId,
        groupRowId: undefined,
      })
      setRecurrence('none')
      setSelectedReminders([])
    }
  }, [event, reset, defaultDate, defaultEndDate, defaultCalendar])

  const handleCalendarSelect = (cal: UserCalendar) => {
    setValue('calendarRowId', cal.rowId)
    setValue('color', cal.color)
    setShowCalendarDropdown(false)
  }

  const handleRecurrenceChange = (option: RecurrenceOption) => {
    setRecurrence(option)
    setValue('rrule', recurrenceToRrule[option])
  }

  const toggleReminder = (minutes: number) => {
    const updated = selectedReminders.includes(minutes)
      ? selectedReminders.filter(m => m !== minutes)
      : [...selectedReminders, minutes]
    setSelectedReminders(updated)
    setValue('reminderMinutes', updated)
  }

  const getReminderLabel = (minutes: number): string => {
    if (minutes < 60) return t(`reminder.${minutes}min`)
    if (minutes === 60) return t('reminder.1hour')
    if (minutes === 1440) return t('reminder.1day')
    return `${minutes}min`
  }

  const onFormSubmit = (data: CalendarEventFormValues) => {
    onSubmit({
      ...data,
      description: data.description || undefined,
      location: data.location || undefined,
      labelRowId: data.labelRowId || undefined,
      rrule: data.rrule || undefined,
      reminderMinutes: selectedReminders.length > 0 ? selectedReminders : undefined,
      calendarRowId: data.calendarRowId || undefined,
      groupRowId: data.groupRowId || undefined,
    })
  }

  const Footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        {tc('cancel')}
      </Button>
      <Button type="button" onClick={handleSubmit(onFormSubmit)} loading={isLoading}>
        {tc('save')}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={event ? t('editEvent') : t('addEvent')}
      onClose={onClose}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('form.title')}</Label>
            <Input
              {...register('title', { required: t('form.titleRequired') })}
              className={cn(errors.title && 'border-destructive')}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t('form.description')}</Label>
            <Textarea
              {...register('description')}
              rows={2}
              className="resize-none"
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Calendar selector dropdown */}
          {userCalendars.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('form.calendar')}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                  className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {selectedCalendar ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedCalendar.color }}
                      />
                      {selectedCalendar.calendarName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {showCalendarDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                    {userCalendars.map(cal => (
                      <button
                        key={cal.rowId}
                        type="button"
                        onClick={() => handleCalendarSelect(cal)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cal.color }}
                        />
                        {cal.calendarName}
                        {selectedCalendarRowId === cal.rowId && (
                          <Check size={14} className="ml-auto text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Group selector dropdown */}
          {groups.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                <Users size={14} className="inline mr-1" />
                {t('selectGroup')}
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {selectedGroup ? (
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-primary" />
                      {selectedGroup.groupName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t('personal')}</span>
                  )}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {showGroupDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('groupRowId', undefined)
                        setShowGroupDropdown(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      {t('personal')}
                      {!selectedGroupRowId && <Check size={14} className="ml-auto text-primary" />}
                    </button>
                    {groups.map(group => (
                      <button
                        key={group.rowId}
                        type="button"
                        onClick={() => {
                          setValue('groupRowId', group.rowId)
                          setShowGroupDropdown(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      >
                        <Users size={14} className="text-muted-foreground" />
                        {group.groupName}
                        {selectedGroupRowId === group.rowId && (
                          <Check size={14} className="ml-auto text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Label selector - KEEP custom dropdown */}
          {labels.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                <Tag size={14} className="inline mr-1" />
                {t('form.label')}
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                  className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {selectedLabel ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedLabel.color }}
                      />
                      {selectedLabel.labelName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t('noLabels')}</span>
                  )}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {showLabelDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('labelRowId', undefined)
                        setShowLabelDropdown(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                      {t('noLabels')}
                      {!selectedLabelRowId && <Check size={14} className="ml-auto text-primary" />}
                    </button>
                    {labels.map(label => (
                      <button
                        key={label.rowId}
                        type="button"
                        onClick={() => {
                          setValue('labelRowId', label.rowId)
                          setShowLabelDropdown(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.labelName}
                        {selectedLabelRowId === label.rowId && (
                          <Check size={14} className="ml-auto text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Color swatches - KEEP custom */}
          <div className="space-y-1.5">
            <Label>{t('form.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* All-day toggle - KEEP custom */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newIsAllDay = !isAllDay
                setValue('isAllDay', newIsAllDay)

                const currentStart = watch('startDate')
                const currentEnd = watch('endDate')

                if (newIsAllDay) {
                  // datetime-local → date: strip time
                  setValue('startDate', currentStart.substring(0, 10))
                  setValue('endDate', currentEnd.substring(0, 10))
                } else {
                  // date → datetime-local: add default time
                  if (!currentStart.includes('T')) {
                    setValue('startDate', `${currentStart}T09:00`)
                  }
                  if (!currentEnd.includes('T')) {
                    setValue('endDate', `${currentEnd}T10:00`)
                  }
                }
              }}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                isAllDay ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  isAllDay && 'translate-x-4'
                )}
              />
            </button>
            <Label className="font-normal">{t('form.allDay')}</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('form.startDate')}</Label>
              <Input
                {...register('startDate', { required: true })}
                type={isAllDay ? 'date' : 'datetime-local'}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('form.endDate')}</Label>
              <Input
                {...register('endDate', { required: true })}
                type={isAllDay ? 'date' : 'datetime-local'}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>
              <MapPin size={14} className="inline mr-1" />
              {t('form.location')}
            </Label>
            <Input
              {...register('location')}
              placeholder={t('form.locationPlaceholder')}
            />
          </div>

          {/* Recurrence pills - KEEP custom */}
          <div className="space-y-1.5">
            <Label>
              <Repeat size={14} className="inline mr-1" />
              {t('form.recurrence')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RecurrenceOption[]).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleRecurrenceChange(option)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    recurrence === option
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t(`recurrence.${option}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder pills - KEEP custom */}
          <div className="space-y-1.5">
            <Label>
              <Bell size={14} className="inline mr-1" />
              {t('form.reminder')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {reminderOptions.map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => toggleReminder(minutes)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedReminders.includes(minutes)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {selectedReminders.includes(minutes) && (
                    <Check size={12} className="inline mr-1" />
                  )}
                  {getReminderLabel(minutes)}
                </button>
              ))}
            </div>
          </div>

        </form>
    </ModalShell>
  )
}
