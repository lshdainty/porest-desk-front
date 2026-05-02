import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
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

export const GroupForm = ({ initialData, onSubmit, onCancel, isSubmitting }: GroupFormProps) => {
  const { t } = useTranslation('group')
  const { t: tc } = useTranslation('common')
  const { data: groupTypes = [], isLoading: isLoadingTypes } = useGroupTypes()

  const [groupName, setGroupName] = useState(initialData?.groupName ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [groupTypeId, setGroupTypeId] = useState<number | null>(initialData?.groupTypeId ?? null)

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.groupName)
      setDescription(initialData.description ?? '')
      setGroupTypeId(initialData.groupTypeId)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    onSubmit({
      groupName: groupName.trim(),
      description: description.trim() || undefined,
      groupTypeId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('form.groupName')}</Label>
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={t('form.groupNamePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t('form.description')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('form.groupType')}</Label>
        {isLoadingTypes ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select
            value={groupTypeId !== null ? String(groupTypeId) : NO_TYPE_VALUE}
            onValueChange={(v) => setGroupTypeId(v === NO_TYPE_VALUE ? null : Number(v))}
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
  )
}
