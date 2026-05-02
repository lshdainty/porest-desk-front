import { useMemo, useState } from 'react'
import { Bell, Zap, Calendar } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon } from '@/shared/lib'
import { useCreateRecurringTransaction } from '@/features/recurring-transaction'
import { useExpenseCategories } from '@/features/expense'
import type { Expense } from '@/entities/expense'
import type {
  RecurringFrequency,
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
  expense: Expense
  onClose: () => void
  onCreated?: (recurringRowId: number) => void
  mobile: boolean
}

export function RecurringFromTxDialog({ expense, onClose, onCreated, mobile }: Props) {
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

  return (
    <ModalShell title="반복 설정" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
        이 거래를 정해진 주기로 자동 반복합니다. 구독료·월세·정기 후원 등에 사용해보세요.
      </p>

      {/* Source card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
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
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>
            {expense.merchant || expense.description || '거래'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {expenseDay} 시작
          </div>
        </div>
        <div className="num" style={{ fontWeight: 800, color: 'var(--fg-primary)' }}>
          {expense.expenseType === 'INCOME' ? '+' : '−'}
          {KRW(Math.abs(expense.amount))}원
        </div>
      </div>

      {/* 반복 주기 */}
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

      {/* 요일 (매주) */}
      {frequency === 'WEEKLY' && (
        <Section title="요일">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DOW_LABEL.map((label, i) => {
              const active = dayOfWeek === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDayOfWeek(i)}
                  style={{
                    padding: '10px 0',
                    background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${active ? 'var(--mossy-700)' : 'var(--border-subtle)'}`,
                    color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                    fontWeight: active ? 700 : 500,
                    borderRadius: 999,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* 반복 일자 (매월) */}
      {frequency === 'MONTHLY' && (
        <Section title="반복 일자">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>매월</span>
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
            <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>일</span>
            <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginLeft: 8 }}>
              해당 일이 없는 달은 말일에 처리됩니다
            </span>
          </div>
        </Section>
      )}

      {/* 종료 */}
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

      {/* 다음 예정일 */}
      {nextDates.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Calendar size={13} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>다음 예정일</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {nextDates.map((d, i) => (
              <span
                key={i}
                className="num"
                style={{
                  padding: '4px 10px',
                  background: 'var(--pd-surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
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
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 8 }}>
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
        border: `1px solid ${selected ? 'var(--mossy-700)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
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
          borderRadius: 999,
          border: `2px solid ${selected ? 'var(--mossy-700)' : 'var(--border-default)'}`,
          background: selected ? 'var(--mossy-700)' : 'transparent',
          boxShadow: selected ? 'inset 0 0 0 3px var(--bg-surface)' : 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 4 }}>
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
        borderRadius: 12,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--pd-surface-inset)',
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
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          border: 0,
          background: value ? 'var(--mossy-700)' : 'var(--border-default)',
          position: 'relative',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: value ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </div>
  )
}

// ---- date helpers ----

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
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
  dayOfWeekUi: number, // 0=일~6=토
  dayOfMonth: number,
  count: number,
): string[] {
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return []
  const out: string[] = []
  const cursor = new Date(start)

  if (freq === 'WEEKLY') {
    // 시작일을 dayOfWeekUi 요일로 정규화
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
