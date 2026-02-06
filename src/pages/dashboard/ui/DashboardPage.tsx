import { useTranslation } from 'react-i18next'
import { DashboardGrid } from '@/widgets/dashboard-grid'

export const DashboardPage = () => {
  const { t } = useTranslation('dashboard')

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <DashboardGrid />
    </div>
  )
}
