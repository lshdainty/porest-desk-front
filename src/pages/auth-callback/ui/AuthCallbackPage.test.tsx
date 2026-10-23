// 로그인 콜백 — 기다리는 원은 ds ProgressCircle 40 neutral(I-05 12). 시간표: 1초 전엔 원이 없고, 1초에 이름 있는 원,
// 5초에 원 아래 "평소보다 오래 걸리고 있어요.". 보이는 글 "인증 중…" 은 걷었다(이름으로만 남는다).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));
vi.mock("@/features/auth", () => ({
  useAuth: () => ({ exchangeCode: vi.fn() }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { AuthCallbackPage } = await import("./AuthCallbackPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/auth/callback"]}>
        <AuthCallbackPage />
      </MemoryRouter>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const circle = () => container.querySelector("[role=progressbar]");
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("로그인 콜백 기다림(12)", () => {
  it("바탕은 로그인과 같은 흰 면(bg-layer-default)이다 — 회색 콜백이 끼지 않는다", () => {
    const root = container.firstElementChild!;
    expect(root.className).toContain("bg-bg-layer-default");
  });

  it("1초 전에는 원이 없다", () => {
    expect(circle()).toBeNull();
    tick(999);
    expect(circle()).toBeNull();
  });

  it("1초 뒤에는 role 과 이름(login:authenticating)이 있는 원이 있다 — 보이는 글은 없다", () => {
    tick(1000);
    const c = circle()!;
    expect(c).not.toBeNull();
    expect(c.getAttribute("aria-label")).toBe("authenticating");
    expect(c.getAttribute("aria-valuenow")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("5초에 원 아래 안내 글이 한 줄 뜬다", () => {
    tick(4999);
    expect(container.querySelector("p")).toBeNull();
    tick(1);
    expect(container.querySelector("p")?.textContent).toBe(
      "평소보다 오래 걸리고 있어요.",
    );
  });

  it("코드가 없으면 로그인으로 돌려보낸다 — 실패 갈래는 그대로", () => {
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
