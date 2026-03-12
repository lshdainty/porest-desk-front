import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { MerchantSummary } from '@/entities/expense'

interface MerchantAnalysisChartProps {
  merchants: MerchantSummary[]
}

export const MerchantAnalysisChart = ({ merchants }: MerchantAnalysisChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    amount: {
      label: t('totalExpense'),
      color: '#f59e0b',
    },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    return [...merchants]
      .filter((m) => m.merchant)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map((m) => ({
        name: m.merchant.length > 10 ? m.merchant.slice(0, 10) + '…' : m.merchant,
        amount: m.totalAmount,
        count: m.count,
      }))
  }, [merchants])

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('stats.noMerchantData')}</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.3} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          width={80}
        />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const count = (item as { payload?: { count?: number } })?.payload?.count
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-1 justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{t('totalExpense')}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                    {count != null && (
                      <div className="text-xs text-muted-foreground">
                        {t('stats.transactionCount', { count })}
                      </div>
                    )}
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ChartContainer>
  )
}
