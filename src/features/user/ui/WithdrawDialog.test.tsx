// 해지 다이얼로그가 **막을 때 막고, 보낼 때 보내는지**를 고정한다.
//
// 되돌릴 수 없는 일이라 두 방향 모두 틀리면 안 된다.
// - 구독이 남았는데 진행 버튼이 서면 → 눌러 봤자 서버가 409 다. 사용자는 왜 안 되는지 모른다
// - 본인 확인 없이 해지가 나가면 → 남이 자리를 비운 사이 계정을 지울 수 있다
// - 티켓을 받고도 해지를 안 부르면 → "됐다" 고 해 놓고 계정이 그대로 남는다
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({
  check: null as Record<string, unknown> | null,
  verifyError: null as unknown,
  verifiedPassword: null as string | null,
  withdrew: null as Record<string, unknown> | null,
  onWithdrawnCalls: 0,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/shared/hooks", () => ({ useIsMobile: () => false }));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));
vi.mock("../model/useWithdrawal", () => ({
  useWithdrawalCheck: () => ({
    data: state.check,
    isLoading: state.check === null,
    isError: false,
  }),
  useSendReauthEmailCodeMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
  useVerifyReauthEmailCodeMutation: () => ({
    mutateAsync: async () => "ticket",
    isPending: false,
  }),
  useVerifyReauthPasswordMutation: () => ({
    mutateAsync: async (pw: string) => {
      state.verifiedPassword = pw;
      if (state.verifyError) throw state.verifyError;
      return "ticket-abc";
    },
    isPending: false,
  }),
  useWithdrawMutation: () => ({
    mutateAsync: async (v: Record<string, unknown>) => {
      state.withdrew = v;
    },
    isPending: false,
  }),
}));

const { WithdrawDialog } = await import("./WithdrawDialog");
const { WITHDRAW_BLOCK_SUBSCRIPTION } = await import("../api/userApi");

const CLEAR = {
  blocked: [],
  subscriptionPeriodEnd: null,
  sharedCalendarsOwned: 2,
  calendarMemberships: 0,
  dutchPaysOwned: 0,
  dutchPayParticipations: 3,
};

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <WithdrawDialog
        onClose={() => {}}
        onWithdrawn={() => {
          state.onWithdrawnCalls += 1;
        }}
      />,
    ),
  );
}

const buttonNamed = (text: string) =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );

/**
 * 버튼 누르기.
 *
 * `el.click()` 을 쓰지 않는다 — jsdom 이 만드는 그 이벤트는 React 19 의 위임에 안
 * 잡혀 핸들러가 조용히 안 불린다(테스트만 초록불이 되고 화면은 멀쩡한, 가장 나쁜 쪽).
 * 레포의 다른 다이얼로그 테스트와 같은 방식으로 실제 MouseEvent 를 쏜다.
 */
const click = (text: string) =>
  buttonNamed(text)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

/**
 * footer 의 주 버튼을 연달아 누르기 전에 기다린다.
 *
 * `계속` 과 `해지하기` 는 **같은 자리의 같은 버튼**이라 React 가 같은 fiber 로 잇는다.
 * Button 의 더블클릭 가드(`DOUBLE_CLICK_GUARD_MS`)가 그 fiber 에 마지막 클릭 시각을
 * 들고 있어서, 600ms 안에 두 번째를 누르면 **버려진다**. 제품에서는 그 사이에 비밀번호를
 * 넣어야 하므로 닿을 일이 없고, 오히려 계속을 누른 자리에 해지 버튼이 올라오는 만큼
 * 튄 클릭을 막아 주는 쪽이다. 테스트만 그 창을 지나가면 된다 — 가드는 클릭 다음
 * 매크로태스크에서 스스로 풀린다.
 */
const flushClickGuard = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.check = null;
  state.verifyError = null;
  state.verifiedPassword = null;
  state.withdrew = null;
  state.onWithdrawnCalls = 0;
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.scrollIntoView = () => {};
});

afterEach(() => {
  // 렌더 없이 도는 테스트(문자열 계약 검사)도 있다 — 그때는 치울 것이 없다.
  if (!root) return;
  act(() => root.unmount());
  container.remove();
});

// 이 값은 **서버가 짓는다** — desk-back `WithdrawalServiceImpl.check()` 의
// `List.of("SUBSCRIPTION_ACTIVE")`. 한 글자만 달라도 `includes` 가 조용히 false 가 되어
// 구독 때문에 막힌 사람에게 **언제부터 가능한지 날짜를 못 보여 준다.** 실제로 `SUBSCRIPTION`
// 으로 적어 두고 dev 에서야 잡았다(2026-09-17). 서버를 고치면 여기도 같이 고쳐야 한다.
describe("막는 사유 코드", () => {
  it("서버가 보내는 문자열과 글자 그대로 같다", () => {
    expect(WITHDRAW_BLOCK_SUBSCRIPTION).toBe("SUBSCRIPTION_ACTIVE");
  });
});

describe("제목", () => {
  beforeEach(() => {
    state.check = CLEAR;
    render();
  });

  // 제목이 `settings` 네임스페이스의 `account.withdraw.label` 을 가리킨 적이 있었다.
  // 이 다이얼로그는 `user` 네임스페이스라 그 키는 안 풀리고, 시트 머리에 키 문자열이
  // 그대로 떴다. t 를 키 그대로 돌려주도록 mock 했으므로 여기서 어느 키를 쓰는지 본다.
  it("user 네임스페이스의 키를 쓴다 — 다른 네임스페이스 키는 안 풀린다", () => {
    expect(document.body.textContent).toContain("withdraw.title");
    expect(document.body.textContent).not.toContain("account.withdraw.label");
  });
});

describe("구독이 막을 때", () => {
  beforeEach(() => {
    state.check = {
      ...CLEAR,
      // 서버가 실제로 넣는 문자열을 그대로 쓴다 — 상수를 여기 넣으면 상수와 mock 이
      // 서로를 보고 끄덕이는 닫힌 고리가 되어, 둘 다 틀려도 초록불이 난다.
      blocked: ["SUBSCRIPTION_ACTIVE"],
      // 서버가 시간대 없이 주는 [UTC] — 화면은 KST 로 읽어 10-01 이 되어야 한다.
      subscriptionPeriodEnd: "2026-09-30T15:00:00",
    };
    render();
  });

  it("진행 버튼을 아예 두지 않는다 — 눌러도 서버가 막는 버튼은 보여 줄 이유가 없다", () => {
    expect(buttonNamed("withdraw.next")).toBeUndefined();
    expect(buttonNamed("withdraw.confirm")).toBeUndefined();
    expect(buttonNamed("close")).toBeDefined();
  });

  it("언제부터 가능한지를 말한다 — 이 날짜가 없으면 기다릴지 말지 정할 수 없다", () => {
    expect(document.body.textContent).toContain(
      "withdraw.blockedSubscriptionUntil",
    );
  });
});

describe("막는 게 없을 때", () => {
  beforeEach(() => {
    state.check = CLEAR;
    render();
  });

  // 해지는 soft delete 다 — 데이터는 남는다. "기록이 사라진다" 로 쓰면 사용자가
  // 실제와 다른 것을 믿고 누른다(2026-09-17 QA #7).
  it("데이터가 어떻게 되는지와 내보내기 권유가 보인다", () => {
    const text = document.body.textContent ?? "";
    expect(text).toContain("withdraw.dataRetention");
  });

  it("0 인 항목은 줄을 안 만든다 — 없는 손실을 세어 겁줄 이유가 없다", () => {
    const text = document.body.textContent ?? "";
    expect(text).toContain("impact.calendarsOwned");
    expect(text).toContain("impact.dutchPayParticipations");
    expect(text).not.toContain("impact.calendarMemberships");
    expect(text).not.toContain("impact.dutchPaysOwned");
  });

  it("안내를 보는 동안에는 해지가 나가지 않는다 — 다음을 눌러야 본인 확인이다", () => {
    expect(state.withdrew).toBeNull();
    act(() => click("withdraw.next"));
    expect(state.withdrew).toBeNull();
    expect(document.body.textContent).toContain("withdraw.reauthIntro");
  });

  it("비밀번호가 비면 확정 버튼이 눌리지 않는다", () => {
    act(() => click("withdraw.next"));
    expect(buttonNamed("withdraw.confirm")!.disabled).toBe(true);
  });

  it("본인 확인 단계에서 바로 눌러도 해지가 나가지 않는다", async () => {
    act(() => click("withdraw.next"));
    await flushClickGuard();
    await act(async () => click("withdraw.confirm"));
    expect(state.withdrew).toBeNull();
  });

  /**
   * 실패 문구는 **서버가 쓴 문장**이어야 한다.
   *
   * axios 는 실패를 Error 로 감싸는데 그 `message` 는 "Request failed with status code
   * 400" 이다 — 그대로 붙이면 사용자가 영문 상태 코드를 읽게 된다(2026-09-17 QA 스크린샷).
   * 정작 할 말은 응답 본문에 들어 있다.
   */
  it("확인에 실패하면 서버 문장을 칸 밑에 붙인다 — axios 원문이 나오면 안 된다", async () => {
    state.verifyError = Object.assign(
      new Error("Request failed with status code 400"),
      { response: { data: { message: "비밀번호가 올바르지 않아요" } } },
    );

    act(() => click("withdraw.next"));
    await flushClickGuard();
    const pw = document.getElementById("withdraw-password") as HTMLInputElement;
    act(() => setValue(pw, "wrong"));
    await act(async () => click("withdraw.confirm"));

    const text = document.body.textContent ?? "";
    expect(text).toContain("비밀번호가 올바르지 않아요");
    expect(text).not.toContain("Request failed with status code");
    expect(state.withdrew).toBeNull();
  });

  it("서버가 아무 말도 안 하면 이 화면의 문구를 쓴다", async () => {
    state.verifyError = new Error("Network Error");

    act(() => click("withdraw.next"));
    await flushClickGuard();
    const pw = document.getElementById("withdraw-password") as HTMLInputElement;
    act(() => setValue(pw, "whatever"));
    await act(async () => click("withdraw.confirm"));

    const text = document.body.textContent ?? "";
    expect(text).toContain("withdraw.failed");
    expect(text).not.toContain("Network Error");
  });

  it("비밀번호 확인 → 그 티켓으로 해지 → 로그아웃까지 이어진다", async () => {
    act(() => click("withdraw.next"));

    const reason = document.getElementById(
      "withdraw-reason",
    ) as HTMLInputElement | null;
    expect(reason).toBeNull(); // 단계가 넘어갔으면 사유 칸은 사라진다

    await flushClickGuard();

    const pw = document.getElementById("withdraw-password") as HTMLInputElement;
    act(() => setValue(pw, "my-password"));

    await act(async () => click("withdraw.confirm"));

    expect(state.verifiedPassword).toBe("my-password");
    // 방금 받은 티켓을 그대로 실어야 한다 — 다른 값이 가면 서버가 AUTH_020 으로 막는다.
    expect(state.withdrew).toEqual({
      reauthToken: "ticket-abc",
      reason: undefined,
    });
    expect(state.onWithdrawnCalls).toBe(1);
  });
});
