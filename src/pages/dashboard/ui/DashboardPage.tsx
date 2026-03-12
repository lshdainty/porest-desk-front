import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { dashboardKeys } from '@/shared/config'
import { DashboardProvider } from '@/features/dashboard/model/DashboardContext'
import DashboardContent from '@/features/dashboard/ui/DashboardContent'

export const DashboardPage = () => {
  const { data: layoutData, isLoading } = useQuery({
    queryKey: dashboardKeys.layout(),
    queryFn: () => dashboardApi.getLayout(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardProvider initialDashboard={layoutData?.dashboard ?? null}>
      <DashboardContent />
    </DashboardProvider>
  )
}
