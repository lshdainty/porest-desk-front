import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { formatCurrency } from '@/shared/lib'
import type { MonthlyAmount, ExpenseCategory } from '@/entities/expense'

interface CategoryTrendChartProps {
  monthlyAmounts: MonthlyAmount[]
  categories?: ExpenseCategory[]
}

export const CategoryTrendChart = ({ monthlyAmounts, categories }: CategoryTrendChartProps) => {
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

  // 수입/지출 그룹 분리
  const { expenseCategories, incomeCategories } = useMemo(() => {
    if (!categories || categories.length === 0) {
      return { expenseCategories: allCategories, incomeCategories: [] as typeof allCategories }
    }

    const typeMap = new Map<number, string>()
    categories.forEach((c) => typeMap.set(c.rowId, c.expenseType))

    const expense: typeof allCategories = []
    const income: typeof allCategories = []

    allCategories.forEach((cat) => {
      const type = typeMap.get(cat.id) ?? 'EXPENSE'
      if (type === 'INCOME') {
        income.push(cat)
      } else {
        expense.push(cat)
      }
    })

    return { expenseCategories: expense, incomeCategories: income }
  }, [allCategories, categories])

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

  const hasGroups = categories && categories.length > 0

  return (
    <div className="space-y-3">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('stats.selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {hasGroups ? (
            <>
              {expenseCategories.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{t('expense')}</SelectLabel>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {incomeCategories.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{t('income')}</SelectLabel>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </>
          ) : (
            allCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedCategoryId && chartData.length > 0 ? (
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={45}
              tickFormatter={(v) => v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString()}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
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
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'white', strokeWidth: 2, stroke: 'var(--color-amount)' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
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
