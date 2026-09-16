// 삭제 확인창은 손으로 만든 footer 라 버튼 크기를 안 적었고, 그래서 구현 기본값
// 36(좌우 16·14px)이 나왔다 — 같은 화면의 표준 footer 는 40(좌우 12·15px)이다
// (데스크톱·태블릿 실측 2026-09-16). 취소도 ghost 라 배경이 없었다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let device: "mobile" | "tablet" | "desktop" = "desktop";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("@/shared/lib/porest/responsive", () => ({
  useDeviceSize: () => device,
}));

const { ConfirmDialog } = await import("@/shared/ui/porest/dialogs");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  device = "desktop";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (node: ReactNode) => act(() => root.render(node));
/** 확인창은 포털로 나가므로 document 전체에서 찾는다. */
const byText = (s: string) =>
  Array.from(document.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(s),
  )!;

const confirm = (extra: Record<string, unknown> = {}) =>
  render(
    <ConfirmDialog
      title="삭제"
      message="지울까요?"
      confirmLabel="삭제"
      cancelLabel="취소"
      onCancel={() => {}}
      onConfirm={() => {}}
      {...extra}
    />,
  );

describe("삭제 확인창 footer — 데스크탑·태블릿", () => {
  it("버튼은 md(40 · 좌우 12 · 15px) 다 — 표준 footer 와 같은 크기", () => {
    confirm();
    for (const label of ["취소", "삭제"]) {
      const b = byText(label);
      expect(b.classList, label).toContain("h-10");
      expect(b.classList, label).toContain("px-3");
      expect(b.classList, label).toContain("text-body-md");
    }
  });

  it("취소는 회색 채움(secondary)이다", () => {
    confirm();
    expect(byText("취소").classList).toContain("bg-secondary");
  });

  it("danger 면 확정은 솔리드 danger", () => {
    confirm({ danger: true });
    expect(byText("삭제").classList).toContain("bg-destructive");
  });
});

describe("모바일은 그대로다", () => {
  it("lg(48)", () => {
    device = "mobile";
    confirm();
    expect(byText("취소").classList).toContain("h-12");
    expect(byText("삭제").classList).toContain("h-12");
  });
});
