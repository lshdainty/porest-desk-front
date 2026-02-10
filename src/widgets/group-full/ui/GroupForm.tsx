import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import type { GroupFormValues, GroupType, UserGroup, UserGroupDetail } from '@/entities/group'

interface GroupFormProps {
  initialData?: UserGroup | UserGroupDetail | null
  onSubmit: (data: GroupFormValues) => void
  onCancel: () => void
}

const groupTypes: { value: GroupType; labelKey: string }[] = [
  { value: 'FAMILY', labelKey: 'groupType.FAMILY' },
  { value: 'COUPLE', labelKey: 'groupType.COUPLE' },
  { value: 'FRIENDS', labelKey: 'groupType.FRIENDS' },
  { value: 'CUSTOM', labelKey: 'groupType.CUSTOM' },
]

export const GroupForm = ({ initialData, onSubmit, onCancel }: GroupFormProps) => {
  const { t } = useTranslation('group')
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [groupType, setGroupType] = useState<GroupType>('CUSTOM')

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.groupName)
      setDescription(initialData.description ?? '')
      setGroupType(initialData.groupType)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    onSubmit({
      groupName: groupName.trim(),
      description: description.trim() || undefined,
      groupType,
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
        <Select value={groupType} onValueChange={(v) => setGroupType(v as GroupType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupTypes.map((gt) => (
              <SelectItem key={gt.value} value={gt.value}>
                {t(gt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button type="submit">{t('save', { ns: 'common' })}</Button>
      </div>
    </form>
  )
}
