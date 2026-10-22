// 예산 경고 기준 — 끄는 동안 머리 "현재 N%" 도 슬라이더와 함께 따라가고, 저장이 끝나면 서버 값으로 돌아온다(slider.yaml 10-09).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  Trans: ({ i18nKey }: { i18nKey?: string }) => i18nKey ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

let settle: (() => void) | null = null;
let fail: (() => void) | null = null;
const mutate = vi.fn(
  (_v: unknown, opts?: { onSettled?: () => void; onError?: () => void }) => {
    settle = opts?.onSettled ?? null;
    fail = opts?.onError ?? null;
  },
);
vi.mock("@/features/user", () => ({
  useUserPreferences: () => ({
    data: { budgetAlertThreshold: 85, pushEnabled: true },
    isLoading: false,
  }),
  useUpdateUserPreferences: () => ({ mutate, isPending: false }),
  useCurrentUser: () => ({ data: { userEmail: "a@example.com" } }),
}));

const { NotificationsManager } = await import("./NotificationsManager");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  mutate.mockClear();
});

const thumb = () => container.querySelector<HTMLElement>("[role=slider]")!;
const head = () =>
  Array.from(container.querySelectorAll("strong")).find((s) =>
    /%$/.test(s.textContent ?? ""),
  )!;

describe("예산 경고 기준 슬라이더", () => {
  it("끄는 동안 머리 값이 따라가고 손을 뗄 때 한 번 저장 — 저장이 끝나면 서버 값으로", () => {
    act(() => root.render(<NotificationsManager mobile={false} />));
    expect(head().textContent).toBe("85%");
    act(() => {
      thumb().focus();
      thumb().dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });
    expect(thumb().getAttribute("aria-valuenow")).toBe("90");
    expect(head().textContent).toBe("90%");
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toEqual({ budgetAlertThreshold: 90 });
    // 저장 중에도 슬라이더는 막히지 않는다
    expect(thumb().hasAttribute("data-disabled")).toBe(false);
    act(() => settle?.());
    expect(head().textContent).toBe("85%");
  });

  it("저장이 실패하면 값을 되돌리고 슬라이더 아래 Field 오류 글로 알린다 — 다시 끌면 사라진다", () => {
    act(() => root.render(<NotificationsManager mobile={false} />));
    const press = () =>
      act(() => {
        thumb().focus();
        thumb().dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
      });
    const error = () =>
      container.querySelector<HTMLElement>("[data-slot=field-error]");
    expect(error()).toBeNull();
    press();
    expect(head().textContent).toBe("90%");
    // 실패 → 서버 값(85)으로 돌아오고 오류 글이 슬라이더 바로 아래에 뜬다
    act(() => {
      fail?.();
      settle?.();
    });
    expect(head().textContent).toBe("85%");
    expect(error()).not.toBeNull();
    expect(error()!.getAttribute("role")).toBe("alert");
    expect(error()!.textContent).toBe("saveError");
    // 같은 글이 화면 맨 아래에 한 번 더 뜨지 않는다(mock 은 isError 를 주지 않아 여기서는 한 곳)
    expect(container.textContent!.split("saveError").length - 1).toBe(1);
    // 다시 끌면 오류 글이 걷힌다
    press();
    expect(error()).toBeNull();
  });
});
