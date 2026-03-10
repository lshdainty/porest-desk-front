import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseKeys } from '@/shared/config'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const MonthlyCompareWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()

  const chartConfig = {
    income: {
      label: t('chart.income'),
      color: '#22c55e',
    },
    expense: {
      label: t('chart.expense'),
      color: '#ef4444',
    },
  } satisfies ChartConfig

  const { data, isLoading } = useQuery({
    queryKey: expenseKeys.yearlySummary(year),
    queryFn: () => expenseApi.getYearlySummary(year),
  })

  const chartData = useMemo(() => {
    if (!data?.monthlyAmounts) return []

    const currentMonth = now.getMonth() + 1
    const startMonth = Math.max(1, currentMonth - 5)

    return data.monthlyAmounts
      .filter((m) => m.month >= startMonth && m.month <= currentMonth)
      .map((m) => ({
        month: `${m.month}월`,
        income: m.totalIncome,
        expense: m.totalExpense,
      }))
  }, [data, now])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-3">
      <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const label = name === 'income' ? chartConfig.income.label : chartConfig.expense.label
                  return (
                    <div className="flex flex-1 justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
