import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MapPin, Repeat, Bell, Tag, Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Form } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { InputTimePicker } from '@/shared/ui/input-time-picker'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { CAT_PALETTE, CHART_PAIRS, getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { useIsMobile } from '@/shared/hooks'
import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'
import type { EventLabel } from '@/entities/event-label'
import { useUserCalendars } from '@/features/user-calendar'
import { format } from 'date-fns'

const NO_LABEL_VALUE = '__none__'

interface EventFormProps {
  event?: CalendarEvent | null
  selectedDate?: Date
  selectedEndDate?: Date
  labels?: EventLabel[]
  onSubmit: (data: CalendarEventFormValues) => void
  onClose: () => void
  isLoading?: boolean
  /** 수정 모드 삭제 — 제공 시 footer 좌측 danger 버튼 노출(앱 PSheetFooter 미러). */
  onDelete?: () => void
}

// 기본 일정 색 = 팔레트 blue #2c70bf (캘린더 기본색 미지정 시 fallback).
const DEFAULT_EVENT_COLOR =
  CHART_PAIRS.find(p => p.key === 'blue')!.base

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

// 시작 datetime 변경 시 종료가 시작 이전/같으면 자동 보정 (Google 캘린더 패턴).
// allDay=true: YYYY-MM-DD 사전식 비교, 종료 = max(종료, 시작).
// allDay=false: ISO 비교, 종료 = 시작 + 1h.
const ensureEndAfterStart = (
  newStart: string,
  currentEnd: string,
  allDay: boolean,
): string => {
  if (allDay) return newStart > currentEnd ? newStart : currentEnd
  if (new Date(newStart) < new Date(currentEnd)) return currentEnd
  const d = new Date(newStart)
  d.setHours(d.getHours() + 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export const EventForm = ({
  event,
  selectedDate,
  selectedEndDate,
  labels = [],
  onSubmit,
  onClose,
  isLoading,
  onDelete,
}: EventFormProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const { data: userCalendars = [] } = useUserCalendars()
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

  const form = useForm<CalendarEventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      eventType: 'PERSONAL',
      color: defaultCalendar?.color ?? DEFAULT_EVENT_COLOR,
      startDate: defaultDate,
      endDate: defaultEndDate,
      isAllDay: true,
      labelRowId: undefined,
      location: '',
      rrule: undefined,
      reminderMinutes: [],
      calendarRowId: defaultCalendar?.rowId,
    },
  })
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form

  const selectedColor = watch('color')
  const isAllDay = watch('isAllDay')
  const selectedLabelRowId = watch('labelRowId')
  const selectedCalendarRowId = watch('calendarRowId')

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
      })
      setRecurrence(rruleToRecurrence(event.rrule))
      setSelectedReminders(reminderMins)
    } else {
      reset({
        title: '',
        description: '',
        eventType: 'PERSONAL',
        color: defaultCalendar?.color ?? DEFAULT_EVENT_COLOR,
        startDate: defaultDate,
        endDate: defaultEndDate,
        isAllDay: true,
        labelRowId: undefined,
        location: '',
        rrule: undefined,
        reminderMinutes: [],
        calendarRowId: defaultCalendar?.rowId,
      })
      setRecurrence('none')
      setSelectedReminders([])
    }
  }, [event, reset, defaultDate, defaultEndDate, defaultCalendar])

  const handleRecurrenceChange = (option: RecurrenceOption) => {
    setRecurrence(option)
    setValue('rrule', recurrenceToRrule[option])
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
    })
  }

  const Footer = (
    <ModalFooter
      onSave={handleSubmit(onFormSubmit)}
      saveLabel={tc('save')}
      saving={isLoading}
      onCancel={onClose}
      cancelLabel={tc('cancel')}
      onDelete={event && onDelete ? onDelete : undefined}
      deleteLabel={tc('delete')}
    />
  )

  return (
    <ModalShell
      title={event ? t('editEvent') : t('addEvent')}
      onClose={onClose}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
        <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
            <Label>{t('form.description')}</Label>
            <Textarea
              {...register('description')}
              rows={2}
              className="resize-none"
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Calendar selector */}
          {userCalendars.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{t('form.calendar')}</Label>
              <Select
                value={selectedCalendarRowId ? String(selectedCalendarRowId) : undefined}
                onValueChange={(v) => {
                  const cal = userCalendars.find((c) => String(c.rowId) === v)
                  if (cal) {
                    setValue('calendarRowId', cal.rowId, { shouldDirty: true })
                    setValue('color', cal.color, { shouldDirty: true })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userCalendars.map((cal) => (
                    <SelectItem key={cal.rowId} value={String(cal.rowId)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getPaletteByColor(cal.color).color }}
                        />
                        {cal.calendarName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Label selector */}
          {labels.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>
                <Tag size={14} className="inline mr-1" />
                {t('form.label')}
              </Label>
              <Select
                value={selectedLabelRowId ? String(selectedLabelRowId) : NO_LABEL_VALUE}
                onValueChange={(v) =>
                  setValue('labelRowId', v === NO_LABEL_VALUE ? undefined : Number(v), {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LABEL_VALUE}>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                      {t('noLabels')}
                    </span>
                  </SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label.rowId} value={String(label.rowId)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getPaletteByColor(label.color).color }}
                        />
                        {label.labelName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color swatches — 디자인시스템 차트 10색 (ColorSwatchGroup) */}
          <div className="flex flex-col gap-2">
            <Label>{t('form.color')}</Label>
            <ColorSwatchGroup
              columns={5}
              value={selectedColor}
              onValueChange={(v) => setValue('color', v, { shouldDirty: true })}
              options={CAT_PALETTE.map((p) => ({
                value: p.baseHex,
                bg: p.bg,
                fg: p.color,
              }))}
            />
          </div>

          {/* All-day switch */}
          <div className="flex items-center gap-2">
            <Switch
              checked={isAllDay}
              onCheckedChange={(checked) => {
                setValue('isAllDay', checked, { shouldDirty: true })

                const currentStart = watch('startDate')
                const currentEnd = watch('endDate')

                if (checked) {
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
              id="event-all-day"
            />
            <Label htmlFor="event-all-day" className="font-normal cursor-pointer">
              {t('form.allDay')}
            </Label>
          </div>

          {/* allDay=true 는 시작/종료 같은 row, false 는 row stack — date input width 확보 */}
          <div className={isAllDay ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            <div className="flex flex-col gap-2">
              <Label>{t('form.startDate')}</Label>
              {isAllDay ? (
                <InputDatePicker
                  value={watch('startDate')}
                  onValueChange={(d) => {
                    setValue('startDate', d, { shouldDirty: true })
                    const adjusted = ensureEndAfterStart(d, watch('endDate'), true)
                    if (adjusted !== watch('endDate'))
                      setValue('endDate', adjusted, { shouldDirty: true })
                  }}
                />
              ) : (
                <div className="grid grid-cols-[1fr_116px] gap-2">
                  <InputDatePicker
                    value={watch('startDate').substring(0, 10)}
                    onValueChange={(d) => {
                      const time = watch('startDate').substring(11, 16) || '09:00'
                      const newStart = `${d}T${time}`
                      setValue('startDate', newStart, { shouldDirty: true })
                      const adjusted = ensureEndAfterStart(newStart, watch('endDate'), false)
                      if (adjusted !== watch('endDate'))
                        setValue('endDate', adjusted, { shouldDirty: true })
                    }}
                  />
                  <InputTimePicker
                    value={watch('startDate').substring(11, 16)}
                    onValueChange={(t) => {
                      const date = watch('startDate').substring(0, 10)
                      const newStart = `${date}T${t}`
                      setValue('startDate', newStart, { shouldDirty: true })
                      const adjusted = ensureEndAfterStart(newStart, watch('endDate'), false)
                      if (adjusted !== watch('endDate'))
                        setValue('endDate', adjusted, { shouldDirty: true })
                    }}
                    minuteStep={5}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('form.endDate')}</Label>
              {isAllDay ? (
                <InputDatePicker
                  value={watch('endDate')}
                  onValueChange={(d) => setValue('endDate', d, { shouldDirty: true })}
                />
              ) : (
                <div className="grid grid-cols-[1fr_116px] gap-2">
                  <InputDatePicker
                    value={watch('endDate').substring(0, 10)}
                    onValueChange={(d) => {
                      const time = watch('endDate').substring(11, 16) || '10:00'
                      setValue('endDate', `${d}T${time}`, { shouldDirty: true })
                    }}
                  />
                  <InputTimePicker
                    value={watch('endDate').substring(11, 16)}
                    onValueChange={(t) => {
                      const date = watch('endDate').substring(0, 10)
                      setValue('endDate', `${date}T${t}`, { shouldDirty: true })
                    }}
                    minuteStep={5}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <Label>
              <MapPin size={14} className="inline mr-1" />
              {t('form.location')}
            </Label>
            <Input
              {...register('location')}
              placeholder={t('form.locationPlaceholder')}
            />
          </div>

          {/* Recurrence — single select */}
          <div className="flex flex-col gap-2">
            <Label>
              <Repeat size={14} className="inline mr-1" />
              {t('form.recurrence')}
            </Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={recurrence}
              onValueChange={(v) => v && handleRecurrenceChange(v as RecurrenceOption)}
              className="justify-start flex-wrap"
            >
              {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RecurrenceOption[]).map(option => (
                <ToggleGroupItem key={option} value={option}>
                  {t(`recurrence.${option}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reminder — multi select */}
          <div className="flex flex-col gap-2">
            <Label>
              <Bell size={14} className="inline mr-1" />
              {t('form.reminder')}
            </Label>
            <ToggleGroup
              type="multiple"
              size="sm"
              value={selectedReminders.map(String)}
              onValueChange={(v) => {
                const next = v.map(Number).sort((a, b) => a - b)
                setSelectedReminders(next)
                setValue('reminderMinutes', next, { shouldDirty: true })
              }}
              className="justify-start flex-wrap"
            >
              {reminderOptions.map(minutes => (
                <ToggleGroupItem key={minutes} value={String(minutes)}>
                  {selectedReminders.includes(minutes) && (
                    <Check size={12} className="inline mr-1" />
                  )}
                  {getReminderLabel(minutes)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

        </form>
        </Form>
    </ModalShell>
  )
}
