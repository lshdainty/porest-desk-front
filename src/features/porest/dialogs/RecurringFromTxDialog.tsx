import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Zap, Calendar } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Switch } from '@/shared/ui/switch'
import { money } from '@/shared/lib/porest/format'
import { renderIcon, tileRadius } from '@/shared/lib'
import { useCreateRecurringTransaction } from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import type { Expense } from '@/entities/expense'
import type {
  RecurringFrequency,
  RecurringTransactionFormValues,
} from '@/entities/recurring-transaction'
import { getPaletteByColor } from './CategoryEditDialog'
import { previewNextDates, addYears, todayIso, formatKoreanMonthDay } from './recurring-date'

const FREQS: { v: RecurringFrequency; lKey: string }[] = [
  { v: 'DAILY', lKey: 'freq.DAILY' },
  { v: 'WEEKLY', lKey: 'freq.WEEKLY' },
  { v: 'MONTHLY', lKey: 'freq.MONTHLY' },
  { v: 'YEARLY', lKey: 'freq.YEARLY' },
]

const DOW_LABEL = ['dow.sun', 'dow.mon', 'dow.tue', 'dow.wed', 'dow.thu', 'dow.fri', 'dow.sat']

type EndMode = 'NONE' | 'COUNT' | 'DATE'

type Props = {
  expense: Expense
  onClose: () => void
  onCreated?: (recurringRowId: number) => void
  mobile: boolean
}

export function RecurringFromTxDialog({ expense, onClose, onCreated, mobile }: Props) {
  const { t } = useTranslation('recurring')
  const createMut = useCreateRecurringTransaction()
  const categoriesQ = useExpenseCategories()
  const category = (categoriesQ.data ?? []).find(c => c.rowId === expense.categoryRowId)
  const palette = getPaletteByColor(category?.color)

  const expenseDay = (expense.expenseDate ?? '').slice(0, 10) || todayIso()
  const baseDate = new Date(expenseDay)
  const baseDow = isNaN(baseDate.getTime()) ? 1 : baseDate.getDay() // 0=일~6=토 (UI 인덱스)
  const baseDom = isNaN(baseDate.getTime()) ? 1 : baseDate.getDate()

  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY')
  const [dayOfWeek, setDayOfWeek] = useState<number>(baseDow) // 0~6 (UI 인덱스, 백엔드는 1~7 ISO)
  const [dayOfMonth, setDayOfMonth] = useState<number>(Math.min(31, baseDom))

  const [endMode, setEndMode] = useState<EndMode>('DATE')
  const [endCount, setEndCount] = useState<string>('12')
  const [endDate, setEndDate] = useState<string>(addYears(expenseDay, 1))

  const [autoLog, setAutoLog] = useState(true)
  const [notifyDayBefore, setNotifyDayBefore] = useState(true)

  const nextDates = useMemo(
    () => previewNextDates(expenseDay, frequency, dayOfWeek, dayOfMonth, 3),
    [expenseDay, frequency, dayOfWeek, dayOfMonth],
  )

  const submitting = createMut.isPending
  const ready = !!expenseDay
    && (endMode !== 'COUNT' || Number(endCount) > 0)
    && (endMode !== 'DATE' || !!endDate)

  const handleSave = () => {
    if (!ready) return
    const data: RecurringTransactionFormValues = {
      categoryRowId: expense.categoryRowId ?? undefined,
      assetRowId: expense.assetRowId ?? undefined,
      sourceExpenseRowId: expense.rowId,
      expenseType: expense.expenseType,
      amount: Math.abs(expense.amount),
      description: expense.description ?? undefined,
      merchant: expense.merchant ?? undefined,
      paymentMethod: expense.paymentMethod ?? undefined,
      frequency,
      intervalValue: 1,
      // 백엔드는 ISO 1=월~7=일. UI 0=일~6=토 → 변환.
      dayOfWeek: frequency === 'WEEKLY' ? (dayOfWeek === 0 ? 7 : dayOfWeek) : undefined,
      dayOfMonth: frequency === 'MONTHLY' || frequency === 'YEARLY' ? dayOfMonth : undefined,
      startDate: expenseDay,
      endDate: endMode === 'DATE' ? endDate : undefined,
      maxOccurrences: endMode === 'COUNT' ? Number(endCount) : undefined,
      autoLog,
      notifyDayBefore,
    }
    createMut.mutate(data, {
      onSuccess: created => {
        onCreated?.(created.rowId)
        onClose()
      },
    })
  }

  const Footer = (
    <ModalFooter
      onSave={handleSave}
      saveLabel={t('saveLabel')}
      saving={submitting}
      saveDisabled={!ready}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title={t('settingsTitle')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: '1.5' }}>
        {t('intro')}
      </p>

      {/* Source card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: tileRadius(38),
            background: palette.bg,
            color: palette.color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIcon(category?.icon ?? 'tag', category?.categoryName?.charAt(0) ?? '·', 18)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
            {expense.merchant || expense.description || t('transaction')}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {t('startsOn', { date: expenseDay })}
          </div>
        </div>
        <div className="num" style={{ fontWeight: '800', color: 'var(--fg-primary)' }}>
          {expense.expenseType === 'INCOME' ? '+' : '−'}
          {money(Math.abs(expense.amount))}
        </div>
      </div>

      {/* 반복 주기 */}
      <Section title={t('frequencyTitle')}>
        <Tabs
          value={frequency}
          onValueChange={(v) => v && setFrequency(v as RecurringFrequency)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {FREQS.map(o => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {t(o.lKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Section>

      {/* 요일 (매주) */}
      {frequency === 'WEEKLY' && (
        <Section title={t('dowTitle')}>
          <ToggleGroup
            type="single"
            size="sm"
            value={String(dayOfWeek)}
            onValueChange={(v) => v && setDayOfWeek(Number(v))}
            className="grid w-full grid-cols-7 gap-1.5"
          >
            {DOW_LABEL.map((label, i) => (
              <ToggleGroupItem key={i} value={String(i)} className="rounded-full">
                {t(label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>
      )}

      {/* 반복 일자 (매월) */}
      {frequency === 'MONTHLY' && (
        <Section title={t('dayOfMonthTitle')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)' }}>{t('monthDayPrefix')}</span>
            <Input
              className="num"
              value={dayOfMonth}
              onChange={e => {
                const n = Math.min(31, Math.max(1, Number(e.target.value.replace(/[^0-9]/g, '')) || 1))
                setDayOfMonth(n)
              }}
              inputMode="numeric"
              style={{ width: 64, textAlign: 'center' }}
            />
            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)' }}>{t('monthDaySuffix')}</span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginLeft: 8 }}>
              {t('monthDayHint')}
            </span>
          </div>
        </Section>
      )}

      {/* 종료 */}
      <Section title={t('endTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioCard
            selected={endMode === 'NONE'}
            onSelect={() => setEndMode('NONE')}
            title={t('endNone')}
            sub={t('endNoneSub')}
          />
          <RadioCard
            selected={endMode === 'COUNT'}
            onSelect={() => setEndMode('COUNT')}
            title={t('endCountTitle')}
            sub={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t('totalPrefix')}
                <Input
                  className="num"
                  value={endCount}
                  onChange={e => setEndCount(e.target.value.replace(/[^0-9]/g, ''))}
                  onClick={e => { e.stopPropagation(); setEndMode('COUNT') }}
                  inputMode="numeric"
                  style={{ width: 64, textAlign: 'center', padding: '4px 8px' }}
                />
                {t('timesSuffix')}
              </span>
            }
          />
          <RadioCard
            selected={endMode === 'DATE'}
            onSelect={() => setEndMode('DATE')}
            title={t('endDateTitle')}
            sub={
              <div
                onClick={e => { e.stopPropagation(); setEndMode('DATE') }}
                style={{ marginTop: 6 }}
              >
                <InputDatePicker
                  value={endDate}
                  onValueChange={setEndDate}
                />
              </div>
            }
          />
        </div>
      </Section>

      {/* 옵션 */}
      <Section title={t('optionsTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            Icon={Zap}
            title={t('autoLog')}
            sub={t('autoLogSub')}
            value={autoLog}
            onChange={setAutoLog}
          />
          <ToggleRow
            Icon={Bell}
            title={t('notifyDayBefore')}
            sub={t('notifyDayBeforeSub')}
            value={notifyDayBefore}
            onChange={setNotifyDayBefore}
          />
        </div>
      </Section>

      {/* 다음 예정일 */}
      {nextDates.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Calendar size={13} />
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: '700' }}>{t('nextDatesTitle')}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {nextDates.map((d, i) => (
              <span
                key={i}
                className="num"
                style={{
                  padding: '4px 10px',
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: '600',
                }}
              >
                {formatKoreanMonthDay(d)}
              </span>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-secondary)', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function RadioCard({
  selected,
  onSelect,
  title,
  sub,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  sub?: React.ReactNode
}) {
  return (
    <div
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '12px 14px',
        background: selected ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
        border: `1px solid ${selected ? 'var(--border-brand)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <span
        aria-hidden
        style={{
          marginTop: 2,
          width: 16,
          height: 16,
          borderRadius: 'var(--radius-pill)',
          border: `2px solid ${selected ? 'var(--border-brand)' : 'var(--border-default)'}`,
          background: selected ? 'var(--bg-brand)' : 'transparent',
          boxShadow: selected ? 'inset 0 0 0 3px var(--bg-surface)' : 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

export function ToggleRow({
  Icon,
  title,
  sub,
  value,
  onChange,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>
  title: string
  sub: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '12px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-sunken)',
          color: 'var(--fg-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{sub}</div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        className="shrink-0"
      />
    </div>
  )
}

