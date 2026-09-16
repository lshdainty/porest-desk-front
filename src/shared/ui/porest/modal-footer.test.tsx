// 같은 footer 안에 크기·색이 다른 버튼이 섞여 "어떤 건 글씨 양옆이 넓고 어떤 건 좁다" 가
// 됐다(데스크톱·태블릿 20종 실측 2026-09-16). 삭제는 `flush="left"`(좌 padding 0)라
// 글자가 여백선에 붙어 정사각처럼 보였다. 여기서 dialog.md footer 규격을 잠근다 —
// jsdom 에는 tailwind CSS 가 없어 높이를 잴 수 없으므로, 그 값을 만드는 유틸 클래스를 본다.
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

const { ModalFooter, ModalViewFooter } =
  await import("@/shared/ui/porest/modal-footer");

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
const buttons = () => Array.from(container.querySelectorAll("button"));
const byText = (s: string) =>
  buttons().find((b) => (b.textContent ?? "").includes(s))!;

/** default — 높이 36 · 좌우 양쪽 16 · 14px(button.md Sizes). */
const isFooterSize = (b: Element) =>
  b.classList.contains("h-9") &&
  b.classList.contains("px-4") &&
  b.classList.contains("text-sm");

const isFlush = (b: Element) =>
  b.classList.contains("pl-0") || b.classList.contains("pr-0");

describe("편집 footer — 데스크탑·태블릿", () => {
  beforeEach(() => {
    render(
      <ModalFooter
        onDelete={() => {}}
        deleteLabel="삭제"
        onCancel={() => {}}
        cancelLabel="취소"
        onSave={() => {}}
        saveLabel="저장"
      />,
    );
  });

  it("버튼 크기는 default 하나다 — 40 이 섞이지 않는다", () => {
    expect(buttons()).toHaveLength(3);
    for (const b of buttons()) {
      expect(isFooterSize(b), `${b.textContent} 가 36 이 아니다`).toBe(true);
    }
  });

  it("삭제는 옅은 빨강 채움이고 좌우 padding 을 잃지 않는다", () => {
    const del = byText("삭제");
    expect(del.className).toContain("var(--status-danger-subtle)");
    expect(isFlush(del)).toBe(false);
    // 좌측 정렬은 padding 이 아니라 margin 으로 한다.
    expect(del.style.marginRight).toBe("auto");
  });

  it("취소는 회색 채움(secondary)이다 — ghost 는 버튼으로 안 보인다", () => {
    expect(byText("취소").classList).toContain("bg-secondary");
  });

  it("저장만 채움 주 액션(primary)이다", () => {
    expect(byText("저장").className).toContain("var(--status-info)");
  });
});

describe("상세 footer — 데스크탑·태블릿", () => {
  it("수정이 주 액션이다 — 확인이 따로 없으면 채움", () => {
    render(<ModalViewFooter onEdit={() => {}} editLabel="수정" />);
    expect(byText("수정").className).toContain("var(--status-info)");
  });

  it("확인이 따로 있으면 수정은 secondary 로 물러선다 — primary 는 하나다", () => {
    render(
      <ModalViewFooter
        onEdit={() => {}}
        editLabel="수정"
        onConfirm={() => {}}
        confirmLabel="일시중지"
      />,
    );
    expect(byText("수정").classList).toContain("bg-secondary");
    expect(byText("일시중지").className).toContain("var(--status-info)");
  });

  it("삭제는 편집 footer 와 같은 규격이다", () => {
    render(
      <ModalViewFooter
        onDelete={() => {}}
        deleteLabel="삭제"
        onEdit={() => {}}
        editLabel="수정"
      />,
    );
    const del = byText("삭제");
    expect(del.className).toContain("var(--status-danger-subtle)");
    expect(isFlush(del)).toBe(false);
    expect(isFooterSize(del)).toBe(true);
  });
});

describe("모바일은 그대로다", () => {
  it("lg(48) + 삭제는 솔리드 채움", () => {
    device = "mobile";
    render(
      <ModalFooter
        onDelete={() => {}}
        deleteLabel="삭제"
        onCancel={() => {}}
        cancelLabel="취소"
        onSave={() => {}}
        saveLabel="저장"
      />,
    );
    for (const b of buttons()) expect(b.classList).toContain("h-12");
    expect(byText("삭제").classList).toContain("bg-destructive");
    expect(byText("취소").classList).toContain("bg-secondary");
  });
});
