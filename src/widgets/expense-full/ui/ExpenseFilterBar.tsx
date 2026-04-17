import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Badge } from '@/shared/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select'
import type { ExpenseSearchParams } from '@/features/expense'
import type { ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'

interface ExpenseFilterBarProps {
  categories: ExpenseCategory[]
  assets: Asset[]
  filters: ExpenseSearchParams
  onFiltersChange: (filters: ExpenseSearchParams) => void
  onClear: () => void
}

export const ExpenseFilterBar = ({
  categories,
  assets,
  filters,
  onFiltersChange,
  onClear,
}: ExpenseFilterBarProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()
  const [showFilters, setShowFilters] = useState(false)
  const [keywordInput, setKeywordInput] = useState(filters.keyword || '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFilterCount = [
    filters.expenseType,
    filters.categoryId,
    filters.assetId,
    filters.merchant,
    filters.minAmount,
    filters.maxAmount,
    filters.startDate,
    filters.endDate,
  ].filter((v) => v !== undefined && v !== '' && v !== 0).length

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = keywordInput.trim()
      if (trimmed !== (filters.keyword || '')) {
        onFiltersChange({ ...filters, keyword: trimmed || undefined })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keywordInput])

  const updateFilter = <K extends keyof ExpenseSearchParams>(
    key: K,
    value: ExpenseSearchParams[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleClear = () => {
    setKeywordInput('')
    setShowFilters(false)
    onClear()
  }

  // 카테고리를 부모-자식 구조로 정렬
  const sortedCategories = (() => {
    const parents = categories.filter((c) => !c.parentRowId)
    const result: ExpenseCategory[] = []
    parents.forEach((parent) => {
      result.push(parent)
      categories
        .filter((c) => c.parentRowId === parent.rowId)
        .forEach((child) => result.push(child))
    })
    return result
  })()

  const hasAnyFilter = activeFilterCount > 0 || !!filters.keyword

  // Preset filter helpers
  const applyPreset = (preset: Partial<ExpenseSearchParams>) => {
    onClear()
    onFiltersChange(preset)
  }

  const getThisWeekRange = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }

  const getThisMonthRange = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const lastDay = new Date(year, month, 0).getDate()
    return {
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  // Active filter chips
  const activeChips: { label: string; onRemove: () => void }[] = []
  if (filters.expenseType) {
    activeChips.push({
      label: `${t('filter.type')}: ${t(filters.expenseType === 'EXPENSE' ? 'expense' : 'income')}`,
      onRemove: () => updateFilter('expenseType', undefined),
    })
  }
  if (filters.categoryId) {
    const cat = categories.find((c) => c.rowId === filters.categoryId)
    if (cat) {
      activeChips.push({
        label: `${t('category')}: ${cat.categoryName}`,
        onRemove: () => updateFilter('categoryId', undefined),
      })
    }
  }
  if (filters.startDate || filters.endDate) {
    activeChips.push({
      label: `${t('filter.dateRange')}: ${filters.startDate || '...'} ~ ${filters.endDate || '...'}`,
      onRemove: () => {
        onFiltersChange({ ...filters, startDate: undefined, endDate: undefined })
      },
    })
  }
  if (filters.minAmount || filters.maxAmount) {
    activeChips.push({
      label: `${t('filter.amountRange')}: ${filters.minAmount?.toLocaleString() || '...'} ~ ${filters.maxAmount?.toLocaleString() || '...'}`,
      onRemove: () => {
        onFiltersChange({ ...filters, minAmount: undefined, maxAmount: undefined })
      },
    })
  }

  return (
    <div className="space-y-2">
      {/* Preset filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => applyPreset(getThisWeekRange())}
          className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {t('filter.thisWeek')}
        </button>
        <button
          onClick={() => applyPreset(getThisMonthRange())}
          className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {t('filter.thisMonth')}
        </button>
        <button
          onClick={() => applyPreset({ minAmount: 50000, expenseType: 'EXPENSE' })}
          className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {t('filter.largeExpenses')}
        </button>
      </div>

      {/* 검색바 + 필터 토글 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {keywordInput && (
            <button
              onClick={() => setKeywordInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'relative flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors',
            showFilters
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-input text-muted-foreground hover:text-foreground',
          )}
        >
          <SlidersHorizontal size={14} />
          {!isMobile && t('filter.toggle')}
          {activeFilterCount > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </button>
        {hasAnyFilter && (
          <button
            onClick={handleClear}
            className="h-9 shrink-0 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('filter.clear')}
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {!showFilters && activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <Badge
              key={chip.label}
              variant="secondary"
              className="gap-1 pr-1 text-xs font-normal"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 필터 패널 */}
      {showFilters && (
        <div className={cn(
          'rounded-lg border bg-muted/20 p-3',
          isMobile ? 'space-y-3' : 'grid grid-cols-2 gap-3',
        )}>
          {/* 유형 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('filter.type')}</label>
            <div className="flex gap-1">
              {[
                { value: undefined, label: t('filter.typeAll') },
                { value: 'INCOME', label: t('income') },
                { value: 'EXPENSE', label: t('expense') },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => updateFilter('expenseType', opt.value)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    filters.expenseType === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground border',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('category')}</label>
            <Select
              value={filters.categoryId?.toString() || 'all'}
              onValueChange={(v) => updateFilter('categoryId', v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.typeAll')}</SelectItem>
                {sortedCategories.map((cat) => (
                  <SelectItem key={cat.rowId} value={cat.rowId.toString()}>
                    <span className={cn('inline-flex items-center gap-1.5', cat.parentRowId && 'pl-3')}>
                      {renderIcon(cat.icon, '', 14)}
                      {cat.categoryName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 자산 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('form.asset')}</label>
            <Select
              value={filters.assetId?.toString() || 'all'}
              onValueChange={(v) => updateFilter('assetId', v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.typeAll')}</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.rowId} value={asset.rowId.toString()}>
                    <span className="inline-flex items-center gap-1.5">
                      {renderIcon(asset.icon, '', 14)}
                      {asset.assetName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 거래처 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('form.merchant')}</label>
            <Input
              value={filters.merchant || ''}
              onChange={(e) => updateFilter('merchant', e.target.value || undefined)}
              placeholder={t('form.merchantPlaceholder')}
              className="h-9 text-sm"
            />
          </div>

          {/* 기간 */}
          <div className={cn('space-y-1', !isMobile && 'col-span-2')}>
            <label className="text-xs font-medium text-muted-foreground">{t('filter.dateRange')}</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <InputDatePicker
                  value={filters.startDate || ''}
                  onValueChange={(v) => updateFilter('startDate', v || undefined)}
                  placeholder={t('filter.startDate')}
                />
              </div>
              <span className="text-xs text-muted-foreground">~</span>
              <div className="flex-1">
                <InputDatePicker
                  value={filters.endDate || ''}
                  onValueChange={(v) => updateFilter('endDate', v || undefined)}
                  placeholder={t('filter.endDate')}
                />
              </div>
            </div>
          </div>

          {/* 금액 범위 */}
          <div className={cn('space-y-1', !isMobile && 'col-span-2')}>
            <label className="text-xs font-medium text-muted-foreground">{t('filter.amountRange')}</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={filters.minAmount ?? ''}
                onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder={t('filter.minAmount')}
                className="h-9 flex-1 text-sm"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <Input
                type="number"
                value={filters.maxAmount ?? ''}
                onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder={t('filter.maxAmount')}
                className="h-9 flex-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
