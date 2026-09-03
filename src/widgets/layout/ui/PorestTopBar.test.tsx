// 데스크톱 상단바의 검색창은 onChange 도 onSubmit 도 없는 장식이었다 — 쳐도 아무 일이
// 안 일어나 고장으로 보였다(QA #49). 모바일 헤더는 이미 준비 중 화면으로 보내고 있었고,
// 여기서 고정하는 건 "데스크톱도 같은 자리로 간다" 와 "치는 시늉을 하지 않는다" 다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("@/features/notification", () => ({
  useUnreadCount: () => ({ data: 0 }),
}));
vi.mock("@/widgets/notification-manage", () => ({
  NotificationsPopover: () => null,
}));
vi.mock("@/shared/lib/porest/hide-amounts-core", () => ({
  useHideAmounts: () => false,
}));
vi.mock("@/shared/lib/porest/hide-amounts-nav", () => ({
  useOpenHideAmountsSettings: () => () => {},
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { PorestTopBar } = await import("./PorestTopBar");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function PathProbe() {
  return <span data-path={useLocation().pathname} />;
}
const currentPath = () =>
  container.querySelector("[data-path]")?.getAttribute("data-path");

function render() {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/desk"]}>
        <PathProbe />
        {/* AppLayout 과 같은 배선 — 상단바의 사이드바 토글은 Provider 안에서만 산다. */}
        <SidebarProvider>
          <PorestTopBar onOpenAdd={() => {}} />
        </SidebarProvider>
      </MemoryRouter>,
    ),
  );
}

const searchInput = () =>
  container.querySelector<HTMLInputElement>(".top__search input")!;

describe("PorestTopBar 검색창", () => {
  it("누르면 검색 화면으로 간다 — 모바일 헤더와 같은 자리", () => {
    render();
    act(() => searchInput().click());
    expect(currentPath()).toBe("/desk/search");
  });

  it("Enter 로도 같은 자리로 간다", () => {
    render();
    const input = searchInput();
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(currentPath()).toBe("/desk/search");
  });

  it("입력칸이 아니다 — 치는 시늉을 하지 않는다", () => {
    render();
    expect(searchInput().readOnly).toBe(true);
  });
});
