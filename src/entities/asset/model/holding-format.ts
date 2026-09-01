/**
 * 보유종목 유형 표시 공용 규칙 — 편집 다이얼로그와 자산 상세가 같은 라벨·단위를 쓰게 한다.
 * (앱 `holding_format.dart` 미러)
 */
import type { HoldingType } from "./types";

/** 유형별 수량 단위 i18n 키 — 주식 주 / 금 g / 코인 개. */
export const HOLDING_UNIT_KEY: Record<HoldingType, string> = {
  STOCK: "holdings.sharesUnitShort",
  GOLD: "holdings.unitGram",
  CRYPTO: "holdings.unitCount",
};

/** 유형 섹션 제목 i18n 키. 표시 순서도 이 배열을 따른다. */
export const HOLDING_TYPES: { type: HoldingType; labelKey: string }[] = [
  { type: "STOCK", labelKey: "holdings.typeStock" },
  { type: "GOLD", labelKey: "holdings.typeGold" },
  { type: "CRYPTO", labelKey: "holdings.typeCrypto" },
];

/** 수량 입력 정규화 — 숫자와 소수점 1개만 남긴다(입력 중 '3.' 같은 중간 상태 허용). */
export function sanitizeQty(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${head}.${rest.join("")}` : (head ?? "");
}

/**
 * 수량 문자열 → 숫자. 비었거나 '3.' 같은 중간 상태면 null.
 *
 * **표시·미리보기 전용** — JS number 는 십진 소수를 정확히 담지 못한다.
 * 서버로 보내는 값은 절대 이걸 거치지 말고 {@link normalizeQty} 로 문자열을 유지한다.
 */
export function qtyNumber(q?: string | number | null): number | null {
  const s = qtyText(q);
  if (!s) return null;
  const v = Number.parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

/**
 * 수량류 값을 문자열로 맞춘다 — 서버가 숫자로 내려보내도 화면이 죽지 않게.
 *
 * 계약은 문자열이다(십진 자릿수 보존). 다만 표시 함수가 서버 응답을 그대로 받는 자리라,
 * 계약이 어긋난 순간 다이얼로그 전체가 흰 화면이 된다 — 여기서 흡수한다.
 */
function qtyText(q?: string | number | null): string {
  if (q == null) return "";
  return typeof q === "number" ? String(q) : q;
}

/**
 * 수량 문자열 → 서버 전송용 정규 문자열(자릿수 무손실). 유효한 십진수가 아니면 null.
 *
 * 숫자로 한 번도 변환하지 않는다 — 사용자가 친 자릿수를 그대로 BigDecimal 로 넘긴다.
 * `sanitizeQty` 가 남긴 입력 중 상태('3.' · '.5' · '.')만 정리한다.
 */
export function normalizeQty(q?: string | number | null): string | null {
  let s = qtyText(q).trim();
  if (!s) return null;
  if (s.endsWith(".")) s = s.slice(0, -1);
  if (s.startsWith(".")) s = `0${s}`;
  return /^\d+(\.\d+)?$/.test(s) ? s : null;
}

/** 유형별 수량 표시 소수 자릿수 — 코인은 잘게 쪼개 사니 8자리까지 보여준다(0.00012345 BTC). */
const QTY_MAX_DECIMALS: Record<HoldingType, number> = {
  STOCK: 3,
  GOLD: 3,
  CRYPTO: 8,
};

/**
 * 보유 수량 표시 — 천단위 콤마 + 유형별 소수 자릿수(뒤 0 은 생략).
 *
 * 문자열을 그대로 다듬는다(숫자 파싱 없음) — `toLocaleString` 은 기본 3자리에서 끊어
 * `0.00012345 BTC` 를 `0` 으로 보여주고, number 로 바꾸는 순간 자릿수도 흔들린다.
 */
export function formatQty(
  q?: string | number | null,
  type: HoldingType = "STOCK",
): string {
  const s = qtyText(q).trim();
  if (!s) return "0";
  const neg = s.startsWith("-");
  const [intRaw = "0", fracRaw = ""] = (neg ? s.slice(1) : s).split(".");
  const int = (intRaw || "0").replace(/^0+(?=\d)/, "");
  const frac = fracRaw.slice(0, QTY_MAX_DECIMALS[type]).replace(/0+$/, "");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}
