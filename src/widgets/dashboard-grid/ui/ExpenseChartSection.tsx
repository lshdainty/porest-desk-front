import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Wallet, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardSummary } from '@/features/dashboard/api/dashboardApi'

interface Props {
  data: DashboardSummary
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const ExpenseChartSection = ({ data }: Props) => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  const { expenseTrend, expenseSummary } = data

  const chartData = expenseTrend.map((d) => ({
    date: new Date(d.date).getDate() + '일',
    income: d.income,
    expense: d.expense,
  }))

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-accent-red" />
          <h3 className="font-semibold">{t('chart.title')}</h3>
          <span className="text-xs text-muted-foreground">{t('chart.last30days')}</span>
        </div>
        <button
          onClick={() => navigate('/desk/expense')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>
      <div className="flex-1 p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'income' ? t('chart.income') : t('chart.expense'),
                ]}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="oklch(0.65 0.19 145)"
                fill="oklch(0.65 0.19 145 / 0.1)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="oklch(0.63 0.22 25)"
                fill="oklch(0.63 0.22 25 / 0.1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-4 border-t pt-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t('chart.income')}</span>
            <p className="font-semibold text-accent-green">{formatCurrency(expenseSummary.monthlyIncome)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('chart.expense')}</span>
            <p className="font-semibold text-accent-red">{formatCurrency(expenseSummary.monthlyExpense)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('expense.net')}</span>
            <p className="font-semibold">{formatCurrency(expenseSummary.monthlyIncome - expenseSummary.monthlyExpense)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
