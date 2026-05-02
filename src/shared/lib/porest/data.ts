export type CategoryKey =
  | 'food' | 'cafe' | 'transport' | 'shopping' | 'living'
  | 'medical' | 'leisure' | 'bill' | 'edu' | 'saving' | 'income'

export interface CategoryDef {
  label: string
  icon: string
  color: string
  bg: string
}

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  food:      { label: '식비',      icon: 'utensils',     color: 'oklch(0.55 0.12 55)',  bg: 'oklch(0.96 0.03 70)' },
  cafe:      { label: '카페·간식', icon: 'coffee',       color: 'oklch(0.50 0.08 50)',  bg: 'oklch(0.96 0.03 60)' },
  transport: { label: '교통',      icon: 'bus',          color: 'oklch(0.50 0.1 230)',  bg: 'oklch(0.96 0.02 230)' },
  shopping:  { label: '쇼핑',      icon: 'shopping-bag', color: 'oklch(0.50 0.12 340)', bg: 'oklch(0.96 0.035 340)' },
  living:    { label: '생활·가공', icon: 'home',         color: 'oklch(0.50 0.1 140)',  bg: 'oklch(0.96 0.025 135)' },
  medical:   { label: '의료·건강', icon: 'heart-pulse',  color: 'oklch(0.55 0.13 25)',  bg: 'oklch(0.96 0.03 25)' },
  leisure:   { label: '문화·여가', icon: 'ticket',       color: 'oklch(0.50 0.12 290)', bg: 'oklch(0.96 0.035 290)' },
  bill:      { label: '공과·통신', icon: 'receipt-text', color: 'oklch(0.48 0.012 195)',bg: 'var(--mist-200)' },
  edu:       { label: '교육',      icon: 'book-open',    color: 'oklch(0.52 0.1 215)',  bg: 'oklch(0.96 0.03 210)' },
  saving:    { label: '저축·투자', icon: 'piggy-bank',   color: 'var(--bark-700)',      bg: 'var(--bark-100)' },
  income:    { label: '수입',      icon: 'arrow-down-to-line', color: 'var(--mossy-800)', bg: 'var(--mossy-100)' },
}

export interface Account {
  id: string
  bank: string
  type: string
  name: string
  number: string
  balance: number
  color: string
}

export const ACCOUNTS: Account[] = [
  { id: 'sh-main',   bank: '신한',    type: '입출금', name: '신한 주거래',    number: '110-***-123456', balance: 3_845_200, color: '#0046FF' },
  { id: 'km-save',   bank: 'KB국민',  type: '적금',   name: 'KB 내일 적금',   number: '004-**-9988',    balance: 8_200_000, color: '#FFBC00' },
  { id: 'ws-save',   bank: '우리',    type: '입출금', name: '우리 파킹통장',  number: '1002-***-3311', balance: 5_120_000, color: '#0067AC' },
  { id: 'toss-main', bank: '토스뱅크', type: '입출금', name: '토스뱅크 통장', number: '100-***-4789',  balance: 1_678_500, color: '#0064FF' },
]

export interface Card {
  id: string
  bank: string
  name: string
  number: string
  due: number
  outstanding: number
  limit: number
  color: string
}

export const CARDS: Card[] = [
  { id: 'sh-card', bank: '신한', name: '신한 Deep Dream', number: '5137-****-7745', due: 28, outstanding: 842_500, limit: 3_000_000, color: '#0046FF' },
  { id: 'hy-card', bank: '현대', name: '현대 M Boost',   number: '4028-****-1010', due: 14, outstanding: 347_800, limit: 2_000_000, color: '#1C2951' },
]

export interface Investment {
  id: string
  bank: string
  name: string
  balance: number
  changePct: number
  changeAmt: number
  color: string
  fg?: string
}

export const INVESTMENTS: Investment[] = [
  { id: 'kakao-pay',  bank: '카카오페이증권', name: 'KODEX 200',              balance: 2_340_000, changePct: 3.8,  changeAmt: 86_000,  color: '#FEE500', fg: '#191919' },
  { id: 'toss-stock', bank: '토스증권',       name: '해외 ETF 포트폴리오',     balance: 4_870_000, changePct: -1.2, changeAmt: -58_600, color: '#0064FF' },
]

export interface Tx {
  id: string
  d: string
  time: string
  cat: CategoryKey
  title: string
  account: string
  amt: number
}

export const TX: Tx[] = [
  { id: 't1',  d: '2026-04-20', time: '13:42', cat: 'food',      title: '배민 · 버거킹',       account: '신한 체크',    amt: -14_800 },
  { id: 't2',  d: '2026-04-20', time: '09:12', cat: 'cafe',      title: '스타벅스 강남R점',    account: '신한 Deep',    amt: -5_500 },
  { id: 't3',  d: '2026-04-20', time: '08:31', cat: 'transport', title: '지하철 · 2호선',      account: '토스 체크',    amt: -1_550 },
  { id: 't4',  d: '2026-04-19', time: '20:30', cat: 'leisure',   title: 'CGV 용산아이파크',   account: '현대 M',       amt: -32_000 },
  { id: 't5',  d: '2026-04-19', time: '13:05', cat: 'food',      title: '이촌돈까스',          account: '신한 Deep',    amt: -28_500 },
  { id: 't6',  d: '2026-04-19', time: '11:40', cat: 'shopping',  title: '무신사 · 스탠다드',   account: '현대 M',       amt: -68_900 },
  { id: 't7',  d: '2026-04-18', time: '19:21', cat: 'food',      title: '교대 돈까스집',       account: '신한 체크',    amt: -18_000 },
  { id: 't8',  d: '2026-04-18', time: '14:03', cat: 'cafe',      title: '블루보틀 성수',       account: '신한 Deep',    amt: -9_000 },
  { id: 't9',  d: '2026-04-17', time: '21:45', cat: 'shopping',  title: '쿠팡 · 생활용품',     account: '토스 체크',    amt: -23_400 },
  { id: 't10', d: '2026-04-17', time: '12:30', cat: 'food',      title: '사내 식당',           account: '신한 체크',    amt: -7_000 },
  { id: 't11', d: '2026-04-17', time: '08:50', cat: 'transport', title: '택시 · 카카오T',      account: '신한 Deep',    amt: -12_800 },
  { id: 't12', d: '2026-04-16', time: '10:00', cat: 'income',    title: '(주)SKCC 급여',       account: '신한 주거래',  amt: 3_820_000 },
  { id: 't13', d: '2026-04-16', time: '12:20', cat: 'food',      title: '한솥 도시락',         account: '신한 체크',    amt: -6_500 },
  { id: 't14', d: '2026-04-15', time: '22:10', cat: 'bill',      title: 'KT 통신요금',        account: '신한 주거래',  amt: -42_000 },
  { id: 't15', d: '2026-04-15', time: '13:15', cat: 'cafe',      title: '투썸플레이스',        account: '신한 Deep',    amt: -6_800 },
  { id: 't16', d: '2026-04-14', time: '19:45', cat: 'leisure',   title: '피트니스 · 이용권',  account: '현대 M',       amt: -89_000 },
  { id: 't17', d: '2026-04-14', time: '08:25', cat: 'transport', title: '광역버스 9401',       account: '토스 체크',    amt: -2_800 },
  { id: 't18', d: '2026-04-13', time: '20:30', cat: 'food',      title: '치킨 · 교촌',         account: '신한 Deep',    amt: -26_000 },
  { id: 't19', d: '2026-04-13', time: '11:50', cat: 'medical',   title: '이든 내과의원',       account: '신한 체크',    amt: -12_500 },
  { id: 't20', d: '2026-04-12', time: '16:20', cat: 'shopping',  title: '다이소 강남역점',     account: '신한 체크',    amt: -8_700 },
  { id: 't21', d: '2026-04-12', time: '13:00', cat: 'food',      title: '한방족발',            account: '현대 M',       amt: -34_000 },
  { id: 't22', d: '2026-04-10', time: '10:00', cat: 'living',    title: '관리비 (4월)',        account: '신한 주거래',  amt: -187_000 },
  { id: 't23', d: '2026-04-08', time: '20:00', cat: 'bill',      title: '넷플릭스 프리미엄',   account: '신한 Deep',    amt: -17_000 },
  { id: 't24', d: '2026-04-05', time: '12:30', cat: 'edu',       title: '인프런 강의 구매',    account: '신한 Deep',    amt: -55_000 },
  { id: 't25', d: '2026-04-03', time: '19:15', cat: 'saving',    title: 'KB 적금 자동이체',   account: '신한 주거래',  amt: -500_000 },
  { id: 't26', d: '2026-04-02', time: '09:00', cat: 'bill',      title: '전기·가스요금',       account: '신한 주거래',  amt: -68_400 },
  { id: 't27', d: '2026-04-01', time: '10:30', cat: 'leisure',   title: '유튜브 프리미엄',     account: '토스 체크',    amt: -14_900 },
]

export const CATEGORY_SUMMARY: { cat: CategoryKey; amt: number }[] = [
  { cat: 'food',      amt: 284_500 },
  { cat: 'shopping',  amt: 180_100 },
  { cat: 'living',    amt: 187_000 },
  { cat: 'leisure',   amt: 135_900 },
  { cat: 'bill',      amt: 127_400 },
  { cat: 'cafe',      amt: 72_300 },
  { cat: 'edu',       amt: 55_000 },
  { cat: 'transport', amt: 43_250 },
  { cat: 'medical',   amt: 12_500 },
  { cat: 'saving',    amt: 500_000 },
]

export const BUDGETS: { cat: CategoryKey; spent: number; limit: number }[] = [
  { cat: 'food',      spent: 284_500, limit: 400_000 },
  { cat: 'shopping',  spent: 180_100, limit: 200_000 },
  { cat: 'cafe',      spent: 72_300,  limit: 60_000 },
  { cat: 'leisure',   spent: 135_900, limit: 150_000 },
  { cat: 'transport', spent: 43_250,  limit: 80_000 },
]

export const MONTHLY_TREND = [
  { month: '2025-11', income: 3_820_000, expense: 2_340_000 },
  { month: '2025-12', income: 4_220_000, expense: 3_110_000 },
  { month: '2026-01', income: 3_820_000, expense: 2_580_000 },
  { month: '2026-02', income: 3_820_000, expense: 2_720_000 },
  { month: '2026-03', income: 3_820_000, expense: 2_190_000 },
  { month: '2026-04', income: 3_820_000, expense: 1_598_450 },
]

export const NETWORTH_TREND = [
  14_200_000, 14_680_000, 15_120_000, 15_890_000, 16_340_000,
  16_720_000, 17_480_000, 18_100_000, 18_540_000, 19_120_000,
  19_680_000, 20_410_800,
]

export const DUTCH_PAY = {
  title: '4월 19일 · 팀 저녁',
  total: 128_000,
  place: '이촌돈까스 강남점',
  date: '2026-04-19',
  participants: [
    { name: '김민서', paid: 128_000, share: 32_000, status: 'owner',   color: 'var(--mossy-500)' },
    { name: '이지훈', paid: 0,       share: 32_000, status: 'paid',    color: 'var(--bark-500)' },
    { name: '박수빈', paid: 0,       share: 32_000, status: 'pending', color: 'var(--sky-500)' },
    { name: '정유나', paid: 0,       share: 32_000, status: 'pending', color: 'var(--sunlit-500)' },
  ],
}

export interface Todo {
  id: string
  title: string
  date: string
  priority: 'high' | 'med' | 'low'
  done: boolean
  tag: string
}

export const TODOS: Todo[] = [
  { id: 'td1', title: '4월 월말 정산',            date: '오늘',  priority: 'high', done: false, tag: '가계부' },
  { id: 'td2', title: '적금 만기 확인 (KB 내일)', date: '오늘',  priority: 'med',  done: false, tag: '자산' },
  { id: 'td3', title: '신한카드 결제일 체크',     date: '내일',  priority: 'med',  done: false, tag: '결제' },
  { id: 'td4', title: '월간 리포트 검토',         date: '4/22',  priority: 'low',  done: false, tag: '가계부' },
  { id: 'td5', title: '전기요금 자동이체 전환',   date: '완료',  priority: 'low',  done: true,  tag: '고정비' },
]

export const RECURRING = [
  { title: '신한 Deep Dream 결제', due: '2026-04-28', amt: 842_500, d: 8 },
  { title: '현대 M Boost 결제',    due: '2026-04-14', amt: 347_800, d: -6 },
  { title: '넷플릭스 프리미엄',    due: '2026-05-08', amt: 17_000,  d: 18 },
  { title: '관리비',              due: '2026-05-10', amt: 190_000, d: 20 },
]

export const groupTxByDay = (txs: Tx[]): [string, Tx[]][] => {
  const map: Record<string, Tx[]> = {}
  for (const t of txs) {
    const bucket = map[t.d] ?? (map[t.d] = [])
    bucket.push(t)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

export const TODAY = new Date(2026, 3, 20)
