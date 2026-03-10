import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { dashboardKeys } from '@/shared/config'
import { DashboardProvider } from '@/features/dashboard/model/DashboardContext'
import DashboardContent from '@/features/dashboard/ui/DashboardContent'

export const DashboardPage = () => {
  const { t } = useTranslation('common')
  const { data: layoutData, isLoading } = useQuery({
    queryKey: dashboardKeys.layout(),
    queryFn: () => dashboardApi.getLayout(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  return (
    <DashboardProvider initialDashboard={layoutData?.dashboard ?? null}>
      <DashboardContent />
    </DashboardProvider>
  )
}
