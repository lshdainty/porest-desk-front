/*
 * 금액 숨기기 대상 목록 — 화면(페이지) → 카드 2단계.
 *
 * 예전엔 boolean 하나로 앱 전체 금액을 한꺼번에 가렸다. 자산은 가리고 싶어도
 * 가계부는 보고 싶은 경우가 있어서 카드 단위로 쪼갰다.
 *
 * 여기 정의된 키가 설정 화면의 목록이자 마스킹 지점의 식별자다. 앱(desk-app)의
 * `hide_amounts_cards.dart` 와 **키 문자열이 같아야 한다** — 다르면 같은 카드를
 * 두 클라이언트가 다르게 부르게 되고, 나중에 서버 동기화를 붙일 때 어긋난다.
 */

export const HIDE_PAGES = [
  'home',
  'asset',
  'ledger',
  'stats',
  'budget',
  'stocks',
  'dutchpay',
  'etc',
] as const

export type HidePageKey = (typeof HIDE_PAGES)[number]

/** 카드 키 → 속한 페이지. 순서가 곧 설정 화면의 나열 순서다. */
export const HIDE_CARDS = {
  // 홈
  'home.netWorth': 'home',
  'home.monthExpense': 'home',
  'home.categoryDonut': 'home',
  'home.budget': 'home',
  'home.todaySpend': 'home',
  'home.upcoming': 'home',
  // 자산
  'asset.netWorth': 'asset',
  'asset.composition': 'asset',
  'asset.accounts': 'asset',
  'asset.investments': 'asset',
  'asset.cards': 'asset',
  'asset.loans': 'asset',
  'asset.savingGoals': 'asset',
  'asset.upcoming': 'asset',
  'asset.detail': 'asset',
  'asset.manage': 'asset',
  // 가계부
  'ledger.monthSummary': 'ledger',
  'ledger.calendar': 'ledger',
  'ledger.txList': 'ledger',
  'ledger.txDetail': 'ledger',
  // 통계
  'stats.category': 'stats',
  'stats.trend': 'stats',
  'stats.compare': 'stats',
  // 예산
  'budget.header': 'budget',
  'budget.pace': 'budget',
  'budget.status': 'budget',
  'budget.categories': 'budget',
  'budget.compliance': 'budget',
  'budget.manage': 'budget',
  // 증권
  'stocks.summary': 'stocks',
  'stocks.holdings': 'stocks',
  'stocks.detail': 'stocks',
  // 더치페이
  'dutchpay.summary': 'dutchpay',
  'dutchpay.sessions': 'dutchpay',
  // 기타
  'etc.search': 'etc',
  'etc.recurring': 'etc',
  'etc.preset': 'etc',
} as const satisfies Record<string, HidePageKey>

export type HideCardKey = keyof typeof HIDE_CARDS

export const ALL_HIDE_CARDS = Object.keys(HIDE_CARDS) as HideCardKey[]

export function cardsOfPage(page: HidePageKey): HideCardKey[] {
  return ALL_HIDE_CARDS.filter(k => HIDE_CARDS[k] === page)
}
