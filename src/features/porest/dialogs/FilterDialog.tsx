import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Asset } from '@/entities/asset'
import type { ExpenseCategory, ExpenseType } from '@/entities/expense'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Toggle } from '@/shared/ui/toggle'
import { TxTypeToggle, type TxTypeOption } from '@/shared/ui/tx-type-toggle'

export type FilterPeriod = 'week' | 'month' | '3m' | 'custom'

export interface FilterValue {
  period: FilterPeriod
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  startDate: string
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  endDate: string
  types: ExpenseType[]
  categoryIds: number[]
  assetIds: number[]
  min: string
  max: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTER: FilterValue = {
  period: 'custom',
  startDate: '',
  endDate: '',
  types: ['EXPENSE', 'INCOME'],
  categoryIds: [],
  assetIds: [],
  min: '',
  max: '',
}

const PERIODS: { v: FilterPeriod; lKey: string }[] = [
  { v: 'week', lKey: 'filter.period.week' },
  { v: 'month', lKey: 'filter.period.month' },
  { v: '3m', lKey: 'stats.period3m' },
  { v: 'custom', lKey: 'filter.period.custom' },
]

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

function pad2(n: number): string { return String(n).padStart(2, '0') }
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
/** 종료일=오늘, 시작일=오늘 − 1개월 */
function defaultCustomRange(): { startDate: string; endDate: string } {
  const today = new Date()
  const start = new Date(today)
  start.setMonth(start.getMonth() - 1)
  return { startDate: fmtYmd(start), endDate: fmtYmd(today) }
}

export function FilterDialog({
  initial,
  categories,
  assets,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null
  categories: ExpenseCategory[]
  assets: Asset[]
  onClose: () => void
  onApply: (v: FilterValue) => void
  mobile: boolean
}) {
  const { t } = useTranslation('expense')
  const TYPES: TxTypeOption[] = [
    { value: 'EXPENSE', label: t('expense') },
    { value: 'INCOME', label: t('income') },
  ]
  const start = initial ?? DEFAULT_FILTER
  const [period, setPeriod] = useState<FilterPeriod>(start.period)
  const initialRange = useMemo(() => {
    if (start.startDate && start.endDate) {
      return { startDate: start.startDate, endDate: start.endDate }
    }
    return defaultCustomRange()
  }, [start.startDate, start.endDate])
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)

  // 'custom' 전환 시 값 비어있으면 기본(오늘~-1개월) 세팅
  const selectPeriod = (p: FilterPeriod) => {
    if (p === 'custom') {
      const def = defaultCustomRange()
      if (!startDate) setStartDate(def.startDate)
      if (!endDate) setEndDate(def.endDate)
    }
    setPeriod(p)
  }
  const [types, setTypes] = useState<ExpenseType[]>(start.types)
  const [categoryIds, setCategoryIds] = useState<number[]>(start.categoryIds)
  const [assetIds, setAssetIds] = useState<number[]>(start.assetIds)
  const [min, setMin] = useState(start.min)
  const [max, setMax] = useState(start.max)

  // 탑레벨(부모 없는) 카테고리만 필터 그리드로 노출
  const parentCategories = useMemo(
    () => categories.filter(c => c.parentRowId == null).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  )

  const reset = () => {
    setPeriod(DEFAULT_FILTER.period)
    setStartDate('')
    setEndDate('')
    setTypes(DEFAULT_FILTER.types)
    setCategoryIds([])
    setAssetIds([])
    setMin('')
    setMax('')
  }

  const apply = () => onApply({
    period,
    startDate: period === 'custom' ? startDate : '',
    endDate: period === 'custom' ? endDate : '',
    types,
    categoryIds,
    assetIds,
    min,
    max,
  })

  const customInvalid = period === 'custom'
    && startDate !== '' && endDate !== '' && startDate > endDate

  const Footer = (
    <ModalFooter
      leftSlot={
        <Button variant="ghost" size="md" flush="left" onClick={reset}>
          {t('filter.reset')}
        </Button>
      }
      onCancel={onClose}
      onSave={apply}
      saveLabel={t('filter.apply')}
      saveDisabled={customInvalid}
    />
  )

  return (
    <ModalShell title={t('filter.title')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t('filter.period')}</FieldLabel>
        <Tabs
          value={period}
          onValueChange={(v) => v && selectPeriod(v as FilterPeriod)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {PERIODS.map(o => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {t(o.lKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {period === 'custom' && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <InputDatePicker
                value={startDate}
                onValueChange={setStartDate}
                placeholder={t('filter.startDate')}
              />
              <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
              <InputDatePicker
                value={endDate}
                onValueChange={setEndDate}
                placeholder={t('filter.endDate')}
              />
            </div>
            {customInvalid && (
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-expense)', marginTop: 6 }}>
                {t('filter.dateError')}
              </div>
            )}
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t('filter.txType')}</FieldLabel>
        <TxTypeToggle
          options={TYPES}
          value={types}
          onChange={(v) => setTypes(v as ExpenseType[])}
          mode="multi"
        />
      </Field>

      {parentCategories.length > 0 && (
        <Field style={{ marginBottom: 16 }}>
          <FieldLabel>
            {t('category')}
            {categoryIds.length > 0 && (
              <span style={{ color: 'var(--fg-brand-strong)', fontWeight: '600', marginLeft: 4 }}>
                · {t('filter.countSelected', { count: categoryIds.length })}
              </span>
            )}
          </FieldLabel>
          <CategoryGrid>
            {parentCategories.map(c => (
              <CategoryTile
                key={c.rowId}
                name={c.categoryName}
                color={c.color ?? undefined}
                icon={c.icon}
                active={categoryIds.includes(c.rowId)}
                onClick={() => setCategoryIds(toggleIn(categoryIds, c.rowId))}
              />
            ))}
          </CategoryGrid>
        </Field>
      )}

      {assets.length > 0 && (
        <Field style={{ marginBottom: 16 }}>
          <FieldLabel>
            {t('accountCard')}
            {assetIds.length > 0 && (
              <span style={{ color: 'var(--fg-brand-strong)', fontWeight: '600', marginLeft: 4 }}>
                · {t('filter.countSelected', { count: assetIds.length })}
              </span>
            )}
          </FieldLabel>
          {/* 다중선택 필터 칩 — spec toggle.md: outline Toggle + radius-md(둥근 사각형). pill 아님. */}
          <div className="flex flex-wrap gap-2">
            {assets.map((a) => (
              <Toggle
                key={a.rowId}
                variant="outline"
                size="sm"
                pressed={assetIds.includes(a.rowId)}
                onPressedChange={() => setAssetIds(toggleIn(assetIds, a.rowId))}
              >
                {a.assetName}
              </Toggle>
            ))}
          </div>
        </Field>
      )}

      <Field>
        <FieldLabel>{t('filter.amountRange')}</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <Input
            className="num"
            value={min}
            onChange={e => setMin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('filter.minAmount')}
            inputMode="numeric"
          />
          <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
          <Input
            className="num"
            value={max}
            onChange={e => setMax(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('filter.maxAmount')}
            inputMode="numeric"
          />
        </div>
      </Field>
    </ModalShell>
  )
}
