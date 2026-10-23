// 로그인 화면 — 마크는 가로 묶음(나무 56 + 사이 8 + 이름 글)이다(로고 결정 5A, I-05 86).
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
    expect(row.textContent).toBe("그루 담다");
  });
});
