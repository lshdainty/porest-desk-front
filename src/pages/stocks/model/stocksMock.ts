/**
 * 증권 mock 데이터 — 토스증권 Open API 연동 전 단계의 정적 시세.
 * 연동 시 이 모듈만 API 클라이언트로 교체하면 되도록 화면은 전부 이 모듈을 통해 읽는다.
 * (porest-design DESIGN.desk.md '증권(Stocks) 페이지' 섹션 정합)
 */

export type StockMarket = 'KR' | 'US'

export interface Stock {
  ticker: string
  name: string
  market: StockMarket
  sector: string
  /** KR=원, US=달러 */
  price: number
  changePct: number
  spark: number[]
  marketCap: string
  per: number | null
  eps: number | null
  high52: number
  low52: number
  vol: string
}

export interface StockHolding {
  ticker: string
  qty: number
  /** 평균단가 — KR=원, US=달러 */
  avg: number
}

export interface WatchGroup {
  id: string
  name: string
  tickers: string[]
}

export const FX_USDKRW = 1383.5

// 가벼운 의사난수 스파크라인 (종목별 고정 시드 — 렌더마다 동일)
function spark(seed: number, n = 24, drift = 0): number[] {
  const out: number[] = []
  let v = 100
  let s = seed
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    v = v + (r - 0.5) * 6 + drift
    out.push(Math.max(60, v))
  }
  return out
}

// 종목 마스터 — 검색·상세·관심·보유 공통 참조
export const STOCKS: Stock[] = [
  // 국내
  { ticker: '005930', name: '삼성전자',    market: 'KR', sector: '반도체',     price: 73_400,  changePct: 1.24,  spark: spark(11, 24, 0.6),  marketCap: '438.2조', per: 13.2, eps: 5_560,  high52: 88_800,  low52: 49_900,  vol: '12,840,221' },
  { ticker: '000660', name: 'SK하이닉스',  market: 'KR', sector: '반도체',     price: 189_500, changePct: 2.81,  spark: spark(23, 24, 1.1),  marketCap: '137.9조', per: 8.6,  eps: 22_010, high52: 248_500, low52: 89_000,  vol: '4,221,908' },
  { ticker: '035420', name: 'NAVER',       market: 'KR', sector: '인터넷',     price: 168_200, changePct: -0.71, spark: spark(37, 24, -0.4), marketCap: '27.4조',  per: 18.9, eps: 8_900,  high52: 232_000, low52: 151_900, vol: '512,773' },
  { ticker: '035720', name: '카카오',      market: 'KR', sector: '인터넷',     price: 39_850,  changePct: -1.36, spark: spark(53, 24, -0.6), marketCap: '17.7조',  per: 41.2, eps: 967,    high52: 61_900,  low52: 36_050,  vol: '1,994,302' },
  { ticker: '247540', name: '에코프로비엠', market: 'KR', sector: '2차전지',    price: 142_700, changePct: 4.62,  spark: spark(71, 24, 1.6),  marketCap: '13.9조',  per: 55.4, eps: 2_577,  high52: 296_000, low52: 118_400, vol: '1,338,540' },
  { ticker: '069500', name: 'KODEX 200',   market: 'KR', sector: 'ETF',        price: 36_120,  changePct: 0.83,  spark: spark(89, 24, 0.4),  marketCap: '6.1조',   per: null, eps: null,   high52: 39_400,  low52: 29_980,  vol: '3,011,442' },
  // 해외 (USD)
  { ticker: 'NVDA',  name: 'NVIDIA',    market: 'US', sector: '반도체',     price: 138.07, changePct: 3.41,  spark: spark(101, 24, 1.4),  marketCap: '$3.39T', per: 64.8, eps: 2.13,  high52: 153.13, low52: 47.32,  vol: '241.3M' },
  { ticker: 'AAPL',  name: 'Apple',     market: 'US', sector: '하드웨어',   price: 227.48, changePct: 0.62,  spark: spark(127, 24, 0.5),  marketCap: '$3.44T', per: 34.6, eps: 6.57,  high52: 237.49, low52: 164.08, vol: '38.1M' },
  { ticker: 'TSLA',  name: 'Tesla',     market: 'US', sector: '자동차',     price: 339.82, changePct: -2.14, spark: spark(149, 24, -0.7), marketCap: '$1.09T', per: 92.3, eps: 3.68,  high52: 414.5,  low52: 138.8,  vol: '74.9M' },
  { ticker: 'MSFT',  name: 'Microsoft', market: 'US', sector: '소프트웨어', price: 423.46, changePct: 0.94,  spark: spark(163, 24, 0.6),  marketCap: '$3.15T', per: 36.1, eps: 11.73, high52: 468.35, low52: 362.9,  vol: '17.2M' },
  { ticker: 'GOOGL', name: 'Alphabet',  market: 'US', sector: '인터넷',     price: 178.35, changePct: 1.52,  spark: spark(181, 24, 0.8),  marketCap: '$2.18T', per: 23.4, eps: 7.62,  high52: 191.75, low52: 127.9,  vol: '21.8M' },
  { ticker: 'AMZN',  name: 'Amazon',    market: 'US', sector: '이커머스',   price: 207.89, changePct: 1.18,  spark: spark(199, 24, 0.7),  marketCap: '$2.18T', per: 44.7, eps: 4.65,  high52: 215.9,  low52: 144.05, vol: '33.4M' },
]

export function findStock(ticker: string): Stock | undefined {
  return STOCKS.find(s => s.ticker === ticker)
}

// 보유 종목 — 평균단가·수량 (평가액/손익은 화면에서 계산)
export const STOCK_HOLDINGS: StockHolding[] = [
  { ticker: '005930', qty: 42, avg: 67_200 },
  { ticker: '000660', qty: 8,  avg: 142_800 },
  { ticker: '069500', qty: 30, avg: 33_500 },
  { ticker: 'NVDA',   qty: 12, avg: 98.4 },
  { ticker: 'AAPL',   qty: 6,  avg: 191.2 },
]

// 관심종목 — 그룹별
export const STOCK_WATCH: WatchGroup[] = [
  { id: 'w-main', name: '관심',        tickers: ['035420', '035720', '247540', 'TSLA'] },
  { id: 'w-us',   name: '미국 기술주', tickers: ['MSFT', 'GOOGL', 'AMZN', 'NVDA'] },
]

// ---- 시세 계산 헬퍼 ----

/** 시세 원화 환산 (US는 환율 적용) */
export function priceKRW(s: Stock): number {
  return s.market === 'US' ? Math.round(s.price * FX_USDKRW) : s.price
}

export function holdingEval(h: StockHolding): number {
  const s = findStock(h.ticker)
  return s ? priceKRW(s) * h.qty : 0
}

export function holdingCost(h: StockHolding): number {
  const s = findStock(h.ticker)
  if (!s) return 0
  const avgKRW = s.market === 'US' ? Math.round(h.avg * FX_USDKRW) : h.avg
  return avgKRW * h.qty
}
