import { useTranslation } from 'react-i18next'
import { useYearlySummary } from '@/features/expense'
import { YearOverYearChart } from '@/widgets/expense-full/ui/summary/YearOverYearChart'

export const YearOverYearDashWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()

  const { data: currentData, isLoading: loadingCurrent } = useYearlySummary(year)
  const { data: prevData, isLoading: loadingPrev } = useYearlySummary(year - 1)

  if (loadingCurrent || loadingPrev) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!currentData && !prevData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <YearOverYearChart
        currentYearData={currentData?.monthlyAmounts ?? []}
        previousYearData={prevData?.monthlyAmounts ?? []}
        currentYear={year}
      />
    </div>
  )
}
