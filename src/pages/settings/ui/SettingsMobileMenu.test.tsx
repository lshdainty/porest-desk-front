// 설정 메뉴(폰) = 흰 면 하나(I-12 5 ~ 9 · 11 · 12) — 실제 화면을 띄워 잠근다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
}));
const user = vi.hoisted(() => ({
  state: {
    data: { userName: "숲빛", userEmail: "a-very-long-address@example.com" },
    isLoading: false,
  } as { data?: { userName: string; userEmail: string }; isLoading: boolean },
}));
vi.mock("@/features/user", () => ({ useCurrentUser: () => user.state }));

const { SettingsMobileMenu } = await import("./SettingsMobileMenu");

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

const mount = (changeSection = vi.fn(), openSection = vi.fn()) => {
  act(() =>
    root.render(
      <MemoryRouter>
        <SettingsMobileMenu
          changeSection={changeSection}
          openSection={openSection}
          goBack={() => {}}
        />
      </MemoryRouter>,
    ),
  );
  return { changeSection, openSection };
};

describe("SettingsMobileMenu", () => {
  it("묶음 제목은 h2, 줄은 List 이고 줄마다 앞 아이콘이 있다", () => {
    mount();
    const heads = [...container.querySelectorAll("h2")];
    expect(heads).toHaveLength(7);
    expect(container.querySelector("h1")?.textContent).toBe("page.title");
    const rows = container.querySelectorAll("ul [data-slot=list-item]");
    // 계정 줄 1 + 메뉴 줄 16
    expect(rows).toHaveLength(17);
    for (const r of [...rows].slice(1))
      expect(r.querySelector("[data-slot=list-prefix] svg")).not.toBeNull();
    // 묶음 목록은 제목과 이어진다
    const lists = container.querySelectorAll("ul[aria-labelledby]");
    expect(lists).toHaveLength(7);
  });

  it("계정 줄은 Avatar 42 + 이메일이고, 누르면 계정 화면으로 간다", () => {
    const { changeSection } = mount();
    const av = container.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(av.className).toContain("size-[42px]");
    expect(container.textContent).toContain("a-very-long-address@example.com");
    act(() => {
      (
        container.querySelector("[data-list-action]") as HTMLButtonElement
      ).click();
    });
    expect(changeSection).toHaveBeenCalledWith("account");
  });

  it("바깥 주소 줄은 새 탭 링크이고 이름에 새 탭이 붙는다", () => {
    mount();
    const links = [...container.querySelectorAll("a[target=_blank]")];
    expect(links).toHaveLength(2);
    for (const a of links) {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
      expect(a.textContent).toContain("newTab");
    }
  });

  it("받는 동안은 Skeleton 줄, 정보가 없으면 계정 줄을 숨긴다", () => {
    user.state = { data: undefined, isLoading: true };
    mount();
    expect(container.querySelector("[data-account-skeleton]")).not.toBeNull();
    act(() => root.unmount());
    root = createRoot(container);
    user.state = { data: undefined, isLoading: false };
    mount();
    expect(container.querySelector("[data-account-skeleton]")).toBeNull();
    expect(container.querySelectorAll("[data-slot=avatar]")).toHaveLength(0);
  });

  it("손 불투명도로 누름을 알리지 않는다(opacity 0.55 · 0.7 걷음)", () => {
    mount();
    for (const b of container.querySelectorAll("button"))
      expect(b.getAttribute("style") ?? "").not.toContain("opacity");
  });
});
