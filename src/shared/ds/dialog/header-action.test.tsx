// 머리 오른쪽 동작(headerAction) — 자리 · 사이 4 · 제목이 남은 폭에서 줄을 바꿈 · 초점 차례(제목 → 동작 → 닫기)
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Button } from "@/shared/ds/button";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
} from "./dialog";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
let wide = false;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  window.history.replaceState(null, "");
  window.matchMedia = ((query: string) => ({
    matches: wide && query.includes("1280px"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 50));
});

const mount = (form: boolean) =>
  act(() =>
    root.render(
      <ResponsiveDialog form={form} defaultOpen>
        <ResponsiveDialogContent
          title="아주 긴 제목 카페·간식·디저트 모임 카테고리 수정"
          headerAction={
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              size="small"
              aria-label="교통 더보기"
            >
              ⋮
            </Button>
          }
        >
          <ResponsiveDialogBody>본문</ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>,
    ),
  );
const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;

describe("시트 머리 동작", () => {
  it("닫기 단추 왼쪽 사이 4(right 56 = 24 + 28 + 4) · 36 상자 · 제목이 그 폭을 비운다", () => {
    wide = false;
    mount(true);
    const box = q("[data-slot=bottom-sheet-header-action]");
    expect(box.className).toContain("1.75rem"); // 닫기 28(rem) 왼쪽 사이 4
    expect(box.className).toContain("-translate-y-1/2");
    expect(q("[data-slot=bottom-sheet-title]").className).toContain(
      "pr-[calc(var(--spacing-x10)+var(--spacing-x1)+2.25rem)]",
    );
  });

  it("초점 차례는 제목 → 동작 → 닫기(DOM 차례)", () => {
    wide = false;
    mount(true);
    const title = q("[data-slot=bottom-sheet-title]");
    const action = q("[data-slot=bottom-sheet-header-action] button");
    const close = q("[data-slot=bottom-sheet-close]");
    const pos = (a: Node, b: Node) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(pos(title, action)).toBeTruthy();
    expect(pos(action, close)).toBeTruthy();
  });
});

describe("대화상자 머리 동작", () => {
  it("입력 폼(닫기 단추 없음)이면 오른쪽 끝", () => {
    wide = true;
    mount(true);
    expect(document.querySelector("[data-slot=dialog-close]")).toBeNull();
    expect(q("[data-slot=dialog-header-action]").className).toContain(
      "right-x4",
    );
    expect(q("[data-slot=dialog-header]").className).toContain(
      "pr-[calc(var(--spacing-x4)+2.25rem+var(--spacing-x2))]",
    );
  });

  it("조회 대화상자(닫기 있음)면 닫기 왼쪽 사이 4 · 초점 차례 제목 → 동작 → 닫기", () => {
    wide = true;
    mount(false);
    const box = q("[data-slot=dialog-header-action]");
    expect(box.className).toContain("right-[calc(var(--spacing-x6)+22px");
    const title = q("[data-slot=dialog-title]");
    const close = q("[data-slot=dialog-close]");
    const pos = (a: Node, b: Node) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(pos(title, box)).toBeTruthy();
    expect(pos(box, close)).toBeTruthy();
  });
});
