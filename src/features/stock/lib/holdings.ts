/**
 * 나무 보유 종목 합치기 — **국내·해외가 별도 호출이라 화면이 붙인다.**
 *
 * 나무는 `/v1/namu/holdings?currency=KRW` 와 `?currency=USD` 가 다른 엔드포인트로 나간다.
 * 예전엔 그 사정이 화면 맨 위 전폭 탭으로 새어 나왔는데, 그건 사용자의 관심사가 아니라
 * 서버 사정이다. 두 응답을 여기서 한 목록으로 붙이고 화면은 통화를 몰라도 되게 한다.
 *
 * **호출이 2회로 늘지만 유량 제한과 무관하다** — 페이지 진입 시 1회씩이고 종목 수에
 * 비례하지 않는다(시세와 다르다). 보유 행은 잔고 응답의 `currentPrice` 를 그대로 쓰므로
 * 추가 시세 호출은 그대로 0건이다.
 *
 * ## 원화 환산은 전부 아니면 전무다
 *
 * 통화가 섞인 목록의 합계를 내려면 환율이 필요한데, 나무 환율은 못 구할 수 있다.
 * 그때 **원화분만 더해 합계라고 부르지 않는다** — 부분합으로 금액을 왜곡하지 않는다는
 * 이 레포의 기존 규칙이다(`NamuQueryServiceImpl#getFxRate` 주석). 대신 통화별 합계를
 * 각자 정확하게 보여주고, 환산 합계는 **환율이 있을 때만** 따로 낸다.
 */
import type { NamuHoldingItem, NamuHoldings } from '../api/namuApi'
import { num } from './format'

/** 나무 해외는 미국(USD)만 된다 — 서버가 다른 통화를 400(`SEC_012`)으로 거절한다. */
export type NamuCurrency = 'KRW' | 'USD'

/** 통화를 붙인 보유 행. 합쳐진 목록에서 행마다 자기 통화를 안다. */
export interface MergedHolding extends NamuHoldingItem {
  currency: NamuCurrency
}

/** 한 통화의 합계. 그 통화 기준이라 환율이 없어도 정확하다. */
export interface CurrencyTotal {
  currency: NamuCurrency
  evalAmount: number
  profitLoss: number
  /** 수익률(%). 매입금액이 0이면 0. */
  profitRatePct: number
  count: number
}

export interface MergedHoldingsView {
  /** 합쳐진 보유 행. 정렬 규칙은 {@link mergeNamuHoldings} 참고. */
  rows: MergedHolding[]
  /** 국내 합계. 조회가 실패했거나 보유가 없으면 null. */
  krw: CurrencyTotal | null
  /** 해외 합계. 조회가 실패했거나 보유가 없으면 null. */
  usd: CurrencyTotal | null
  /** 전체 보유 종목 수. */
  count: number
  /**
   * 원화 환산 **총** 평가금액.
   *
   * - 해외 보유가 없으면 국내 합계가 곧 총액이다(환율이 필요 없다)
   * - 해외 보유가 있고 환율이 있으면 환산해 더한다
   * - 해외 보유가 있는데 **환율이 없으면 null** — 부분합을 총액이라고 부르지 않는다
   */
  totalKrw: number | null
  /** 환산에 실제로 쓴 환율. 환산을 못 했으면 null. */
  appliedFxRate: number | null
  /** 두 통화가 다 있는데 환율이 없어 총액을 못 낸 상태. 화면이 이유를 밝힐 때 쓴다. */
  fxMissing: boolean
}

/** 통화 하나의 응답을 행 목록으로. 조회 실패(undefined)면 빈 배열. */
function rowsOf(holdings: NamuHoldings | undefined, currency: NamuCurrency): MergedHolding[] {
  if (!holdings) return []
  return holdings.items.map(item => ({ ...item, currency }))
}

/** 통화 하나의 합계. 행이 없으면 null — "0원 보유" 와 "조회 안 됨" 을 화면이 구분하게. */
function totalOf(rows: MergedHolding[], currency: NamuCurrency): CurrencyTotal | null {
  if (rows.length === 0) return null
  const evalAmount = rows.reduce((s, r) => s + num(r.evalAmount), 0)
  const profitLoss = rows.reduce((s, r) => s + num(r.profitLoss), 0)
  const cost = evalAmount - profitLoss
  return {
    currency,
    evalAmount,
    profitLoss,
    profitRatePct: cost > 0 ? (profitLoss / cost) * 100 : 0,
    count: rows.length,
  }
}

/**
 * 국내·해외 응답과 환율을 하나의 화면 모델로.
 *
 * **정렬** — 환율이 있으면 원화 환산 평가금액 내림차순으로 통화를 섞어 한 줄로 세운다.
 * 환율이 없으면 통화를 섞어 비교할 척도가 없으므로 **국내 → 해외 순으로 묶고 각 묶음
 * 안에서만** 내림차순으로 정렬한다. 환율 없이 원화 1만과 달러 100을 맞대면 달러가
 * 아래로 가는데, 그건 정렬이 아니라 거짓말이다.
 *
 * @param fxRate USD→KRW 환율. 못 구했으면 null
 */
export function mergeNamuHoldings(
  krwHoldings: NamuHoldings | undefined,
  usdHoldings: NamuHoldings | undefined,
  fxRate: number | null,
): MergedHoldingsView {
  const krwRows = rowsOf(krwHoldings, 'KRW')
  const usdRows = rowsOf(usdHoldings, 'USD')
  const krw = totalOf(krwRows, 'KRW')
  const usd = totalOf(usdRows, 'USD')

  // 환율은 양수일 때만 쓴다 — 0·음수·NaN 이 오면 없는 것으로 본다.
  const usableFx = fxRate != null && Number.isFinite(fxRate) && fxRate > 0 ? fxRate : null

  const byEvalDesc = (a: MergedHolding, b: MergedHolding) => num(b.evalAmount) - num(a.evalAmount)
  const rows = usableFx
    ? [...krwRows, ...usdRows].sort(
        (a, b) => krwValueOf(b, usableFx) - krwValueOf(a, usableFx),
      )
    : [...[...krwRows].sort(byEvalDesc), ...[...usdRows].sort(byEvalDesc)]

  const hasUsd = usd != null
  const totalKrw = !hasUsd
    ? (krw?.evalAmount ?? null)
    : usableFx != null
      ? (krw?.evalAmount ?? 0) + usd.evalAmount * usableFx
      : null

  return {
    rows,
    krw,
    usd,
    count: rows.length,
    totalKrw,
    appliedFxRate: hasUsd && usableFx != null ? usableFx : null,
    fxMissing: hasUsd && usableFx == null,
  }
}

/** 행의 원화 환산 평가금액. 정렬과 비중 계산이 같은 척도를 쓰게 한다. */
export function krwValueOf(row: MergedHolding, fxRate: number | null): number {
  const v = num(row.evalAmount)
  if (row.currency === 'KRW') return v
  return fxRate != null && fxRate > 0 ? v * fxRate : 0
}

/**
 * 구성 도넛에 넘길 조각. **척도가 하나로 통일될 때만 낸다** — 통화가 섞였는데 환율이
 * 없으면 비중이 거짓이 되므로 빈 배열을 돌려주고 화면이 도넛을 접는다.
 */
export function donutSlices(view: MergedHoldingsView): Array<{ name: string; value: number }> {
  if (view.fxMissing) return []
  return view.rows.map(r => ({
    name: r.name || r.symbol,
    value: krwValueOf(r, view.appliedFxRate),
  }))
}
