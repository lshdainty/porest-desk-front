import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseKeys } from '@/shared/config'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const ExpenseByMerchantWidget = () => {
  const { t } = useTranslation('dashboard')

  const now = new Date()
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  ).padStart(2, '0')}`

  const { data, isLoading } = useQuery({
    queryKey: expenseKeys.merchantSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getMerchantSummary(startDate, endDate),
  })

  const topMerchants = useMemo(() => {
    if (!data?.merchants) return []
    return [...data.merchants]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
  }, [data])

  const maxAmount = useMemo(() => {
    if (topMerchants.length === 0) return 1
    return topMerchants[0].totalAmount
  }, [topMerchants])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || topMerchants.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {topMerchants.map((merchant, index) => (
        <div key={merchant.merchant} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground w-4">{index + 1}</span>
              <span className="truncate max-w-[120px]">{merchant.merchant}</span>
            </div>
            <span className="text-sm font-medium tabular-nums">{formatCurrency(merchant.totalAmount)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(merchant.totalAmount / maxAmount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
