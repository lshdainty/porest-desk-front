// 비밀번호 변경 실패가 **화면에** 어떻게 닿는지를 고정한다 (QA #128).
//
// 틀린 현재 비밀번호를 넣으면 SSO 가 쓴 문장이 그대로 떴다
// — `현재 비밀번호가 올바르지 않습니다`. desk 는 `~어요` 로 말한다.
//
// 서버는 못 고친다(SSO 문구는 HR·SSO 화면도 함께 쓴다). 그래서 desk 가 **코드로**
// 자기 문구를 고르고, 그 문구를 고칠 칸 밑에 붙인다 — 토스트로 띄우면 어느 칸을
// 고쳐야 하는지 안 보인다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

/** 이번 제출이 실패하면 쓸 응답 — 없으면 성공. */
const next = vi.hoisted(() => ({ error: null as unknown }));
const toasts = vi.hoisted(() => ({ error: [] as string[] }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("sonner", () => ({
  toast: {
    success: () => {},
    error: (m: string) => {
      toasts.error.push(m);
    },
  },
}));
vi.mock("@/features/user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/user")>()),
  useChangePasswordMutation: () => ({
    isPending: false,
    mutate: (
      _v: unknown,
      cb: { onSuccess?: () => void; onError?: (e: unknown) => void },
    ) => {
      if (next.error) cb.onError?.(next.error);
      else cb.onSuccess?.();
    },
  }),
}));

/** desk-back 이 실제로 돌려주는 모양 — `code` + relay 된 SSO `message`. */
const SSO_SENTENCE = "현재 비밀번호가 올바르지 않습니다";
const wrongCurrentPassword = {
  message: "Request failed with status code 400",
  response: {
    status: 400,
    data: { success: false, code: "USER_003", message: SSO_SENTENCE },
  },
};

const { PasswordChangeDialog } = await import("./PasswordChangeDialog");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  next.error = null;
  toasts.error.length = 0;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** 리액트가 관리하는 입력에 값을 넣는다(setter 를 우회하면 상태가 안 바뀐다). */
function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  });
}

const field = (id: string) => {
  const el = document.body.querySelector<HTMLInputElement>(`#${id}`);
  if (!el) throw new Error(`칸을 찾지 못했다: ${id}`);
  return el;
};

/** 폼을 채우고 저장까지 누른다 — 유효성 검사가 비동기라 flush 를 기다린다. */
async function submit() {
  setValue(field("currentPassword"), "old-one!");
  setValue(field("newPassword"), "new-one!");
  setValue(field("confirmPassword"), "new-one!");

  const save = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "save",
  );
  if (!save) throw new Error("저장 버튼을 찾지 못했다");
  await act(async () => {
    save.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("비밀번호 변경 실패 문구 (QA #128)", () => {
  it("현재 비밀번호가 틀리면 desk 문구가 그 칸 밑에 붙는다", async () => {
    next.error = wrongCurrentPassword;
    act(() =>
      root.render(<PasswordChangeDialog open onOpenChange={() => {}} />),
    );

    await submit();

    expect(document.body.textContent).toContain("currentPasswordInvalid");
  });

  it("SSO 가 쓴 문장은 화면 어디에도 안 나온다 — 토스트에도", async () => {
    next.error = wrongCurrentPassword;
    act(() =>
      root.render(<PasswordChangeDialog open onOpenChange={() => {}} />),
    );

    await submit();

    expect(document.body.textContent).not.toContain(SSO_SENTENCE);
    expect(toasts.error).toEqual([]);
  });

  it("모르는 실패는 일반 문구로 알린다 — 조용히 닫히지 않는다", async () => {
    next.error = {
      message: "Request failed with status code 503",
      response: { status: 503, data: { code: "SSO_001", message: "SSO down" } },
    };
    act(() =>
      root.render(<PasswordChangeDialog open onOpenChange={() => {}} />),
    );

    await submit();

    expect(toasts.error).toEqual(["passwordChangeError"]);
  });

  it("성공하면 실패 문구가 안 뜬다 — 반대편", async () => {
    let closed = false;
    act(() =>
      root.render(
        <PasswordChangeDialog
          open
          onOpenChange={(o) => {
            closed = !o;
          }}
        />,
      ),
    );

    await submit();

    expect(document.body.textContent).not.toContain("currentPasswordInvalid");
    expect(toasts.error).toEqual([]);
    expect(closed).toBe(true);
  });
});
