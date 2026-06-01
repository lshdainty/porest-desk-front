import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { decodeHtml } from '@/shared/lib'
import { useCardCatalogDetail } from '@/features/card-catalog'
import type { CardCatalogDetail, CardCatalogSummary } from '@/entities/card'
import { getCardBrand } from '@/entities/card'

/**
 * 카드 혜택 상세 모달 — porest-design `card-benefits.jsx` CardBenefitDialog SoT 정합.
 *
 * - ModalShell(title="카드 상세", footer 닫기 버튼)
 * - 카드 hero: 3단계 fallback — imgUrl 로드 성공 → <img object-fit cover> /
 *   실패·없음 → 카드사 브랜드 색 아트워크(브랜드명/카드명 오버레이) /
 *   브랜드 미상 → 중립 그라데이션
 * - 연회비 · 전월 실적 stat 2셀
 * - 주요 혜택 태그 칩 (topBenefits flatten)
 * - 혜택 상세 · N건 아코디언 (모두 펼치기/접기 토글 + 개별 펼침)
 *
 * 신규 API 금지 — rowId 로 useCardCatalogDetail 만 사용.
 */

function formatKRW(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

/** 연회비 표기: amount>0 → "국내전용 N원", 0/null → label ?? "없음". */
function annualFeeText(s: CardCatalogSummary) {
  if (s.annualFee.amount > 0) return `국내전용 ${formatKRW(s.annualFee.amount)}원`
  return s.annualFee.label ?? '없음'
}

/** 전월 실적 표기: isRequired==='Y' → requiredText ?? "N원 이상", 아니면 "실적 무관". */
function performanceText(s: CardCatalogSummary) {
  if (s.performance.isRequired === 'Y') {
    if (s.performance.requiredAmount > 0) {
      return `${formatKRW(s.performance.requiredAmount)}원 이상`
    }
    return s.performance.requiredText ?? '실적 무관'
  }
  return '실적 무관'
}

/** topBenefits[].tags 를 flatten 해 중복 제거한 주요 혜택 태그. */
function flattenTopTags(detail: CardCatalogDetail): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const g of detail.topBenefits) {
    for (const t of g.tags) {
      const v = decodeHtml(t)
      if (v && !seen.has(v)) {
        seen.add(v)
        out.push(v)
      }
    }
  }
  return out
}

function CardHero({ summary }: { summary: CardCatalogSummary }) {
  const cardName = decodeHtml(summary.cardName)
  const companyName = decodeHtml(summary.company?.name ?? '')
  const discontinued = summary.isDiscontinued === 'Y'

  // 3단계 fallback: imgUrl 로드 성공 → <img> / 실패·없음 → 브랜드 색 / 미상 → 중립.
  const [imgError, setImgError] = useState(false)
  const showImg = !!summary.imgUrl && !imgError
  const brand = getCardBrand(companyName)

  if (showImg) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '1.586 / 1',
          maxHeight: 220,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 18,
          position: 'relative',
          background: 'var(--bg-sunken)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <img
          src={summary.imgUrl ?? undefined}
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
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.55)',
              color: 'var(--fg-on-brand)',
            }}
          >
            단종
          </span>
        )}
      </div>
    )
  }

  // imgUrl 없음·로드 실패 → 브랜드 색(or 중립) 아트워크 + 브랜드명/카드명 오버레이
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1.586 / 1',
        maxHeight: 220,
        borderRadius: 'var(--radius-lg)',
        background: brand.bg,
        color: brand.fg,
        padding: 22,
        marginBottom: 18,
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
        <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: '0.06em' }}>
          {companyName}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>
          {summary.cardType === 'CREDIT' ? '신용' : '체크'}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            marginBottom: 4,
            wordBreak: 'keep-all',
            lineHeight: 1.25,
          }}
        >
          {cardName}
        </div>
        {discontinued && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.3)',
              color: 'var(--fg-on-brand)',
            }}
          >
            단종
          </span>
        )}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-sunken)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-tertiary)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--fg-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function DetailContent({ detail }: { detail: CardCatalogDetail }) {
  const summary = detail.summary
  const tags = flattenTopTags(detail)
  const benefits = detail.benefits

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  const expandAll = () => setExpanded(new Set(benefits.map((_, i) => i)))
  const collapseAll = () => setExpanded(new Set())
  const allOpen = benefits.length > 0 && expanded.size === benefits.length

  return (
    <>
      <CardHero summary={summary} />

      {/* 연회비 · 전월 실적 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <StatCell label="연회비" value={annualFeeText(summary)} />
        <StatCell label="전월 실적" value={performanceText(summary)} />
      </div>

      {/* 주요 혜택 태그 */}
      {tags.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--fg-primary)',
              marginBottom: 8,
            }}
          >
            주요 혜택 태그
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map(t => (
              <span
                key={t}
                style={{
                  padding: '4px 10px',
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand)',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-pill)',
                  letterSpacing: '-0.005em',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 혜택 상세 · N건 아코디언 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>
            혜택 상세 · {benefits.length}건
          </span>
          {benefits.length > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={allOpen ? collapseAll : expandAll}
              style={{ marginLeft: 'auto' }}
            >
              {allOpen ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
              {allOpen ? '모두 접기' : '모두 펼치기'}
            </Button>
          )}
        </div>

        {benefits.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--fg-tertiary)',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            등록된 혜택이 없어요
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {benefits.map((b, i) => {
              const open = expanded.has(i)
              const title = decodeHtml(b.category)
              const value = decodeHtml(b.summary ?? b.title ?? '')
              const condition =
                summary.performance.requiredText ??
                (summary.performance.isRequired === 'Y' ? undefined : '실적 무관')
              const body = decodeHtml(b.detail ?? '')
              return (
                <div
                  key={b.rowId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 16px',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--fg-primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        {value && (
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: 'var(--fg-brand)',
                            }}
                          >
                            {value}
                          </span>
                        )}
                        {condition && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: 'var(--fg-tertiary)',
                              background: 'var(--bg-sunken)',
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            {condition}
                          </span>
                        )}
                      </div>
                    </div>
                    {open ? (
                      <ChevronUp size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown
                        size={16}
                        style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }}
                      />
                    )}
                  </button>
                  {open && body && (
                    <div
                      style={{
                        padding: '14px 16px 16px',
                        fontSize: 13,
                        color: 'var(--fg-secondary)',
                        lineHeight: 1.6,
                        letterSpacing: '-0.003em',
                        whiteSpace: 'pre-wrap',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {body}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export function CardBenefitDetailDialog({
  rowId,
  onClose,
  mobile,
}: {
  rowId: number
  onClose: () => void
  mobile: boolean
}) {
  const { data: detail, isLoading, isError } = useCardCatalogDetail(rowId)

  const footer = (
    <Button variant="ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>
      닫기
    </Button>
  )

  return (
    <ModalShell title="카드 상세" onClose={onClose} size="md" footer={footer} mobile={mobile}>
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
          }}
        >
          <Spinner size="lg" />
        </div>
      ) : isError || !detail ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--fg-tertiary)',
          }}
        >
          카드 정보를 불러오지 못했어요
        </div>
      ) : (
        <DetailContent detail={detail} />
      )}
    </ModalShell>
  )
}
