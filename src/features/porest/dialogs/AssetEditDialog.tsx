import { Fragment, useEffect, useMemo, useState } from 'react'
import { CreditCard, Search, Trash2 } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
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
import type { CardCatalogSummary, CardType } from '@/entities/card'
import type {
  Asset,
  AssetFormValues,
  AssetType,
  AssetUpdateFormValues,
} from '@/entities/asset'

export type AssetGroup = 'account' | 'card' | 'invest'

type AccountSub = '입출금' | '적금' | '예금' | '현금' | '대출'
const ACCOUNT_SUBS: AccountSub[] = ['입출금', '적금', '예금', '현금', '대출']

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
  const [balanceStr, setBalanceStr] = useState<string>(
    item ? KRW(item.balance ?? 0) : '0',
  )

  // 계좌 sub
  const [accountSub, setAccountSub] = useState<AccountSub>(
    item && editingGroup === 'account' ? assetTypeToSub(item.assetType) : '입출금',
  )

  // 카드
  const [cardType, setCardType] = useState<CardType>(
    item?.assetType === 'CHECK_CARD' ? 'CHECK' : 'CREDIT',
  )
  const [cardKeyword, setCardKeyword] = useState('')
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardCatalogSummary | null>(null)

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

  const previewBg = brandColor?.bg ?? item?.color ?? 'var(--mossy-500)'
  const previewFg = brandColor?.fg ?? '#fff'

  const previewName = (() => {
    const trimmed = name.trim()
    if (trimmed) return trimmed
    if (editingGroup === 'card') return selectedCard?.cardName || '새 카드'
    if (editingGroup === 'invest') return '새 투자 상품'
    return '새 계좌'
  })()

  const previewSub = (() => {
    if (editingGroup === 'card') {
      const company = cardCompanyName
      return `${company ? `${company} · ` : ''}${cardType === 'CREDIT' ? '신용카드' : '체크카드'}`
    }
    return `${brand} · 미리보기`
  })()

  const previewLetter = (() => {
    if (editingGroup === 'card') return (cardCompanyName[0] ?? '?').trim()
    return (brand[0] ?? '?').trim()
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
    const action = isNew ? '추가' : '편집'
    if (editingGroup === 'card') return `카드 ${action}`
    if (editingGroup === 'invest') return `투자 ${action}`
    return `계좌 ${action}`
  })()

  const nameLabel = editingGroup === 'invest' ? '상품·종목명' : editingGroup === 'card' ? '별칭 (선택)' : '별칭'
  const namePlaceholder =
    editingGroup === 'invest'
      ? '예: KODEX 200, 해외 ETF 포트폴리오'
      : editingGroup === 'card'
      ? selectedCard?.cardName ?? '예: 신한 Deep Dream'
      : '예: 신한 주거래'

  const balanceLabel =
    editingGroup === 'card' ? '현재 사용액 (원)' : editingGroup === 'invest' ? '평가액 (원)' : '잔액 (원)'

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const parsedBalance = Number(balanceStr.replace(/[^\d-]/g, '')) || 0

    if (editingGroup === 'card') {
      const type: AssetType = cardType === 'CREDIT' ? 'CREDIT_CARD' : 'CHECK_CARD'
      const resolvedName =
        name.trim() || selectedCard?.cardName || item?.assetName || '카드'
      const catalogId = selectedCard?.rowId ?? item?.cardCatalog?.rowId ?? null
      const institution =
        selectedCard?.company?.name ?? item?.institution ?? undefined
      const color = cardBrandColor?.bg ?? item?.color ?? undefined

      if (isNew) {
        onCreate({
          assetName: resolvedName,
          assetType: type,
          balance: parsedBalance,
          currency: 'KRW',
          institution,
          color,
          cardCatalogRowId: catalogId,
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
          isIncludedInTotal: item?.isIncludedInTotal,
          cardCatalogRowId: catalogId,
        })
      }
      return
    }

    if (editingGroup === 'invest') {
      const resolvedName = name.trim() || `${brand} 투자`
      if (isNew) {
        onCreate({
          assetName: resolvedName,
          assetType: 'INVESTMENT',
          balance: parsedBalance,
          currency: 'KRW',
          institution: brand,
          color: brandColor?.bg,
          memo: memo.trim() || undefined,
        })
      } else {
        onUpdate({
          assetName: resolvedName,
          assetType: 'INVESTMENT',
          balance: parsedBalance,
          currency: 'KRW',
          institution: brand,
          color: brandColor?.bg,
          memo: memo.trim() || undefined,
          isIncludedInTotal: item?.isIncludedInTotal,
        })
      }
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
        isIncludedInTotal: item?.isIncludedInTotal,
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
              <span
                className="inline-flex items-center justify-center rounded-[var(--radius-md)] font-bold text-base flex-shrink-0"
                style={{ background: previewBg, color: previewFg, width: 52, height: 52 }}
              >
                {previewLetter}
              </span>
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
                <Label className="text-[13px] font-medium mb-2 block">카드 종류</Label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
                  {(['CREDIT', 'CHECK'] as CardType[]).map(t => {
                    const active = t === cardType
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setCardType(t)
                          if (isNew) setSelectedCard(null)
                        }}
                        className="h-9 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                        style={
                          active
                            ? { background: 'var(--mossy-800)', color: 'var(--fg-on-brand)' }
                            : { background: 'transparent', color: 'var(--fg-secondary)' }
                        }
                      >
                        {t === 'CREDIT' ? '신용카드' : '체크카드'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[13px] font-medium">카드 상품</Label>
                  <div className="flex items-center gap-3">
                    <label
                      className="inline-flex items-center cursor-pointer select-none"
                      style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', gap: 6 }}
                      title="단종된 카드 상품도 검색 결과에 포함합니다"
                    >
                      <Switch
                        checked={includeDiscontinued}
                        onCheckedChange={setIncludeDiscontinued}
                      />
                      단종 포함
                    </label>
                    {catalogQ.data?.meta?.totalElements != null && (
                      <span className="text-[11px] text-[var(--fg-tertiary)]">
                        총 {catalogQ.data.meta.totalElements}건
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
                  />
                  <Input
                    value={cardKeyword}
                    onChange={e => setCardKeyword(e.target.value)}
                    placeholder="카드명 또는 발급사 검색"
                    className="pl-9"
                  />
                </div>
                <div
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]"
                  style={{ maxHeight: 260, overflowY: 'auto' }}
                >
                  {catalogQ.isLoading ? (
                    <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">불러오는 중…</div>
                  ) : catalogItems.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">검색 결과가 없어요</div>
                  ) : (
                    catalogItems.map(c => {
                      const active = selectedCard?.rowId === c.rowId
                      const discontinued = c.isDiscontinued === 'Y'
                      return (
                        <button
                          key={c.rowId}
                          type="button"
                          onClick={() => setSelectedCard(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                          style={{
                            background: active ? 'var(--bg-brand-subtle)' : 'transparent',
                            opacity: discontinued && !active ? 0.7 : 1,
                          }}
                        >
                          {c.imgUrl ? (
                            <img
                              src={c.imgUrl}
                              alt=""
                              className="rounded object-cover flex-shrink-0"
                              style={{ width: 44, height: 28 }}
                            />
                          ) : (
                            <span
                              className="rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                              style={{
                                width: 44,
                                height: 28,
                                background: getBrandColor(c.company?.name)?.bg ?? 'var(--bark-500)',
                              }}
                            >
                              {(c.company?.name ?? c.cardName).slice(0, 1)}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className="truncate text-[13px] flex items-center gap-1.5"
                              style={{
                                color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                                fontWeight: active ? 600 : 500,
                              }}
                            >
                              <span className="truncate">{c.cardName}</span>
                              {discontinued && (
                                <span
                                  className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold flex-shrink-0"
                                  style={{
                                    background: 'var(--bg-disabled)',
                                    color: 'var(--fg-tertiary)',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  단종
                                </span>
                              )}
                            </div>
                            <div className="truncate text-[11.5px] text-[var(--fg-tertiary)] mt-0.5">
                              {c.company?.name ?? '—'} · {c.cardType === 'CREDIT' ? '신용' : '체크'}
                              {c.annualFee.amount > 0 && (
                                <> · 연회비 {c.annualFee.amount.toLocaleString('ko-KR')}원</>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[13px] font-medium">
                  {editingGroup === 'invest' ? '증권사·거래소' : '기관·브랜드'}
                </Label>
                <span className="text-[11px] text-[var(--fg-tertiary)]">
                  총{' '}
                  {editingGroup === 'invest'
                    ? INVEST_BRANDS.length
                    : BANK_ENTRIES.filter(e => !INVEST_CATEGORY_SET.has(e.category)).length}
                  개
                </span>
              </div>
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
                />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={
                    editingGroup === 'invest'
                      ? '증권사·가상자산거래소 검색'
                      : '은행명 검색'
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
                      검색 결과가 없어요
                    </div>
                  ) : (
                    investFilteredByCategory.map(([cat, list]) => (
                      <div key={cat}>
                        <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                          {CATEGORY_LABEL[cat]}
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                          {list.map(e => {
                            const active = e.name === brand
                            return (
                              <button
                                key={e.name}
                                type="button"
                                onClick={() => setBrand(e.name)}
                                className="inline-flex items-center justify-center rounded-full border text-[12.5px] font-medium transition-colors h-7 px-3"
                                style={
                                  active
                                    ? {
                                        background: e.color.bg,
                                        color: e.color.fg ?? '#fff',
                                        borderColor: 'transparent',
                                      }
                                    : {
                                        background: 'var(--pd-surface-subtle)',
                                        color: 'var(--fg-secondary)',
                                        borderColor: 'transparent',
                                      }
                                }
                              >
                                {e.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )
                ) : bankFilteredByCategory.length === 0 ? (
                  <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                    검색 결과가 없어요
                  </div>
                ) : (
                  bankFilteredByCategory.map(([cat, list]) => (
                    <div key={cat}>
                      <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                        {cat}
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                        {list.map(e => {
                          const active = e.name === brand
                          return (
                            <button
                              key={e.name}
                              type="button"
                              onClick={() => setBrand(e.name)}
                              className="inline-flex items-center justify-center rounded-full border text-[12.5px] font-medium transition-colors h-7 px-3"
                              style={
                                active
                                  ? {
                                      background: e.color.bg,
                                      color: e.color.fg ?? '#fff',
                                      borderColor: 'transparent',
                                    }
                                  : {
                                      background: 'var(--pd-surface-subtle)',
                                      color: 'var(--fg-secondary)',
                                      borderColor: 'transparent',
                                    }
                              }
                            >
                              {e.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {editingGroup === 'account' && (
            <div>
              <Label className="text-[13px] font-medium mb-2 block">계좌 종류</Label>
              <div className="grid grid-cols-5 gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
                {ACCOUNT_SUBS.map(s => {
                  const active = s === accountSub
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAccountSub(s)}
                      className="h-9 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                      style={
                        active
                          ? { background: 'var(--mossy-800)', color: 'var(--fg-on-brand)' }
                          : { background: 'transparent', color: 'var(--fg-secondary)' }
                      }
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
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
                청구될 금액을 입력하세요. 총 부채에 반영됩니다.
              </p>
            )}
          </div>

          {editingGroup !== 'card' && (
            <div>
              <Label htmlFor="asset-edit-memo" className="text-[13px] font-medium mb-2 block">메모 (선택)</Label>
              <Input
                id="asset-edit-memo"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="계좌번호 뒷자리, 결제일, 한도 등 메모하세요"
                maxLength={120}
              />
            </div>
          )}
    </Fragment>
  )

  // 데스크탑 footer 와 모바일 footer 모두 동일 구조 (삭제 좌측 / 취소+저장 우측)
  const footerInner = (
    <Fragment>
      <div className="flex items-center gap-2">
        {onDelete && (
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={isSubmitting}
            style={{ color: 'var(--berry-700)' }}
          >
            <Trash2 size={14} />삭제
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="default" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? '저장 중…' : isNew ? '추가' : '저장'}
        </Button>
      </div>
    </Fragment>
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
