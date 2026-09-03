/**
 * 증권 화면 공용 표기 규칙 — **증권사와 무관하다.**
 *
 * 토스 화면에만 있던 것을 끌어냈다. 나무 화면이 자기 몫을 새로 쓰면 상승색·통화 표기가
 * 두 벌이 되어 각자 늙는다 — 같은 값을 한 화면에선 빨강, 다른 화면에선 파랑으로 보여주는
 * 종류의 어긋남이라 눈에 잘 띄지도 않는다.
 */
import { formatChartAxis, isEn, money } from "@/shared/lib/porest/format";

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

/**
 * 시가총액 — ko `{축약}원`(`5,000만원`·`5조원`) / en `₩{compact}`(`₩5T`).
 *
 * 축약은 **차트 축과 같은 함수 하나**를 지난다. 손으로 짠 예전 코드는 구간마다
 * 규칙이 달랐다 — 1조 위는 `.0` 을 남겨 `5.0조원`, 그 아래는 통째로 억에 반올림했다
 * (`${Math.round(v / 1e8)}억원`). 그래서 **1억 밑이 전부 거짓말**이었다: 5,000만원은
 * 반올림이 올라붙어 `1억원`(두 배), 그보다 작으면 0 으로 떨어져 `0억원` 으로 값이
 * 통째로 사라졌다. 앱은 이미 `toss_stocks_view.dart` 의 `_fmtCapKrw` 를 이 규칙으로
 * 옮겼다 — 같은 화면을 두 플랫폼이 그리므로 한 글자도 갈리면 안 된다.
 */
export function fmtCapKRW(v: number): string {
  if (isEn()) return `₩${formatChartAxis(v)}`;
  return `${formatChartAxis(v)}원`;
}

/**
 * 상장주식수 — 금액은 아니지만 같은 한국어 단위 사다리(만·억)를 쓴다.
 * ko `{축약} 주`(`1,234.6만 주`·`5억 주`) / en 은 축약만(`12.3M`).
 *
 * 예전엔 같은 칸에서 규칙이 세 번 바뀌었다 — 10억 주 위는 정수 억(`60억 주`),
 * 1억~10억 주는 소수 한 자리라 `.0` 이 남고(`5.0억 주`), 1억 주 밑은 만에 반올림해
 * 12,345,678 주가 `1,235만 주` 로 부풀었다. 축약 규칙은 하나다(QA #73).
 * 단위(주)는 ko 만 붙인다. en 은 행 라벨이 이미 들고 있다(앱 `_fmtShares` 미러).
 */
export function fmtShares(n: number): string {
  if (isEn()) return formatChartAxis(n);
  return `${formatChartAxis(n)} 주`;
}
