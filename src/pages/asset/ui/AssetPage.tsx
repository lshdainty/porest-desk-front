import { useTranslation } from 'react-i18next'
import { AssetFullWidget } from '@/widgets/asset-full'

export const AssetPage = () => {
  const { t } = useTranslation('asset')

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t('title')}</h1>
      <AssetFullWidget />
    </div>
  )
}
