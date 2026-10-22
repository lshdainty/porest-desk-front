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
const mutate = vi.fn((_v: unknown, opts?: { onSettled?: () => void }) => {
  settle = opts?.onSettled ?? null;
});
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
});
