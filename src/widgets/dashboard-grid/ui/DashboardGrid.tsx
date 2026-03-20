import { TodoSummaryWidget } from '@/widgets/todo-summary'
import { CalendarTodayWidget } from '@/widgets/calendar-today'
import { TimerMiniWidget } from '@/widgets/timer-mini'
import { ExpenseSummaryWidget } from '@/widgets/expense-summary'
import { MemoQuickWidget } from '@/widgets/memo-quick'
import { CalculatorMiniWidget } from '@/widgets/calculator-mini'
import { WidgetWrapper } from './WidgetWrapper'

export const DashboardGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WidgetWrapper>
        <TodoSummaryWidget />
      </WidgetWrapper>
      <WidgetWrapper>
        <CalendarTodayWidget />
      </WidgetWrapper>
      <WidgetWrapper>
        <TimerMiniWidget />
      </WidgetWrapper>
      <WidgetWrapper>
        <ExpenseSummaryWidget />
      </WidgetWrapper>
      <WidgetWrapper>
        <MemoQuickWidget />
      </WidgetWrapper>
      <WidgetWrapper>
        <CalculatorMiniWidget />
      </WidgetWrapper>
    </div>
  )
}
