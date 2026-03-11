import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useYearlySummary } from '@/features/expense'
import { MonthlyTrendChart } from '@/widgets/expense-full/ui/summary/MonthlyTrendChart'

export const MonthlyTrendDashWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()

  const { data, isLoading } = useYearlySummary(year)

  const filteredData = useMemo(() => {
    if (!data?.monthlyAmounts) return []
    const currentMonth = now.getMonth() + 1
    const startMonth = Math.max(1, currentMonth - 5)
    return data.monthlyAmounts.filter((m) => m.month >= startMonth && m.month <= currentMonth)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || filteredData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <MonthlyTrendChart monthlyAmounts={filteredData} />
    </div>
  )
}
