/**
 * 보유종목 유형 표시 공용 규칙 — 편집 다이얼로그와 자산 상세가 같은 라벨·단위를 쓰게 한다.
 * (앱 `holding_format.dart` 미러)
 */
import type { HoldingType } from './types'

/** 유형별 수량 단위 i18n 키 — 주식 주 / 금 g / 코인 개. */
export const HOLDING_UNIT_KEY: Record<HoldingType, string> = {
  STOCK: 'holdings.sharesUnitShort',
  GOLD: 'holdings.unitGram',
  CRYPTO: 'holdings.unitCount',
}

/** 유형 섹션 제목 i18n 키. 표시 순서도 이 배열을 따른다. */
export const HOLDING_TYPES: { type: HoldingType; labelKey: string }[] = [
  { type: 'STOCK', labelKey: 'holdings.typeStock' },
  { type: 'GOLD', labelKey: 'holdings.typeGold' },
  { type: 'CRYPTO', labelKey: 'holdings.typeCrypto' },
]

/** 수량 입력 정규화 — 숫자와 소수점 1개만 남긴다(입력 중 '3.' 같은 중간 상태 허용). */
export function sanitizeQty(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [head, ...rest] = cleaned.split('.')
  return rest.length > 0 ? `${head}.${rest.join('')}` : head ?? ''
}

/**
 * 수량 문자열 → 숫자. 비었거나 '3.' 같은 중간 상태면 null.
 *
 * **표시·미리보기 전용** — JS number 는 십진 소수를 정확히 담지 못한다.
 * 서버로 보내는 값은 절대 이걸 거치지 말고 {@link normalizeQty} 로 문자열을 유지한다.
 */
export function qtyNumber(q?: string | null): number | null {
  if (!q) return null
  const v = Number.parseFloat(q)
  return Number.isFinite(v) ? v : null
}

/**
 * 수량 문자열 → 서버 전송용 정규 문자열(자릿수 무손실). 유효한 십진수가 아니면 null.
 *
 * 숫자로 한 번도 변환하지 않는다 — 사용자가 친 자릿수를 그대로 BigDecimal 로 넘긴다.
 * `sanitizeQty` 가 남긴 입력 중 상태('3.' · '.5' · '.')만 정리한다.
 */
export function normalizeQty(q?: string | null): string | null {
  if (!q) return null
  let s = q.trim()
  if (s.endsWith('.')) s = s.slice(0, -1)
  if (s.startsWith('.')) s = `0${s}`
  return /^\d+(\.\d+)?$/.test(s) ? s : null
}
