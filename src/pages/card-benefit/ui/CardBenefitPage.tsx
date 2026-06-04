import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CreditCard, Search, SearchX, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Checkbox } from '@/shared/ui/checkbox'
import { Skeleton } from '@/shared/ui/skeleton'
import { Spinner } from '@/shared/ui/spinner'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { decodeHtml } from '@/shared/lib'
import { useCardCatalogs, useInfiniteCardCatalogs } from '@/features/card-catalog'
import type {
  CardBenefitType,
  CardCatalogSummary,
  CardType,
} from '@/entities/card'
import { getCardBrand } from '@/entities/card'
import { CardBenefitDetailDialog } from './CardBenefitDetailDialog'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

/**
 * 카드 혜택 라이브러리 — porest-design `card-benefits.jsx` CardBenefitsScreen SoT 정합.
 *
 * - 데스크탑: 카드 아트워크 grid (auto-fill minmax(280px,1fr))
 * - 모바일: 가로형 리스트 타일
 * - 검색(디바운스) + 종류/혜택 필터 pill + 단종 포함 토글 → 서버 useCardCatalogs
 *
 * 신규 API 금지 — useCardCatalogs(params) 만 사용.
 */

const PAGE_SIZE = 60

type TypeKey = 'all' | 'CREDIT' | 'CHECK'

/** 혜택 필터 — UI 라벨 5개, benefitType 매핑. 적립·캐시백 둘 다 POINT 전송. */
const BENEFIT_FILTERS: { key: string; label: string; type: CardBenefitType | undefined }[] = [
  { key: 'all', label: '혜택 전체', type: undefined },
  { key: 'discount', label: '할인', type: 'DISCOUNT' },
  { key: 'point', label: '적립', type: 'POINT' },
  { key: 'cashback', label: '캐시백', type: 'POINT' },
  { key: 'mileage', label: '마일리지', type: 'MILEAGE' },
]

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function formatKRW(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

/** 연회비 표기: amount>0 → "N원", 0/null → label ?? "없음". */
function annualFeeText(s: CardCatalogSummary) {
  if (s.annualFee.amount > 0) return `연회비 ${formatKRW(s.annualFee.amount)}원`
  return `연회비 ${s.annualFee.label ?? '없음'}`
}

/** 전월 실적 표기: isRequired==='Y' → "실적 N원/월", 아니면 "실적 무관". */
function performanceText(s: CardCatalogSummary) {
  if (s.performance.isRequired === 'Y' && s.performance.requiredAmount > 0) {
    return `실적 ${formatKRW(s.performance.requiredAmount)}원/월`
  }
  if (s.performance.isRequired === 'Y' && s.performance.requiredText) {
    return s.performance.requiredText
  }
  return '실적 무관'
}

/** 필터 pill 1행 — 단일 선택. Button(secondary=active / ghost=inactive) 사용. */
function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; count?: number }[]
  value: T
  onChange: (k: T) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        maxWidth: '100%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {options.map(o => {
        const active = value === o.key
        return (
          <Button
            key={o.key}
            type="button"
            size="sm"
            variant={active ? 'secondary' : 'ghost'}
            onClick={() => onChange(o.key)}
            className="shrink-0 rounded-full"
          >
            {o.label}
            {o.count != null && (
              <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
                {o.count}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

/** 데스크탑 카드 아트워크 타일. */
function CardArtworkTile({ card, onClick }: { card: CardCatalogSummary; onClick: () => void }) {
  const cardName = decodeHtml(card.cardName)
  const companyName = decodeHtml(card.company?.name ?? '')
  const discontinued = card.isDiscontinued === 'Y'

  // 3단계 fallback: imgUrl 로드 성공 → <img> / 실패·없음 → 브랜드 색 아트워크 / 미상 → 중립.
  const [imgError, setImgError] = useState(false)
  const showImg = !!card.imgUrl && !imgError
  const brand = getCardBrand(companyName)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: 0,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        textAlign: 'left',
        opacity: discontinued ? 0.65 : 1,
        overflow: 'hidden',
        fontFamily: 'inherit',
        transition:
          'box-shadow var(--motion-duration-fast) var(--motion-ease-out), transform var(--motion-duration-fast) var(--motion-ease-out)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* 아트워크 — showImg 면 <img>, 아니면 브랜드 색(or 중립) 아트워크 */}
      {showImg ? (
        <div
          style={{
            width: '100%',
            aspectRatio: '1.586 / 1',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-sunken)',
          }}
        >
          <img
            src={card.imgUrl ?? undefined}
            alt={cardName}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {discontinued && (
            <span
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.55)',
                color: 'var(--fg-on-brand)',
              }}
            >
              단종
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '1.586 / 1',
            background: brand.bg,
            color: brand.fg,
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '0.06em' }}>
              {companyName}
            </span>
            {discontinued && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--fg-on-brand)',
                }}
              >
                단종
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                wordBreak: 'keep-all',
                lineHeight: 1.25,
              }}
            >
              {cardName}
            </div>
          </div>
        </div>
      )}

      {/* 메타 */}
      <div
        style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        {showImg && (
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cardName}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--fg-primary)',
              padding: '2px 8px',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            {card.cardType === 'CREDIT' ? '신용' : '체크'}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
            {annualFeeText(card)}
          </span>
          <span
            style={{
              width: 2,
              height: 2,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--fg-tertiary)',
            }}
          />
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--fg-tertiary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {performanceText(card)}
          </span>
        </div>
      </div>
    </button>
  )
}

/** 모바일 가로형 리스트 타일. */
function CardListTile({ card, onClick }: { card: CardCatalogSummary; onClick: () => void }) {
  const cardName = decodeHtml(card.cardName)
  const companyName = decodeHtml(card.company?.name ?? '')
  const discontinued = card.isDiscontinued === 'Y'

  // 3단계 fallback: imgUrl 로드 성공 → <img> / 실패·없음 → 브랜드 색 / 미상 → 중립.
  const [imgError, setImgError] = useState(false)
  const showImg = !!card.imgUrl && !imgError
  const brand = getCardBrand(companyName)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: 0,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: discontinued ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
    >
      {/* 미니 카드 비주얼 — showImg 면 <img>, 아니면 브랜드 색(or 중립) 아트워크 */}
      <span
        style={{
          width: 56,
          height: 36,
          borderRadius: 6,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: showImg ? 'var(--bg-sunken)' : brand.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showImg ? (
          <img
            src={card.imgUrl ?? undefined}
            alt={cardName}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              }}
            />
            <span
              style={{
                position: 'relative',
                textAlign: 'center',
                padding: '0 4px',
                lineHeight: 1.1,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: brand.fg,
              }}
            >
              {companyName.replace('카드', '').slice(0, 4)}
            </span>
          </>
        )}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--fg-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {cardName}
          </span>
          {discontinued && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: 'var(--fg-tertiary)',
                background: 'var(--bg-sunken)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
              }}
            >
              단종
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--fg-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {companyName} · {card.cardType === 'CREDIT' ? '신용' : '체크'} · {annualFeeText(card)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {performanceText(card)}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
    </button>
  )
}

function GridSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Skeleton className="h-9 w-14 rounded-md" />
            <div style={{ flex: 1 }}>
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <Skeleton className="w-full rounded-none" style={{ aspectRatio: '1.586 / 1' }} />
          <div style={{ padding: '16px 18px' }}>
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-sunken)',
            color: 'var(--fg-tertiary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <SearchX size={20} />
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--fg-primary)',
            marginBottom: 4,
          }}
        >
          결과가 없어요
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)' }}>
          다른 검색어나 필터를 시도해보세요
        </div>
      </CardContent>
    </Card>
  )
}

export const CardBenefitPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeKey>('all')
  const [benefitKey, setBenefitKey] = useState<string>('all')
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const debouncedQuery = useDebounced(query.trim(), 300)

  const benefitType = useMemo(
    () => BENEFIT_FILTERS.find(f => f.key === benefitKey)?.type,
    [benefitKey],
  )

  // 검색/필터 변경 시 데스크탑 페이지를 첫 페이지로 리셋 (render 중 상태 조정 — effect 불필요).
  const filterSig = `${debouncedQuery}|${typeFilter}|${benefitType ?? ''}|${includeDiscontinued}`
  const [prevFilterSig, setPrevFilterSig] = useState(filterSig)
  if (filterSig !== prevFilterSig) {
    setPrevFilterSig(filterSig)
    setPage(0)
  }

  const baseParams = {
    keyword: debouncedQuery || undefined,
    cardType: typeFilter === 'all' ? undefined : (typeFilter as CardType),
    benefitType,
    includeDiscontinued,
    size: PAGE_SIZE,
  }

  // 데스크탑/태블릿: 페이지네이션. 모바일: 인피니티 스크롤. 활성 쿼리만 enabled.
  const pageQ = useCardCatalogs({ ...baseParams, page }, { enabled: !mobile })
  const infQ = useInfiniteCardCatalogs(baseParams, { enabled: mobile })

  const cards = mobile
    ? (infQ.data?.pages.flatMap(p => p.content) ?? [])
    : (pageQ.data?.content ?? [])
  const total = mobile
    ? (infQ.data?.pages[0]?.meta.totalElements ?? cards.length)
    : (pageQ.data?.meta.totalElements ?? cards.length)
  const isLoading = mobile ? infQ.isLoading : pageQ.isLoading
  const isFetching = mobile ? infQ.isFetching : pageQ.isFetching
  const totalPages = pageQ.data?.meta.totalPages ?? 1

  // 모바일 인피니티 스크롤 sentinel observer.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = infQ
  useEffect(() => {
    if (!mobile) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [mobile, hasNextPage, isFetchingNextPage, fetchNextPage, cards.length])

  const benefitOptions = BENEFIT_FILTERS.map(f => ({ key: f.key, label: f.label }))
  const typeOptions: { key: TypeKey; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'CREDIT', label: '신용' },
    { key: 'CHECK', label: '체크' },
  ]

  const Body = isLoading ? (
    <GridSkeleton mobile={mobile} />
  ) : cards.length === 0 ? (
    <EmptyState />
  ) : mobile ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {cards.map(c => (
          <CardListTile key={c.rowId} card={c} onClick={() => setSelectedRowId(c.rowId)} />
        ))}
      </div>
      {/* 인피니티 스크롤 sentinel + 더보기 로딩 */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {infQ.isFetchingNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <Spinner size="sm" />
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {cards.map(c => (
          <CardArtworkTile key={c.rowId} card={c} onClick={() => setSelectedRowId(c.rowId)} />
        ))}
      </div>

      {/* 페이지네이션 컨트롤 — 2페이지 이상일 때만 노출 */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page <= 0}
            onClick={() => {
              setPage(p => Math.max(0, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <ChevronLeft size={14} />
            이전
          </Button>
          <span
            style={{
              fontSize: 12.5,
              color: 'var(--fg-tertiary)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 56,
              textAlign: 'center',
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => {
              setPage(p => Math.min(totalPages - 1, p + 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            다음
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )

  const Controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero 안내 — 데스크탑만 */}
      {!mobile && (
        <Card>
          <CardContent
            style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-brand-muted)',
                color: 'var(--fg-brand)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CreditCard size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>
                카드 혜택 라이브러리
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--fg-tertiary)',
                  marginTop: 2,
                }}
              >
                신용·체크 카드의 혜택을 한 번에 비교하세요
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 검색 — 헤더(top__search) 스타일 정합: filled·radius-md·테두리 없음·compact */}
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--fg-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <Input
          search
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="카드명, 발급사로 검색"
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="지우기"
            onClick={() => setQuery('')}
            className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2"
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <FilterPills options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
        <FilterPills options={benefitOptions} value={benefitKey} onChange={setBenefitKey} />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--fg-secondary)',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <Checkbox
            size="sm"
            checked={includeDiscontinued}
            onCheckedChange={v => setIncludeDiscontinued(v === true)}
          />
          단종 카드 포함
        </label>
      </div>

      {/* 결과 카운트 */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--fg-tertiary)',
          padding: '0 4px',
          fontVariantNumeric: 'tabular-nums',
          opacity: isFetching ? 0.6 : 1,
        }}
      >
        총 {formatKRW(total)}건
      </div>

      {Body}
    </div>
  )

  return (
    <>
      {mobile ? (
        <>
          <MobileBackHeader title="카드 혜택" />
          <div style={{ padding: '16px 16px 24px' }}>{Controls}</div>
        </>
      ) : (
        <div style={{ padding: 0 }}>
          <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
            <div>
              <h1>카드 혜택</h1>
              <div className="sub">신용·체크 카드의 혜택을 한 번에</div>
            </div>
          </div>
          <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>{Controls}</div>
        </div>
      )}

      {selectedRowId != null && (
        <CardBenefitDetailDialog
          rowId={selectedRowId}
          onClose={() => setSelectedRowId(null)}
          mobile={mobile}
        />
      )}
    </>
  )
}
