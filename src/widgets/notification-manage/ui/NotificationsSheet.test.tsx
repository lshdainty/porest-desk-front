// 1280 미만 데스크톱의 알림 Bottom Sheet — 제목 · 목록 · 바닥("알림 설정") · 닫기.
// 모양(바닥에 붙음 · 짧으면 내용 높이 · 긴 목록은 목록만 스크롤)은 크로미움에서 1 · 5 · 1234건으로 봤고,
// 여기서는 구성과 동작을 고정한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock("@/features/notification", () => ({
  useNotifications: () => ({ data: state.items, isLoading: false }),
  useMarkRead: () => ({ mutate: vi.fn(), pendingIds: new Set() }),
  useMarkAllRead: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/shared/hooks", () => ({ useNow: () => new Date() }));
vi.mock("@/entities/notification", () => ({
  NotificationRow: ({ notification }: { notification: { title: string } }) => (
    <div data-testid="row">{notification.title}</div>
  ),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { NotificationsSheet } = await import("./NotificationsPopover");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  state.items = [1, 2, 3].map((i) => ({
    rowId: i,
    title: `알림 ${i}`,
    isRead: false,
  }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

const sheet = () => document.querySelector<HTMLElement>("[role=dialog]");

describe("NotificationsSheet", () => {
  it("제목 · 목록 · 바닥이 한 시트 안에 있고 바닥이 맨 끝이다", () => {
    act(() =>
      root.render(
        <NotificationsSheet onClose={() => {}} onGoSettings={() => {}} />,
      ),
    );
    const el = sheet()!;
    expect(el.textContent).toContain("title");
    expect(el.querySelectorAll("[data-testid=row]")).toHaveLength(3);
    // 시트의 마지막 자식이 "알림 설정" 줄 — 목록을 스크롤해도 바닥에 붙는다
    const last = el.lastElementChild as HTMLElement;
    expect(last.textContent).toContain("prefs.title");
    // 목록은 스크롤 본문 안, 바닥은 그 밖이다
    const body = el.querySelector("[data-slot=bottom-sheet-body]")!;
    expect(body.contains(last)).toBe(false);
    expect(body.querySelectorAll("[data-testid=row]")).toHaveLength(3);
  });

  it("끝 흐림(아래 여백 80)을 걸지 않는다 — 짧은 목록 아래가 비지 않는다", () => {
    act(() => root.render(<NotificationsSheet onClose={() => {}} />));
    const body = document.querySelector("[data-slot=bottom-sheet-body]")!;
    expect(body.getAttribute("data-scroll-fog")).toBeNull();
  });

  it("바닥의 알림 설정을 누르면 닫고 설정으로 간다", () => {
    const onClose = vi.fn();
    const onGoSettings = vi.fn();
    act(() =>
      root.render(
        <NotificationsSheet onClose={onClose} onGoSettings={onGoSettings} />,
      ),
    );
    const settings = [...sheet()!.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("prefs.title"),
    )!;
    act(() => settings.click());
    expect(onClose).toHaveBeenCalled();
    expect(onGoSettings).toHaveBeenCalled();
  });

  it("닫기 버튼을 누르면 onClose", () => {
    const onClose = vi.fn();
    act(() => root.render(<NotificationsSheet onClose={onClose} />));
    const close = sheet()!.querySelector<HTMLButtonElement>(
      "[data-slot=bottom-sheet-close]",
    );
    expect(close).not.toBeNull();
    act(() => close!.click());
    expect(onClose).toHaveBeenCalled();
  });
});
