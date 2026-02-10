import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { format } from 'date-fns'
import type { DutchPay, DutchPayFormValues, SplitMethod, ParticipantFormValues } from '@/entities/dutch-pay'

interface DutchPayFormProps {
  dutchPay?: DutchPay | null
  onSubmit: (data: DutchPayFormValues) => void
  onClose: () => void
  isLoading?: boolean
}

const splitMethodOptions: SplitMethod[] = ['EQUAL', 'CUSTOM', 'RATIO']

export const DutchPayForm = ({
  dutchPay,
  onSubmit,
  onClose,
  isLoading,
}: DutchPayFormProps) => {
  const { t } = useTranslation('dutchPay')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const defaultDate = format(new Date(), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DutchPayFormValues>({
    defaultValues: {
      title: '',
      description: '',
      totalAmount: 0,
      currency: 'KRW',
      splitMethod: 'EQUAL',
      dutchPayDate: defaultDate,
      participants: [{ participantName: '', amount: 0 }],
    },
  })

  const splitMethod = watch('splitMethod')
  const totalAmount = watch('totalAmount')
  const [participants, setParticipants] = useState<ParticipantFormValues[]>([
    { participantName: '', amount: 0 },
  ])

  useEffect(() => {
    if (dutchPay) {
      const parts = dutchPay.participants.map(p => ({
        participantName: p.participantName,
        amount: p.amount,
      }))
      reset({
        title: dutchPay.title,
        description: dutchPay.description || '',
        totalAmount: dutchPay.totalAmount,
        currency: dutchPay.currency,
        splitMethod: dutchPay.splitMethod,
        dutchPayDate: dutchPay.dutchPayDate,
        participants: parts,
      })
      setParticipants(parts.length > 0 ? parts : [{ participantName: '', amount: 0 }])
    } else {
      reset({
        title: '',
        description: '',
        totalAmount: 0,
        currency: 'KRW',
        splitMethod: 'EQUAL',
        dutchPayDate: defaultDate,
        participants: [{ participantName: '', amount: 0 }],
      })
      setParticipants([{ participantName: '', amount: 0 }])
    }
  }, [dutchPay, reset, defaultDate])

  // Auto-calculate equal split
  useEffect(() => {
    if (splitMethod === 'EQUAL' && participants.length > 0 && totalAmount > 0) {
      const perPerson = Math.floor(totalAmount / participants.length)
      const remainder = totalAmount - perPerson * participants.length
      const updated = participants.map((p, i) => ({
        ...p,
        amount: i === 0 ? perPerson + remainder : perPerson,
      }))
      setParticipants(updated)
    }
  }, [splitMethod, totalAmount, participants.length])

  const addParticipant = () => {
    setParticipants([...participants, { participantName: '', amount: 0 }])
  }

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) return
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const updateParticipant = (index: number, field: keyof ParticipantFormValues, value: string | number) => {
    const updated = [...participants]
    if (field === 'participantName') {
      updated[index] = { ...updated[index], participantName: value as string }
    } else {
      updated[index] = { ...updated[index], amount: Number(value) }
    }
    setParticipants(updated)
  }

  const onFormSubmit = (data: DutchPayFormValues) => {
    const validParticipants = participants.filter(p => p.participantName.trim())
    onSubmit({
      ...data,
      description: data.description || undefined,
      participants: validParticipants,
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
            : 'max-w-md rounded-lg max-h-[90vh] overflow-y-auto'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {dutchPay ? t('editDutchPay') : t('addDutchPay')}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-4">
          {/* Title */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.description')}</label>
            <input
              {...register('description')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.totalAmount')}</label>
            <input
              {...register('totalAmount', { required: true, valueAsNumber: true, min: 1 })}
              type="number"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.totalAmount && 'border-destructive'
              )}
              placeholder="0"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.date')}</label>
            <input
              {...register('dutchPayDate', { required: true })}
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Split Method */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('form.splitMethod')}</label>
            <div className="flex flex-wrap gap-1.5">
              {splitMethodOptions.map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setValue('splitMethod', method)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    splitMethod === method
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t(`splitMethod.${method}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('form.participants')}</label>
            {participants.map((p, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={p.participantName}
                  onChange={(e) => updateParticipant(index, 'participantName', e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={t('form.participantName')}
                />
                {splitMethod !== 'EQUAL' && (
                  <input
                    value={p.amount || ''}
                    onChange={(e) => updateParticipant(index, 'amount', e.target.value)}
                    type="number"
                    className="w-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0"
                  />
                )}
                {splitMethod === 'EQUAL' && (
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {new Intl.NumberFormat('ko-KR').format(p.amount)}{t('currency')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  disabled={participants.length <= 1}
                  className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParticipant}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-muted-foreground/30 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus size={12} />
              {t('form.addParticipant')}
            </button>
          </div>

          {/* Submit */}
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
