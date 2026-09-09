import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it, vi } from "vitest";
import { INVALIDATION_MAP, type ChangeKind } from "@/shared/config";

/**
 * 뮤테이션이 무엇을 비우는지 — **표 하나로 잠근다.**
 *
 * 여기서 지키려는 건 "이 훅이 이 키를 비운다" 가 아니라 **아무도 표 밖에서 비우지
 * 못한다** 는 것이다. 지금까지 새던 방식이 정확히 그거였다 — 호출처마다 키를 손으로
 * 나열하다 보니 카드 실적(`cardKeys`)은 앱 전체에서 한 번도 안 비워졌고, 카드 결제와
 * 결제 취소가 서로 다른 범위를 비웠다.
 *
 * 그래서 세 가지를 함께 본다.
 *   ① 표(`INVALIDATION_MAP`)가 어느 접두를 비우는지 — 여기 그대로 적어 고정한다.
 *      키 하나를 표에서 빼면 이 테스트가 깨진다.
 *   ② 훅마다 **어느 이름을 골랐는지** — 결제가 `"asset"` 으로 내려앉으면 깨진다.
 *   ③ 대상 파일에 `invalidateQueries` 직접 호출이 **하나도 없고**, `invalidateFor`
 *      호출 수가 아래 표의 줄 수와 **정확히 같은지** — 새 뮤테이션을 추가하고 표에
 *      안 적으면 깨진다.
 */

const mocks = vi.hoisted(() => {
  const invalidated: unknown[][] = [];
  return {
    invalidated,
    queryClient: {
      invalidateQueries: (filters: { queryKey: readonly unknown[] }) => {
        invalidated.push([...filters.queryKey]);
      },
      cancelQueries: () => Promise.resolve(),
      getQueriesData: () => [],
      setQueriesData: () => undefined,
      setQueryData: () => undefined,
    },
  };
});

// 훅을 렌더하지 않고 부르려고 react-query 를 걷어낸다 — `useMutation` 이 옵션을
// 그대로 돌려주므로 `onSuccess` 를 직접 부를 수 있다. 렌더가 끼면 무효화 여부가
// 아니라 렌더 배선을 시험하게 된다.
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mocks.queryClient,
  useMutation: (options: unknown) => options,
  useQuery: () => ({ data: undefined }),
  useInfiniteQuery: () => ({ data: undefined }),
}));
// 토글 훅들이 쓰는 상태 훅 — 리액트 밖에서 부르면 죽으므로 껍데기로 바꾼다.
vi.mock("@/shared/lib/porest/use-pending-ids", () => ({
  usePendingIds: () => ({
    pendingIds: new Set<number>(),
    begin: () => undefined,
    end: () => undefined,
  }),
}));
vi.mock("@/shared/lib/porest/use-hold-ids", () => ({
  useHoldIds: () => ({ holdIds: new Set<number>(), hold: () => undefined }),
}));

const expenses = await import("@/features/expense/model/useExpenses");
const sms = await import("@/features/sms/model/useCommitSms");
const splits = await import("@/features/expense-split/model/useExpenseSplits");
const assets = await import("@/features/asset/model/useAssets");
const todos = await import("@/features/todo/model/useTodos");
const memos = await import("@/features/memo/model/useMemos");
const events = await import("@/widgets/calendar/model/useCalendarEvents");
const calendars =
  await import("@/features/user-calendar/model/useUserCalendars");

const EXPENSES = "src/features/expense/model/useExpenses.ts";
const SMS = "src/features/sms/model/useCommitSms.ts";
const SPLITS = "src/features/expense-split/model/useExpenseSplits.ts";
const ASSETS = "src/features/asset/model/useAssets.ts";
const TODOS = "src/features/todo/model/useTodos.ts";
const MEMOS = "src/features/memo/model/useMemos.ts";
const EVENTS = "src/widgets/calendar/model/useCalendarEvents.ts";
const CALENDARS = "src/features/user-calendar/model/useUserCalendars.ts";

type MutationLike = {
  onSuccess?: (...args: unknown[]) => void;
  onSettled?: (...args: unknown[]) => void;
};

type Row = {
  file: string;
  hook: string;
  change: ChangeKind;
  call: () => unknown;
};

/** 뮤테이션 훅 → 고른 변경 이름. 새 뮤테이션은 여기 한 줄을 더해야 통과한다. */
const ROWS: Row[] = [
  // 가계부
  {
    file: EXPENSES,
    hook: "useCreateExpense",
    change: "ledger",
    call: () => expenses.useCreateExpense(),
  },
  {
    file: EXPENSES,
    hook: "useUpdateExpense",
    change: "ledger",
    call: () => expenses.useUpdateExpense(),
  },
  {
    file: EXPENSES,
    hook: "useUnlinkRefund",
    change: "ledger",
    call: () => expenses.useUnlinkRefund(),
  },
  {
    file: EXPENSES,
    hook: "useDeleteExpense",
    change: "ledger",
    call: () => expenses.useDeleteExpense(),
  },
  {
    file: SMS,
    hook: "useCommitSms",
    change: "ledger",
    call: () => sms.useCommitSms(),
  },
  // 분할 — 거래를 쪼개는 것이므로 거래 변경과 파급이 같다.
  {
    file: SPLITS,
    hook: "useReplaceExpenseSplits",
    change: "ledger",
    call: () => splits.useReplaceExpenseSplits(),
  },
  {
    file: SPLITS,
    hook: "useDeleteAllExpenseSplits",
    change: "ledger",
    call: () => splits.useDeleteAllExpenseSplits(),
  },
  // 자산·카드
  {
    file: ASSETS,
    hook: "useCreateAsset",
    change: "asset",
    call: () => assets.useCreateAsset(),
  },
  {
    file: ASSETS,
    hook: "useUpdateAsset",
    change: "asset",
    call: () => assets.useUpdateAsset(),
  },
  {
    file: ASSETS,
    hook: "useReorderAssets",
    change: "asset",
    call: () => assets.useReorderAssets(),
  },
  {
    file: ASSETS,
    hook: "useDeleteAsset",
    change: "ledger",
    call: () => assets.useDeleteAsset(),
  },
  {
    file: ASSETS,
    hook: "usePayCard",
    change: "ledger",
    call: () => assets.usePayCard(),
  },
  {
    file: ASSETS,
    hook: "useCancelCardPayment",
    change: "ledger",
    call: () => assets.useCancelCardPayment(),
  },
  {
    file: ASSETS,
    hook: "useInstallmentPayoff",
    change: "ledger",
    call: () => assets.useInstallmentPayoff(1),
  },
  {
    file: ASSETS,
    hook: "useCreateTransfer",
    change: "ledger",
    call: () => assets.useCreateTransfer(),
  },
  {
    file: ASSETS,
    hook: "useUpdateTransfer",
    change: "ledger",
    call: () => assets.useUpdateTransfer(),
  },
  {
    file: ASSETS,
    hook: "useDeleteTransfer",
    change: "ledger",
    call: () => assets.useDeleteTransfer(),
  },
  {
    file: ASSETS,
    hook: "useCreateTrade",
    change: "ledger",
    call: () => assets.useCreateTrade(),
  },
  {
    file: ASSETS,
    hook: "useDeleteTrade",
    change: "ledger",
    call: () => assets.useDeleteTrade(),
  },
  // 할 일
  {
    file: TODOS,
    hook: "useCreateTodo",
    change: "todo",
    call: () => todos.useCreateTodo(),
  },
  {
    file: TODOS,
    hook: "useUpdateTodo",
    change: "todo",
    call: () => todos.useUpdateTodo(),
  },
  {
    file: TODOS,
    hook: "useReorderTodos",
    change: "todo",
    call: () => todos.useReorderTodos(),
  },
  {
    file: TODOS,
    hook: "useDeleteTodo",
    change: "todo",
    call: () => todos.useDeleteTodo(),
  },
  {
    file: TODOS,
    hook: "useUpdateTodoTags",
    change: "todo",
    call: () => todos.useUpdateTodoTags(),
  },
  {
    file: TODOS,
    hook: "useToggleTodoPin",
    change: "todo",
    call: () => todos.useToggleTodoPin(),
  },
  {
    file: TODOS,
    hook: "useToggleTodoStatus",
    change: "todo-status",
    call: () => todos.useToggleTodoStatus(),
  },
  // 메모
  {
    file: MEMOS,
    hook: "useCreateMemo",
    change: "memo",
    call: () => memos.useCreateMemo(),
  },
  {
    file: MEMOS,
    hook: "useUpdateMemo",
    change: "memo",
    call: () => memos.useUpdateMemo(),
  },
  {
    file: MEMOS,
    hook: "useToggleMemoPin",
    change: "memo",
    call: () => memos.useToggleMemoPin(),
  },
  {
    file: MEMOS,
    hook: "useDeleteMemo",
    change: "memo",
    call: () => memos.useDeleteMemo(),
  },
  // 일정
  {
    file: EVENTS,
    hook: "useCreateEvent",
    change: "calendar-event",
    call: () => events.useCreateEvent(),
  },
  {
    file: EVENTS,
    hook: "useUpdateEvent",
    change: "calendar-event",
    call: () => events.useUpdateEvent(),
  },
  {
    file: EVENTS,
    hook: "useDeleteEvent",
    change: "calendar-event",
    call: () => events.useDeleteEvent(),
  },
  // 캘린더
  {
    file: CALENDARS,
    hook: "useCreateUserCalendar",
    change: "user-calendar",
    call: () => calendars.useCreateUserCalendar(),
  },
  {
    file: CALENDARS,
    hook: "useUpdateUserCalendar",
    change: "user-calendar",
    call: () => calendars.useUpdateUserCalendar(),
  },
  {
    file: CALENDARS,
    hook: "useToggleCalendarVisibility",
    change: "user-calendar",
    call: () => calendars.useToggleCalendarVisibility(),
  },
  {
    file: CALENDARS,
    hook: "useRegenerateCalendarInviteCode",
    change: "user-calendar",
    call: () => calendars.useRegenerateCalendarInviteCode(),
  },
  {
    file: CALENDARS,
    hook: "useRemoveCalendarMember",
    change: "user-calendar",
    call: () => calendars.useRemoveCalendarMember(),
  },
  {
    file: CALENDARS,
    hook: "useChangeCalendarMemberRole",
    change: "user-calendar",
    call: () => calendars.useChangeCalendarMemberRole(),
  },
  {
    file: CALENDARS,
    hook: "useDeleteUserCalendar",
    change: "user-calendar-scope",
    call: () => calendars.useDeleteUserCalendar(),
  },
  {
    file: CALENDARS,
    hook: "useJoinCalendar",
    change: "user-calendar-scope",
    call: () => calendars.useJoinCalendar(),
  },
];

/** 표가 비우는 접두 — 표를 고치면 여기도 고쳐야 한다. */
const EXPECTED_MAP: Record<ChangeKind, string[]> = {
  ledger: [
    "expenses",
    "assets",
    "cards",
    "expense-splits",
    "dutch-pay",
    "dashboard",
  ],
  asset: ["assets"],
  todo: ["todos", "dashboard"],
  "todo-status": ["todos", "constellation", "dashboard"],
  "calendar-event": ["calendar", "dashboard"],
  memo: ["memos", "dashboard"],
  "user-calendar": ["user-calendars"],
  "user-calendar-scope": ["user-calendars", "calendar"],
};

// 레포 루트 기준으로 읽는다. `import.meta.url` 은 안 쓴다 — 테스트 러너 안에서는
// 파일 경로가 아니라 http URL 이라 `readFileSync` 가 못 받는다.
const read = (file: string) => readFileSync(join(cwd(), file), "utf8");

describe("무효화 매핑 상수", () => {
  it("변경마다 비우는 접두를 고정한다", () => {
    const actual = Object.fromEntries(
      Object.entries(INVALIDATION_MAP).map(([change, keys]) => [
        change,
        keys.map((key) => key.join("/")),
      ]),
    );
    expect(actual).toEqual(EXPECTED_MAP);
  });
});

describe("뮤테이션이 고른 변경", () => {
  for (const row of ROWS) {
    it(`${row.hook} → "${row.change}"`, () => {
      mocks.invalidated.length = 0;
      const mutation = row.call() as MutationLike;
      const handler = mutation.onSuccess ?? mutation.onSettled;
      expect(handler, `${row.hook} 에 onSuccess/onSettled 가 없다`).toBeTypeOf(
        "function",
      );
      handler?.(undefined, undefined, 1);
      expect(mocks.invalidated).toEqual(
        INVALIDATION_MAP[row.change].map((key) => [...key]),
      );
    });
  }
});

describe("표 밖에서 비우지 못한다", () => {
  for (const file of new Set(ROWS.map((r) => r.file))) {
    it(`${file} 는 키를 손으로 나열하지 않는다`, () => {
      expect(read(file)).not.toContain("invalidateQueries(");
    });

    it(`${file} 의 뮤테이션이 표에 다 적혀 있다`, () => {
      const found = read(file).match(/invalidateFor\(queryClient, "/g) ?? [];
      expect(found).toHaveLength(ROWS.filter((r) => r.file === file).length);
    });
  }
});
