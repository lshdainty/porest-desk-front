import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Wallet, Timer } from 'lucide-react'
import type { DashboardSummary } from '@/features/dashboard/api/dashboardApi'

interface Props {
  data: DashboardSummary
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const SummaryCardsRow = ({ data }: Props) => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  const { todoSummary, expenseSummary, timerSummary } = data
  const totalTodos = todoSummary.totalCount
  const completedTodos = todoSummary.completedCount
  const progressPercent = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  const cards = [
    {
      title: t('summary.todoProgress'),
      value: `${completedTodos}/${totalTodos}`,
      sub: `${progressPercent}%`,
      progress: progressPercent,
      icon: <CheckSquare size={20} />,
      color: 'bg-accent-blue/10 text-accent-blue',
      path: '/desk/todo',
    },
    {
      title: t('summary.monthlyExpense'),
      value: formatCurrency(expenseSummary.monthlyExpense),
      sub: `${t('expense.net')}: ${formatCurrency(expenseSummary.monthlyIncome - expenseSummary.monthlyExpense)}`,
      icon: <Wallet size={20} />,
      color: 'bg-accent-red/10 text-accent-red',
      path: '/desk/expense',
    },
    {
      title: t('summary.focusTime'),
      value: formatTime(timerSummary.todayFocusSeconds),
      sub: `${timerSummary.todaySessionCount} ${t('timer.sessions')}`,
      icon: <Timer size={20} />,
      color: 'bg-accent-purple/10 text-accent-purple',
      path: '/desk/timer',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => navigate(card.path)}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
            <div className={`rounded-lg p-2 ${card.color}`}>{card.icon}</div>
          </div>
          <div>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
          {card.progress !== undefined && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent-blue transition-all"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
