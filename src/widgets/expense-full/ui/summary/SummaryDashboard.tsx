import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import type {
  StatsPeriod,
  MonthlyAmount,
  CategoryBreakdown,
} from '@/entities/expense'
import {
  useExpenses,
  useYearlySummary,
  useMerchantSummary,
  useAssetExpenseSummary,
  useExpenseBudgets,
  useExpenseCategories,
} from '@/features/expense'
import { SectionOverview } from './SectionOverview'
import { SectionCategory } from './SectionCategory'
import { SectionTrend } from './SectionTrend'
import { SectionBudget } from './SectionBudget'
import { SectionDetailed } from './SectionDetailed'
import { DailyExpenseHeatmap } from './DailyExpenseHeatmap'
import {
  OverviewSkeleton,
  CategorySkeleton,
  TrendSkeleton,
  BudgetSkeleton,
  DetailedSkeleton,
} from './SummarySkeleton'

type SummarySection = 'overview' | 'category' | 'trend' | 'budget' | 'detailed'

interface SummaryDashboardProps {
  year: number
  month: number
  onNavigateToList?: (categoryId?: number) => void
}

function computeDateRange(
  period: StatsPeriod,
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12

  let startMonth = month - (monthCount - 1)
  let startYear = year
  while (startMonth <= 0) {
    startMonth += 12
    startYear--
  }

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`

  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { startDate, endDate }
}

function filterMonthlyAmountsByPeriod(
  monthlyAmounts: MonthlyAmount[] | undefined,
  period: StatsPeriod,
  year: number,
  month: number,
): MonthlyAmount[] {
  if (!monthlyAmounts) return []

  const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12
  const periodMonths: Array<{ year: number; month: number }> = []

  for (let i = monthCount - 1; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y--
    }
    periodMonths.push({ year: y, month: m })
  }

  const currentYearMonths = new Set(
    periodMonths.filter((pm) => pm.year === year).map((pm) => pm.month),
  )

  return monthlyAmounts.filter((ma) => currentYearMonths.has(ma.month))
}

export const SummaryDashboard = ({ year, month, onNavigateToList }: SummaryDashboardProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()
  const [period, setPeriod] = useState<StatsPeriod>('6m')
  const [activeSection, setActiveSection] = useState<SummarySection>('overview')

  const { startDate, endDate } = useMemo(
    () => computeDateRange(period, year, month),
    [period, year, month],
  )

  // 해당 월 날짜 범위
  const lastDay = new Date(year, month, 0).getDate()
  const monthStartDate = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Data fetching - each independently
  const { data: yearlyData, isLoading: loadingYearly } = useYearlySummary(year)
  const { data: prevYearlyData, isLoading: loadingPrevYearly } = useYearlySummary(year - 1)
  const { data: merchantData, isLoading: loadingMerchants } = useMerchantSummary(startDate, endDate)
  const { data: assetData, isLoading: loadingAssets } = useAssetExpenseSummary(startDate, endDate)
  const { data: budgets, isLoading: loadingBudgets } = useExpenseBudgets({ year, month })
  const { data: categories } = useExpenseCategories()
  const { data: monthExpenses, isLoading: loadingExpenses } = useExpenses({
    startDate: monthStartDate,
    endDate: monthEndDate,
  })
  const { data: monthMerchantData } = useMerchantSummary(monthStartDate, monthEndDate)

  // Derived data
  const filteredMonthlyAmounts = useMemo(
    () => filterMonthlyAmountsByPeriod(yearlyData?.monthlyAmounts, period, year, month),
    [yearlyData, period, year, month],
  )

  const categoryNames = useMemo(() => {
    const map: Record<number, string> = {}
    categories?.forEach((c) => { map[c.rowId] = c.categoryName })
    return map
  }, [categories])

  const categoryBreakdown: CategoryBreakdown[] = useMemo(() => {
    if (!yearlyData?.monthlyAmounts) return []
    const currentMonth = yearlyData.monthlyAmounts.find((m) => m.month === month)
    return currentMonth?.categoryBreakdown ?? []
  }, [yearlyData, month])

  // Section loading states
  const overviewLoading = loadingExpenses
  const categoryLoading = loadingYearly
  const trendLoading = loadingYearly || loadingPrevYearly || loadingExpenses
  const budgetLoading = loadingBudgets || loadingYearly
  const detailedLoading = loadingExpenses || loadingMerchants || loadingAssets

  const sections: { key: SummarySection; label: string }[] = [
    { key: 'overview', label: t('stats.sectionOverview', '개요') },
    { key: 'category', label: t('stats.sectionCategory', '카테고리') },
    { key: 'trend', label: t('stats.sectionTrend', '트렌드') },
    { key: 'budget', label: t('stats.sectionBudget', '예산') },
    { key: 'detailed', label: t('stats.sectionDetailed', '상세') },
  ]

  const renderSection = (section: SummarySection) => {
    switch (section) {
      case 'overview':
        if (overviewLoading) return <OverviewSkeleton />
        return <SectionOverview year={year} month={month} expenses={monthExpenses || []} />
      case 'category':
        if (categoryLoading) return <CategorySkeleton />
        return (
          <SectionCategory
            categoryBreakdown={categoryBreakdown}
            categories={categories}
            filteredMonthlyAmounts={filteredMonthlyAmounts}
            onViewTransactions={onNavigateToList}
          />
        )
      case 'trend':
        if (trendLoading) return <TrendSkeleton />
        return (
          <SectionTrend
            expenses={monthExpenses || []}
            filteredMonthlyAmounts={filteredMonthlyAmounts}
            allMonthlyAmounts={yearlyData?.monthlyAmounts ?? []}
            prevYearMonthlyAmounts={prevYearlyData?.monthlyAmounts ?? []}
            year={year}
            month={month}
            period={period}
            onPeriodChange={setPeriod}
          />
        )
      case 'budget':
        if (budgetLoading) return <BudgetSkeleton />
        return (
          <SectionBudget
            budgets={budgets ?? []}
            categoryBreakdown={categoryBreakdown}
            categoryNames={categoryNames}
            categories={categories}
          />
        )
      case 'detailed':
        if (detailedLoading) return <DetailedSkeleton />
        return (
          <SectionDetailed
            expenses={monthExpenses || []}
            merchants={monthMerchantData?.merchants ?? merchantData?.merchants ?? []}
            assets={assetData?.assets ?? []}
          />
        )
      default:
        return null
    }
  }

  // Mobile: section tabs + active section only
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex overflow-x-auto rounded-lg border bg-muted/30 p-1 scrollbar-none">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeSection === section.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
        {renderSection(activeSection)}
        {activeSection === 'overview' && !overviewLoading && (
          <DailyExpenseHeatmap expenses={monthExpenses || []} year={year} month={month} />
        )}
      </div>
    )
  }

  // Desktop: Overview + Category side by side, others collapsible
  return (
    <div className="space-y-4">
      {/* Primary: Overview + Category side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>{renderSection('overview')}</div>
        <div>{renderSection('category')}</div>
      </div>

      {/* Daily Expense Heatmap */}
      {!overviewLoading && (
        <DailyExpenseHeatmap expenses={monthExpenses || []} year={year} month={month} />
      )}

      {/* Secondary: Collapsible sections */}
      {sections.slice(2).map((section) => (
        <Collapsible key={section.key} defaultOpen={section.key === 'trend'}>
          <div className="rounded-xl border">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-muted/30 transition-colors">
              {section.label}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t p-4">
                {renderSection(section.key)}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  )
}
