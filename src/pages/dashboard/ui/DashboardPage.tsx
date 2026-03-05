import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { GreetingSection } from '@/widgets/dashboard-grid/ui/GreetingSection'
import { SummaryCardsRow } from '@/widgets/dashboard-grid/ui/SummaryCardsRow'
import { QuickStatsRow } from '@/widgets/dashboard-grid/ui/QuickStatsRow'
import { ScheduleSection } from '@/widgets/dashboard-grid/ui/ScheduleSection'
import { ExpenseChartSection } from '@/widgets/dashboard-grid/ui/ExpenseChartSection'
import { TimerMiniWidget } from '@/widgets/timer-mini'
import { CalculatorMiniWidget } from '@/widgets/calculator-mini'
import { Card } from '@/shared/ui/card'

export const DashboardPage = () => {
  const { t } = useTranslation('common')
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <GreetingSection />
      <SummaryCardsRow data={data} />
      <QuickStatsRow data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScheduleSection data={data} />
        <ExpenseChartSection data={data} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <TimerMiniWidget />
        </Card>
        <Card className="overflow-hidden">
          <CalculatorMiniWidget />
        </Card>
      </div>
    </div>
  )
}
