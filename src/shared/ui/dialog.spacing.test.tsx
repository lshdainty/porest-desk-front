// 사용자가 데스크톱·태블릿에서 본 "위아래 여백이 다르다" 는 헤더 py 18 vs footer py 14 였다
// (2026-09-16 실측). 구역마다 제 padding 을 들고 있는 한 다시 갈린다 — 여백은 컨테이너
// 한 곳에서만 준다는 규칙을 여기서 잠근다. 같은 이유로 확인창(AlertDialog)과 대화상자
// (Dialog)의 폭이 사이즈별로 같아야 한다 — 한 화면에 둘 다 뜨는 자리가 있다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

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

const render = (node: ReactNode) => act(() => root.render(node));

/** tailwind padding 유틸(p-/px-/py-/pt-…) 이 하나라도 붙어 있나. */
const hasPadding = (el: Element) =>
  Array.from(el.classList).some((c) => /^p[xytblrse]?-/.test(c));

const SIZES = ["sm", "md", "lg"] as const;

function renderDialog(size: (typeof SIZES)[number]) {
  render(
    <Dialog open>
      <DialogContent size={size}>
        <DialogHeader data-testid="head">
          <DialogTitle>제목</DialogTitle>
        </DialogHeader>
        <DialogBody data-testid="body">본문</DialogBody>
        <DialogFooter data-testid="foot">
          <button type="button">저장</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
  return document.querySelector('[role="dialog"]')!;
}

/** `w-[520px]` · `[--dialog-max-w:520px]` 어느 쪽이든 폭 숫자만 꺼낸다. */
const widthOf = (el: Element) => {
  const cls = Array.from(el.classList).join(" ");
  const m = cls.match(/(?:w-\[|--dialog-max-w:)(\d+)px/);
  return m?.[1] ?? null;
};

describe("대화상자 여백", () => {
  it.each(SIZES)("%s — 여백은 컨테이너 하나가 준다", (size) => {
    const content = renderDialog(size);
    // 컨테이너가 사방 균일 padding 을 든다 — px/py 로 갈라 두면 상하가 다시 어긋난다.
    expect(
      Array.from(content.classList).some((c) =>
        /^p-\[var\(--spacing-(xl|2xl)\)\]$/.test(c),
      ),
    ).toBe(true);
    // 구역 사이는 gap 으로 띄운다.
    expect(content.classList.contains("gap-[var(--spacing-md)]")).toBe(true);

    for (const id of ["head", "body", "foot"]) {
      const el = document.querySelector(`[data-testid="${id}"]`)!;
      expect(hasPadding(el), `${id} 가 제 padding 을 들고 있다`).toBe(false);
    }
  });

  it("sm 은 24, md·lg 는 32", () => {
    expect(renderDialog("sm").classList).toContain("p-[var(--spacing-xl)]");
    act(() => root.unmount());
    root = createRoot(container);
    expect(renderDialog("md").classList).toContain("p-[var(--spacing-2xl)]");
  });
});

describe("확인창과 대화상자의 폭", () => {
  it.each(SIZES)("%s — 같은 값이다", (size) => {
    const dialogWidth = widthOf(renderDialog(size));
    act(() => root.unmount());
    root = createRoot(container);
    render(
      <AlertDialog open>
        <AlertDialogContent size={size}>
          <AlertDialogTitle>제목</AlertDialogTitle>
          <AlertDialogDescription>본문</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const alertWidth = widthOf(document.querySelector('[role="alertdialog"]')!);
    expect(dialogWidth).not.toBeNull();
    expect(alertWidth).toBe(dialogWidth);
  });
});
