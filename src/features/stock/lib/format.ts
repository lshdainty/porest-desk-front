/**
 * 증권 화면 공용 표기 규칙 — **증권사와 무관하다.**
 *
 * 토스 화면에만 있던 것을 끌어냈다. 나무 화면이 자기 몫을 새로 쓰면 상승색·통화 표기가
 * 두 벌이 되어 각자 늙는다 — 같은 값을 한 화면에선 빨강, 다른 화면에선 파랑으로 보여주는
 * 종류의 어긋남이라 눈에 잘 띄지도 않는다.
 */
import { money } from "@/shared/lib/porest/format";

/** 서버가 정밀도 보존을 위해 String 으로 내려주는 금액/비율을 숫자로 파싱. */
export function num(s: string | null | undefined): number {
  return s == null ? 0 : Number(s) || 0;
}

/** 상승/하락 색 — 국내 증권 통념: 상승=빨강(danger), 하락=파랑(brand). */
export function trendColor(pct: number): string {
  return pct >= 0 ? "var(--status-danger-fg)" : "var(--fg-brand)";
}

/**
 * 통화별 가격 표기 — KRW 는 원화 포맷, USD 는 $, 그 외(CNY·JPY 등)는 통화코드 병기.
 *
 * 원화는 반드시 {@link money} 를 지난다 — 로케일마다 표기가 다르다(ko `10,000원` /
 * en `₩10,000`). 여기서 `toLocaleString()+'원'` 으로 손수 만들면 영어 화면에만 원이 붙는다.
 */
export function fmtByCurrency(price: number, currency: string): string {
  // 달러도 천단위를 끊는다. `toFixed(2)` 만 쓰면 `$11514.30` 이 되는데, 요약 스트립처럼
  // 큰 금액이 서는 자리에서는 자릿수를 눈으로 못 센다(원화는 money() 가 이미 끊는다).
  if (currency === "USD")
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "KRW") return money(Math.round(price));
  return `${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}
