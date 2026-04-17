import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { useExpenses } from '@/features/expense'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CARD: '#3b82f6',
  CASH: '#10b981',
  TRANSFER: '#8b5cf6',
  OTHER: '#6b7280',
}

const PAYMENT_METHOD_KEYS: Record<string, string> = {
  CARD: 'payment.card',
  CASH: 'payment.cash',
  TRANSFER: 'payment.transfer',
  OTHER: 'payment.other',
}

export const PaymentMethodWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
    new Date(year, month, 0).getDate(),
  ).padStart(2, '0')}`

  const { data: expenses, isLoading } = useExpenses({
    startDate,
    endDate,
    expenseType: 'EXPENSE',
  })

  // 결제수단별 집계
  const { chartData, total } = useMemo(() => {
    if (!expenses || expenses.length === 0) return { chartData: [], total: 0 }

    const methodMap = new Map<string, number>()

    expenses.forEach((expense) => {
      const method = expense.paymentMethod || 'OTHER'
      methodMap.set(method, (methodMap.get(method) ?? 0) + expense.amount)
    })

    const totalAmount = Array.from(methodMap.values()).reduce((sum, v) => sum + v, 0)
    if (totalAmount === 0) return { chartData: [], total: 0 }

    const items = Array.from(methodMap.entries())
      .map(([method, amount]) => ({
        name: t(PAYMENT_METHOD_KEYS[method] ?? 'payment.other'),
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
      config[item.name] = {
        label: item.name,
        color: item.fill,
      }
    })
    return config
  }, [chartData])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* 도넛 차트 */}
      <div className="relative flex shrink-0 items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square h-full max-h-[200px] w-full">
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
              stroke="var(--background)"
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
            <p className="text-xs text-muted-foreground">{t('widget.totalExpense')}</p>
          </div>
        </div>
      </div>

      {/* 상세 리스트 */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>{t('payment.method')}</span>
          <span>{t('payment.amountRatio')}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chartData.map((item) => (
            <div
              key={item.method}
              className="flex items-center gap-3 border-b py-3 last:border-b-0"
            >
              <div
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="text-sm font-bold tabular-nums">{formatCurrency(item.value)}</span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
