/*
 * 거래소 · 시장 이름 — 사용자 말(나스닥 · 뉴욕 · 아멕스 …) 한 표.
 *
 * 종목 마스터는 거래소 코드(`NAS` · `NYS` · `AMS` · `KOSPI` …)를, 토스 종목 정보(StockInfo.market)는
 * 시장 이름 글(`NASDAQ` · `NYSE` · `AMEX` · `KOSPI` · `KR_ETC` · `US_ETC`)을 준다. 두 갈래를 같은 사용자 말로 모은다.
 * 표는 로케일 키 `stocks:market.*`(ko · en)이고 모르는 코드만 원문을 그대로 보인다 — 코드를 화면에 쓰지 않는다.
 * 출처: 토스 OpenAPI `StockInfo.market` enum · 종목 마스터 `marketCode`.
 */

/** 시장 이름 글 → 거래소 코드(로케일 키 쪽) */
const ALIAS: Record<string, string> = {
  NASDAQ: "NAS",
  NYSE: "NYS",
  AMEX: "AMS",
};

/** 로케일 키(`market.*`) 에 쓸 코드 — 별칭을 거래소 코드로 접는다 */
export const marketCodeOf = (code: string): string => ALIAS[code] ?? code;

/** 사용자 말 한 이름 — 모르는 코드는 원문. `t` 는 stocks 네임스페이스 */
export function marketName(
  t: (key: string, opts?: { defaultValue: string }) => string,
  code: string | null | undefined,
): string {
  if (!code) return "";
  return t(`market.${marketCodeOf(code)}`, { defaultValue: code });
}
