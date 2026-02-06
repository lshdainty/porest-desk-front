import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import type { CalendarEvent, CalendarEventFormValues, CalendarEventType } from '@/entities/calendar'
import { format } from 'date-fns'

interface EventFormProps {
  event?: CalendarEvent | null
  selectedDate?: Date
  onSubmit: (data: CalendarEventFormValues) => void
  onClose: () => void
  isLoading?: boolean
}

const eventTypeOptions: CalendarEventType[] = ['PERSONAL', 'WORK', 'BIRTHDAY', 'HOLIDAY']

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

export const EventForm = ({
  event,
  selectedDate,
  onSubmit,
  onClose,
  isLoading,
}: EventFormProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const defaultDate = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')

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
      color: '#3b82f6',
      startDate: defaultDate,
      endDate: defaultDate,
      isAllDay: true,
    },
  })

  const selectedColor = watch('color')
  const selectedEventType = watch('eventType')
  const isAllDay = watch('isAllDay')

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        color: event.color,
        startDate: event.startDate.substring(0, event.isAllDay ? 10 : 16),
        endDate: event.endDate.substring(0, event.isAllDay ? 10 : 16),
        isAllDay: event.isAllDay,
      })
    } else {
      reset({
        title: '',
        description: '',
        eventType: 'PERSONAL',
        color: '#3b82f6',
        startDate: defaultDate,
        endDate: defaultDate,
        isAllDay: true,
      })
    }
  }, [event, reset, defaultDate])

  const onFormSubmit = (data: CalendarEventFormValues) => {
    onSubmit({
      ...data,
      description: data.description || undefined,
    })
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/40',
        !isMobile && 'items-center'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full bg-background shadow-lg',
          isMobile
            ? 'max-h-[85vh] overflow-y-auto rounded-t-2xl'
            : 'max-w-md rounded-lg'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {event ? t('editEvent') : t('addEvent')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.title')}</label>
            <input
              {...register('title', { required: t('form.titleRequired') })}
              className={cn(
                'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.title && 'border-destructive'
              )}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.description')}</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.eventType')}</label>
            <div className="flex flex-wrap gap-1.5">
              {eventTypeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('eventType', type)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedEventType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t(`eventType.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.color')}</label>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValue('isAllDay', !isAllDay)}
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
            <label className="text-sm">{t('form.allDay')}</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('form.startDate')}</label>
              <input
                {...register('startDate', { required: true })}
                type={isAllDay ? 'date' : 'datetime-local'}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('form.endDate')}</label>
              <input
                {...register('endDate', { required: true })}
                type={isAllDay ? 'date' : 'datetime-local'}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? tc('loading') : tc('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
