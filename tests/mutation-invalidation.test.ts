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
const budgets = await import("@/features/expense/model/useExpenseBudgets");
const categories =
  await import("@/features/expense/model/useExpenseCategories");
const templates = await import("@/features/expense/model/useExpenseTemplates");
const dutchPays = await import("@/features/dutch-pay/model/useDutchPay");
const savingGoals = await import("@/features/savingGoal/model/useSavingGoals");
const recurrings =
  await import("@/features/recurring-transaction/model/useRecurringTransactions");
const memoTags = await import("@/features/memo-tag/model/useMemoTags");
const todoTags = await import("@/features/todo-tag/model/useTodoTags");
const eventLabels = await import("@/features/event-label/model/useEventLabels");
const notifications =
  await import("@/features/notification/model/useNotifications");
const oauthLink = await import("@/features/oauth-link/model/useOAuthLink");
const deviceSessions =
  await import("@/features/session/model/useDeviceSessions");
const watchlist = await import("@/features/stock/api/watchlistApi");
const subscriptions =
  await import("@/features/subscription/model/useSubscription");

const EXPENSES = "src/features/expense/model/useExpenses.ts";
const SMS = "src/features/sms/model/useCommitSms.ts";
const SPLITS = "src/features/expense-split/model/useExpenseSplits.ts";
const ASSETS = "src/features/asset/model/useAssets.ts";
const TODOS = "src/features/todo/model/useTodos.ts";
const MEMOS = "src/features/memo/model/useMemos.ts";
const EVENTS = "src/widgets/calendar/model/useCalendarEvents.ts";
const CALENDARS = "src/features/user-calendar/model/useUserCalendars.ts";
const BUDGETS = "src/features/expense/model/useExpenseBudgets.ts";
const CATEGORIES = "src/features/expense/model/useExpenseCategories.ts";
const TEMPLATES = "src/features/expense/model/useExpenseTemplates.ts";
const DUTCH_PAY = "src/features/dutch-pay/model/useDutchPay.ts";
const SAVING_GOALS = "src/features/savingGoal/model/useSavingGoals.ts";
const RECURRINGS =
  "src/features/recurring-transaction/model/useRecurringTransactions.ts";
const MEMO_TAGS = "src/features/memo-tag/model/useMemoTags.ts";
const TODO_TAGS = "src/features/todo-tag/model/useTodoTags.ts";
const EVENT_LABELS = "src/features/event-label/model/useEventLabels.ts";
const NOTIFICATIONS = "src/features/notification/model/useNotifications.ts";
const OAUTH_LINK = "src/features/oauth-link/model/useOAuthLink.ts";
const DEVICE_SESSIONS = "src/features/session/model/useDeviceSessions.ts";
const WATCHLIST = "src/features/stock/api/watchlistApi.ts";
const SUBSCRIPTIONS = "src/features/subscription/model/useSubscription.ts";

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

  // 가계부의 밑바탕 — 예산·분류·프리셋. 금액이 안 움직이니 옆 도메인은 안 늙는다.
  {
    file: BUDGETS,
    hook: "useCreateExpenseBudget",
    change: "expense-meta",
    call: () => budgets.useCreateExpenseBudget(),
  },
  {
    file: BUDGETS,
    hook: "useUpdateExpenseBudget",
    change: "expense-meta",
    call: () => budgets.useUpdateExpenseBudget(),
  },
  {
    file: BUDGETS,
    hook: "useDeleteExpenseBudget",
    change: "expense-meta",
    call: () => budgets.useDeleteExpenseBudget(),
  },
  {
    file: CATEGORIES,
    hook: "useCreateExpenseCategory",
    change: "expense-meta",
    call: () => categories.useCreateExpenseCategory(),
  },
  {
    file: CATEGORIES,
    hook: "useUpdateExpenseCategory",
    change: "expense-meta",
    call: () => categories.useUpdateExpenseCategory(),
  },
  {
    file: CATEGORIES,
    hook: "useDeleteExpenseCategory",
    change: "expense-meta",
    call: () => categories.useDeleteExpenseCategory(),
  },
  {
    file: CATEGORIES,
    hook: "useMoveCategoryTransactions",
    change: "expense-meta",
    call: () => categories.useMoveCategoryTransactions(),
  },
  {
    file: CATEGORIES,
    hook: "useSplitCategoryIntoChild",
    change: "expense-meta",
    call: () => categories.useSplitCategoryIntoChild(),
  },
  {
    file: CATEGORIES,
    hook: "useReorderExpenseCategories",
    change: "expense-category-order",
    call: () => categories.useReorderExpenseCategories(),
  },
  {
    file: TEMPLATES,
    hook: "useCreateExpenseTemplate",
    change: "expense-template",
    call: () => templates.useCreateExpenseTemplate(),
  },
  {
    file: TEMPLATES,
    hook: "useUpdateExpenseTemplate",
    change: "expense-template",
    call: () => templates.useUpdateExpenseTemplate(),
  },
  {
    file: TEMPLATES,
    hook: "useDeleteExpenseTemplate",
    change: "expense-template",
    call: () => templates.useDeleteExpenseTemplate(),
  },
  {
    file: TEMPLATES,
    hook: "useTouchExpenseTemplate",
    change: "expense-template",
    call: () => templates.useTouchExpenseTemplate(),
  },
  // 더치페이 — 서버가 원거래를 연결만 하고 정산은 참가자 상태만 바꾼다.
  {
    file: DUTCH_PAY,
    hook: "useCreateDutchPay",
    change: "dutch-pay",
    call: () => dutchPays.useCreateDutchPay(),
  },
  {
    file: DUTCH_PAY,
    hook: "useUpdateDutchPay",
    change: "dutch-pay",
    call: () => dutchPays.useUpdateDutchPay(),
  },
  {
    file: DUTCH_PAY,
    hook: "useDeleteDutchPay",
    change: "dutch-pay",
    call: () => dutchPays.useDeleteDutchPay(),
  },
  {
    file: DUTCH_PAY,
    hook: "useMarkParticipantPaid",
    change: "dutch-pay",
    call: () => dutchPays.useMarkParticipantPaid(),
  },
  {
    file: DUTCH_PAY,
    hook: "useSettleAll",
    change: "dutch-pay",
    call: () => dutchPays.useSettleAll(),
  },
  // 저축목표 — 적립도 목표의 모은 금액만 올린다. 거래·잔액은 그대로다.
  {
    file: SAVING_GOALS,
    hook: "useCreateSavingGoal",
    change: "saving-goal",
    call: () => savingGoals.useCreateSavingGoal(),
  },
  {
    file: SAVING_GOALS,
    hook: "useUpdateSavingGoal",
    change: "saving-goal",
    call: () => savingGoals.useUpdateSavingGoal(),
  },
  {
    file: SAVING_GOALS,
    hook: "useContributeSavingGoal",
    change: "saving-goal",
    call: () => savingGoals.useContributeSavingGoal(),
  },
  {
    file: SAVING_GOALS,
    hook: "useDeleteSavingGoal",
    change: "saving-goal",
    call: () => savingGoals.useDeleteSavingGoal(),
  },
  {
    file: SAVING_GOALS,
    hook: "useReorderSavingGoals",
    change: "saving-goal",
    call: () => savingGoals.useReorderSavingGoals(),
  },
  // 반복 거래 — 예약만 바뀐다. 실제 거래는 예정일에 서버가 만든다.
  {
    file: RECURRINGS,
    hook: "useCreateRecurringTransaction",
    change: "recurring-transaction",
    call: () => recurrings.useCreateRecurringTransaction(),
  },
  {
    file: RECURRINGS,
    hook: "useUpdateRecurringTransaction",
    change: "recurring-transaction",
    call: () => recurrings.useUpdateRecurringTransaction(),
  },
  {
    file: RECURRINGS,
    hook: "useDeleteRecurringTransaction",
    change: "recurring-transaction",
    call: () => recurrings.useDeleteRecurringTransaction(),
  },
  {
    file: RECURRINGS,
    hook: "useToggleRecurringTransaction",
    change: "recurring-transaction",
    call: () => recurrings.useToggleRecurringTransaction(),
  },
  // 이름표 — 만들 때는 목록만, 고치거나 지울 때는 그걸 달고 있던 것까지.
  {
    file: MEMO_TAGS,
    hook: "useCreateMemoTag",
    change: "memo-tag",
    call: () => memoTags.useCreateMemoTag(),
  },
  {
    file: MEMO_TAGS,
    hook: "useUpdateMemoTag",
    change: "memo-tag-usage",
    call: () => memoTags.useUpdateMemoTag(),
  },
  {
    file: MEMO_TAGS,
    hook: "useDeleteMemoTag",
    change: "memo-tag-usage",
    call: () => memoTags.useDeleteMemoTag(),
  },
  {
    file: TODO_TAGS,
    hook: "useCreateTodoTag",
    change: "todo-tag",
    call: () => todoTags.useCreateTodoTag(),
  },
  {
    file: TODO_TAGS,
    hook: "useUpdateTodoTag",
    change: "todo-tag-usage",
    call: () => todoTags.useUpdateTodoTag(),
  },
  {
    file: TODO_TAGS,
    hook: "useDeleteTodoTag",
    change: "todo-tag-usage",
    call: () => todoTags.useDeleteTodoTag(),
  },
  {
    file: EVENT_LABELS,
    hook: "useCreateEventLabel",
    change: "event-label",
    call: () => eventLabels.useCreateEventLabel(),
  },
  {
    file: EVENT_LABELS,
    hook: "useUpdateEventLabel",
    change: "event-label-usage",
    call: () => eventLabels.useUpdateEventLabel(),
  },
  {
    file: EVENT_LABELS,
    hook: "useDeleteEventLabel",
    change: "event-label-usage",
    call: () => eventLabels.useDeleteEventLabel(),
  },
  // 계정·구독·증권
  {
    file: NOTIFICATIONS,
    hook: "useMarkRead",
    change: "notification",
    call: () => notifications.useMarkRead(),
  },
  {
    file: NOTIFICATIONS,
    hook: "useMarkAllRead",
    change: "notification",
    call: () => notifications.useMarkAllRead(),
  },
  {
    file: NOTIFICATIONS,
    hook: "useDeleteNotification",
    change: "notification",
    call: () => notifications.useDeleteNotification(),
  },
  {
    file: OAUTH_LINK,
    hook: "useUnlinkOAuth",
    change: "oauth-link",
    call: () => oauthLink.useUnlinkOAuth(),
  },
  {
    file: DEVICE_SESSIONS,
    hook: "useRevokeDeviceMutation",
    change: "device-session",
    call: () => deviceSessions.useRevokeDeviceMutation(),
  },
  {
    file: WATCHLIST,
    hook: "useCreateWatchGroup",
    change: "stock-watchlist",
    call: () => watchlist.useCreateWatchGroup(),
  },
  {
    file: WATCHLIST,
    hook: "useRenameWatchGroup",
    change: "stock-watchlist",
    call: () => watchlist.useRenameWatchGroup(),
  },
  {
    file: WATCHLIST,
    hook: "useDeleteWatchGroup",
    change: "stock-watchlist",
    call: () => watchlist.useDeleteWatchGroup(),
  },
  {
    file: WATCHLIST,
    hook: "useAddWatchItem",
    change: "stock-watchlist",
    call: () => watchlist.useAddWatchItem(),
  },
  {
    file: WATCHLIST,
    hook: "useRemoveWatchItem",
    change: "stock-watchlist",
    call: () => watchlist.useRemoveWatchItem(),
  },
  {
    file: SUBSCRIPTIONS,
    hook: "useSubscribe",
    change: "subscription",
    call: () => subscriptions.useSubscribe(),
  },
  {
    file: SUBSCRIPTIONS,
    hook: "useCancelSubscription",
    change: "subscription",
    call: () => subscriptions.useCancelSubscription(),
  },
  {
    file: SUBSCRIPTIONS,
    hook: "useRegisterBrokerCredential",
    change: "broker-connection",
    call: () => subscriptions.useRegisterBrokerCredential(),
  },
  {
    file: SUBSCRIPTIONS,
    hook: "useDisconnectBrokerCredential",
    change: "broker-connection",
    call: () => subscriptions.useDisconnectBrokerCredential(),
  },
  {
    file: SUBSCRIPTIONS,
    hook: "useSetPrimaryBroker",
    change: "broker-connection",
    call: () => subscriptions.useSetPrimaryBroker(),
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
  "event-label": ["event-labels"],
  "event-label-usage": ["event-labels", "calendar"],
  "memo-tag": ["memo-tags"],
  "memo-tag-usage": ["memo-tags", "memos"],
  "todo-tag": ["todo-tags"],
  "todo-tag-usage": ["todo-tags", "todos"],
  "expense-meta": ["expenses"],
  "expense-category-order": ["expenses/categories"],
  "expense-template": ["expenses/templates"],
  "dutch-pay": ["dutch-pay"],
  "saving-goal": ["saving-goals"],
  "recurring-transaction": ["recurring-transactions"],
  notification: ["notifications"],
  "oauth-link": ["oauth"],
  "device-session": ["deviceSessions"],
  "stock-watchlist": ["stocks/watch-groups"],
  subscription: ["subscription"],
  "broker-connection": [
    "subscription/securities-credentials",
    "subscription/features",
  ],
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
