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
  // 'kind' 는 화면이 아니라 **거래 종류** 축이다. 나머지 페이지가 "어느 화면의 금액인가" 를
  // 가른다면 이쪽은 "어떤 종류의 거래인가" 를 가른다 — 화면을 가로지른다.
  // 설정 화면에서도 화면 탭 줄에 끼우지 않고 맨 위 별도 영역으로 뺀다.
  "kind",
  "home",
  "asset",
  "ledger",
  "stats",
  "budget",
  "stocks",
  "dutchpay",
  "etc",
] as const;

export type HidePageKey = (typeof HIDE_PAGES)[number];

/**
 * 거래 종류 — 화면을 가로지르는 축.
 *
 * <p>거래 목록·상세·캘린더 합계·홈 월 합계처럼 **그 자리에서 종류가 확정되는 금액**에
 * 걸린다. 통계·예산·카테고리 도넛처럼 여러 거래를 다시 집계한 값은 화면 카드가 담당한다 —
 * 종류 카드가 앱 절반을 덮으면 화면 카드 37장이 사실상 무의미해진다.
 */
export const HIDE_KIND_CARDS = [
  "kind.expense",
  "kind.income",
  "kind.transfer",
] as const;

/** 카드 키 → 속한 페이지. 순서가 곧 설정 화면의 나열 순서다. */
export const HIDE_CARDS = {
  // 거래 종류 (화면 아님)
  "kind.expense": "kind",
  "kind.income": "kind",
  "kind.transfer": "kind",
  // 홈
  "home.netWorth": "home",
  "home.monthExpense": "home",
  "home.categoryDonut": "home",
  "home.budget": "home",
  "home.todaySpend": "home",
  "home.upcoming": "home",
  // 자산
  "asset.netWorth": "asset",
  "asset.composition": "asset",
  "asset.accounts": "asset",
  "asset.investments": "asset",
  "asset.cards": "asset",
  "asset.loans": "asset",
  "asset.savingGoals": "asset",
  "asset.upcoming": "asset",
  "asset.detail": "asset",
  "asset.manage": "asset",
  // 가계부
  "ledger.monthSummary": "ledger",
  "ledger.calendar": "ledger",
  "ledger.txList": "ledger",
  "ledger.txDetail": "ledger",
  // 통계
  "stats.category": "stats",
  "stats.trend": "stats",
  "stats.compare": "stats",
  // 예산
  "budget.header": "budget",
  "budget.pace": "budget",
  "budget.status": "budget",
  "budget.categories": "budget",
  "budget.compliance": "budget",
  "budget.manage": "budget",
  // 증권
  "stocks.summary": "stocks",
  "stocks.holdings": "stocks",
  "stocks.detail": "stocks",
  // 더치페이
  "dutchpay.summary": "dutchpay",
  "dutchpay.sessions": "dutchpay",
  // 기타
  "etc.search": "etc",
  "etc.recurring": "etc",
  "etc.preset": "etc",
} as const satisfies Record<string, HidePageKey>;

export type HideCardKey = keyof typeof HIDE_CARDS;

export const ALL_HIDE_CARDS = Object.keys(HIDE_CARDS) as HideCardKey[];

export function cardsOfPage(page: HidePageKey): HideCardKey[] {
  return ALL_HIDE_CARDS.filter((k) => HIDE_CARDS[k] === page);
}

/** 화면 카드만 — 종류 축을 뺀 나머지. '하나라도 가려졌나' 판정의 분모다. */
export const SCREEN_HIDE_CARDS: HideCardKey[] = ALL_HIDE_CARDS.filter(
  (k) => HIDE_CARDS[k] !== "kind",
);

/**
 * 이 금액이 어떤 거래의 것인가.
 *
 * <p>`net` 은 **수입−지출을 그대로 화면에 찍는 값**이다 — 가계부 월 요약의 '합계',
 * 홈 잔액, 차트 툴팁의 '저축' 셋뿐이다. 카드가 아니라 파생 규칙이라 설정에는 안 뜨고,
 * **수입·지출 중 하나라도 가려지면** 함께 가린다. `수입 = 합계 + 지출` 은 항등식이라
 * 둘이 보이면 나머지 하나가 뺄셈 한 번에 드러난다.
 *
 * <p>하루평균·전월대비%는 `지출 / 일수`, `(지난달지출 − 이번달지출) / 지난달지출` 로
 * **지출만으로** 계산된다 — 수입이 안 들어가므로 net 이 아니라 `expense` 다.
 * 차트 Y축과 막대 형태도 건드리지 않는다(숫자가 아니다).
 */
export type HideKind = "expense" | "income" | "transfer" | "net";

/** 그 종류를 가리는 카드들. 하나라도 켜져 있으면 가린다. */
export function cardsOfKind(kind: HideKind): HideCardKey[] {
  return kind === "net"
    ? ["kind.expense", "kind.income"]
    : [`kind.${kind}` as HideCardKey];
}

/** 거래 한 건의 종류 — 부호가 아니라 타입으로 가른다(환불이 음수 지출이라 부호로는 샌다). */
export function kindOfExpense(
  expenseType: string | null | undefined,
): HideKind {
  return expenseType === "INCOME" ? "income" : "expense";
}
