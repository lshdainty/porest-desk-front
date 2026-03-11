import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { MonthlyAmount } from '@/entities/expense'

interface YearOverYearChartProps {
  currentYearData: MonthlyAmount[]
  previousYearData: MonthlyAmount[]
  currentYear: number
}

export const YearOverYearChart = ({
  currentYearData,
  previousYearData,
  currentYear,
}: YearOverYearChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    thisYear: {
      label: `${currentYear}${t('stats.thisYear') === '올해' ? '년' : ''}`,
      color: '#3b82f6',
    },
    lastYear: {
      label: `${currentYear - 1}${t('stats.lastYear') === '작년' ? '년' : ''}`,
      color: '#94a3b8',
    },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    return months.map((month) => {
      const current = currentYearData.find((m) => m.month === month)
      const previous = previousYearData.find((m) => m.month === month)
      return {
        month: `${month}월`,
        thisYear: current?.totalExpense ?? 0,
        lastYear: previous?.totalExpense ?? 0,
      }
    }).filter((d) => d.thisYear > 0 || d.lastYear > 0)
  }, [currentYearData, previousYearData])

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
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
                const label = name === 'thisYear' ? chartConfig.thisYear.label : chartConfig.lastYear.label
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
        <Bar dataKey="thisYear" fill="var(--color-thisYear)" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar dataKey="lastYear" fill="var(--color-lastYear)" radius={[4, 4, 0, 0]} barSize={14} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
