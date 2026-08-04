/**
 * 지원 통화 — 외화통장·해외 결제에서 쓴다.
 *
 * 통화명은 i18n 이 아니라 여기 두지 않는다. ISO 코드(USD)와 기호($)는 로케일과 무관한
 * 국제 표기라 번역 대상이 아니고, 화면에는 `$ USD` 처럼 코드로 보여 준다.
 * (브랜드 고유명과 같은 취급 — taxonomy 예외)
 */
export interface CurrencyOption {
  code: string
  symbol: string
}

export const DEFAULT_CURRENCY = 'KRW'

export const CURRENCIES: CurrencyOption[] = [
  { code: 'KRW', symbol: '₩' },
  { code: 'USD', symbol: '$' },
  { code: 'JPY', symbol: '¥' },
  { code: 'EUR', symbol: '€' },
  { code: 'CNY', symbol: '¥' },
  { code: 'GBP', symbol: '£' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'THB', symbol: '฿' },
  { code: 'VND', symbol: '₫' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'CHF', symbol: 'CHF' },
]

const BY_CODE = new Map(CURRENCIES.map(c => [c.code, c]))

export const currencySymbol = (code: string | null | undefined): string =>
  BY_CODE.get(code ?? '')?.symbol ?? code ?? ''

export const isForeignCurrency = (code: string | null | undefined): boolean =>
  !!code && code !== DEFAULT_CURRENCY

/**
 * 원 통화 금액 표기 — `$5.50` / `¥1,280`.
 *
 * 소수 자리는 통화별로 다르다(엔·원은 0). Intl 이 통화별 기본 자리수를 알고 있어
 * 직접 세지 않는다. 기호는 우리가 붙이므로 표기는 숫자만 뽑는다.
 */
export const formatOriginalAmount = (
  amount: number,
  code: string,
  locale: string,
): string => {
  const digits = code === 'JPY' || code === 'KRW' || code === 'VND' ? 0 : 2
  return `${currencySymbol(code)}${amount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}`
}

/**
 * 자산 잔액의 원화 환산 — 클라이언트 합산은 이 함수를 거친다.
 *
 * 서버는 순자산·요약을 이미 환산해서 준다. 화면에서 자산 목록을 다시 더하는 곳
 * (총자산 카드, 비중 막대)이 raw balance 를 쓰면 USD 1,000 이 1,000원으로 더해져
 * 서버 값과 어긋난다.
 */
export const assetBalanceInKrw = (
  asset: { balance: number; currency?: string | null; exchangeRate?: number | null },
): number => {
  const rate = asset.exchangeRate
  if (!isForeignCurrency(asset.currency) || rate == null || rate <= 0) return asset.balance
  return Math.round(asset.balance * rate)
}
