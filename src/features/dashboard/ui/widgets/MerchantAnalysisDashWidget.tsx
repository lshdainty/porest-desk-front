import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMerchantSummary } from '@/features/expense'
import { MerchantAnalysisChart } from '@/widgets/expense-full/ui/summary/MerchantAnalysisChart'

export const MerchantAnalysisDashWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { startDate, endDate } = useMemo(() => {
    let startM = month - 5
    let startY = year
    while (startM <= 0) { startM += 12; startY-- }
    const sd = `${startY}-${String(startM).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const ed = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    return { startDate: sd, endDate: ed }
  }, [year, month])

  const { data, isLoading } = useMerchantSummary(startDate, endDate)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data?.merchants || data.merchants.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <MerchantAnalysisChart merchants={data.merchants} />
    </div>
  )
}
