import { useMemo, useState } from 'react'
import { Bell, Calendar, Zap } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Switch } from '@/shared/ui/switch'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon } from '@/shared/lib'
import { useUpdateRecurringTransaction } from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import type {
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionFormValues,
} from '@/entities/recurring-transaction'
import { getPaletteByColor } from './CategoryEditDialog'

const FREQS: { v: RecurringFrequency; l: string }[] = [
  { v: 'DAILY', l: '매일' },
  { v: 'WEEKLY', l: '매주' },
  { v: 'MONTHLY', l: '매월' },
  { v: 'YEARLY', l: '매년' },
]

const DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토']

type EndMode = 'NONE' | 'COUNT' | 'DATE'

type Props = {
  recurring: RecurringTransaction
  onClose: () => void
  onSaved?: () => void
  mobile: boolean
}

export function RecurringEditDialog({ recurring, onClose, onSaved, mobile }: Props) {
  const updateMut = useUpdateRecurringTransaction()
  const categoriesQ = useExpenseCategories()
  const category = (categoriesQ.data ?? []).find(c => c.rowId === recurring.categoryRowId)
  const palette = getPaletteByColor(category?.color)

  const startDay = recurring.startDate.slice(0, 10)
  const baseDate = new Date(startDay)
  const baseDom = isNaN(baseDate.getTime()) ? 1 : baseDate.getDate()
  // backend stores ISO 1=월~7=일; UI uses 0=일~6=토
  const initialDow =
    recurring.dayOfWeek != null
      ? (recurring.dayOfWeek === 7 ? 0 : recurring.dayOfWeek)
      : (isNaN(baseDate.getTime()) ? 1 : baseDate.getDay())

  const [frequency, setFrequency] = useState<RecurringFrequency>(recurring.frequency)
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDow)
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    recurring.dayOfMonth ?? Math.min(31, baseDom),
  )

  const initialEndMode: EndMode = recurring.endDate ? 'DATE' : 'NONE'
  const [endMode, setEndMode] = useState<EndMode>(initialEndMode)
  const [endCount, setEndCount] = useState<string>('12')
  const [endDate, setEndDate] = useState<string>(
    recurring.endDate ?? addYears(startDay, 1),
  )

  const [autoLog, setAutoLog] = useState<boolean>(recurring.autoLog)
  const [notifyDayBefore, setNotifyDayBefore] = useState<boolean>(recurring.notifyDayBefore)

  const nextDates = useMemo(
    () => previewNextDates(startDay, frequency, dayOfWeek, dayOfMonth, 3),
    [startDay, frequency, dayOfWeek, dayOfMonth],
  )

  const submitting = updateMut.isPending
  const ready = !!startDay
    && (endMode !== 'COUNT' || Number(endCount) > 0)
    && (endMode !== 'DATE' || !!endDate)

  const handleSave = () => {
    if (!ready) return
    const data: RecurringTransactionFormValues = {
      categoryRowId: recurring.categoryRowId ?? undefined,
      assetRowId: recurring.assetRowId ?? undefined,
      sourceExpenseRowId: recurring.sourceExpenseRowId ?? undefined,
      expenseType: recurring.expenseType,
      amount: Math.abs(recurring.amount),
      description: recurring.description ?? undefined,
      merchant: recurring.merchant ?? undefined,
      paymentMethod: recurring.paymentMethod ?? undefined,
      frequency,
      intervalValue: recurring.intervalValue ?? 1,
      dayOfWeek: frequency === 'WEEKLY' ? (dayOfWeek === 0 ? 7 : dayOfWeek) : undefined,
      dayOfMonth: frequency === 'MONTHLY' || frequency === 'YEARLY' ? dayOfMonth : undefined,
      startDate: startDay,
      endDate: endMode === 'DATE' ? endDate : undefined,
      autoLog,
      notifyDayBefore,
    }
    updateMut.mutate({ id: recurring.rowId, data }, {
      onSuccess: () => {
        onSaved?.()
        onClose()
      },
    })
  }

  const Footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button
        type="button"
        onClick={handleSave}
        disabled={!ready}
        loading={submitting}
      >
        반복 저장
      </Button>
    </>
  )

  const title = recurring.merchant || recurring.description || recurring.categoryName || '반복 거래'
  const isExpense = recurring.expenseType === 'EXPENSE'

  return (
    <ModalShell title="반복 설정" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: 'var(--lh-normal)' }}>
        이 거래를 정해진 주기로 자동 반복합니다. 구독료·월세·정기 후원 등에 사용해보세요.
      </p>

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
            borderRadius: 'var(--radius-tile)',
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
          <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>{title}</div>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {startDay} 시작
          </div>
        </div>
        <div className="num" style={{ fontWeight: 'var(--fw-heavy)', color: 'var(--fg-primary)' }}>
          {isExpense ? '−' : '+'}
          {KRW(Math.abs(recurring.amount))}원
        </div>
      </div>

      <Section title="반복 주기">
        <ToggleGroup
          type="single"
          variant="segmented"
          value={frequency}
          onValueChange={(v) => v && setFrequency(v as RecurringFrequency)}
        >
          {FREQS.map(o => (
            <ToggleGroupItem key={o.v} value={o.v}>
              {o.l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>

      {frequency === 'WEEKLY' && (
        <Section title="요일">
          <ToggleGroup
            type="single"
            size="sm"
            value={String(dayOfWeek)}
            onValueChange={(v) => v && setDayOfWeek(Number(v))}
            className="grid w-full grid-cols-7 gap-1.5"
          >
            {DOW_LABEL.map((label, i) => (
              <ToggleGroupItem key={i} value={String(i)} className="rounded-full">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>
      )}

      {frequency === 'MONTHLY' && (
        <Section title="반복 일자">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-secondary)' }}>매월</span>
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
            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-secondary)' }}>일</span>
            <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginLeft: 8 }}>
              해당 일이 없는 달은 말일에 처리됩니다
            </span>
          </div>
        </Section>
      )}

      <Section title="종료">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioCard
            selected={endMode === 'NONE'}
            onSelect={() => setEndMode('NONE')}
            title="무기한"
            sub="중지할 때까지 계속 반복"
          />
          <RadioCard
            selected={endMode === 'COUNT'}
            onSelect={() => setEndMode('COUNT')}
            title="횟수 지정"
            sub={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                총
                <Input
                  className="num"
                  value={endCount}
                  onChange={e => setEndCount(e.target.value.replace(/[^0-9]/g, ''))}
                  onClick={e => { e.stopPropagation(); setEndMode('COUNT') }}
                  inputMode="numeric"
                  style={{ width: 64, textAlign: 'center', padding: '4px 8px' }}
                />
                회
              </span>
            }
          />
          <RadioCard
            selected={endMode === 'DATE'}
            onSelect={() => setEndMode('DATE')}
            title="종료일 지정"
            sub={
              <div
                onClick={e => { e.stopPropagation(); setEndMode('DATE') }}
                style={{ marginTop: 6 }}
              >
                <InputDatePicker value={endDate} onValueChange={setEndDate} />
              </div>
            }
          />
        </div>
      </Section>

      <Section title="옵션">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            Icon={Zap}
            title="자동 기록"
            sub="해당 일자에 거래를 자동으로 추가합니다"
            value={autoLog}
            onChange={setAutoLog}
          />
          <ToggleRow
            Icon={Bell}
            title="하루 전 알림"
            sub="결제·이체 예정일 전날 알림을 보냅니다"
            value={notifyDayBefore}
            onChange={setNotifyDayBefore}
          />
        </div>
      </Section>

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
            <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)' }}>다음 예정일</span>
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
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-semi)',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-secondary)', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function RadioCard({
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
        border: `1px solid ${selected ? 'var(--fg-income)' : 'var(--border-subtle)'}`,
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
          border: `2px solid ${selected ? 'var(--fg-income)' : 'var(--border-default)'}`,
          background: selected ? 'var(--fg-income)' : 'transparent',
          boxShadow: selected ? 'inset 0 0 0 3px var(--bg-surface)' : 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-secondary)', marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
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
        <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' }}>{title}</div>
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{sub}</div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        className="shrink-0"
      />
    </div>
  )
}

function addYears(iso: string, years: number): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

function formatKoreanMonthDay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`
}

function previewNextDates(
  startIso: string,
  freq: RecurringFrequency,
  dayOfWeekUi: number,
  dayOfMonth: number,
  count: number,
): string[] {
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return []
  const out: string[] = []
  const cursor = new Date(start)

  if (freq === 'WEEKLY') {
    const diff = (dayOfWeekUi - cursor.getDay() + 7) % 7
    cursor.setDate(cursor.getDate() + diff)
  } else if (freq === 'MONTHLY') {
    cursor.setDate(Math.min(dayOfMonth, daysInMonth(cursor.getFullYear(), cursor.getMonth())))
  }

  for (let i = 0; i < count; i++) {
    out.push(cursor.toISOString().slice(0, 10))
    if (freq === 'DAILY') cursor.setDate(cursor.getDate() + 1)
    else if (freq === 'WEEKLY') cursor.setDate(cursor.getDate() + 7)
    else if (freq === 'MONTHLY') {
      const ny = cursor.getFullYear()
      const nm = cursor.getMonth() + 1
      const nd = Math.min(dayOfMonth, daysInMonth(ny, nm))
      cursor.setFullYear(ny, nm, nd)
    }
    else if (freq === 'YEARLY') cursor.setFullYear(cursor.getFullYear() + 1)
  }
  return out
}

function daysInMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate()
}
