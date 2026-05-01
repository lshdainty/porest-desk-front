import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Info, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { renderIcon } from '@/shared/lib'
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
import type { Expense, ExpenseCategory, ExpenseFormValues } from '@/entities/expense'
import type { Asset, AssetType } from '@/entities/asset'
import type { ExpenseTemplate } from '@/entities/expense-template'

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

export function AddTxSheet({ onClose, mobile, expense, defaultDate }: Props) {
  const isEdit = !!expense

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const createMut = useCreateExpense()
  const updateMut = useUpdateExpense()
  const deleteMut = useDeleteExpense()
  const createTransferMut = useCreateTransfer()
  const touchPresetMut = useTouchExpenseTemplate()

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
  const amountFormatted = amountNumber.toLocaleString('ko-KR')

  const canSave = (() => {
    if (amountNumber <= 0) return false
    if (type === 'TRANSFER') {
      return !!fromAssetRowId && !!toAssetRowId && fromAssetRowId !== toAssetRowId
    }
    return !!categoryRowId
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
    const data: ExpenseFormValues = {
      categoryRowId: categoryRowId!,
      assetRowId: assetRowId ?? undefined,
      expenseType: type,
      amount: amountNumber,
      description: description || undefined,
      expenseDate,
      merchant: merchant || undefined,
      paymentMethod: paymentMethod || undefined,
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
    type === 'EXPENSE' ? 'var(--berry-700)'
    : type === 'INCOME' ? 'var(--mossy-700)'
    : 'var(--fg-primary)'
  const amountPrefix = type === 'EXPENSE' ? '−' : type === 'INCOME' ? '+' : ''

  const Footer = (
    <>
      {isEdit && (
        <button
          type="button"
          className="p-btn p-btn--ghost"
          onClick={onDeleteClick}
          disabled={submitting}
          style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
        >
          <Trash2 size={14} /> 삭제
        </button>
      )}
      <button type="button" className="p-btn p-btn--ghost" onClick={onClose} disabled={submitting}>
        취소
      </button>
      <button
        type="button"
        className="p-btn p-btn--primary"
        onClick={save}
        disabled={!canSave || submitting}
      >
        {submitting ? '저장 중…' : isEdit ? '저장' : '추가'}
      </button>
    </>
  )

  return (
    <ModalShell
      title={isEdit ? '거래 편집' : '내역 추가'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      {/* 타입 segment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          padding: 3,
          background: 'var(--pd-surface-inset)',
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        {([
          { v: 'EXPENSE', l: '지출', c: 'var(--berry-700)' },
          { v: 'INCOME', l: '수입', c: 'var(--mossy-700)' },
          { v: 'TRANSFER', l: '이체', c: 'var(--fg-primary)' },
        ] as { v: TxType; l: string; c: string }[]).map(o => {
          const active = type === o.v
          const disabled = isEdit && o.v !== (expense?.expenseType ?? type) // edit 모드는 타입 변경 막음
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => {
                if (disabled) return
                setType(o.v)
                clearPresetMark()
              }}
              disabled={disabled}
              style={{
                background: active ? 'var(--bg-surface)' : 'transparent',
                color: active ? o.c : 'var(--fg-secondary)',
                border: 0,
                padding: '8px 0',
                fontSize: 13.5,
                fontWeight: 700,
                borderRadius: 8,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                fontFamily: 'inherit',
                boxShadow: active ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {o.l}
            </button>
          )
        })}
      </div>

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
                  fontSize: 11,
                  color: 'var(--fg-tertiary)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                프리셋 불러오기
              </span>
              {activePresetId != null && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--fg-brand-strong)',
                    fontWeight: 700,
                    padding: '2px 6px',
                    background: 'var(--bg-brand-subtle)',
                    borderRadius: 4,
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
                fontSize: 11.5,
                color: amountNumber > 0 && categoryRowId ? 'var(--fg-brand-strong)' : 'var(--fg-tertiary)',
                fontWeight: 600,
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
                const catColor = cat?.color ?? 'var(--mossy-600)'
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
                      background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                      border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 600,
                      color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.12s',
                      boxShadow: active ? '0 0 0 2px var(--bg-brand-subtle)' : 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    {cat && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          background: `color-mix(in oklch, ${catColor} 18%, transparent)`,
                          color: catColor,
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
                          fontSize: 11,
                          color: active ? 'var(--fg-brand-strong)' : 'var(--fg-tertiary)',
                          fontWeight: 600,
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
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
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
                background: 'var(--pd-surface-inset)',
                border: '1px dashed var(--border-default)',
                borderRadius: 8,
                fontSize: 11.5,
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
                border: '1px solid var(--mossy-500)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Info size={13} style={{ color: 'var(--fg-brand-strong)' }} />
              <span
                style={{
                  fontSize: 11.5,
                  color: 'var(--fg-brand-strong)',
                  fontWeight: 600,
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
                  fontSize: 11,
                  color: 'var(--fg-brand-strong)',
                  fontWeight: 700,
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

      {/* 큰 금액 */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          금액
        </div>
        <div
          className="num"
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: amountColor,
          }}
        >
          {amountPrefix}
          {amountFormatted}
          <span style={{ fontSize: 20, color: 'var(--fg-tertiary)', marginLeft: 4, fontWeight: 700 }}>원</span>
        </div>
        <input
          className="p-input num"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          inputMode="numeric"
          style={{ marginTop: 10, textAlign: 'center', fontSize: 15 }}
        />
      </div>

      {type !== 'TRANSFER' ? (
        <>
          {/* 카테고리 */}
          {topCategories.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-tertiary)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                카테고리
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {topCategories.map(c => {
                  const active = selectedParentId === c.rowId
                  const color = c.color ?? 'var(--mossy-600)'
                  return (
                    <button
                      key={c.rowId}
                      type="button"
                      onClick={() => {
                        const firstChild = childrenByParent.get(c.rowId)?.[0]
                        setCategoryRowId(firstChild ? firstChild.rowId : c.rowId)
                        clearPresetMark()
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '10px 4px',
                        background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                        border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          // color-mix 로 18% 알파 tint — light/dark 모두 자연 적응.
                          // 기존 `oklch(from ${color} l c h / 0.14)` 는 다크모드에서
                          // 알파가 낮아 카테고리 구분이 어려웠음.
                          background: `color-mix(in oklch, ${color} 18%, transparent)`,
                          color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderIcon(c.icon, c.categoryName.charAt(0), 18)}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: active ? 700 : 500,
                          color: active ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {c.categoryName}
                      </span>
                    </button>
                  )
                })}
              </div>

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
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">{type === 'INCOME' ? '수입처' : '거래처'}</label>
            <input
              className="p-input"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              placeholder={type === 'INCOME' ? '예: (주)포레스트' : '예: 스타벅스 강남점'}
            />
          </div>

          {/* 결제 수단 — 먼저 선택, 계좌·카드 목록을 필터링 */}
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">
              {type === 'INCOME' ? '수입 방식' : '결제 수단'}
            </label>
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
          </div>

          {/* 계좌·카드 — 결제 수단에 맞춰 필터 */}
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">
              {type === 'INCOME' ? '입금 계좌' : '계좌·카드'}
              {paymentMethod && filteredAssets.length !== assets.length && (
                <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400, marginLeft: 4 }}>
                  ({PAYMENT_METHODS.find(p => p.v === paymentMethod)?.l ?? ''} 기준)
                </span>
              )}
            </label>
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
              <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 4 }}>
                해당 결제 수단에 연결된 자산이 없어요.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 이체: 출금 → 입금 */}
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">출금 계좌</label>
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
          </div>
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">입금 계좌</label>
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
          </div>
          <div className="p-field" style={{ marginBottom: 14 }}>
            <label className="p-field__label">수수료 (선택)</label>
            <input
              className="p-input num"
              value={fee}
              onChange={e => setFee(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
        </>
      )}

      {/* 날짜 */}
      <div className="p-field" style={{ marginBottom: 14 }}>
        <label className="p-field__label">날짜</label>
        <InputDatePicker value={expenseDate} onValueChange={setExpenseDate} />
      </div>

      {/* 메모 */}
      <div className="p-field" style={{ marginBottom: 4 }}>
        <label className="p-field__label">메모</label>
        <textarea
          className="p-textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="선택 사항"
          style={{ minHeight: 64 }}
        />
      </div>

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

      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0.15 0.01 180 / 0.5)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => !submitting && setConfirmDelete(false)}
        >
          <div
            className="p-card"
            style={{ width: 360, padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>거래 삭제</div>
            <div style={{ fontSize: 13.5, color: 'var(--fg-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              선택한 거래를 삭제하시겠어요? 연결된 자산 잔액이 함께 조정됩니다.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="p-btn p-btn--ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="p-btn p-btn--danger"
                onClick={doDelete}
                disabled={submitting}
              >
                삭제
              </button>
            </div>
          </div>
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
    <>
      <button type="button" className="p-btn p-btn--ghost" onClick={onClose} disabled={createMut.isPending}>
        취소
      </button>
      <button
        type="button"
        className="p-btn p-btn--primary"
        onClick={submit}
        disabled={!canSave || createMut.isPending}
      >
        {createMut.isPending ? '저장 중…' : '저장'}
      </button>
    </>
  )

  return (
    <ModalShell title="프리셋으로 저장" onClose={onClose} mobile={mobile} size="md" footer={Footer}>
      {/* 시드 미리보기 */}
      <div
        style={{
          padding: 14,
          background: 'var(--pd-surface-inset)',
          borderRadius: 10,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--fg-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {seed.merchant || '내역 없음'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
            {seed.categoryName ?? '카테고리 미선택'}
            {seed.assetName ? ` · ${seed.assetName}` : ''}
          </div>
        </div>
        <div
          className="num"
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: seed.expenseType === 'EXPENSE' ? 'var(--berry-700)' : 'var(--mossy-700)',
          }}
        >
          {seed.expenseType === 'EXPENSE' ? '−' : '+'}
          {KRW(seed.amount)}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: 16 }}>
        <label className="p-field__label">프리셋 이름</label>
        <input
          className="p-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 점심 도시락"
          autoFocus
        />
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          background: 'var(--pd-surface-inset)',
          borderRadius: 10,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={lockAmount}
          onChange={e => setLockAmount(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>금액도 함께 저장</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2, lineHeight: 1.4 }}>
            {lockAmount
              ? `${KRW(seed.amount)}원이 항상 채워집니다.`
              : '체크 해제 시 금액은 비워두고 매번 직접 입력합니다.'}
          </div>
        </div>
      </label>

      {seed.categoryRowId == null && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--berry-700)' }}>
          저장하려면 먼저 카테고리를 선택해주세요.
        </div>
      )}
    </ModalShell>
  )
}
