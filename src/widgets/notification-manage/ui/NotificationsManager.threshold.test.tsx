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

const mut = vi.hoisted(() => ({
  isError: false,
  variables: null as Record<string, unknown> | null,
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
  useUpdateUserPreferences: () => ({
    mutate,
    isPending: false,
    isError: mut.isError,
    variables: mut.variables,
  }),
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
    // Field 오류 꼴 — 보이는 글은 숨기고 polite 로 한 번 읽힌다(alert 아님), circle-alert 16 이 앞에, 손잡이가 설명으로 이음
    expect(error()!.getAttribute("role")).toBeNull();
    expect(error()!.getAttribute("aria-hidden")).toBe("true");
    expect(error()!.textContent).toBe("saveError");
    expect(error()!.querySelector("svg")?.getAttribute("width")).toBe("16");
    expect(thumb().getAttribute("aria-describedby")).toBe(error()!.id);
    expect(container.querySelector("[aria-live=polite]")?.textContent).toBe(
      "saveError",
    );
    // 트랙 · 눈금 글(50 … 100) 아래 — 눈금과 트랙 사이에 끼지 않는다
    const ticks = Array.from(container.querySelectorAll("span")).find(
      (e) => e.textContent === "100",
    )!.parentElement!;
    expect(
      ticks.compareDocumentPosition(error()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // 같은 글이 화면 맨 아래에 한 번 더 뜨지 않는다(보이는 곳 한 곳)
    expect(container.querySelectorAll("[data-slot=field-error]")).toHaveLength(
      1,
    );
    // 기준 저장이 실패한 뒤 다른 설정이 실패하면 화면 아래 오류 글이 맡는다(숨지 않는다)
    mut.isError = true;
    mut.variables = { pushEnabled: false };
    act(() => root.render(<NotificationsManager mobile={false} />));
    expect(error()).toBeNull();
    expect(container.textContent).toContain("saveError");
    mut.isError = false;
    mut.variables = null;
    act(() => root.render(<NotificationsManager mobile={false} />));
    expect(error()).not.toBeNull();
    // 다시 끌면 오류 글이 걷힌다
    press();
    expect(error()).toBeNull();
  });
});
