/**
 * 카드사 브랜드 색맵 + 매칭 헬퍼 — 카드 아트워크 fallback(2단계) 공용 모듈.
 *
 * - 카드 비주얼 3단계 fallback 중 2단계(브랜드 색 아트워크)에서 사용.
 * - hex 색맵은 카드사 브랜드/은행 실제 CI 색으로, CLAUDE.md raw-color 허용 예외(브랜드/은행색).
 * - 매칭: company.name 이 키를 포함하거나 키가 company.name 을 포함하면 해당 브랜드
 *   (예: "NH농협" ↔ "NH농협카드"). 미상이면 known=false + 중립 fallback 그라데이션.
 */

/** imgUrl 없거나 로드 실패 + 브랜드 미상일 때의 중립 카드 fallback 그라데이션 (브랜드 토큰 예외 상수). */
export const CARD_FALLBACK_GRADIENT =
  'linear-gradient(135deg, var(--bg-brand), var(--fg-brand-strong))'

export interface CardBrand {
  /** 카드 아트워크 배경 — 브랜드 solid 색(known) 또는 중립 그라데이션(unknown). */
  bg: string
  /** 오버레이 글자색 — 표 글자색(known) 또는 #fff(unknown). */
  fg: string
  /** 색맵 매칭 여부. false 면 bg=CARD_FALLBACK_GRADIENT. */
  known: boolean
}

/**
 * 카드사 브랜드 색맵 — 디자인 CARD_BRANDS SoT.
 * 브랜드/은행 hex 는 CLAUDE.md raw-color 허용 예외.
 */
export const CARD_BRANDS: Record<string, { bg: string; fg: string }> = {
  우리카드: { bg: '#0067AC', fg: '#fff' },
  신한카드: { bg: '#0046FF', fg: '#fff' },
  삼성카드: { bg: '#1428A0', fg: '#fff' },
  현대카드: { bg: '#1C2951', fg: '#fff' },
  KB국민카드: { bg: '#FFBC00', fg: '#1A1F2E' },
  롯데카드: { bg: '#ED1C24', fg: '#fff' },
  하나카드: { bg: '#008C74', fg: '#fff' },
  NH농협카드: { bg: '#00A149', fg: '#fff' },
  카카오뱅크: { bg: '#FEE500', fg: '#1A1F2E' },
  토스뱅크: { bg: '#0064FF', fg: '#fff' },
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').trim()
}

/**
 * 카드사 이름으로 브랜드 색을 찾는다.
 *
 * 매칭: company.name 이 키를 포함하거나(예: "우리카드 플래티넘") 키가 company.name 을 포함
 * (예: "NH농협" ↔ "NH농협카드"). 가장 긴 키 우선으로 오매칭을 줄인다.
 *
 * @returns 매칭 시 `{ bg, fg, known: true }`, 미상 시 `{ bg: CARD_FALLBACK_GRADIENT, fg: '#fff', known: false }`.
 */
export function getCardBrand(companyName: string | null | undefined): CardBrand {
  const n = normalize(companyName ?? '')
  if (n) {
    const keys = Object.keys(CARD_BRANDS).sort((a, b) => b.length - a.length)
    for (const k of keys) {
      const hit = CARD_BRANDS[k]
      if (hit && (n.includes(k) || k.includes(n))) {
        return { bg: hit.bg, fg: hit.fg, known: true }
      }
    }
  }
  return { bg: CARD_FALLBACK_GRADIENT, fg: '#fff', known: false }
}
