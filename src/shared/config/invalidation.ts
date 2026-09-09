import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  assetKeys,
  calendarKeys,
  cardKeys,
  constellationKeys,
  dashboardKeys,
  dutchPayKeys,
  expenseKeys,
  expenseSplitKeys,
  memoKeys,
  todoKeys,
  userCalendarKeys,
} from "./queryKeys";

/**
 * 무엇이 바뀌면 무엇을 비우는가 — **이 표 하나가 정의다.**
 *
 * 뮤테이션마다 호출처에서 키를 손으로 나열하면 샌다. 실제로 샜다 — 카드로 지출을
 * 넣어도 `cardKeys` 를 비우는 곳이 앱 전체에 하나도 없어 카드 실적이 `0 / 300,000`
 * 으로 남았고, 카드 결제는 이체를 만들면서 가계부를 안 비웠는데 결제 **취소**는
 * 비웠다(같은 화면, 반대 방향, 다른 범위). 접두가 같은 도메인은 `expenseKeys.all`
 * 한 줄로 덮여 놓칠 일이 없다 — 놓치는 건 언제나 **접두가 다른 옆 도메인**이다.
 * 그래서 옆 도메인을 아는 자리를 여기 하나로 모은다.
 *
 * 넓게 비우는 쪽으로 기운다. 안 비워서 틀린 값을 보여 주면 아무도 못 찾지만, 더
 * 비워서 드는 비용은 **화면에 떠 있는** 쿼리의 재조회뿐이다 — `invalidateQueries`
 * 는 떠 있지 않은 쿼리에는 낡음 표시만 하고 요청을 보내지 않는다.
 *
 * 새 변경 경로가 생기면 여기 줄을 더하고 호출처는 이름 하나만 고른다. 표에 없는
 * 이름은 타입이 막고, 손으로 나열해 우회하면 테스트가 잡는다
 * (`tests/mutation-invalidation.test.ts`).
 */
export const INVALIDATION_MAP = {
  /**
   * 가계부 행이 생기거나·바뀌거나·사라진다.
   *
   * 거래 CRUD·환불 연결 해제·문자 커밋만이 아니다. **거래를 딸고 움직이는 것 전부**
   * 가 여기다 — 이체·매매(이자·실현손익이 거래로 잡힌다), 카드 결제·결제 취소·할부
   * 상환(이체가 생기고 청구·실적이 함께 바뀐다), 자산 삭제(그 자산의 거래가 함께
   * 사라진다). 금액이 움직이면 카드 실적도, 분할·더치페이도, 홈 합계도 같이 늙는다.
   */
  ledger: [
    expenseKeys.all,
    assetKeys.all,
    cardKeys.all,
    expenseSplitKeys.all,
    dutchPayKeys.all,
    dashboardKeys.all,
  ],
  /** 자산 자체만 바뀐다 — 추가·수정·정렬. 거래는 그대로다. */
  asset: [assetKeys.all],
  /** 할 일이 바뀐다. 홈 위젯이 할 일 개수·최근 목록을 들고 있다. */
  todo: [todoKeys.all, dashboardKeys.all],
  /** 할 일 완료 토글 — 별빛이 적립·회수되므로 별자리도 함께 늙는다. */
  "todo-status": [todoKeys.all, constellationKeys.all, dashboardKeys.all],
  /** 일정이 바뀐다. 홈 위젯이 오늘·다가오는 일정을 들고 있다. */
  "calendar-event": [calendarKeys.all, dashboardKeys.all],
  /** 메모가 바뀐다. 홈 위젯이 개수·고정·최근 제목을 들고 있다. */
  memo: [memoKeys.all, dashboardKeys.all],
  /** 캘린더의 속성이 바뀐다 — 이름·색·표시·초대코드·멤버. 일정 자체는 안 움직인다. */
  "user-calendar": [userCalendarKeys.all],
  /**
   * 내가 가진 캘린더 집합이 바뀐다 — 삭제·참여.
   *
   * 삭제하면 서버가 그 캘린더의 일정을 **기본 캘린더로 옮긴다.** 일정 캐시를 안
   * 비우면 옛 캘린더 아이디를 든 일정이 그대로 남고, 화면의 표시 필터가 사라진
   * 캘린더를 못 찾아 색·이름을 옛것으로 그린다.
   */
  "user-calendar-scope": [userCalendarKeys.all, calendarKeys.all],
} as const satisfies Record<string, readonly QueryKey[]>;

/** 서버 상태를 바꾸는 변경의 이름. 뮤테이션은 이 중 하나를 고른다. */
export type ChangeKind = keyof typeof INVALIDATION_MAP;

/**
 * 변경 하나가 늙히는 캐시를 전부 비운다.
 *
 * 호출처는 "무엇이 바뀌었는지" 이름 하나만 고른다 — 어느 도메인이 딸려 늙는지는
 * 위 표가 안다.
 */
export const invalidateFor = (queryClient: QueryClient, change: ChangeKind) => {
  for (const queryKey of INVALIDATION_MAP[change]) {
    queryClient.invalidateQueries({ queryKey });
  }
};
