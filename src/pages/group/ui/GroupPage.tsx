import { useTranslation } from 'react-i18next'
import { GroupFullWidget } from '@/widgets/group-full'

export const GroupPage = () => {
  const { t } = useTranslation('group')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <GroupFullWidget />
    </div>
  )
}
