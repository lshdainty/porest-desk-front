import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bookmark, Info, MoreHorizontal, Plus, Scissors } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { CategoryGrid, CategoryTile } from '@/shared/ui/category-tile'
import { Input } from '@/shared/ui/input'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Textarea } from '@/shared/ui/textarea'
import { renderIcon } from '@/shared/lib'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { KRW } from '@/shared/lib/porest/format'
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
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { InputTimePicker } from '@/shared/ui/input-time-picker'
import {
  useCreateExpense,
  useCreateExpenseTemplate,
  useExpenseCategories,
  useExpenseTemplates,
  useTouchExpenseTemplate,
  useUpdateExpense,
  useDeleteExpense,
} from '@/features/expense'
import { useAssets, useCreateTransfer } from '@/features/asset'
import { useExpenseSplits } from '@/features/expense-split'
import type { Expense, ExpenseCategory, ExpenseFormValues } from '@/entities/expense'
import type { Asset, AssetType } from '@/entities/asset'
import type { ExpenseTemplate } from '@/entities/expense-template'
import type { ExpenseSplitFormValue } from '@/entities/expense-split'
import { Card, CardContent } from '@/shared/ui/card'
import { SplitTxDialog } from '../dialogs/SplitTxDialog'

const PAYMENT_METHODS: { v: string; l: string }[] = [
  { v: 'CASH', l: '현금' },
  { v: 'CARD', l: '카드' },
  { v: 'TRANSFER', l: '계좌이체' },
  { v: 'OTHER', l: '기타' },
]

/** 결제 수단 → 허용 자산 타입. null이면 전체 허용. */
const PAYMENT_ASSET_TYPES: Record<string, AssetType[] | null> = {
  CASH: ['CASH'],
  CARD: ['CREDIT_CARD', 'CHECK_CARD'],
  TRANSFER: ['BANK_ACCOUNT', 'SAVINGS'],
  OTHER: null,
}

type TxType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

type Props = {
  onClose: () => void
  /** Desktop=false / Mobile=true — ModalShell 패턴 전환용 */
  mobile: boolean
  /** 편집 모드일 때 전달 — 전달되면 수정/삭제, 아니면 신규 생성 */
  expense?: Expense | null
  /** 신규 생성 시 기본 날짜(yyyy-MM-dd). 미지정이면 오늘. expense가 있으면 무시. */
  defaultDate?: string
}

const todayLocal = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const nowTimeLocal = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// "YYYY-MM-DDTHH:mm[:ss]" 또는 "YYYY-MM-DD HH:mm[:ss]" 에서 HH:mm 추출
const extractTime = (s?: string | null) => {
  if (!s) return null
  const m = /[T ](\d{2}:\d{2})/.exec(s)
  return m ? m[1] : null
}

export function AddTxSheet({ onClose, mobile, expense, defaultDate }: Props) {
  const isEdit = !!expense

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const createMut = useCreateExpense()
  const updateMut = useUpdateExpense()
  const deleteMut = useDeleteExpense()
  const createTransferMut = useCreateTransfer()
  const touchPresetMut = useTouchExpenseTemplate()
  // 편집 모드: 기존 분할 내역 — 금액 변경 시 분할 합과 일치 여부 판정용
  const splitsQ = useExpenseSplits(expense?.rowId ?? null)

  const categories: ExpenseCategory[] = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data])
  const assets: Asset[] = useMemo(() => assetsQ.data?.assets ?? [], [assetsQ.data])

  // 타입
  const [type, setType] = useState<TxType>(expense?.expenseType ?? 'EXPENSE')

  // 공통 필드
  const [amount, setAmount] = useState<string>(expense?.amount ? String(expense.amount) : '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [expenseDate, setExpenseDate] = useState<string>(
    expense?.expenseDate ? expense.expenseDate.slice(0, 10) : (defaultDate ?? todayLocal()),
  )
  const [expenseTime, setExpenseTime] = useState<string>(
    () => extractTime(expense?.expenseDate) ?? nowTimeLocal(),
  )
  const [merchant, setMerchant] = useState(expense?.merchant ?? '')
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '')

  // EXPENSE/INCOME 전용
  const [categoryRowId, setCategoryRowId] = useState<number | null>(expense?.categoryRowId ?? null)
  const [assetRowId, setAssetRowId] = useState<number | null>(expense?.assetRowId ?? null)

  // TRANSFER 전용
  const [fromAssetRowId, setFromAssetRowId] = useState<number | null>(null)
  const [toAssetRowId, setToAssetRowId] = useState<number | null>(null)
  const [fee, setFee] = useState<string>('')

  const [confirmDelete, setConfirmDelete] = useState(false)

  // 분할 합 일치화: 금액을 바꿔 기존 분할 합과 어긋날 때 맞추기 플로우
  const [openReconcile, setOpenReconcile] = useState(false)
  // 이번 편집 세션에서 맞춘 분할(있으면 저장 시 금액과 함께 원자적으로 전송)
  const [reconciledSplits, setReconciledSplits] = useState<ExpenseSplitFormValue[] | null>(null)

  // 프리셋: 적용 추적 + 저장 다이얼로그
  const templatesQ = useExpenseTemplates()
  const templates: ExpenseTemplate[] = useMemo(() => templatesQ.data ?? [], [templatesQ.data])
  const [activePresetId, setActivePresetId] = useState<number | null>(null)
  const [savePresetOpen, setSavePresetOpen] = useState(false)

  // 사용 빈도 높은 순으로 8개. 편집 모드에선 프리셋 row 자체가 안 보이므로 무관.
  const topPresets = useMemo(
    () => [...templates].sort((a, b) => b.useCount - a.useCount).slice(0, 8),
    [templates],
  )

  const clearPresetMark = () => {
    if (activePresetId != null) setActivePresetId(null)
  }

  const applyPreset = (p: ExpenseTemplate) => {
    setType(p.expenseType as TxType)
    setAmount(p.lockAmount === 'Y' && p.amount != null ? String(p.amount) : '')
    setCategoryRowId(p.categoryRowId ?? null)
    setAssetRowId(p.assetRowId ?? null)
    setMerchant(p.merchant ?? '')
    setPaymentMethod(p.paymentMethod ?? '')
    setDescription(p.description ?? '')
    setActivePresetId(p.rowId)
  }

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

  // 선택된 카테고리 정보 (자식이면 부모 id 도 파악)
  const selectedCategory = categoryRowId != null
    ? categories.find(c => c.rowId === categoryRowId)
    : null
  const selectedParentId = selectedCategory
    ? (selectedCategory.parentRowId ?? selectedCategory.rowId)
    : null

  // 결제 수단으로 계좌·카드 목록 필터
  const filteredAssets = useMemo(() => {
    if (!paymentMethod) return assets
    const allowed = PAYMENT_ASSET_TYPES[paymentMethod]
    if (!allowed) return assets
    return assets.filter(a => allowed.includes(a.assetType))
  }, [assets, paymentMethod])

  // 결제 수단 변경 시 현재 선택한 자산이 허용 목록에 없으면 리셋
  useEffect(() => {
    if (!paymentMethod || assetRowId == null) return
    const allowed = PAYMENT_ASSET_TYPES[paymentMethod]
    if (!allowed) return
    const ok = assets.some(a => a.rowId === assetRowId && allowed.includes(a.assetType))
    if (!ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssetRowId(null)
    }
  }, [paymentMethod, assetRowId, assets])

  // 타입 전환 시 해당 타입에 속하지 않는 카테고리는 리셋
  useEffect(() => {
    if (categoryRowId == null) return
    const cat = categories.find(c => c.rowId === categoryRowId)
    if (!cat || cat.expenseType !== type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryRowId(null)
    }
  }, [type, categoryRowId, categories])

  const amountNumber = amount ? Number(amount.replace(/[^0-9]/g, '')) : 0

  // 유효 분할 = 이번 세션에서 맞춘 분할 ?? 서버 분할. 금액이 분할 합과 어긋나면 일치화 필요.
  const serverSplitForms: ExpenseSplitFormValue[] = useMemo(
    () => (splitsQ.data ?? []).map(s => ({
      categoryRowId: s.categoryRowId,
      amount: s.amount,
      label: s.label,
      sortOrder: s.sortOrder,
    })),
    [splitsQ.data],
  )
  const effectiveSplits = reconciledSplits ?? serverSplitForms
  const splitSum = effectiveSplits.reduce((s, p) => s + p.amount, 0)
  const hasSplits = effectiveSplits.length > 0
  const splitMismatch = isEdit && type !== 'TRANSFER' && hasSplits && amountNumber > 0 && amountNumber !== splitSum

  const canSave = (() => {
    if (amountNumber <= 0) return false
    if (type === 'TRANSFER') {
      return !!fromAssetRowId && !!toAssetRowId && fromAssetRowId !== toAssetRowId
    }
    if (!categoryRowId) return false
    // 편집 모드: 분할 내역을 아직 모르면(로딩/에러) 저장 보류. 분할 합 정합 판정이 불가한 상태에서
    // 금액을 바꾼 분할 거래를 저장하면 백엔드 400(EXP_012)로 새고 정합 안내가 우회되므로 게이트.
    if (isEdit && (splitsQ.isPending || splitsQ.isError)) return false
    return true
  })()

  const submitting = createMut.isPending || updateMut.isPending || createTransferMut.isPending || deleteMut.isPending

  const save = () => {
    if (!canSave) return
    if (type === 'TRANSFER') {
      createTransferMut.mutate(
        {
          fromAssetRowId: fromAssetRowId!,
          toAssetRowId: toAssetRowId!,
          amount: amountNumber,
          fee: fee ? Number(fee) : undefined,
          description: description || undefined,
          transferDate: expenseDate,
        },
        { onSuccess: onClose },
      )
      return
    }
    // 분할이 있는 거래의 금액을 바꿔 합과 어긋나면 → 저장 전에 분할을 먼저 맞춘다.
    if (splitMismatch) {
      setOpenReconcile(true)
      return
    }
    const data: ExpenseFormValues = {
      categoryRowId: categoryRowId!,
      assetRowId: assetRowId ?? undefined,
      expenseType: type,
      amount: amountNumber,
      description: description || undefined,
      expenseDate: `${expenseDate}T${expenseTime}`,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
      // 일치화한 분할이 있으면 금액과 함께 원자적으로 교체(백엔드가 합==금액 검증).
      ...(isEdit && reconciledSplits ? { splits: reconciledSplits } : {}),
    }
    if (isEdit && expense) {
      updateMut.mutate({ id: expense.rowId, data }, { onSuccess: onClose })
    } else {
      const presetIdAtSubmit = activePresetId
      createMut.mutate(data, {
        onSuccess: () => {
          // 거래 저장 성공 후 적용된 프리셋이 있으면 useCount/lastUsedAt 갱신.
          // 실패해도 거래는 성공했으니 무시(Best-effort).
          if (presetIdAtSubmit != null) {
            touchPresetMut.mutate(presetIdAtSubmit)
          }
          onClose()
        },
      })
    }
  }

  const onDeleteClick = () => setConfirmDelete(true)
  const doDelete = () => {
    if (!expense) return
    deleteMut.mutate(expense.rowId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  // 타입별 강조 색
  const amountColor =
    type === 'EXPENSE' ? 'var(--fg-expense)'
    : type === 'INCOME' ? 'var(--fg-income)'
    : 'var(--fg-primary)'

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={splitMismatch ? '분할 맞추고 저장' : isEdit ? '저장' : '추가'}
      saving={submitting}
      saveDisabled={!canSave}
      onCancel={onClose}
      onDelete={isEdit ? onDeleteClick : undefined}
      deleteLabel="삭제"
      deleting={deleteMut.isPending}
    />
  )

  return (
    <ModalShell
      title={isEdit ? '거래 편집' : '내역 추가'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      {/* 타입 segment — spec tabs.md variant="pill" (container) */}
      <Tabs
        value={type}
        onValueChange={(v) => {
          if (!v) return
          const lockedTo = isEdit ? expense?.expenseType ?? type : null
          if (lockedTo != null && v !== lockedTo) return
          setType(v as TxType)
          clearPresetMark()
        }}
        className="mb-[var(--spacing-md)]"
      >
        <TabsList variant="pill" size="sm" className="w-full">
          {([
            { v: 'EXPENSE', l: '지출' },
            { v: 'INCOME', l: '수입' },
            { v: 'TRANSFER', l: '이체' },
          ] as { v: TxType; l: string }[]).map(o => {
            const disabled = isEdit && o.v !== (expense?.expenseType ?? type)
            return (
              <TabsTrigger
                key={o.v}
                value={o.v}
                disabled={disabled}
                aria-label={o.l}
                className="flex-1"
              >
                {o.l}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* 프리셋 불러오기 — 신규 추가일 때만 노출, TRANSFER 제외 */}
      {!isEdit && type !== 'TRANSFER' && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bookmark size={13} style={{ color: 'var(--fg-tertiary)' }} />
              <span
                style={{
                  fontSize: 'var(--text-badge)',
                  color: 'var(--fg-tertiary)',
                  fontWeight: '600',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                프리셋 불러오기
              </span>
              {activePresetId != null && (
                <span
                  style={{
                    fontSize: 'var(--text-badge)',
                    color: 'var(--fg-brand-strong)',
                    fontWeight: '700',
                    padding: '2px 6px',
                    background: 'var(--bg-brand-subtle)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  적용됨
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSavePresetOpen(true)}
              disabled={amountNumber <= 0 || !categoryRowId}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                fontSize: 'var(--text-caption)',
                color: amountNumber > 0 && categoryRowId ? 'var(--fg-brand-strong)' : 'var(--fg-tertiary)',
                fontWeight: '600',
                cursor: amountNumber > 0 && categoryRowId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: 'inherit',
              }}
            >
              <Plus size={12} /> 현재 입력값 저장
            </button>
          </div>

          {topPresets.length > 0 ? (
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 4,
                marginLeft: -2,
                paddingLeft: 2,
                marginRight: -2,
                paddingRight: 2,
                scrollbarWidth: 'thin',
              }}
            >
              {topPresets.map(p => {
                const active = activePresetId === p.rowId
                const showAmount = p.lockAmount === 'Y' && p.amount != null
                const cat = p.categoryRowId != null ? categories.find(c => c.rowId === p.categoryRowId) : undefined
                // 카테고리 아이콘색 — 다크모드 light variant 자동 swap(앱 resolveChartColor 정합)
                const catPal = getPaletteByColor(cat?.color)
                return (
                  <button
                    key={p.rowId}
                    type="button"
                    onClick={() => applyPreset(p)}
                    style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '7px 11px',
                      // border 사각형 제거 — 아이콘+글씨만 노출. active 만 subtle 채움으로 강조.
                      background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-label-sm)',
                      fontWeight: active ? 700 : 600,
                      color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.12s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {cat && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 'var(--radius-sm)',
                          background: catPal.bg,
                          color: catPal.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {renderIcon(cat.icon, cat.categoryName.charAt(0), 11)}
                      </span>
                    )}
                    <span>{p.templateName}</span>
                    {showAmount && (
                      <span
                        className="num"
                        style={{
                          fontSize: 'var(--text-badge)',
                          color: active ? 'var(--fg-brand-strong)' : 'var(--fg-tertiary)',
                          fontWeight: '600',
                        }}
                      >
                        {(p.amount as number) >= 10000
                          ? `${Math.floor((p.amount as number) / 1000)}k`
                          : KRW(p.amount as number)}
                      </span>
                    )}
                  </button>
                )
              })}
              {templates.length > topPresets.length && (
                <span
                  style={{
                    flex: '0 0 auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '7px 11px',
                    background: 'transparent',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--text-caption)',
                    fontWeight: '600',
                    color: 'var(--fg-tertiary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MoreHorizontal size={14} />
                  설정 → 프리셋 관리
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--bg-sunken)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-caption)',
                color: 'var(--fg-tertiary)',
              }}
            >
              저장된 프리셋이 없어요. 자주 쓰는 내역을 입력 후 “현재 입력값 저장”을 눌러보세요.
            </div>
          )}

          {activePresetId != null && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 10px',
                background: 'var(--bg-brand-subtle)',
                border: '1px solid var(--border-brand)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Info size={13} style={{ color: 'var(--fg-brand-strong)' }} />
              <span
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--fg-brand-strong)',
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                프리셋 값이 채워졌어요. 금액·내역만 수정해서 저장하세요.
              </span>
              <button
                type="button"
                onClick={clearPresetMark}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontSize: 'var(--text-badge)',
                  color: 'var(--fg-brand-strong)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >
                해제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 금액 — 다른 필드와 동일한 라벨+인풋 (모바일 처럼 깔끔하게) */}
      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>금액</FieldLabel>
        <Input
          className="num"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          inputMode="numeric"
          style={{
            fontSize: 'var(--text-title-md)',
            fontWeight: '700',
            color: amountColor,
          }}
        />
      </Field>

      {/* 분할 합 불일치 경고 — 금액을 바꿔 기존 분할 합과 어긋날 때 */}
      {splitMismatch && (
        <div
          style={{
            marginBottom: 18,
            padding: '13px 15px',
            borderRadius: 'var(--radius-lg)',
            background: 'color-mix(in oklch, var(--status-warning) 12%, var(--bg-surface))',
            border: '1px solid color-mix(in oklch, var(--status-warning) 35%, transparent)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
              marginTop: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'color-mix(in oklch, var(--status-warning) 22%, var(--bg-surface))',
              color: 'var(--status-warning-fg)',
            }}
          >
            <AlertTriangle size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
              분할 내역과 금액이 달라요
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 3, lineHeight: '1.5' }}>
              새 총액 <b className="num">{KRW(amountNumber)}원</b> · 분할 합계 <b className="num">{KRW(splitSum)}원</b> ·{' '}
              <b className="num" style={{ color: 'var(--status-warning-fg)' }}>
                {amountNumber - splitSum > 0 ? '+' : '−'}{KRW(Math.abs(amountNumber - splitSum))}원
              </b>{' '}
              차이
            </div>
            <Button type="button" size="sm" onClick={() => setOpenReconcile(true)} style={{ marginTop: 10 }}>
              <Scissors size={13} /> 분할 내역 맞추기
            </Button>
          </div>
        </div>
      )}

      {type !== 'TRANSFER' ? (
        <>
          {/* 카테고리 */}
          {topCategories.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
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
                      clearPresetMark()
                    }}
                  />
                ))}
              </CategoryGrid>

              {/* 하위 카테고리 (선택된 부모에 자식이 있을 때) */}
              {selectedParentId != null
                && (childrenByParent.get(selectedParentId)?.length ?? 0) > 0 && (
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
              placeholder={type === 'INCOME' ? '예: (주)포레스트' : '예: 스타벅스 강남점'}
            />
          </Field>

          {/* 결제 수단 — 먼저 선택, 계좌·카드 목록을 필터링 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>
              {type === 'INCOME' ? '수입 방식' : '결제 수단'}
            </FieldLabel>
            <Select
              value={paymentMethod || '__none__'}
              onValueChange={(v) => {
                setPaymentMethod(v === '__none__' ? '' : v)
                clearPresetMark()
              }}
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

          {/* 계좌·카드 — 결제 수단에 맞춰 필터 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>
              {type === 'INCOME' ? '입금 계좌' : '계좌·카드'}
              {paymentMethod && filteredAssets.length !== assets.length && (
                <span style={{ color: 'var(--fg-tertiary)', fontWeight: '400', marginLeft: 4 }}>
                  ({PAYMENT_METHODS.find(p => p.v === paymentMethod)?.l ?? ''} 기준)
                </span>
              )}
            </FieldLabel>
            <Select
              value={assetRowId != null ? String(assetRowId) : '__none__'}
              onValueChange={(v) => {
                setAssetRowId(v === '__none__' ? null : Number(v))
                clearPresetMark()
              }}
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
            {paymentMethod && filteredAssets.length === 0 && (
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
                해당 결제 수단에 연결된 자산이 없어요.
              </div>
            )}
          </Field>
        </>
      ) : (
        <>
          {/* 이체: 출금 → 입금 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>출금 계좌</FieldLabel>
            <Select
              value={fromAssetRowId != null ? String(fromAssetRowId) : ''}
              onValueChange={(v) => setFromAssetRowId(v ? Number(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(a => (
                  <SelectItem key={a.rowId} value={String(a.rowId)}>
                    {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>입금 계좌</FieldLabel>
            <Select
              value={toAssetRowId != null ? String(toAssetRowId) : ''}
              onValueChange={(v) => setToAssetRowId(v ? Number(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {assets
                  .filter(a => a.rowId !== fromAssetRowId)
                  .map(a => (
                    <SelectItem key={a.rowId} value={String(a.rowId)}>
                      {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>수수료 (선택)</FieldLabel>
            <Input
              className="num"
              value={fee}
              onChange={e => setFee(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </>
      )}

      {/* 날짜·시간 (TRANSFER는 시간 없음 — 백엔드 transferDate가 LocalDate) */}
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{type === 'TRANSFER' ? '날짜' : '날짜·시간'}</FieldLabel>
        {type === 'TRANSFER' ? (
          <InputDatePicker value={expenseDate} onValueChange={setExpenseDate} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 116px', gap: 8 }}>
            <InputDatePicker value={expenseDate} onValueChange={setExpenseDate} />
            <InputTimePicker
              value={expenseTime}
              onValueChange={setExpenseTime}
              minuteStep={5}
            />
          </div>
        )}
      </Field>

      {/* 메모 */}
      <Field style={{ marginBottom: 4 }}>
        <FieldLabel>메모</FieldLabel>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="선택 사항"
          style={{ minHeight: 64 }}
        />
      </Field>

      {savePresetOpen && (
        <SavePresetDialog
          mobile={mobile}
          onClose={() => setSavePresetOpen(false)}
          seed={{
            expenseType: type === 'TRANSFER' ? 'EXPENSE' : type,
            amount: amountNumber,
            categoryRowId,
            categoryName: selectedCategory?.categoryName ?? null,
            assetRowId,
            assetName: assets.find(a => a.rowId === assetRowId)?.assetName ?? null,
            merchant,
            paymentMethod,
            description,
          }}
        />
      )}

      {openReconcile && expense && (
        <SplitTxDialog
          expense={expense}
          mobile={mobile}
          overrideTotal={amountNumber}
          recordedTotal={Math.abs(expense.amount)}
          initialSplits={effectiveSplits.length > 0 ? effectiveSplits : undefined}
          onReconciled={(splits) => {
            setReconciledSplits(splits)
            setOpenReconcile(false)
          }}
          onClose={() => setOpenReconcile(false)}
        />
      )}

      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0.15 0.01 180 / 0.5)',
            zIndex: 'var(--z-sticky)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => !submitting && setConfirmDelete(false)}
        >
          <Card
            style={{ width: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <CardContent>
              <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: '700', marginBottom: 8 }}>거래 삭제</div>
              <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', lineHeight: '1.7', marginBottom: 16 }}>
                선택한 거래를 삭제하시겠어요? 연결된 자산 잔액이 함께 조정됩니다.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  disabled={submitting}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={doDelete}
                  loading={submitting}
                >
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ModalShell>
  )
}

// =========================================================================
// SavePresetDialog — 현재 입력값을 프리셋으로 저장
// =========================================================================
type SavePresetSeed = {
  expenseType: 'EXPENSE' | 'INCOME'
  amount: number
  categoryRowId: number | null
  categoryName: string | null
  assetRowId: number | null
  assetName: string | null
  merchant: string
  paymentMethod: string
  description: string
}

function SavePresetDialog({
  onClose,
  mobile,
  seed,
}: {
  onClose: () => void
  mobile: boolean
  seed: SavePresetSeed
}) {
  const [name, setName] = useState(seed.merchant || '')
  const [lockAmount, setLockAmount] = useState(false)

  const createMut = useCreateExpenseTemplate()

  const canSave = name.trim().length > 0 && seed.categoryRowId != null

  const submit = () => {
    if (!canSave) return
    createMut.mutate(
      {
        templateName: name.trim(),
        categoryRowId: seed.categoryRowId,
        assetRowId: seed.assetRowId ?? undefined,
        expenseType: seed.expenseType,
        amount: lockAmount ? seed.amount : undefined,
        description: seed.description || undefined,
        merchant: seed.merchant || undefined,
        paymentMethod: seed.paymentMethod || undefined,
        lockAmount: lockAmount ? 'Y' : 'N',
      },
      { onSuccess: onClose },
    )
  }

  const Footer = (
    <ModalFooter
      onSave={submit}
      saveLabel="저장"
      saving={createMut.isPending}
      saveDisabled={!canSave}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title="프리셋으로 저장" onClose={onClose} mobile={mobile} size="md" footer={Footer}>
      {/* 시드 미리보기 */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-tile)',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: '700',
              color: 'var(--fg-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {seed.merchant || '내역 없음'}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {seed.categoryName ?? '카테고리 미선택'}
            {seed.assetName ? ` · ${seed.assetName}` : ''}
          </div>
        </div>
        <div
          className="num"
          style={{
            fontSize: 'var(--text-body-lg)',
            fontWeight: '800',
            color: seed.expenseType === 'EXPENSE' ? 'var(--fg-expense)' : 'var(--fg-income)',
          }}
        >
          {seed.expenseType === 'EXPENSE' ? '−' : '+'}
          {KRW(seed.amount)}
        </div>
      </div>

      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>프리셋 이름</FieldLabel>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 점심 도시락"
          autoFocus
        />
      </Field>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-tile)',
          cursor: 'pointer',
        }}
      >
        <Checkbox
          checked={lockAmount}
          onCheckedChange={(c) => setLockAmount(c === true)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 2 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-primary)' }}>금액도 함께 저장</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2, lineHeight: '1.3' }}>
            {lockAmount
              ? `${KRW(seed.amount)}원이 항상 채워집니다.`
              : '체크 해제 시 금액은 비워두고 매번 직접 입력합니다.'}
          </div>
        </div>
      </label>

      {seed.categoryRowId == null && (
        <div style={{ marginTop: 10, fontSize: 'var(--text-caption)', color: 'var(--fg-expense)' }}>
          저장하려면 먼저 카테고리를 선택해주세요.
        </div>
      )}
    </ModalShell>
  )
}
