// 사용자가 데스크톱·태블릿에서 본 "위아래 여백이 다르다" 는 헤더 py 18 vs footer py 14 였다
// (2026-09-16 실측). 여백은 **구역**(헤더·본문·footer)이 갖고 — 본문만 스크롤해야 해서 셋을
// 한 덩어리로 묶을 수 없다 — 대신 헤더 위와 footer 아래가 같은 값이어야 한다.
// 컨테이너로 여백을 몰아 봤다가(#393) 좌우가 넓고 위아래가 좁아져 되돌렸다.
//
// 같은 이유로 확인창(AlertDialog)과 대화상자(Dialog)의 폭·여백이 같아야 한다 — 한 화면에
// 둘 다 뜨는 자리가 있다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
const remount = () => {
  act(() => root.unmount());
  root = createRoot(container);
};

const classes = (el: Element) => Array.from(el.classList);
/** tailwind padding 유틸(p-/px-/py-/pt-…) 이 하나라도 붙어 있나. */
const hasPadding = (el: Element) =>
  classes(el).some((c) => /^p[xytblrse]?-/.test(c));
const has = (el: Element, c: string) => classes(el).includes(c);

const SIZES = ["sm", "md", "lg"] as const;
const part = (id: string) => document.querySelector(`[data-testid="${id}"]`)!;

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

function renderAlert(size: (typeof SIZES)[number]) {
  render(
    <AlertDialog open>
      <AlertDialogContent size={size}>
        <AlertDialogHeader data-testid="head">
          <AlertDialogTitle>제목</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody data-testid="body">
          <AlertDialogDescription>본문</AlertDialogDescription>
        </AlertDialogBody>
        <AlertDialogFooter data-testid="foot">
          <button type="button">확인</button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  return document.querySelector('[role="alertdialog"]')!;
}

/** `w-[520px]` · `[--dialog-max-w:520px]` 어느 쪽이든 폭 숫자만 꺼낸다. */
const widthOf = (el: Element) => {
  const m = classes(el)
    .join(" ")
    .match(/(?:w-\[|--dialog-max-w:)(\d+)px/);
  return m?.[1] ?? null;
};

/** 헤더 위 = footer 아래 · 본문 22 — 두 계열이 같은 규격을 지나는지. */
function expectSectionPadding(content: Element) {
  // 컨테이너는 여백을 갖지 않는다.
  expect(hasPadding(content), "컨테이너가 padding 을 들고 있다").toBe(false);
  // 헤더와 footer 는 같은 값 — 위아래가 갈리면 안 된다.
  for (const id of ["head", "foot"]) {
    expect(has(part(id), "px-[22px]"), `${id} 좌우 22`).toBe(true);
    expect(has(part(id), "py-[18px]"), `${id} 위아래 18`).toBe(true);
  }
  // 본문은 사방 22 + 여기서만 스크롤한다.
  expect(has(part("body"), "p-[22px]")).toBe(true);
  expect(has(part("body"), "overflow-y-auto")).toBe(true);
}

describe("대화상자 여백은 구역이 갖는다", () => {
  it.each(SIZES)("Dialog %s — 헤더 위 18 = footer 아래 18", (size) => {
    expectSectionPadding(renderDialog(size));
  });

  it.each(SIZES)("AlertDialog %s — 같은 규격이다", (size) => {
    expectSectionPadding(renderAlert(size));
  });
});

describe("확인창과 대화상자의 폭", () => {
  it.each(SIZES)("%s — 같은 값이다", (size) => {
    const dialogWidth = widthOf(renderDialog(size));
    remount();
    const alertWidth = widthOf(renderAlert(size));
    expect(dialogWidth).not.toBeNull();
    expect(alertWidth).toBe(dialogWidth);
  });
});
