import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/shared/lib'
import type { CategoryBreakdown } from '@/entities/expense'

interface ExpenseChartProps {
  breakdown: CategoryBreakdown[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

export const ExpenseChart = ({ breakdown }: ExpenseChartProps) => {
  if (breakdown.length === 0) return null

  const data = breakdown.map((item) => ({
    name: item.categoryName,
    value: item.totalAmount,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
