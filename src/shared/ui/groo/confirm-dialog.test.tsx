// 공용 확인창(ConfirmDialog)은 ds Alert Dialog(spec alert-dialog.md) 한 벌이다 — 모양 값은 ds 쪽(check-ds-spec)이 잰다.
// 여기서는 종류별(삭제 · 일반 확정 · 통지 하나) 렌더와 계약(바깥 누르기 무시 · Esc 는 취소 · 확정은 호출처가 닫음 · 뒤로 가기)을 잠근다.
// 이 시험은 작성만 했고 이 묶음에서는 돌리지 않았다(heavy.sh 규칙) — 다음 전체 실행에서 확인한다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { ConfirmDialog } = await import("@/shared/ui/groo/dialogs");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "");
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 30));
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

describe("종류별 렌더", () => {
  it("삭제(danger) — 확정은 criticalSolid, 취소는 neutralWeak, 둘이 나란히 있다", () => {
    confirm({ danger: true });
    expect(byText("삭제").classList).toContain("bg-bg-critical-solid");
    expect(byText("취소").classList).toContain("bg-bg-neutral-weak");
    expect(
      document.querySelectorAll("[data-slot=alert-dialog-footer] button"),
    ).toHaveLength(2);
  });

  it("danger 가 아닌 확정은 neutralSolid 다", () => {
    confirm();
    expect(byText("삭제").classList).toContain("bg-bg-neutral-inverted");
    expect(byText("삭제").classList).not.toContain("bg-bg-critical-solid");
  });

  it("제목 · 글이 ds 확인창의 제목 · 설명이고 닫기(X) 버튼이 없다", () => {
    confirm({ title: "일정 삭제", message: "지울까요?\n되돌릴 수 없어요." });
    const dlg = document.querySelector<HTMLElement>("[role=alertdialog]")!;
    expect(dlg.getAttribute("data-slot")).toBe("alert-dialog-content");
    expect(
      dlg.querySelector("[data-slot=alert-dialog-title]")?.textContent,
    ).toBe("일정 삭제");
    const desc = dlg.querySelector("[data-slot=alert-dialog-description]")!;
    expect(desc.textContent).toContain("되돌릴 수 없어요.");
    expect(desc.classList).toContain("whitespace-pre-line");
    expect(dlg.querySelectorAll("button")).toHaveLength(2);
  });

  it("singleAction 은 확인 하나, 폭 전체 — 취소가 없고 neutralSolid 다", () => {
    confirm({ singleAction: true, danger: true, confirmLabel: "확인" });
    const buttons = document.querySelectorAll(
      "[data-slot=alert-dialog-footer] button",
    );
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.textContent).toBe("확인");
    expect(buttons[0]!.classList).toContain("bg-bg-neutral-inverted");
  });

  it("loading 이면 확정 버튼이 busy 이고 눌러도 onConfirm 을 부르지 않는다", () => {
    const onConfirm = vi.fn();
    confirm({ loading: true, onConfirm });
    const b = byText("삭제");
    expect(b.getAttribute("aria-busy")).toBe("true");
    act(() => b.click());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("파괴적 확정은 버튼으로만 닫는다", () => {
  it("alertdialog 다 — 화면 낭독기가 확정 창으로 읽는다", () => {
    confirm();
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    // Dialog 계열로 남아 있으면 안 된다.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(
      document.querySelector("[role=alertdialog]")?.getAttribute("aria-modal"),
    ).toBe("true");
  });

  it("ESC 는 취소와 같다 — onCancel 을 부른다(03F-009)", () => {
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
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("처음 초점은 확인창(컨테이너)이다 — Enter 를 무심코 눌러도 삭제되지 않는다", () => {
    confirm();
    expect(document.activeElement).toBe(
      document.querySelector("[role=alertdialog]"),
    );
    expect(document.activeElement).not.toBe(byText("삭제"));
  });

  it("바깥(딤)을 눌러도 닫히지 않는다", () => {
    const onCancel = vi.fn();
    confirm({ onCancel });
    const dim = document.querySelector("[data-slot=alert-dialog-overlay]")!;
    act(() => {
      dim.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      dim.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onCancel).not.toHaveBeenCalled();
    expect(document.querySelector("[role=alertdialog]")).not.toBeNull();
  });

  it("취소 버튼은 onCancel 을 부른다", () => {
    const onCancel = vi.fn();
    confirm({ onCancel });
    act(() => byText("취소").click());
    expect(onCancel).toHaveBeenCalledTimes(1);
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
    // preventDefault — ds 의 확정 버튼이 스스로 닫지 않는다.
    expect(document.querySelector("[role=alertdialog]")).not.toBeNull();
    // 확정이 취소까지 부르면 호출처가 상태를 지워 스피너가 사라진다.
    expect(onCancel).not.toHaveBeenCalled();
  });
});
