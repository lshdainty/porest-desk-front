import { SpeedDial, type SpeedDialAction } from '@/shared/ui/speed-dial/SpeedDial'
import { Button } from '@/shared/ui/button'
import { WIDGETS } from '@/features/dashboard/lib/constants'
import { useDashboardContext } from '@/features/dashboard/model/DashboardContext'
import WidgetWrapper from '@/features/dashboard/ui/WidgetWrapper'
import { cn } from '@/shared/lib'
import { GripVertical, Pencil, Plus, Save, Settings, X } from 'lucide-react'
import { useMemo } from 'react'
import { Responsive, useContainerWidth, type Layout, type ResponsiveLayouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useTranslation } from 'react-i18next'

// Widget components
import { GreetingWidget } from '@/features/dashboard/ui/widgets/GreetingWidget'
import { TodoSummaryWidget } from '@/features/dashboard/ui/widgets/TodoSummaryWidget'
import { ExpenseSummaryWidget } from '@/features/dashboard/ui/widgets/ExpenseSummaryWidget'
import { UpcomingEventsWidget } from '@/features/dashboard/ui/widgets/UpcomingEventsWidget'
import { ExpenseTrendWidget } from '@/features/dashboard/ui/widgets/ExpenseTrendWidget'
import { QuickStatsWidget } from '@/features/dashboard/ui/widgets/QuickStatsWidget'
import { ExpenseCategoryWidget } from '@/features/dashboard/ui/widgets/ExpenseCategoryWidget'
import { MonthlyBudgetWidget } from '@/features/dashboard/ui/widgets/MonthlyBudgetWidget'
import { AssetOverviewWidget } from '@/features/dashboard/ui/widgets/AssetOverviewWidget'
import { MonthlyCompareWidget } from '@/features/dashboard/ui/widgets/MonthlyCompareWidget'
import { MiniCalendarWidget } from '@/features/dashboard/ui/widgets/MiniCalendarWidget'
import { TodayScheduleWidget } from '@/features/dashboard/ui/widgets/TodayScheduleWidget'
import { DDayWidget } from '@/features/dashboard/ui/widgets/DDayWidget'
import { RecentTodosWidget } from '@/features/dashboard/ui/widgets/RecentTodosWidget'
import { PinnedMemosWidget } from '@/features/dashboard/ui/widgets/PinnedMemosWidget'
import { TimerMiniWidgetWrapper } from '@/features/dashboard/ui/widgets/TimerMiniWidgetWrapper'
import { CalculatorMiniWidgetWrapper } from '@/features/dashboard/ui/widgets/CalculatorMiniWidgetWrapper'
import { YearOverYearDashWidget } from '@/features/dashboard/ui/widgets/YearOverYearDashWidget'
import { CategoryTrendDashWidget } from '@/features/dashboard/ui/widgets/CategoryTrendDashWidget'
import { BudgetVsActualDashWidget } from '@/features/dashboard/ui/widgets/BudgetVsActualDashWidget'
import { MerchantAnalysisDashWidget } from '@/features/dashboard/ui/widgets/MerchantAnalysisDashWidget'
import { AssetUsageDashWidget } from '@/features/dashboard/ui/widgets/AssetUsageDashWidget'
import { PaymentMethodWidget } from '@/features/dashboard/ui/widgets/PaymentMethodWidget'
import { DailyExpenseCalendarWidget } from '@/features/dashboard/ui/widgets/DailyExpenseCalendarWidget'
import { SavingsRateWidget } from '@/features/dashboard/ui/widgets/SavingsRateWidget'

const DashboardContent = () => {
  const { t } = useTranslation('dashboard')
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1280,
  })
  const {
    layouts,
    activeWidgets,
    isEditing,
    isToolboxOpen,
    draggedWidget,
    handleLayoutChange,
    handleBreakpointChange,
    toggleWidget,
    resetLayout,
    onDrop,
    handleSave,
    handleCancel,
    setIsEditing,
    setIsToolboxOpen,
    setDraggedWidget,
  } = useDashboardContext()

  const speedDialActions: SpeedDialAction[] = useMemo(() => {
    if (isEditing) {
      return [
        {
          icon: <Save className="h-5 w-5" />,
          label: t('save'),
          onClick: handleSave,
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700',
        },
        {
          icon: <X className="h-5 w-5" />,
          label: t('cancel'),
          onClick: handleCancel,
          variant: 'destructive' as const,
        },
        {
          icon: <Settings className="h-5 w-5" />,
          label: isToolboxOpen ? t('closeSettings') : t('widgetSettings'),
          onClick: () => setIsToolboxOpen(!isToolboxOpen),
          variant: 'secondary' as const,
        },
      ]
    }
    return [
      {
        icon: <Pencil className="h-5 w-5" />,
        label: t('edit'),
        onClick: () => setTimeout(() => setIsEditing(true), 300),
        variant: 'default' as const,
      },
    ]
  }, [isEditing, isToolboxOpen, handleSave, handleCancel, setIsEditing, setIsToolboxOpen, t])

  const widgetConfig: Record<string, { title: string; component: React.ReactNode }> = {
    greeting: { title: t('widget.greeting'), component: <GreetingWidget /> },
    'todo-summary': { title: t('widget.todoSummary'), component: <TodoSummaryWidget /> },
    'expense-summary': { title: t('widget.expenseSummary'), component: <ExpenseSummaryWidget /> },
    'upcoming-events': { title: t('widget.upcomingEvents'), component: <UpcomingEventsWidget /> },
    'expense-trend': { title: t('widget.expenseTrend'), component: <ExpenseTrendWidget /> },
    'quick-stats': { title: t('widget.quickStats'), component: <QuickStatsWidget /> },
    'expense-category': { title: t('widget.expenseCategory'), component: <ExpenseCategoryWidget /> },
    'monthly-budget': { title: t('widget.monthlyBudget'), component: <MonthlyBudgetWidget /> },
    'asset-overview': { title: t('widget.assetOverview'), component: <AssetOverviewWidget /> },
    'monthly-compare': { title: t('widget.monthlyCompare'), component: <MonthlyCompareWidget /> },
    'mini-calendar': { title: t('widget.miniCalendar'), component: <MiniCalendarWidget /> },
    'today-schedule': { title: t('widget.todaySchedule'), component: <TodayScheduleWidget /> },
    dday: { title: t('widget.dday'), component: <DDayWidget /> },
    'recent-todos': { title: t('widget.recentTodos'), component: <RecentTodosWidget /> },
    'pinned-memos': { title: t('widget.pinnedMemos'), component: <PinnedMemosWidget /> },
    'year-over-year': { title: t('widget.yearOverYear'), component: <YearOverYearDashWidget /> },
    'category-trend': { title: t('widget.categoryTrend'), component: <CategoryTrendDashWidget /> },
    'budget-vs-actual': { title: t('widget.budgetVsActual'), component: <BudgetVsActualDashWidget /> },
    'merchant-analysis': { title: t('widget.merchantAnalysis'), component: <MerchantAnalysisDashWidget /> },
    'asset-usage': { title: t('widget.assetUsage'), component: <AssetUsageDashWidget /> },
    'payment-method': { title: t('widget.paymentMethod'), component: <PaymentMethodWidget /> },
    'daily-expense-calendar': { title: t('widget.dailyExpenseCalendar'), component: <DailyExpenseCalendarWidget /> },
    'savings-rate': { title: t('widget.savingsRate'), component: <SavingsRateWidget /> },
    'timer-mini': { title: t('widget.timerMini'), component: <TimerMiniWidgetWrapper /> },
    'calculator-mini': { title: t('widget.calculatorMini'), component: <CalculatorMiniWidgetWrapper /> },
  }

  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

  const constrainedLayouts = useMemo(() => {
    const newLayouts: ResponsiveLayouts = {}
    Object.keys(layouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = ((layouts[breakpoint] || []) as Layout)
        .filter((item) => widgetConfig[item.i])
        .map((item) => {
          const widgetDef = WIDGETS.find((w) => w.id === item.i)
          if (widgetDef) {
            const breakpointCols = cols[breakpoint as keyof typeof cols] || 12
            return {
              ...item,
              minW: Math.min(widgetDef.minW, breakpointCols),
              maxW: widgetDef.maxW,
              minH: widgetDef.minH,
              maxH: widgetDef.maxH,
            }
          }
          return item
        })
    })
    return newLayouts
  }, [layouts])

  return (
    <div className="relative flex flex-col">
      <div ref={containerRef}>
        {mounted && (
          <Responsive
            className="layout min-h-screen"
            layouts={constrainedLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={cols}
            rowHeight={30}
            width={width}
            onLayoutChange={(layout, layouts) => handleLayoutChange(layout, layouts as Record<string, unknown[]>)}
            onBreakpointChange={(bp, _cols) => handleBreakpointChange(bp)}
            margin={[16, 16]}
            dragConfig={{ enabled: isEditing, handle: '.drag-handle' }}
            resizeConfig={{ enabled: isEditing }}
            dropConfig={{ enabled: isEditing }}
            onDrop={(layout, item, e) => onDrop(layout as unknown[], item, e)}
            droppingItem={
              draggedWidget
                ? { i: draggedWidget.id, x: 0, y: 0, w: draggedWidget.defaultW, h: draggedWidget.defaultH }
                : undefined
            }
          >
            {activeWidgets
              .filter((widgetId) => widgetConfig[widgetId])
              .map((widgetId) => {
                const config = widgetConfig[widgetId]
                if (!config) return null
                return (
                  <div key={widgetId}>
                    <WidgetWrapper
                      title={config.title}
                      onClose={() => toggleWidget(widgetId)}
                      isEditing={isEditing}
                    >
                      {config.component}
                    </WidgetWrapper>
                  </div>
                )
              })}
          </Responsive>
        )}
      </div>

      {/* Speed Dial Button */}
      <SpeedDial
        actions={speedDialActions}
        mainIcon={isEditing ? <Settings className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        activeIcon={<X className="h-6 w-6" />}
      />

      {/* Toolbox Panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 top-0 z-40 w-full transform overflow-y-auto border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out md:w-80',
          isEditing && isToolboxOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="p-6 pt-20">
          <h2 className="mb-6 text-lg font-semibold">{t('widgetSettings')}</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="mb-4 text-sm font-medium text-muted-foreground">{t('availableWidgets')}</h4>
              <p className="mb-4 text-xs text-muted-foreground">{t('widgetDragHint')}</p>

              {WIDGETS.map((widget) => {
                const isActive = activeWidgets.includes(widget.id)
                return (
                  <div
                    key={widget.id}
                    className={cn(
                      'flex select-none items-center justify-between rounded-lg border bg-card p-3 transition-colors',
                      isActive
                        ? 'cursor-not-allowed bg-muted opacity-50'
                        : 'cursor-grab hover:bg-accent/50 active:cursor-grabbing',
                    )}
                    draggable={!isActive}
                    onDragStart={(e) => {
                      if (isActive) {
                        e.preventDefault()
                        return
                      }
                      setDraggedWidget(widget)
                      e.dataTransfer.setData('text/plain', '')
                    }}
                    onDragEnd={() => {
                      setDraggedWidget(null)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t(widget.labelKey)}</span>
                    </div>
                    {isActive && (
                      <span className="text-xs font-medium text-green-600">{t('inUse')}</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 border-t pt-8">
              <Button variant="destructive" className="w-full" onClick={resetLayout}>
                {t('layoutReset')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardContent
