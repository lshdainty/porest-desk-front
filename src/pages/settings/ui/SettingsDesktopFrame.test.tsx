// 데스크톱 왼쪽 목록의 고른 칸 판정(I-12 35) — 숨은 칸(기기)에서 부모 "계정" 이 켜지고 aria-current 가 붙는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SECTIONS, type SectionId } from "../model/sections";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/shared/ui/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

const { SettingsDesktopFrame } = await import("./SettingsDesktopFrame");

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

const current = (section: SectionId) => {
  act(() =>
    root.render(
      <SettingsDesktopFrame
        section={section}
        activeSection={SECTIONS.find((s) => s.id === section) ?? null}
        openSection={() => {}}
        renderBody={() => null}
      />,
    ),
  );
  return [...container.querySelectorAll("aside button")]
    .filter((b) => b.getAttribute("aria-current") === "page")
    .map((b) => b.textContent);
};

describe("SettingsDesktopFrame 고른 칸", () => {
  it("기기 화면에서는 계정 칸이 켜진다", () => {
    expect(current("devices")).toEqual(["sections.account.label"]);
  });
  it("카테고리 화면은 전과 같다(카테고리 하나)", () => {
    expect(current("categories")).toEqual(["sections.categories.label"]);
  });
  it("계정 화면은 계정 하나만 켜진다", () => {
    expect(current("account")).toEqual(["sections.account.label"]);
  });
});
