// 모바일 알림 화면에서 '알림 설정 ›' 는 **바닥에 고정**이고 가운데 목록만 스크롤한다
// (사용자 신고 2026-09-14 — 알림 5개 바로 아래에 붙어 같이 흘러간다).
//
// 원래 코드는 바깥을 통째로 `m-scroll`(flex:1 + overflow-y:auto) 로 두고 그 안에
// unreadSub · body · footer 를 나란히 넣었다. 주석은 "본문 스크롤 후 footer 고정"
// 이라고 적혀 있었지만 실제로는 footer 도 스크롤 대상이었다.
//
// jsdom 에는 레이아웃이 없어 "스크롤해도 dy 가 안 변한다" 를 직접 못 잰다. 대신
// **그 증상을 만드는 구조**를 잠근다 — footer 가 스크롤 컨테이너의 자손이면 반드시
// 같이 흘러간다. 그래서 "footer 는 스크롤 박스 바깥" 을 단언한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let mobile = true;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "ko" },
  }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => () => {},
  useOutletContext: () => ({ onAddTx: () => {}, mobile }),
}));

const rows = Array.from({ length: 20 }, (_, i) => ({
  rowId: i + 1,
  title: `알림 ${i + 1}`,
  content: "내용",
  isRead: i > 2,
  createdAt: "2026-09-14T00:00:00",
  type: "BUDGET",
}));

vi.mock("@/features/notification", () => ({
  useNotifications: () => ({ data: rows, isLoading: false }),
  useUnreadCount: () => ({ data: 3 }),
  useMarkRead: () => ({ mutate: () => {}, pendingIds: new Set<number>() }),
  useMarkAllRead: () => ({ mutate: () => {}, isPending: false }),
  useDeleteNotification: () => ({ mutate: () => {} }),
}));

vi.mock("@/shared/hooks", () => ({
  useNow: () => new Date("2026-09-14T01:00:00"),
}));

vi.mock("@/entities/notification", () => ({
  NotificationRow: ({ notification }: { notification: { title: string } }) => (
    <div className="notif-row">{notification.title}</div>
  ),
}));

vi.mock("@/shared/ui/porest/mobile-back-header", () => ({
  MobileBackHeader: ({ trailing }: { trailing?: unknown }) => (
    <div data-testid="back-header">{trailing as never}</div>
  ),
}));

const { NotificationsPage } = await import("./NotificationsPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => root.render(<NotificationsPage />));
}

/** '알림 설정' 버튼을 감싼 바깥 div — footer 상자. */
function footerBox(): HTMLElement {
  const btn = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("prefs.title"),
  );
  expect(btn, "'알림 설정' 버튼을 못 찾았다").toBeTruthy();
  return btn!.closest("div[style]") as HTMLElement;
}

describe("모바일 알림 — footer 고정", () => {
  beforeEach(() => {
    mobile = true;
  });

  it("footer 가 스크롤 컨테이너 바깥에 있다", () => {
    render();
    const scroll = container.querySelector(".notif-mobile__body");
    expect(scroll, "목록 스크롤 상자가 없다").toBeTruthy();
    // 여기서 깨지면 footer 가 목록 끝에 붙어 같이 흘러간다.
    expect(scroll!.contains(footerBox())).toBe(false);
  });

  it("행 20개가 전부 스크롤 상자 안에 있다", () => {
    render();
    const scroll = container.querySelector(".notif-mobile__body")!;
    expect(scroll.querySelectorAll(".notif-row")).toHaveLength(20);
    // 바깥에 샌 행이 없어야 한다.
    expect(container.querySelectorAll(".notif-row")).toHaveLength(20);
  });

  it("바깥은 세로 flex — 목록만 늘어나고 footer 는 자기 높이만 갖는다", () => {
    render();
    const shell = container.querySelector(".notif-mobile");
    expect(shell, "flex 셸이 없다").toBeTruthy();
    // 스크롤 상자는 셸의 자식이고, footer 도 셸의 자식이다(형제).
    expect(shell!.contains(footerBox())).toBe(true);
    expect(footerBox().parentElement).toBe(shell);
  });

  it("footer 가 하단 인셋을 보상한다 — 홈 인디케이터에 안 가린다", () => {
    render();
    expect(footerBox().style.paddingBottom).toContain("safe-area-inset-bottom");
  });
});

describe("데스크탑은 종전 그대로", () => {
  beforeEach(() => {
    mobile = false;
  });

  it("모바일 전용 셸을 쓰지 않는다", () => {
    render();
    expect(container.querySelector(".notif-mobile")).toBeNull();
    // 데스크탑 popover 는 좁아서 행 여백 18 을 유지한다 — 모바일 클래스가 붙으면 안 된다.
    expect(container.querySelector(".notif-mobile__body")).toBeNull();
  });

  it("하단 인셋 보상은 모바일에만 붙는다", () => {
    render();
    expect(footerBox().style.paddingBottom).toBe("");
  });
});
