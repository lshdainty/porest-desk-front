// 금액 보기 인증 본문(I-14 43 · I-17 21) — 오류 판정: 틀린 비밀번호 코드(USER_004)만 "일치하지 않아요", 나머지는 다시 시도를 부탁한다.
// 서버 글은 화면에 내지 않는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const server = vi.hoisted(() => ({
  fail: null as null | { code?: string; message?: string },
  calls: [] as string[],
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/user", () => ({
  useVerifyPasswordMutation: () => ({
    isPending: false,
    mutate: (
      pw: string,
      o: { onSuccess: () => void; onError: (e: unknown) => void },
    ) => {
      server.calls.push(pw);
      if (server.fail) o.onError({ response: { data: server.fail } });
      else o.onSuccess();
    },
  }),
}));

const { HideAmountsUnlockFields } = await import("./HideAmountsUnlockBody");
const { useHideAmountsUnlock } = await import("./use-hide-amounts-unlock");

let container: HTMLDivElement;
let root: Root;
let verified = 0;

function Probe() {
  const unlock = useHideAmountsUnlock({ onVerified: () => (verified += 1) });
  return (
    <>
      <HideAmountsUnlockFields unlock={unlock} />
      <button type="button" data-submit onClick={unlock.submit} />
    </>
  );
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  server.fail = null;
  server.calls = [];
  verified = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Probe />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const input = () => document.querySelector<HTMLInputElement>("input")!;
function type(value: string) {
  const set = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    set.call(input(), value);
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const submit = () =>
  act(() =>
    document
      .querySelector("[data-submit]")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );

describe("금액 보기 인증 본문", () => {
  it("비밀번호 칸은 current-password 자동 완성 · 밑줄형이고 설명이 위에 있다", () => {
    expect(input().type).toBe("password");
    expect(input().autocomplete).toBe("current-password");
    expect(document.body.textContent).toContain("hideAmounts.unlockDesc");
  });

  it("맞으면 확인됐다고 알린다", () => {
    type("secret");
    submit();
    expect(server.calls).toEqual(["secret"]);
    expect(verified).toBe(1);
  });

  it("비어 있어도 단추는 눌린다 — 보내지 않고 칸 아래에 알린다", () => {
    submit();
    expect(server.calls).toEqual([]);
    expect(document.body.textContent).toContain("hideAmounts.passwordRequired");
  });

  it("USER_004 는 '일치하지 않아요', 서버 글은 내지 않고 칸을 비운다", () => {
    server.fail = { code: "USER_004", message: "서버가 준 글" };
    type("wrong");
    submit();
    const text = document.body.textContent ?? "";
    expect(text).toContain("hideAmounts.passwordError");
    expect(text).not.toContain("서버가 준 글");
    expect(input().value).toBe("");
    expect(verified).toBe(0);
  });

  it("그 밖의 실패는 다시 시도를 부탁한다", () => {
    server.fail = { code: "COMMON_500", message: "내부 오류" };
    type("x");
    submit();
    const text = document.body.textContent ?? "";
    expect(text).toContain("hideAmounts.verifyFailed");
    expect(text).not.toContain("내부 오류");
  });
});
