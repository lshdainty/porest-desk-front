import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { formatCurrency } from '@/shared/lib'
import type { MonthlyAmount } from '@/entities/expense'

interface CategoryTrendChartProps {
  monthlyAmounts: MonthlyAmount[]
}

export const CategoryTrendChart = ({ monthlyAmounts }: CategoryTrendChartProps) => {
  const { t } = useTranslation('expense')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Collect all unique categories from all months
  const allCategories = useMemo(() => {
    const catMap = new Map<number, string>()
    monthlyAmounts.forEach((m) => {
      m.categoryBreakdown?.forEach((c) => {
        if (!catMap.has(c.categoryRowId)) {
          catMap.set(c.categoryRowId, c.categoryName)
        }
      })
    })
    return Array.from(catMap.entries()).map(([id, name]) => ({ id, name }))
  }, [monthlyAmounts])

  const selectedCategory = allCategories.find((c) => String(c.id) === selectedCategoryId)

  const chartConfig = {
    amount: {
      label: selectedCategory?.name ?? t('totalExpense'),
      color: '#8b5cf6',
    },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    if (!selectedCategoryId) return []
    const catId = Number(selectedCategoryId)
    return monthlyAmounts.map((m) => {
      const cat = m.categoryBreakdown?.find((c) => c.categoryRowId === catId)
      return {
        month: `${m.month}월`,
        amount: cat?.totalAmount ?? 0,
      }
    })
  }, [monthlyAmounts, selectedCategoryId])

  return (
    <div className="space-y-3">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('stats.selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {allCategories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCategoryId && chartData.length > 0 ? (
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  formatter={(value) => (
                    <div className="flex flex-1 justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{selectedCategory?.name}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="amount"
              type="monotone"
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-amount)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {!selectedCategoryId ? t('stats.selectCategory') : t('stats.noData')}
          </p>
        </div>
      )}
    </div>
  )
}
