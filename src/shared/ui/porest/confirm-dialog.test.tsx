// 삭제 확인창은 손으로 만든 footer 라 버튼 크기를 안 적었고, 취소도 ghost 라 배경이 없었다
// (데스크톱·태블릿 실측 2026-09-16). 크기는 표준 footer 와 같은 `default`
// (36 · 좌우 양쪽 16 · 14px)로 못 박는다 — 40 으로 올려 봤다가 대화상자에 비해 굵어 되돌렸다.
//
// 그리고 같은 "삭제 확인" 이 두 계열로 갈려 있었다 — 22곳은 Dialog 위에 얹은
// ConfirmDialog(ESC·overlay 로 닫힘), 3곳은 손수 만든 AlertDialog. 확인창은
// **버튼으로만 닫히고 기본 포커스가 취소** 여야 한다(spec alert-dialog.md Behavior).
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
  it("버튼은 default(36 · 좌우 양쪽 16 · 14px) 다 — 표준 footer 와 같은 크기", () => {
    confirm();
    for (const label of ["취소", "삭제"]) {
      const b = byText(label);
      expect(b.classList, label).toContain("h-9");
      expect(b.classList, label).toContain("px-4");
      expect(b.classList, label).toContain("text-sm");
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

describe("파괴적 확정은 버튼으로만 닫는다", () => {
  it("alertdialog 다 — 화면 낭독기가 확정 창으로 읽는다", () => {
    confirm();
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    // Dialog 계열로 남아 있으면 안 된다.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("ESC 로는 안 닫힌다 — 취소를 눌러야 한다", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="삭제"
        message="지울까요?"
        confirmLabel="삭제"
        cancelLabel="취소"
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    act(() => {
      // cancelable 를 빼면 preventDefault 가 통하지 않아 브라우저와 다른 결과가 나온다.
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(onCancel).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();

    act(() => byText("취소").click());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("기본 포커스는 취소다 — Enter 를 무심코 눌러도 삭제되지 않는다", () => {
    confirm();
    expect(document.activeElement).toBe(byText("취소"));
  });

  it("취소가 없는 통지형은 확인이 그 자리를 대신한다", () => {
    render(
      <ConfirmDialog
        title="삭제 불가"
        message="자식이 있어요."
        confirmLabel="확인"
        singleAction
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(document.activeElement).toBe(byText("확인"));
  });

  it("확정을 눌러도 창은 호출처가 닫는다 — 스피너가 뜨는 동안 열려 있어야 한다", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="삭제"
        message="지울까요?"
        confirmLabel="삭제"
        cancelLabel="취소"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    act(() => byText("삭제").click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    // 확정이 취소까지 부르면 호출처가 상태를 지워 스피너가 사라진다.
    expect(onCancel).not.toHaveBeenCalled();
  });
});
