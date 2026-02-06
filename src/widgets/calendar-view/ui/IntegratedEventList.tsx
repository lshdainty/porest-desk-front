import { useTranslation } from 'react-i18next'
import { Calendar, CheckSquare, Wallet, Timer } from 'lucide-react'
import { cn, formatDate, formatCurrency, formatDuration } from '@/shared/lib'
import { isSameDay } from '@/shared/lib/date'
import type { CalendarEvent } from '@/entities/calendar'
import type { Todo } from '@/entities/todo'
import type { Expense } from '@/entities/expense'
import type { TimerSession } from '@/entities/timer'
import { EventBadge } from './EventBadge'

interface IntegratedEventListProps {
  selectedDate: Date
  events: CalendarEvent[]
  todos: Todo[]
  expenses: Expense[]
  timerSessions: TimerSession[]
  onEventClick?: (event: CalendarEvent) => void
  onTodoToggle?: (id: number) => void
}

const formatTimerDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const IntegratedEventList = ({
  selectedDate,
  events,
  todos,
  expenses,
  timerSessions,
  onEventClick,
  onTodoToggle,
}: IntegratedEventListProps) => {
  const { t } = useTranslation('calendar')

  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    return selectedDate >= new Date(eventStart.toDateString()) &&
      selectedDate <= new Date(eventEnd.toDateString())
  })

  const dayTodos = todos.filter((todo) => {
    if (!todo.dueDate) return false
    return isSameDay(new Date(todo.dueDate), selectedDate)
  })

  const dayExpenses = expenses.filter((expense) => {
    return isSameDay(new Date(expense.expenseDate), selectedDate)
  })

  const dayTimerSessions = timerSessions.filter((session) => {
    return isSameDay(new Date(session.startTime), selectedDate)
  })

  const hasItems = dayEvents.length > 0 || dayTodos.length > 0 || dayExpenses.length > 0 || dayTimerSessions.length > 0

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {formatDate(selectedDate, 'PPP')}
      </h3>

      {!hasItems && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t('noEvents')}
        </p>
      )}

      {dayEvents.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar size={12} />
            <span>{t('events')}</span>
            <span className="ml-auto text-[10px]">{dayEvents.length}</span>
          </div>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <button
                key={event.rowId}
                onClick={() => onEventClick?.(event)}
                className="flex w-full items-center gap-2 rounded-md border p-2.5 text-left hover:bg-muted transition-colors"
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  {event.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {event.isAllDay
                        ? t('allDay')
                        : `${formatDate(event.startDate, 'HH:mm')} - ${formatDate(event.endDate, 'HH:mm')}`}
                    </span>
                    <EventBadge
                      title={t(`eventType.${event.eventType}`)}
                      color={event.color}
                      eventType={event.eventType}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {dayTodos.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CheckSquare size={12} />
            <span>{t('todos')}</span>
            <span className="ml-auto text-[10px]">{dayTodos.length}</span>
          </div>
          <div className="space-y-1">
            {dayTodos.map((todo) => (
              <button
                key={todo.rowId}
                onClick={() => onTodoToggle?.(todo.rowId)}
                className="flex w-full items-center gap-2 rounded-md border p-2.5 text-left hover:bg-muted transition-colors"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    todo.status === 'COMPLETED'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {todo.status === 'COMPLETED' && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm',
                      todo.status === 'COMPLETED' && 'line-through text-muted-foreground'
                    )}
                  >
                    {todo.title}
                  </p>
                </div>
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    todo.priority === 'HIGH' && 'bg-red-500',
                    todo.priority === 'MEDIUM' && 'bg-yellow-500',
                    todo.priority === 'LOW' && 'bg-blue-500'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {dayExpenses.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wallet size={12} />
            <span>{t('expenses')}</span>
            <span className="ml-auto text-[10px]">{dayExpenses.length}</span>
          </div>
          <div className="space-y-1">
            {dayExpenses.map((expense) => (
              <div
                key={expense.rowId}
                className="flex w-full items-center gap-2 rounded-md border p-2.5 transition-colors"
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: expense.categoryColor ?? '#6b7280' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {expense.categoryName ?? expense.description ?? '-'}
                  </p>
                  {expense.description && expense.categoryName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.description}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    expense.expenseType === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {expense.expenseType === 'INCOME' ? '+' : '-'}
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dayTimerSessions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Timer size={12} />
            <span>{t('timerSessions')}</span>
            <span className="ml-auto text-[10px]">{dayTimerSessions.length}</span>
          </div>
          <div className="space-y-1">
            {dayTimerSessions.map((session) => (
              <div
                key={session.rowId}
                className="flex w-full items-center gap-2 rounded-md border p-2.5 transition-colors"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white',
                    session.timerType === 'POMODORO' && 'bg-red-500',
                    session.timerType === 'STOPWATCH' && 'bg-blue-500',
                    session.timerType === 'COUNTDOWN' && 'bg-purple-500'
                  )}
                >
                  {session.timerType.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {session.label ?? session.timerType}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(session.startTime, 'HH:mm')}
                    {session.endTime ? ` - ${formatDate(session.endTime, 'HH:mm')}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-mono font-semibold text-foreground">
                  {formatTimerDuration(session.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
