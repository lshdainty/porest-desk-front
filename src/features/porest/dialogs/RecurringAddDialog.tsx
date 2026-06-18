import { useEffect, useMemo, useState } from 'react'
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

const FREQS: { v: RecurringFrequency; l: string }[] = [
  { v: 'DAILY', l: '매일' },
  { v: 'WEEKLY', l: '매주' },
  { v: 'MONTHLY', l: '매월' },
  { v: 'YEARLY', l: '매년' },
]

const DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토']

const PAYMENT_METHODS: { v: string; l: string }[] = [
  { v: 'CASH', l: '현금' },
  { v: 'CARD', l: '카드' },
  { v: 'TRANSFER', l: '계좌이체' },
  { v: 'OTHER', l: '기타' },
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
      saveLabel="추가"
      saving={submitting}
      saveDisabled={!ready}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title="반복 거래 추가" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: '1.5' }}>
        이 거래를 정해진 주기로 자동 반복합니다. 구독료·월세·정기 후원 등에 사용해보세요.
      </p>

      {/* 유형 */}
      <Section title="유형">
        <Tabs value={type} onValueChange={(v) => v && setType(v as TxType)}>
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">지출</TabsTrigger>
            <TabsTrigger value="INCOME" className="flex-1">수입</TabsTrigger>
          </TabsList>
        </Tabs>
      </Section>

      {/* 금액 */}
      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>금액</FieldLabel>
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
            카테고리
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
                  <SelectValue placeholder="세부 카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>상위</SelectLabel>
                    <SelectItem value={String(selectedParentId)}>
                      {categories.find(c => c.rowId === selectedParentId)?.categoryName ?? '상위'}
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>세부</SelectLabel>
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
        <FieldLabel>{type === 'INCOME' ? '수입처' : '거래처'}</FieldLabel>
        <Input
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          placeholder={type === 'INCOME' ? '예: (주)포레스트' : '예: 넷플릭스'}
        />
      </Field>

      {/* 결제 수단 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'INCOME' ? '수입 방식' : '결제 수단'}</FieldLabel>
        <Select
          value={paymentMethod || '__none__'}
          onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="선택 안 함" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">선택 안 함</SelectItem>
            {PAYMENT_METHODS.map(pm => (
              <SelectItem key={pm.v} value={pm.v}>{pm.l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* 계좌·카드 */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'INCOME' ? '입금 계좌' : '계좌·카드'}</FieldLabel>
        <Select
          value={assetRowId != null ? String(assetRowId) : '__none__'}
          onValueChange={(v) => setAssetRowId(v === '__none__' ? null : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="선택 안 함" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">선택 안 함</SelectItem>
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
        <FieldLabel>반복 시작일</FieldLabel>
        <InputDatePicker value={startDate} onValueChange={setStartDate} />
      </Field>

      {/* 메모 */}
      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>메모</FieldLabel>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="선택 사항"
          style={{ minHeight: 56 }}
        />
      </Field>

      {/* 반복 주기 */}
      <Section title="반복 주기">
        <Tabs value={frequency} onValueChange={(v) => v && setFrequency(v as RecurringFrequency)}>
          <TabsList variant="pill" size="sm" className="w-full">
            {FREQS.map(o => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {o.l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Section>

      {/* 요일 (매주) */}
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

      {/* 반복 일자 (매월) */}
      {frequency === 'MONTHLY' && (
        <Section title="반복 일자">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)' }}>매월</span>
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
            <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)' }}>일</span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginLeft: 8 }}>
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
              <div onClick={e => { e.stopPropagation(); setEndMode('DATE') }} style={{ marginTop: 6 }}>
                <InputDatePicker value={endDate} onValueChange={setEndDate} />
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
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Calendar size={13} />
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: '700' }}>다음 예정일</span>
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
