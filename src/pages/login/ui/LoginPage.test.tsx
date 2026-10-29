// 로그인 화면 — 마크는 가로 묶음(나무 56 + 사이 8 + 이름 글)이다(로고 결정 5A, I-05 86).
// 이름 글은 화면 제목(h1 하나) · 안내는 R2 부제 · 버튼은 ds Button large neutralSolid 전체 폭(I-05 5 · 6 · 7).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("@/shared/api", () => ({ hasToken: () => false }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { LoginPage } = await import("./LoginPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("로그인 마크(86)", () => {
  it("나무 56 이 이름 글 옆(가로)에 있고 사각 4단 마크가 아니다", () => {
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("147 183 154 166");
    expect(svg.getAttribute("height")).toBe("56");
    expect(svg.querySelectorAll("path")).toHaveLength(4);
    expect(svg.querySelector("rect")).toBeNull();
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    const row = svg.parentElement!;
    expect(row.className).toContain("gap-x2");
    expect(row.className).not.toContain("flex-col");
    expect(row.textContent).toBe("app.title");
  });
});

describe("로그인 화면 이름 · 부제 · 버튼(5 · 6 · 7)", () => {
  it("화면 제목 h1 이 하나이고 번역 문구(common:app.title)다 — 코드에 한국어 상수가 없다", () => {
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    // 번역 mock 이 키를 그대로 돌려준다 — 키가 보이면 t() 를 거친 것이다
    expect(h1s[0]?.textContent).toBe("app.title");
  });

  it("이름 글은 t12 역할 · 줄 높이 40 · 자간 -0.32px 이다(앱 groo_wordmark 와 같음, 옛 display-md 아님)", () => {
    const h1 = container.querySelector("h1")!;
    expect(h1.className).toContain("text-t12");
    expect(h1.style.fontSize).toBe("");
    expect(h1.style.lineHeight).toBe("1.25");
    expect(h1.style.letterSpacing).toBe("-0.32px");
  });

  it("안내 글은 t5 · fg-neutral-muted 부제다(옛 text-muted-foreground 아님)", () => {
    const p = container.querySelector("p")!;
    expect(p.textContent).toBe("sso.description");
    expect(p.className).toContain("text-t5");
    expect(p.className).toContain("text-fg-neutral-muted");
    expect(p.className).not.toContain("text-muted-foreground");
  });

  it("버튼은 ds Button large 48 · neutralSolid · 전체 폭이고 누르기 전엔 로딩이 아니다", () => {
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("sso.login");
    expect(button.className).toContain("min-h-[48px]");
    expect(button.className).toContain("bg-bg-neutral-inverted");
    expect(button.className).toContain("w-full");
    expect(button.getAttribute("aria-busy")).not.toBe("true");
    expect(button.getAttribute("data-slot")).not.toBe("spinner");
  });

  it("바닥은 셸 밖 흰 면(bg-layer-default)이다", () => {
    expect(container.firstElementChild?.className).toContain(
      "bg-bg-layer-default",
    );
  });
});

describe("로그인 간격은 px 토큰이다(6) — 글자 200% 에서 커지지 않는다", () => {
  it("Tailwind 숫자(rem) 간격 클래스가 없다", () => {
    const html = container.innerHTML;
    expect(html).not.toMatch(/(?:^|[\s"])(?:gap|p|px|py|m|mx|my)-[1-9]/);
    for (const c of ["p-x6", "gap-x8", "gap-x2", "max-w-[384px]"])
      expect(html).toContain(c);
  });
});
