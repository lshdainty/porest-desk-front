// 토스 화면에만 있던 표기 규칙을 나무와 공용으로 끌어냈다.
// 옮기면서 값이 바뀌면 같은 금액이 화면마다 다르게 보인다 — 그 회귀를 여기서 막는다.
import { describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n/config'
import { fmtByCurrency, num, trendColor } from './format'

describe('num', () => {
  it('서버가 String 으로 주는 금액을 숫자로 읽는다', () => {
    expect(num('1234.56')).toBe(1234.56)
  })

  it('없거나 숫자가 아니면 0 — 평가액 계산이 NaN 으로 번지지 않게', () => {
    expect(num(null)).toBe(0)
    expect(num(undefined)).toBe(0)
    expect(num('')).toBe(0)
    expect(num('abc')).toBe(0)
  })
})

describe('trendColor — 국내 증권 통념(상승=빨강, 하락=파랑)', () => {
  it('상승·보합은 danger, 하락은 brand', () => {
    expect(trendColor(1)).toBe('var(--status-danger-fg)')
    expect(trendColor(0)).toBe('var(--status-danger-fg)')
    expect(trendColor(-1)).toBe('var(--fg-brand)')
  })
})

describe('fmtByCurrency', () => {
  it('USD 는 소수 두 자리 달러', () => {
    expect(fmtByCurrency(123.456, 'USD')).toBe('$123.46')
  })

  // 원화 표기는 **로케일마다 다르다**(ko `1,235원` / en `₩1,235`). 공용으로 끌어내면서
  // `toLocaleString()+'원'` 을 손수 만들 뻔했는데, 그러면 영어 화면에만 원이 붙는다.
  // 두 로케일을 다 박아 둬 다음에 누가 같은 지름길을 타면 여기서 깨지게 한다.
  it('KRW 는 반올림 + 로케일별 원화 표기 — 규칙을 money() 에 맡긴다', async () => {
    const before = i18n.language
    try {
      await i18n.changeLanguage('ko')
      expect(fmtByCurrency(1234.7, 'KRW')).toBe('1,235원')
      await i18n.changeLanguage('en')
      expect(fmtByCurrency(1234.7, 'KRW')).toBe('₩1,235')
    } finally {
      await i18n.changeLanguage(before)
    }
  })

  it('그 밖의 통화는 통화코드를 병기한다 — 나무 해외가 늘어도 숫자만 덩그러니 남지 않게', () => {
    expect(fmtByCurrency(1234.5, 'JPY')).toBe('1,234.5 JPY')
  })
})

describe('fmtByCurrency — 달러 천단위', () => {
  it('네 자리 이상 달러는 천단위를 끊는다', () => {
    expect(fmtByCurrency(11514.3, 'USD')).toBe('$11,514.30')
  })

  it('소수 두 자리를 유지한다', () => {
    expect(fmtByCurrency(7412.1, 'USD')).toBe('$7,412.10')
    expect(fmtByCurrency(9.5, 'USD')).toBe('$9.50')
  })

  it('로케일과 무관하게 같은 표기 — en-US 고정', () => {
    expect(fmtByCurrency(1234567.891, 'USD')).toBe('$1,234,567.89')
  })
})
