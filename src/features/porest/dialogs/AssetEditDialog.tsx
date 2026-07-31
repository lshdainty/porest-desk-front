import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { SearchableList, SearchableListItem } from '@/shared/ui/searchable-list'
import { Switch } from '@/shared/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useAssets } from '@/features/asset'
import { KRW } from '@/shared/lib/porest/format'
import {
  getBrandColor,
  BANK_ENTRIES,
  BANK_ENTRIES_BY_CATEGORY,
  BANK_CATEGORY_ORDER,
  INVEST_CATEGORIES,
  type BankCategory,
  type BankEntry,
} from '@/shared/lib/porest/bank-colors'

const INVEST_CATEGORY_SET = new Set<BankCategory>(INVEST_CATEGORIES)

const CATEGORY_LABEL: Record<BankCategory, string> = {
  '시중은행': '시중은행',
  '인터넷은행': '인터넷은행',
  '지방은행': '지방은행',
  '특수은행': '특수은행',
  '저축기관': '저축기관',
  '외국계': '외국계',
  '증권사': '증권사',
  '가상자산': '가상자산거래소',
  '기타': '기타',
}
import { useCardCatalogs } from '@/features/card-catalog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import type { CardCatalogSummary, CardType } from '@/entities/card'
import {
  AssetLogo,
  type Asset,
  type AssetFormValues,
  type AssetHolding,
  type AssetType,
  type AssetUpdateFormValues,
  type YNType,
} from '@/entities/asset'
import { useStockSearch, useStockSymbolName } from '@/features/stock/model/useStockMaster'
import { useTossPrices, useTossExchangeRate } from '@/features/stock/model/useTossStocks'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { Button } from '@/shared/ui/button'

export type AssetGroup = 'account' | 'card' | 'invest'

// 투자 보유 편집 행 — 로컬 편집용(react key + 검색 시 확보한 표시명 보관).
type EditHolding = {
  key: string
  rowId?: number
  linked: boolean
  tossSymbol?: string
  quantity?: number
  holdingName?: string
  holdingValue?: number
  /** 검색에서 추가한 연동 항목의 종목명(표시용 — payload 미포함) */
  displayName?: string
}

let editHoldingSeq = 0
const nextHoldingKey = () => `eh-${++editHoldingSeq}`

/** 검색 입력 디바운스 — 키 입력마다 서버 검색이 나가지 않게 한다. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** 연동 항목 이름 — 저장돼 있던 항목은 심볼→마스터 이름 조회(캐시), 검색 추가분은 displayName. */
function LinkedHoldingName({ holding }: { holding: EditHolding }) {
  const { data: masterName } = useStockSymbolName(
    holding.displayName ? '' : holding.tossSymbol ?? '',
  )
  return <>{holding.displayName ?? masterName ?? holding.tossSymbol ?? ''}</>
}

type AccountSub = '입출금' | '적금' | '예금' | '현금' | '대출'
const ACCOUNT_SUBS: AccountSub[] = ['입출금', '적금', '예금', '현금', '대출']

// AccountSub(타입 판별자, 한글 리터럴)의 표시 라벨 i18n 키 매핑
const ACCOUNT_SUB_KEY: Record<AccountSub, string> = {
  '입출금': 'checking',
  '적금': 'savings',
  '예금': 'deposit',
  '현금': 'cash',
  '대출': 'loan',
}

const GROUP_NOUN_KEY: Record<AssetGroup, string> = {
  account: 'group.account',
  card: 'group.card',
  invest: 'group.invest',
}

function subToAssetType(sub: AccountSub): AssetType {
  switch (sub) {
    case '입출금': return 'BANK_ACCOUNT'
    case '적금':   return 'SAVINGS'
    case '예금':   return 'SAVINGS'
    case '현금':   return 'CASH'
    case '대출':   return 'LOAN'
  }
}

function assetTypeToSub(t: AssetType): AccountSub {
  switch (t) {
    case 'BANK_ACCOUNT': return '입출금'
    case 'SAVINGS':      return '적금'
    case 'CASH':         return '현금'
    case 'LOAN':         return '대출'
    default:             return '입출금'
  }
}

const groupOfType = (t: AssetType): AssetGroup => {
  if (t === 'CREDIT_CARD' || t === 'CHECK_CARD') return 'card'
  if (t === 'INVESTMENT') return 'invest'
  return 'account'
}

const INVEST_BRANDS: BankEntry[] = INVEST_CATEGORIES.flatMap(
  cat => BANK_ENTRIES_BY_CATEGORY[cat] ?? [],
)

export interface AssetEditDialogProps {
  item: Asset | null
  group: AssetGroup
  onClose: () => void
  onCreate: (values: AssetFormValues) => void
  onUpdate: (values: AssetUpdateFormValues) => void
  onDelete?: () => void
  mobile: boolean
  isSubmitting?: boolean
}

export function AssetEditDialog({
  item,
  group,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  mobile,
  isSubmitting,
}: AssetEditDialogProps) {
  const { t } = useTranslation('asset')
  const { t: tCommon } = useTranslation('common')
  const isNew = !item
  const editingGroup: AssetGroup = item ? groupOfType(item.assetType) : group

  // 공통
  const [brand, setBrand] = useState<string>(
    item?.institution ??
      (editingGroup === 'invest'
        ? INVEST_BRANDS[0]?.name ?? '삼성증권'
        : BANK_ENTRIES[0]?.name ?? '신한'),
  )
  const [query, setQuery] = useState('')
  const [name, setName] = useState(item?.assetName ?? '')
  const [memo, setMemo] = useState(item?.memo ?? '')
  const [isIncludedInTotal, setIsIncludedInTotal] = useState<YNType>(item?.isIncludedInTotal ?? 'Y')
  const [balanceStr, setBalanceStr] = useState<string>(
    item ? KRW(item.balance ?? 0) : '0',
  )

  // 계좌 sub
  const [accountSub, setAccountSub] = useState<AccountSub>(
    item && editingGroup === 'account' ? assetTypeToSub(item.assetType) : '입출금',
  )

  // 투자 — 보유 종목 다건 편집 (design AssetEditDialog invest 분기 미러).
  // 기존 holdings 우선, 구버전 단일 연동(tossSymbol)은 linked 1건으로 합성(하위호환).
  const [holdings, setHoldings] = useState<EditHolding[]>(() => {
    if (item?.holdings && item.holdings.length > 0) {
      return item.holdings.map(h => ({
        key: nextHoldingKey(),
        rowId: h.rowId,
        linked: h.linked,
        tossSymbol: h.tossSymbol ?? undefined,
        quantity: h.quantity ?? undefined,
        holdingName: h.holdingName ?? undefined,
        holdingValue: h.holdingValue ?? undefined,
      }))
    }
    if (item?.tossSymbol && item.tossQuantity != null) {
      return [
        {
          key: nextHoldingKey(),
          linked: true,
          tossSymbol: item.tossSymbol,
          quantity: item.tossQuantity,
        },
      ]
    }
    return []
  })
  const [stockQ, setStockQ] = useState('')
  const debouncedStockQ = useDebounced(stockQ.trim(), 300)
  const { data: features } = useMyFeatures()
  const liveEnabled =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const { data: stockMatches = [], isFetching: stockSearching } = useStockSearch(
    editingGroup === 'invest' ? debouncedStockQ : '',
  )
  const stockResults = useMemo(
    () =>
      stockMatches
        .filter(s => !holdings.some(h => h.linked && h.tossSymbol === s.symbol))
        .slice(0, 6),
    [stockMatches, holdings],
  )
  // 연동 항목 라이브 평가 — 시세(10초 폴링)×수량, 외화는 환율 환산. 게이트 밖이면 미평가.
  const holdingSymbols = useMemo(
    () => [...new Set(holdings.filter(h => h.linked && h.tossSymbol).map(h => h.tossSymbol as string))],
    [holdings],
  )
  const priceActive = liveEnabled && editingGroup === 'invest' && holdingSymbols.length > 0
  const activeHoldingSymbols = useMemo(
    () => (priceActive ? holdingSymbols : []),
    [priceActive, holdingSymbols],
  )
  const holdingPricesQ = useTossPrices(activeHoldingSymbols)
  const holdingFxQ = useTossExchangeRate(priceActive)
  const holdingValueOf = useMemo(() => {
    const priceBySymbol = new Map<string, { price: number; currency: string }>()
    for (const p of holdingPricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) priceBySymbol.set(p.symbol, { price: v, currency: p.currency })
    }
    const fx = Number.parseFloat(holdingFxQ.data?.rate ?? '')
    return (h: EditHolding): number | null => {
      if (!h.linked) return h.holdingValue ?? 0
      const info = h.tossSymbol ? priceBySymbol.get(h.tossSymbol) : undefined
      if (!info) return null
      const krw =
        info.currency === 'KRW'
          ? info.price
          : Number.isFinite(fx) && fx > 0
            ? info.price * fx
            : null
      return krw != null ? Math.round(krw * (h.quantity ?? 0)) : null
    }
  }, [holdingPricesQ.data, holdingFxQ.data])
  // 합계 — 평가 불가 연동 항목은 0 취급하지 않고 '평가 가능분 합'으로 표기.
  const holdingsTotal = useMemo(
    () => holdings.reduce((s, h) => s + (holdingValueOf(h) ?? 0), 0),
    [holdings, holdingValueOf],
  )

  // 카드
  const [cardType, setCardType] = useState<CardType>(
    item?.assetType === 'CHECK_CARD' ? 'CHECK' : 'CREDIT',
  )
  const [cardKeyword, setCardKeyword] = useState('')
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardCatalogSummary | null>(null)

  // 신용카드 청구사이클 (CREDIT_CARD 전용)
  const [creditLimit, setCreditLimit] = useState<string>(
    item?.creditLimit != null ? String(item.creditLimit) : '',
  )
  const [paymentDay, setPaymentDay] = useState<string>(
    item?.paymentDay != null ? String(item.paymentDay) : '',
  )
  const [paymentAssetRowId, setPaymentAssetRowId] = useState<number | null>(
    item?.paymentAssetRowId ?? null,
  )

  const { data: assetsData } = useAssets()
  const bankAccounts = useMemo(
    () =>
      (assetsData?.assets ?? []).filter(
        a => a.assetType === 'BANK_ACCOUNT' && a.rowId !== item?.rowId,
      ),
    [assetsData, item?.rowId],
  )

  const catalogQ = useCardCatalogs({
    keyword: cardKeyword.trim() || undefined,
    cardType,
    includeDiscontinued: includeDiscontinued || undefined,
    page: 0,
    size: 40,
  })
  const catalogItems = catalogQ.data?.content ?? []

  // 편집 진입 시 기존 카드 카탈로그를 선택 상태처럼 보이도록 채움
  useEffect(() => {
    if (!item || editingGroup !== 'card') return
    if (!item.cardCatalog) {
      setSelectedCard(null)
      return
    }
    setSelectedCard({
      rowId: item.cardCatalog.rowId,
      externalCardId: 0,
      cardName: item.cardCatalog.cardName,
      cardType: item.assetType === 'CHECK_CARD' ? 'CHECK' : 'CREDIT',
      benefitType: 'POINT',
      isDiscontinued: 'N',
      onlyOnline: 'N',
      launchDate: null,
      imgUrl: item.cardCatalog.imgUrl,
      detailUrl: null,
      annualFee: { amount: 0, label: null },
      performance: { requiredAmount: 0, requiredText: null, isRequired: 'N' },
      company: item.cardCatalog.companyName
        ? {
            rowId: 0,
            name: item.cardCatalog.companyName,
            nameEng: '',
            logoUrl: item.cardCatalog.companyLogoUrl,
          }
        : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.rowId])

  // 은행 검색 (category 묶음 — 투자용 카테고리는 제외)
  const matchesQuery = (e: BankEntry, q: string) => {
    if (!q) return true
    const needle = q.toLowerCase().replace(/\s+/g, '')
    if (e.name.toLowerCase().replace(/\s+/g, '').includes(needle)) return true
    return (e.aliases ?? []).some(a =>
      a.toLowerCase().replace(/\s+/g, '').includes(needle),
    )
  }

  const bankFilteredByCategory = useMemo(() => {
    const result: [BankCategory, BankEntry[]][] = []
    for (const cat of BANK_CATEGORY_ORDER) {
      if (INVEST_CATEGORY_SET.has(cat)) continue
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter(e =>
        matchesQuery(e, query),
      )
      if (list.length > 0) result.push([cat, list])
    }
    return result
  }, [query])

  const investFilteredByCategory = useMemo(() => {
    const result: [BankCategory, BankEntry[]][] = []
    for (const cat of INVEST_CATEGORIES) {
      const list = (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter(e => matchesQuery(e, query))
      if (list.length > 0) result.push([cat, list])
    }
    return result
  }, [query])

  const investFilteredCount = investFilteredByCategory.reduce((sum, [, list]) => sum + list.length, 0)

  // 색/미리보기
  const cardCompanyName = selectedCard?.company?.name ?? item?.institution ?? ''
  const cardBrandColor = useMemo(
    () => getBrandColor(cardCompanyName, selectedCard?.cardName),
    [cardCompanyName, selectedCard?.cardName],
  )
  const brandColor = useMemo(() => {
    if (editingGroup === 'card') return cardBrandColor
    return getBrandColor(brand)
  }, [editingGroup, brand, cardBrandColor])

  const previewBg = brandColor?.bg ?? item?.color ?? 'var(--border-brand)'
  const previewFg = brandColor?.fg ?? '#fff'

  const previewName = (() => {
    const trimmed = name.trim()
    if (trimmed) return trimmed
    if (editingGroup === 'card') return selectedCard?.cardName || t('editDialog.newCard')
    if (editingGroup === 'invest') return t('editDialog.newInvest')
    return t('editDialog.newAccount')
  })()

  const previewSub = (() => {
    if (editingGroup === 'card') {
      const company = cardCompanyName
      const typeLabel = cardType === 'CREDIT' ? t('assetType.creditcard') : t('assetType.checkcard')
      return `${company ? `${company} · ` : ''}${typeLabel}`
    }
    return t('editDialog.previewSub', { brand })
  })()

  // 유효성
  const canSubmit = (() => {
    if (editingGroup === 'card') {
      // 편집 모드: 카드 카탈로그 재선택 없이 별칭/금액만 바꿀 수 있어야 함
      return isNew ? !!selectedCard : true
    }
    return (name.trim().length > 0 || !isNew) && brand.trim().length > 0
  })()

  const title = (() => {
    const group = t(GROUP_NOUN_KEY[editingGroup])
    return isNew
      ? t('editDialog.titleAdd', { group })
      : t('editDialog.titleEdit', { group })
  })()

  const nameLabel =
    editingGroup === 'invest'
      ? t('editDialog.nameLabelInvest')
      : editingGroup === 'card'
      ? t('editDialog.nameLabelCard')
      : t('editDialog.nameLabelAccount')
  const namePlaceholder =
    editingGroup === 'invest'
      ? t('editDialog.namePlaceholderInvest')
      : editingGroup === 'card'
      ? selectedCard?.cardName ?? t('editDialog.namePlaceholderCard')
      : t('editDialog.namePlaceholderAccount')

  const balanceLabel =
    editingGroup === 'card'
      ? t('editDialog.balanceLabelCard')
      : editingGroup === 'invest'
      ? t('editDialog.balanceLabelInvest')
      : t('editDialog.balanceLabelAccount')

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const parsedBalance = Number(balanceStr.replace(/[^\d-]/g, '')) || 0

    if (editingGroup === 'card') {
      const type: AssetType = cardType === 'CREDIT' ? 'CREDIT_CARD' : 'CHECK_CARD'
      const isCredit = cardType === 'CREDIT'
      const resolvedName =
        name.trim() || selectedCard?.cardName || item?.assetName || '카드'
      const catalogId = selectedCard?.rowId ?? item?.cardCatalog?.rowId ?? null
      const institution =
        selectedCard?.company?.name ?? item?.institution ?? undefined
      const color = cardBrandColor?.bg ?? item?.color ?? undefined

      const parsedLimit = creditLimit.trim() ? parseInt(creditLimit, 10) : null
      const parsedDay = paymentDay.trim() ? parseInt(paymentDay, 10) : null
      const billingFields = {
        creditLimit: isCredit ? (Number.isFinite(parsedLimit as number) ? parsedLimit : null) : null,
        paymentDay: isCredit ? (Number.isFinite(parsedDay as number) ? parsedDay : null) : null,
        paymentAssetRowId: isCredit ? paymentAssetRowId : null,
      }

      if (isNew) {
        onCreate({
          assetName: resolvedName,
          assetType: type,
          balance: parsedBalance,
          currency: 'KRW',
          institution,
          color,
          isIncludedInTotal,
          cardCatalogRowId: catalogId,
          ...billingFields,
        })
      } else {
        onUpdate({
          assetName: resolvedName,
          assetType: type,
          balance: parsedBalance,
          currency: 'KRW',
          institution,
          color,
          memo: memo.trim() || undefined,
          isIncludedInTotal,
          cardCatalogRowId: catalogId,
          ...billingFields,
        })
      }
      return
    }

    if (editingGroup === 'invest') {
      const resolvedName = name.trim() || `${brand} 투자`
      // holdings 페이로드 — 리스트 전체 교체 계약. linked→tossSymbol+quantity / manual→holdingName+holdingValue.
      const holdingsPayload: AssetHolding[] = holdings.map((h, i) => ({
        rowId: h.rowId,
        linked: h.linked,
        tossSymbol: h.linked ? h.tossSymbol ?? null : null,
        quantity: h.linked ? h.quantity ?? 0 : null,
        holdingName: h.linked ? null : h.holdingName ?? '',
        holdingValue: h.linked ? null : h.holdingValue ?? 0,
        sortOrder: i,
      }))
      // 보유가 있으면 balance = 평가 가능분 합(연동 시세 미확보는 0 대신 제외된 합) — 서버 스냅샷용.
      const investBalance = holdings.length > 0 ? holdingsTotal : parsedBalance
      const common = {
        assetName: resolvedName,
        assetType: 'INVESTMENT' as AssetType,
        balance: investBalance,
        currency: 'KRW',
        institution: brand,
        color: brandColor?.bg,
        memo: memo.trim() || undefined,
        isIncludedInTotal,
        holdings: holdingsPayload,
      }
      if (isNew) onCreate(common)
      else onUpdate(common)
      return
    }

    // account
    const assetType = subToAssetType(accountSub)
    const resolvedName = name.trim() || `${brand} ${accountSub}`
    if (isNew) {
      onCreate({
        assetName: resolvedName,
        assetType,
        balance: parsedBalance,
        currency: 'KRW',
        institution: brand,
        color: brandColor?.bg,
        memo: memo.trim() || undefined,
        isIncludedInTotal,
      })
    } else {
      onUpdate({
        assetName: resolvedName,
        assetType,
        balance: parsedBalance,
        currency: 'KRW',
        institution: brand,
        color: brandColor?.bg,
        memo: memo.trim() || undefined,
        isIncludedInTotal,
      })
    }
  }

  const bodyContent = (
    <Fragment>
          {/* Preview */}
          <div className="flex items-center gap-3">
            {editingGroup === 'card' && selectedCard?.imgUrl ? (
              <img
                src={selectedCard.imgUrl}
                alt=""
                className="rounded-[var(--radius-md)] object-cover flex-shrink-0"
                style={{ width: 68, height: 44 }}
              />
            ) : editingGroup === 'card' ? (
              <span
                className="inline-flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
                style={{
                  width: 68,
                  height: 44,
                  background: previewBg,
                  color: previewFg,
                }}
              >
                <CreditCard size={20} />
              </span>
            ) : (
              <AssetLogo
                asset={{ assetName: previewName, institution: brand, color: brandColor?.bg ?? item?.color ?? null }}
                size={52}
              />
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">{previewName}</div>
              <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">{previewSub}</div>
            </div>
          </div>

          {/* Group별 본문 */}
          {editingGroup === 'card' ? (
            <>
              <div>
                <Label className="text-[13px] font-medium mb-2 block">{t('editDialog.cardTypeLabel')}</Label>
                <Tabs
                  value={cardType}
                  onValueChange={(v) => {
                    if (!v) return
                    setCardType(v as CardType)
                    if (isNew) setSelectedCard(null)
                  }}
                >
                  <TabsList variant="pill" size="sm" className="w-full">
                    <TabsTrigger value="CREDIT" className="flex-1">{t('assetType.creditcard')}</TabsTrigger>
                    <TabsTrigger value="CHECK" className="flex-1">{t('assetType.checkcard')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <SearchableList
                label={t('editDialog.cardProduct')}
                totalCount={catalogQ.data?.meta?.totalElements}
                searchValue={cardKeyword}
                onSearchChange={setCardKeyword}
                placeholder={t('editDialog.cardSearchPlaceholder')}
                isLoading={catalogQ.isLoading}
                loadingSkeleton={
                  <div className="flex flex-col">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2.5"
                        style={{ borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}
                      >
                        <SkeletonBase className="h-7 w-11 rounded-sm shrink-0" />
                        <div className="flex-1 min-w-0">
                          <SkeletonBase className="h-3.5 w-2/3 mb-1.5" />
                          <SkeletonBase className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                }
                headerExtras={
                  <label
                    className="inline-flex items-center cursor-pointer select-none gap-1.5 text-caption text-text-tertiary"
                    title={t('editDialog.includeDiscontinuedTooltip')}
                  >
                    <Switch
                      checked={includeDiscontinued}
                      onCheckedChange={setIncludeDiscontinued}
                    />
                    {t('editDialog.includeDiscontinued')}
                  </label>
                }
              >
                {catalogItems.map(c => {
                  const active = selectedCard?.rowId === c.rowId
                  const discontinued = c.isDiscontinued === 'Y'
                  const thumbnail = c.imgUrl ? (
                    <img
                      src={c.imgUrl}
                      alt=""
                      className="rounded object-cover"
                      style={{ width: 44, height: 28 }}
                    />
                  ) : (
                    <span
                      className="rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        width: 44,
                        height: 28,
                        background: getBrandColor(c.company?.name)?.bg ?? 'var(--color-chart-brown)',
                      }}
                    >
                      {(c.company?.name ?? c.cardName).slice(0, 1)}
                    </span>
                  )
                  return (
                    <SearchableListItem
                      key={c.rowId}
                      active={active}
                      dim={discontinued}
                      onClick={() => setSelectedCard(c)}
                      thumbnail={thumbnail}
                      title={
                        <>
                          <span className="truncate">{c.cardName}</span>
                          {discontinued && (
                            <span
                              className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold flex-shrink-0"
                              style={{
                                background: 'var(--bg-disabled)',
                                color: 'var(--fg-tertiary)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {t('editDialog.discontinued')}
                            </span>
                          )}
                        </>
                      }
                      subtitle={
                        <>
                          {c.company?.name ?? '—'} · {c.cardType === 'CREDIT' ? t('cardTypeShort.credit') : t('cardTypeShort.check')}
                          {c.annualFee.amount > 0 && (
                            <> · {t('editDialog.annualFeeValue', { amount: c.annualFee.amount.toLocaleString('ko-KR') })}</>
                          )}
                        </>
                      }
                    />
                  )
                })}
              </SearchableList>

            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[13px] font-medium">
                  {editingGroup === 'invest' ? t('editDialog.brokerExchange') : t('editDialog.institutionBrand')}
                </Label>
                <span className="text-[11px] text-[var(--fg-tertiary)]">
                  {t('editDialog.totalCount', {
                    count:
                      editingGroup === 'invest'
                        ? INVEST_BRANDS.length
                        : BANK_ENTRIES.filter(e => !INVEST_CATEGORY_SET.has(e.category)).length,
                  })}
                </span>
              </div>
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
                />
                <Input
                  search
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={
                    editingGroup === 'invest'
                      ? t('editDialog.investSearchPlaceholder')
                      : t('editDialog.bankSearchPlaceholder')
                  }
                  className="pl-9"
                />
              </div>
              <div
                className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                style={{ maxHeight: 260, overflowY: 'auto' }}
              >
                {editingGroup === 'invest' ? (
                  investFilteredCount === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                      {t('editDialog.noSearchResults')}
                    </div>
                  ) : (
                    <ToggleGroup
                      type="single"
                      value={brand}
                      onValueChange={(v) => v && setBrand(v)}
                      className="block w-full"
                    >
                      {investFilteredByCategory.map(([cat, list]) => (
                        <div key={cat}>
                          <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                            {CATEGORY_LABEL[cat]}
                          </div>
                          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                            {list.map(e => {
                              const active = e.name === brand
                              return (
                                <ToggleGroupItem
                                  key={e.name}
                                  value={e.name}
                                  className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                                  style={
                                    active
                                      ? {
                                          background: e.color.bg,
                                          color: e.color.fg ?? '#fff',
                                          borderColor: 'transparent',
                                        }
                                      : {
                                          background: 'var(--bg-muted)',
                                          color: 'var(--fg-secondary)',
                                          borderColor: 'transparent',
                                        }
                                  }
                                >
                                  {e.name}
                                </ToggleGroupItem>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </ToggleGroup>
                  )
                ) : bankFilteredByCategory.length === 0 ? (
                  <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                    {t('editDialog.noSearchResults')}
                  </div>
                ) : (
                  <ToggleGroup
                    type="single"
                    value={brand}
                    onValueChange={(v) => v && setBrand(v)}
                    className="block w-full"
                  >
                    {bankFilteredByCategory.map(([cat, list]) => (
                      <div key={cat}>
                        <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                          {cat}
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                          {list.map(e => {
                            const active = e.name === brand
                            return (
                              <ToggleGroupItem
                                key={e.name}
                                value={e.name}
                                className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                                style={
                                  active
                                    ? {
                                        background: e.color.bg,
                                        color: e.color.fg ?? '#fff',
                                        borderColor: 'transparent',
                                      }
                                    : {
                                        background: 'var(--bg-muted)',
                                        color: 'var(--fg-secondary)',
                                        borderColor: 'transparent',
                                      }
                                }
                              >
                                {e.name}
                              </ToggleGroupItem>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </ToggleGroup>
                )}
              </div>
            </div>
          )}

          {editingGroup === 'account' && (
            <div>
              <Label className="text-[13px] font-medium mb-2 block">{t('editDialog.accountTypeLabel')}</Label>
              <Tabs
                value={accountSub}
                onValueChange={(v) => v && setAccountSub(v as typeof accountSub)}
              >
                <TabsList variant="pill" size="sm" className="w-full">
                  {ACCOUNT_SUBS.map((s) => (
                    <TabsTrigger key={s} value={s} className="flex-1">
                      {t(`accountSub.${ACCOUNT_SUB_KEY[s]}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          <div>
            <Label htmlFor="asset-edit-name" className="text-[13px] font-medium mb-2 block">
              {nameLabel}
            </Label>
            <Input
              id="asset-edit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={namePlaceholder}
              maxLength={60}
            />
          </div>

          {/* 투자 — 보유 종목 편집 (design invest 분기: 검색→연동 추가 / 직접 추가, qty·평가액 인라인 편집) */}
          {editingGroup === 'invest' && (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <Label className="text-[13px] font-medium">{t('holdings.sectionTitle')}</Label>
                <span className="num text-[11px] text-[var(--fg-tertiary)]">
                  {t('holdings.editSummary', { n: holdings.length, total: KRW(holdingsTotal) })}
                </span>
              </div>
              <div className="relative mb-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
                />
                <Input
                  search
                  value={stockQ}
                  onChange={e => setStockQ(e.target.value)}
                  placeholder={t('holdings.searchPlaceholder')}
                  className="pl-9"
                />
              </div>
              {stockQ.trim().length > 0 && (
                <div
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] mb-2"
                  style={{ maxHeight: 240, overflowY: 'auto' }}
                >
                  {stockResults.map(s => (
                    <button
                      key={`${s.marketCode}:${s.symbol}`}
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                      onClick={() => {
                        setHoldings(prev => [
                          ...prev,
                          {
                            key: nextHoldingKey(),
                            linked: true,
                            tossSymbol: s.symbol,
                            quantity: 1,
                            displayName: s.nameKr,
                          },
                        ])
                        setStockQ('')
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-[var(--fg-primary)]">{s.nameKr}</div>
                        <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                          {s.symbol} · {s.marketCode}
                        </div>
                      </div>
                    </button>
                  ))}
                  {stockSearching && stockResults.length === 0 && (
                    <div className="py-4 text-center text-[12px] text-[var(--fg-tertiary)]">…</div>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-bold text-[var(--fg-brand)]"
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderTop: stockResults.length ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setHoldings(prev => [
                        ...prev,
                        {
                          key: nextHoldingKey(),
                          linked: false,
                          holdingName: stockQ.trim(),
                          holdingValue: 0,
                        },
                      ])
                      setStockQ('')
                    }}
                  >
                    <Plus size={13} strokeWidth={2.4} /> {t('holdings.addManual', { name: stockQ.trim() })}
                  </button>
                </div>
              )}
              {holdings.length === 0 ? (
                <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5 leading-relaxed">
                  {t('holdings.editEmptyHelp')}
                </p>
              ) : (
                <div>
                  {holdings.map((h, i) => {
                    const val = holdingValueOf(h)
                    return (
                      <div
                        key={h.key}
                        className="flex items-center gap-2"
                        style={{
                          padding: '11px 2px',
                          borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-[var(--fg-primary)] truncate">
                            {h.linked ? <LinkedHoldingName holding={h} /> : h.holdingName}
                            {h.linked && (
                              <span
                                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold align-middle"
                                style={{ background: 'var(--bg-brand-subtle)', color: 'var(--fg-brand-strong)' }}
                              >
                                {t('holdings.linkedBadge')}
                              </span>
                            )}
                          </div>
                          <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                            {h.linked ? t('holdings.editLinkedSub') : t('holdings.manualSub')}
                          </div>
                        </div>
                        {h.linked ? (
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Input
                              inputMode="numeric"
                              value={h.quantity != null ? String(h.quantity) : ''}
                              onChange={e => {
                                const q = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
                                setHoldings(prev =>
                                  prev.map(x => (x.key === h.key ? { ...x, quantity: q } : x)),
                                )
                              }}
                              className="num h-[34px] w-[58px] px-2 text-right"
                            />
                            <span className="text-[12px] text-[var(--fg-tertiary)]">{t('holdings.sharesUnitShort')}</span>
                          </span>
                        ) : (
                          <Input
                            inputMode="numeric"
                            value={h.holdingValue != null ? String(h.holdingValue) : ''}
                            onChange={e => {
                              const v = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
                              setHoldings(prev =>
                                prev.map(x => (x.key === h.key ? { ...x, holdingValue: v } : x)),
                              )
                            }}
                            className="num h-[34px] w-[104px] px-2 text-right shrink-0"
                          />
                        )}
                        <span
                          className="num shrink-0 text-right text-[12.5px] font-bold text-[var(--fg-primary)]"
                          style={{ minWidth: 84 }}
                        >
                          {val != null ? `${KRW(val)}원` : '—'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          aria-label={t('holdings.remove')}
                          onClick={() => setHoldings(prev => prev.filter(x => x.key !== h.key))}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 신용카드 — design 신판 순서: 신용한도 → 결제일 → 현재 사용액 → 결제 계좌(연동 유지) */}
          {editingGroup === 'card' && cardType === 'CREDIT' && (
            <>
              <div>
                <Label htmlFor="card-credit-limit" className="text-[13px] font-medium mb-2 block">{t('editDialog.creditLimit')}</Label>
                <Input
                  id="card-credit-limit"
                  inputMode="numeric"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={t('editDialog.creditLimitPlaceholder')}
                />
              </div>
              <div>
                <Label className="text-[13px] font-medium mb-2 block">{t('editDialog.paymentDay')}</Label>
                <Select value={paymentDay || undefined} onValueChange={v => setPaymentDay(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('editDialog.paymentDayPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <SelectItem key={d} value={String(d)}>{t('editDialog.dayUnit', { day: d })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* 투자 + 보유 종목 존재 시 평가액은 보유 합계로 자동 계산 — 입력 대신 요약 표시 */}
          {editingGroup === 'invest' && holdings.length > 0 ? (
            <div>
              <Label className="text-[13px] font-medium mb-2 block">{balanceLabel}</Label>
              <div
                className="num rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5 text-[14px] font-bold text-[var(--fg-primary)]"
              >
                {KRW(holdingsTotal)}원
              </div>
              <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
                {t('holdings.balanceAutoHelp')}
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="asset-edit-balance" className="text-[13px] font-medium mb-2 block">
                {balanceLabel}
              </Label>
              <Input
                id="asset-edit-balance"
                inputMode="numeric"
                value={balanceStr}
                onChange={e => setBalanceStr(e.target.value.replace(/[^\d-]/g, ''))}
                onBlur={() => {
                  const n = Number(balanceStr) || 0
                  setBalanceStr(n ? KRW(n) : '0')
                }}
                onFocus={() => setBalanceStr(prev => prev.replace(/,/g, ''))}
              />
              {editingGroup === 'card' && (
                <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
                  {t('editDialog.cardBalanceHelp')}
                </p>
              )}
            </div>
          )}

          {editingGroup === 'card' && cardType === 'CREDIT' && (
            <div>
              <Label className="text-[13px] font-medium mb-2 block">{t('editDialog.paymentAccount')}</Label>
              <Select
                value={paymentAssetRowId != null ? String(paymentAssetRowId) : undefined}
                onValueChange={v => setPaymentAssetRowId(v ? Number(v) : null)}
                disabled={bankAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={bankAccounts.length === 0 ? t('editDialog.noCheckingAccount') : t('editDialog.selectPaymentAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(a => (
                    <SelectItem key={a.rowId} value={String(a.rowId)}>
                      {a.institution ? `${a.institution} · ${a.assetName}` : a.assetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editingGroup !== 'card' && (
            <div>
              <Label htmlFor="asset-edit-memo" className="text-[13px] font-medium mb-2 block">{t('editDialog.memoOptional')}</Label>
              <Input
                id="asset-edit-memo"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder={t('editDialog.memoPlaceholder')}
                maxLength={120}
              />
            </div>
          )}

          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[var(--fg-secondary)]">
              <Wallet size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[var(--fg-primary)]">{t('editDialog.includeInTotal')}</div>
              <div className="mt-0.5 text-[11.5px] text-[var(--fg-secondary)]">{t('editDialog.includeInTotalDesc')}</div>
            </div>
            <Switch
              checked={isIncludedInTotal === 'Y'}
              onCheckedChange={(b) => setIsIncludedInTotal(b ? 'Y' : 'N')}
            />
          </div>
    </Fragment>
  )

  // 데스크탑 footer 와 모바일 footer 모두 동일 구조 (삭제 좌측 / 취소+저장 우측)
  const footerInner = (
    <ModalFooter
      onSave={handleSubmit}
      saveLabel={isNew ? t('addAction') : tCommon('save')}
      saving={isSubmitting}
      saveDisabled={!canSubmit}
      onCancel={handleClose}
      cancelLabel={tCommon('cancel')}
      onDelete={onDelete}
      deleteLabel={tCommon('delete')}
    />
  )

  return (
    <ModalShell
      title={title}
      onClose={handleClose}
      mobile={mobile}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {footerInner}
        </div>
      }
    >
      <div className="flex flex-col gap-5">{bodyContent}</div>
    </ModalShell>
  )
}
