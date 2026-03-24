import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import type { Expense } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CARD: '#3b82f6',
  CASH: '#10b981',
  TRANSFER: '#8b5cf6',
  OTHER: '#6b7280',
}

interface PaymentMethodChartProps {
  expenses: Expense[]
}

export const PaymentMethodChart = ({ expenses }: PaymentMethodChartProps) => {
  const { t } = useTranslation('expense')

  const PAYMENT_LABELS: Record<string, string> = {
    CARD: t('form.paymentMethod.CARD'),
    CASH: t('form.paymentMethod.CASH'),
    TRANSFER: t('form.paymentMethod.TRANSFER'),
    OTHER: t('form.paymentMethod.OTHER'),
  }

  const { chartData, total } = useMemo(() => {
    const expenseOnly = expenses.filter((e) => e.expenseType === 'EXPENSE')
    if (expenseOnly.length === 0) return { chartData: [], total: 0 }

    const methodMap = new Map<string, number>()
    expenseOnly.forEach((e) => {
      const method = e.paymentMethod || 'OTHER'
      methodMap.set(method, (methodMap.get(method) ?? 0) + e.amount)
    })

    const totalAmount = Array.from(methodMap.values()).reduce((sum, v) => sum + v, 0)
    if (totalAmount === 0) return { chartData: [], total: 0 }

    const items = Array.from(methodMap.entries())
      .map(([method, amount]) => ({
        name: PAYMENT_LABELS[method] ?? PAYMENT_LABELS['OTHER'] ?? method,
        value: amount,
        percentage: Math.round((amount / totalAmount) * 1000) / 10,
        fill: PAYMENT_METHOD_COLORS[method] ?? '#6b7280',
        method,
      }))
      .sort((a, b) => b.value - a.value)

    return { chartData: items, total: totalAmount }
  }, [expenses, t])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    chartData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.fill ?? '#6b7280' }
    })
    return config
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="relative flex items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square max-h-[200px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {formatCurrency(value as number)}
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              strokeWidth={3}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {chartData.map((item) => (
          <div key={item.method} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
            <div className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(item.value)}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
