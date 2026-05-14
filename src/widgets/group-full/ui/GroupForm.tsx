import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Spinner } from '@/shared/ui/spinner'
import { Button } from '@/shared/ui/button'
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
import { useGroupTypes } from '@/features/group'
import type { GroupFormValues, UserGroup, UserGroupDetail } from '@/entities/group'

interface GroupFormProps {
  initialData?: UserGroup | UserGroupDetail | null
  onSubmit: (data: GroupFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const NO_TYPE_VALUE = '__none__'

type FormShape = {
  groupName: string
  description: string
  groupTypeId: number | null
}

export const GroupForm = ({ initialData, onSubmit, onCancel, isSubmitting }: GroupFormProps) => {
  const { t } = useTranslation('group')
  const { t: tc } = useTranslation('common')
  const { data: groupTypes = [], isLoading: isLoadingTypes } = useGroupTypes()

  const form = useForm<FormShape>({
    defaultValues: {
      groupName: initialData?.groupName ?? '',
      description: initialData?.description ?? '',
      groupTypeId: initialData?.groupTypeId ?? null,
    },
  })
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form

  const groupTypeId = watch('groupTypeId')

  useEffect(() => {
    if (initialData) {
      reset({
        groupName: initialData.groupName,
        description: initialData.description ?? '',
        groupTypeId: initialData.groupTypeId,
      })
    }
  }, [initialData, reset])

  const onFormSubmit = (data: FormShape) => {
    onSubmit({
      groupName: data.groupName.trim(),
      description: data.description.trim() || undefined,
      groupTypeId: data.groupTypeId,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>{t('form.groupName')}</Label>
          <Input
            {...register('groupName', {
              required: t('form.groupNameRequired', { defaultValue: tc('required') }),
              validate: (v) => v.trim().length > 0 || t('form.groupNameRequired', { defaultValue: tc('required') }),
            })}
            className={cn(errors.groupName && 'border-destructive')}
            placeholder={t('form.groupNamePlaceholder')}
          />
          {errors.groupName && (
            <p className="text-xs text-destructive">{errors.groupName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('form.description')}</Label>
          <Textarea
            {...register('description')}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('form.groupType')}</Label>
          {isLoadingTypes ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner size="sm" />
            </div>
          ) : (
            <Select
              value={groupTypeId !== null ? String(groupTypeId) : NO_TYPE_VALUE}
              onValueChange={(v) =>
                setValue('groupTypeId', v === NO_TYPE_VALUE ? null : Number(v), { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TYPE_VALUE}>{t('noGroupType')}</SelectItem>
                {groupTypes.map((gt) => (
                  <SelectItem key={gt.rowId} value={String(gt.rowId)}>
                    <span className="flex items-center gap-2">
                      {gt.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: gt.color }}
                        />
                      )}
                      {gt.typeName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {tc('cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {tc('save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
