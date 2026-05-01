import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Label } from '@/shared/ui/label'
import { ModalShell } from '@/shared/ui/porest/dialogs'
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
    const current = updated[index]
    if (!current) return
    if (field === 'participantName') {
      updated[index] = { ...current, participantName: value as string }
    } else {
      updated[index] = { ...current, amount: Number(value) }
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

  const Footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        {tc('cancel')}
      </Button>
      <Button type="button" onClick={handleSubmit(onFormSubmit)} disabled={isLoading}>
        {isLoading ? tc('loading') : tc('save')}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={dutchPay ? t('editDutchPay') : t('addDutchPay')}
      onClose={onClose}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Title */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t('form.description')}</Label>
            <Input
              {...register('description')}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-1.5">
            <Label>{t('form.totalAmount')}</Label>
            <Input
              {...register('totalAmount', { required: true, valueAsNumber: true, min: 1 })}
              type="number"
              className={cn(errors.totalAmount && 'border-destructive')}
              placeholder="0"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>{t('form.date')}</Label>
            <InputDatePicker
              value={watch('dutchPayDate')}
              onValueChange={(v) => setValue('dutchPayDate', v)}
            />
          </div>

          {/* Split Method - KEEP custom pill buttons */}
          <div className="space-y-1.5">
            <Label>{t('form.splitMethod')}</Label>
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

          {/* Participants - KEEP custom participant remove/add buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('form.participants')}</Label>
              <button
                type="button"
                onClick={addParticipant}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus size={12} />
                {t('form.addParticipant')}
              </button>
            </div>
            {participants.map((p, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={p.participantName}
                  onChange={(e) => updateParticipant(index, 'participantName', e.target.value)}
                  className="flex-1"
                  placeholder={t('form.participantName')}
                />
                {splitMethod !== 'EQUAL' && (
                  <Input
                    value={p.amount || ''}
                    onChange={(e) => updateParticipant(index, 'amount', e.target.value)}
                    type="number"
                    className="w-24"
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
          </div>

        </form>
    </ModalShell>
  )
}
