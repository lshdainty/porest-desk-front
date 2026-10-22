/**
 * 카드사 브랜드 색맵 + 매칭 헬퍼 — 카드 아트워크 fallback(2단계) 공용 모듈.
 *
 * - 카드 비주얼 3단계 fallback 중 2단계(브랜드 색 아트워크)에서 사용.
 * - 색은 기관 색 표 하나(ds institution-colors)에서 읽는다 — 이 파일에 hex 를 두지 않는다.
 * - 미상이면 known=false + 중립 fallback 그라데이션.
 */

import { brandOfInstitution } from "@/shared/lib/groo/bank-colors";

/** imgUrl 없거나 로드 실패 + 브랜드 미상일 때의 중립 카드 fallback 그라데이션 (브랜드 토큰 예외 상수). */
export const CARD_FALLBACK_GRADIENT =
  "linear-gradient(135deg, var(--bg-brand), var(--fg-brand-strong))";

export interface CardBrand {
  /** 카드 아트워크 배경 — 브랜드 solid 색(known) 또는 중립 그라데이션(unknown). */
  bg: string;
  /** 오버레이 글자색 — 표 글자색(known) 또는 #fff(unknown). */
  fg: string;
  /** 색맵 매칭 여부. false 면 bg=CARD_FALLBACK_GRADIENT. */
  known: boolean;
}

/**
 * 카드사 이름으로 브랜드 색을 찾는다 — 기관 색 표(ds institution-colors)로. 같은 회사는 자산 로고와 같은 색이다.
 *
 * 매칭: 이름 · 별칭이 같거나 카드사 이름에 든 가장 긴 것("우리카드 플래티넘" → 우리카드). 표의 이름이 찾는 이름을 품는
 * 거꾸로 맞추기는 하지 않는다. 글자색은 표의 글자색(흰 글자가 4.5:1 에 못 미치면 짙은 글자).
 *
 * @returns 매칭 시 `{ bg, fg, known: true }`, 미상 시 `{ bg: CARD_FALLBACK_GRADIENT, fg: '#fff', known: false }`.
 */
export function getCardBrand(
  companyName: string | null | undefined,
): CardBrand {
  const hit = brandOfInstitution(companyName);
  if (hit) return { bg: hit.bg, fg: hit.fg ?? "#fff", known: true };
  return { bg: CARD_FALLBACK_GRADIENT, fg: "#fff", known: false };
}
