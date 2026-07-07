import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Zap, Calendar } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Textarea } from '@/shared/ui/textarea'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useExpenseCategories } from '@/features/expense'
import { useAssets } from '@/features/asset'
import { useCreateRecurringTransaction } from '@/features/recurring-transaction'
import type { ExpenseCategory } from '@/entities/expense'
import type { Asset, AssetType } from '@/entities/asset'
import type {
  RecurringFrequency,
  RecurringTransactionFormValues,
} from '@/entities/recurring-transaction'
import { Section, RadioCard, ToggleRow } from './RecurringFromTxDialog'
import {
  previewNextDates,
  addYears,
  todayIso,
  formatKoreanMonthDay,
} from './recurring-date'

const FREQS: { v: RecurringFrequency; lKey: string }[] = [
  { v: 'DAILY', lKey: 'freq.DAILY' },
  { v: 'WEEKLY', lKey: 'freq.WEEKLY' },
  { v: 'MONTHLY', lKey: 'freq.MONTHLY' },
  { v: 'YEARLY', lKey: 'freq.YEARLY' },
]

const DOW_LABEL = ['dow.sun', 'dow.mon', 'dow.tue', 'dow.wed', 'dow.thu', 'dow.fri', 'dow.sat']

const PAYMENT_METHODS: { v: string; lKey: string }[] = [
  { v: 'CASH', lKey: 'form.paymentMethod.CASH' },
  { v: 'CARD', lKey: 'form.paymentMethod.CARD' },
  { v: 'TRANSFER', lKey: 'paymentTransferFull' },
  { v: 'OTHER', lKey: 'form.paymentMethod.OTHER' },
]

/** 결제 수단 → 허용 자산 타입. null이면 전체 허용. (AddTxSheet와 동일) */
const PAYMENT_ASSET_TYPES: Record<string, AssetType[] | null> = {
  CASH: ['CASH'],
  CARD: ['CREDIT_CARD', 'CHECK_CARD'],
  TRANSFER: ['BANK_ACCOUNT', 'SAVINGS'],
  OTHER: null,
}

type EndMode = 'NONE' | 'COUNT' | 'DATE'
type TxType = 'EXPENSE' | 'INCOME'

type Props = {
  onClose: () => void
  onCreated?: (recurringRowId: number) => void
  mobile: boolean
}

/**
 * 처음부터 반복 거래를 추가하는 다이얼로그.
 * 거래 입력(AddTxSheet 패턴) + 반복 주기(RecurringFromTxDialog 헬퍼 재사용)를 조합.
 * desk-app `recurring_settings_drawer`(신규 추가 모드)의 web 미러.
 * ModalShell로 모바일=Drawer / 태블릿·데스크톱=Dialog 자동 분기.
 */
export function RecurringAddDialog({ onClose, onCreated, mobile }: Props) {
  const { t } = useTranslation('recurring')
  const { t: tExpense } = useTranslation('expense')
  const { t: tCommon } = useTranslation('common')
  const createMut = useCreateRecurringTransaction()
  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const categories: ExpenseCategory[] = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data])
  const assets: Asset[] = useMemo(() => assetsQ.data?.assets ?? [], [assetsQ.data])

  // 거래 입력 (이체 제외 — 반복은 지출/수입만)
  const [type, setType] = useState<TxType>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [categoryRowId, setCategoryRowId] = useState<number | null>(null)
  const [assetRowId, setAssetRowId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  // 날짜 = 반복 시작일 (공통)
  const [startDate, setStartDate] = useState<string>(todayIso())

  // 반복 설정
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY')
  const startBase = new Date(startDate)
  const [dayOfWeek, setDayOfWeek] = useState<number>(isNaN(startBase.getTime()) ? 1 : startBase.getDay()) // 0=일~6=토 (UI)
  const [dayOfMonth, setDayOfMonth] = useState<number>(isNaN(startBase.getTime()) ? 1 : Math.min(31, startBase.getDate()))
  const [endMode, setEndMode] = useState<EndMode>('NONE')
  const [endCount, setEndCount] = useState('12')
  const [endDate, setEndDate] = useState(addYears(todayIso(), 1))
  const [autoLog, setAutoLog] = useState(true)
  const [notifyDayBefore, setNotifyDayBefore] = useState(true)

  // 같은 expenseType의 최상위 카테고리 그리드 (자식은 Select로)
  const topCategories = useMemo(
    () =>
      categories
        .filter(c => c.expenseType === type && c.parentRowId == null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, type],
  )
  const childrenByParent = useMemo(() => {
    const map = new Map<number, ExpenseCategory[]>()
    for (const c of categories) {
      if (c.parentRowId == null || c.expenseType !== type) continue
      const arr = map.get(c.parentRowId) ?? []
      arr.push(c)
      map.set(c.parentRowId, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder)
    return map
  }, [categories, type])
  const selectedCategory = categoryRowId != null ? categories.find(c => c.rowId === categoryRowId) : null
  const selectedParentId = selectedCategory ? (selectedCategory.parentRowId ?? selectedCategory.rowId) : null

  // 결제 수단으로 계좌·카드 목록 필터
  const filteredAssets = useMemo(() => {
    if (!paymentMethod) return assets
    const allowed = PAYMENT_ASSET_TYPES[paymentMethod]
    if (!allowed) return assets
    return assets.filter(a => allowed.includes(a.assetType))
  }, [assets, paymentMethod])

  // 결제 수단 변경 시 현재 선택 자산이 허용 목록에 없으면 리셋
  useEffect(() => {
    if (!paymentMethod || assetRowId == null) return
    const allowed = PAYMENT_ASSET_TYPES[paymentMethod]
    if (!allowed) return
    const ok = assets.some(a => a.rowId === assetRowId && allowed.includes(a.assetType))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!ok) setAssetRowId(null)
  }, [paymentMethod, assetRowId, assets])

  // 타입 전환 시 해당 타입에 속하지 않는 카테고리는 리셋
  useEffect(() => {
    if (categoryRowId == null) return
    const cat = categories.find(c => c.rowId === categoryRowId)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!cat || cat.expenseType !== type) setCategoryRowId(null)
  }, [type, categoryRowId, categories])

  const nextDates = useMemo(
    () => previewNextDates(startDate, frequency, dayOfWeek, dayOfMonth, 3),
    [startDate, frequency, dayOfWeek, dayOfMonth],
  )

  const amountNumber = amount ? Number(amount.replace(/[^0-9]/g, '')) : 0
  const ready =
    amountNumber > 0 &&
    !!startDate &&
    (endMode !== 'COUNT' || Number(endCount) > 0) &&
    (endMode !== 'DATE' || !!endDate)
  const submitting = createMut.isPending

  const handleSave = () => {
    if (!ready) return
    const data: RecurringTransactionFormValues = {
      categoryRowId: categoryRowId ?? undefined,
      assetRowId: assetRowId ?? undefined,
      sourceExpenseRowId: undefined, // 처음부터 추가 — 원본 거래 없음
      expenseType: type,
      amount: amountNumber,
      description: description || undefined,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
      frequency,
      intervalValue: 1,
      // 백엔드는 ISO 1=월~7=일. UI 0=일~6=토 → 변환.
      dayOfWeek: frequency === 'WEEKLY' ? (dayOfWeek === 0 ? 7 : dayOfWeek) : undefined,
      dayOfMonth: frequency === 'MONTHLY' || frequency === 'YEARLY' ? dayOfMonth : undefined,
      startDate,
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

  const amountColor = type === 'INCOME'
    ? 'var(--fg-income, var(--fg-primary))'
    : 'var(--fg-expense, var(--fg-primary))'

  const Footer = (
    <ModalFooter
      onSave={handleSave}
      saveLabel={tCommon('add')}
      saving={submitting}
      saveDisabled={!ready}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title={t('addTitle')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: '1.5' }}>
        {t('intro')}
      </p>

      {/* 유형 */}
      <Section title={t('typeTitle')}>
        <Tabs value={type} onValueChange={(v) => v && setType(v as TxType)}>
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">{tExpense('expense')}</TabsTrigger>
            <TabsTrigger value="INCOME" className="flex-1">{tExpense('income')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </Section>

      {/* 금액 */}
      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{tExpense('form.amount')}</FieldLabel>
        <Input
          className="num"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          inputMode="numeric"
          style={{ fontSize: 'var(--text-title-md)', fontWeight: '700', color: amountColor }}
        />
      </Field>

      {/* 카테고리 */}
      {topCategories.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 'var(--text-badge)',
              color: 'var(--fg-tertiary)',
              fontWeight: '600',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            {tExpense('category')}
          </div>
          <CategoryGrid>
            {topCategories.map(c => (
              <CategoryTile
                key={c.rowId}
                name={c.categoryName}
                color={c.color ?? undefined}
                icon={c.icon}
                active={selectedParentId === c.rowId}
                onClick={() => {
                  const firstChild = childrenByParent.get(c.rowId)?.[0]
                  setCategoryRowId(firstChild ? firstChild.rowId : c.rowId)
                }}
              />
            ))}
          </CategoryGrid>

          {selectedParentId != null && (childrenByParent.get(selectedParentId)?.length ?? 0) > 0 && (
            <div style={{ marginTop: 10 }}>
              <Select
                value={categoryRowId != null ? String(categoryRowId) : ''}
                onValueChange={(v) => setCategoryRowId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tExpense('addTx.subCategoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{tExpense('addTx.parent')}</SelectLabel>
                    <SelectItem value={String(selectedParentId)}>
                      {categories.find(c => c.rowId === selectedParentId)?.categoryName ?? tExpense('addTx.parent')}
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>{tExpense('addTx.detail')}</SelectLabel>
                    {(childrenByParent.get(selectedParentId) ?? []).map(child => (
                      <SelectItem key={child.rowId} value={String(child.rowId)}>
                        {child.categoryName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* 거래처 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'INCOME' ? tExpense('addTx.incomeSource') : tExpense('form.merchant')}</FieldLabel>
        <Input
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          placeholder={type === 'INCOME' ? t('merchantPlaceholderIncome') : t('merchantPlaceholderExpense')}
        />
      </Field>

      {/* 결제 수단 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'INCOME' ? tExpense('addTx.incomeMethod') : tExpense('paymentMethodLabel')}</FieldLabel>
        <Select
          value={paymentMethod || '__none__'}
          onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={tExpense('selectNone')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{tExpense('selectNone')}</SelectItem>
            {PAYMENT_METHODS.map(pm => (
              <SelectItem key={pm.v} value={pm.v}>{tExpense(pm.lKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* 계좌·카드 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'INCOME' ? tExpense('addTx.depositAccount') : tExpense('accountCard')}</FieldLabel>
        <Select
          value={assetRowId != null ? String(assetRowId) : '__none__'}
          onValueChange={(v) => setAssetRowId(v === '__none__' ? null : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder={tExpense('selectNone')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{tExpense('selectNone')}</SelectItem>
            {filteredAssets.map(a => (
              <SelectItem key={a.rowId} value={String(a.rowId)}>
                {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* 반복 시작일 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('startDateLabel')}</FieldLabel>
        <InputDatePicker value={startDate} onValueChange={setStartDate} />
      </Field>

      {/* 메모 */}
      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>{tExpense('memo')}</FieldLabel>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={tExpense('addTx.optional')}
          style={{ minHeight: 56 }}
        />
      </Field>

      {/* 반복 주기 */}
      <Section title={t('frequencyTitle')}>
        <Tabs value={frequency} onValueChange={(v) => v && setFrequency(v as RecurringFrequency)}>
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
              <div onClick={e => { e.stopPropagation(); setEndMode('DATE') }} style={{ marginTop: 6 }}>
                <InputDatePicker value={endDate} onValueChange={setEndDate} />
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
