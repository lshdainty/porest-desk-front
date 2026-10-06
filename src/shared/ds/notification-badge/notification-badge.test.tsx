// Notification Badge 의 동작 — 모양 · 색 · 자리는 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NotificationBadge } from "./notification-badge";
import { formatNotificationCount } from "./notification-badge-variants";

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

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const badge = () =>
  container.querySelector<HTMLElement>("[data-slot=notification-badge]");

// 보조 기술이 읽는 글 — aria-hidden 안의 글은 뺀다
function spokenText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.getAttribute("aria-hidden") === "true")
    return "";
  return Array.from(node.childNodes).map(spokenText).join("");
}

const Icon = () => <svg data-testid="bell" />;

describe("formatNotificationCount", () => {
  it("0 이하(소수는 버림)면 null — 배지가 없다", () => {
    expect(formatNotificationCount(0)).toBeNull();
    expect(formatNotificationCount(-3)).toBeNull();
    expect(formatNotificationCount(0.9)).toBeNull();
    expect(formatNotificationCount(Number.NaN)).toBeNull();
  });

  it("1 ~ 99 는 그 숫자, 100 이상은 99+", () => {
    expect(formatNotificationCount(1)).toBe("1");
    expect(formatNotificationCount(12.7)).toBe("12");
    expect(formatNotificationCount(99)).toBe("99");
    expect(formatNotificationCount(99.9)).toBe("99");
    expect(formatNotificationCount(100)).toBe("99+");
    expect(formatNotificationCount(128)).toBe("99+");
  });
});

describe("NotificationBadge", () => {
  it("기본은 점(small) · 아이콘 — 대상을 감싸고 그 위에 겹친다", () => {
    const target = render(
      <NotificationBadge>
        <Icon />
      </NotificationBadge>,
    );
    expect(target.dataset.slot).toBe("notification-badge-target");
    expect(target.className).toContain("relative");
    expect(target.querySelector("[data-testid=bell]")).not.toBeNull();
    const dot = badge()!;
    expect(dot.dataset.size).toBe("small");
    expect(dot.className).toContain("absolute");
    expect(dot.className).toContain("right-px");
    expect(dot.className).toContain("top-px");
    // 점에는 글이 없다
    expect(dot.textContent).toBe("");
  });

  it("점 · 숫자는 보조 기술에 숨긴다 — 이름은 붙은 버튼이 가진다", () => {
    render(
      <button type="button" aria-label="알림, 새 알림 3개">
        <NotificationBadge size="large" count={3}>
          <Icon />
        </NotificationBadge>
      </button>,
    );
    expect(badge()!.getAttribute("aria-hidden")).toBe("true");
    expect(badge()!.textContent).toBe("3");
    // 숫자가 버튼 글로 읽히지 않는다("3 알림" 이 아니다)
    expect(spokenText(container)).toBe("");
    // 라이브 영역을 두지 않는다 — 수가 바뀌어도 소리로 알리지 않는다
    expect(container.querySelector("[aria-live]")).toBeNull();
  });

  it("보면 지운다 — visible={false} 면 점이 없다", () => {
    render(
      <NotificationBadge visible={false}>
        <Icon />
      </NotificationBadge>,
    );
    expect(badge()).toBeNull();
    expect(container.querySelector("[data-testid=bell]")).not.toBeNull();
  });

  it("숫자는 0 이하면 배지가 없고 100 이상이면 99+", () => {
    render(
      <NotificationBadge size="large" count={0}>
        <Icon />
      </NotificationBadge>,
    );
    expect(badge()).toBeNull();

    render(
      <NotificationBadge size="large" count={128}>
        <Icon />
      </NotificationBadge>,
    );
    expect(badge()!.textContent).toBe("99+");
    expect(badge()!.dataset.size).toBe("large");
  });

  it("수가 바뀌면 숫자만 바뀐다 — 0 이 되면 사라진다", () => {
    const at = (count: number) =>
      render(
        <NotificationBadge size="large" count={count}>
          <Icon />
        </NotificationBadge>,
      );
    at(2);
    expect(badge()!.textContent).toBe("2");
    at(12);
    expect(badge()!.textContent).toBe("12");
    at(0);
    expect(badge()).toBeNull();
  });

  it("숫자 알약은 글자 크기 설정을 따르지 않는 11/15 · 700 · 숫자 폭 고정", () => {
    render(
      <NotificationBadge size="large" count={8}>
        <Icon />
      </NotificationBadge>,
    );
    const pill = badge()!;
    expect(pill.className).toContain("text-t1-static");
    expect(pill.className).toContain("font-bold");
    expect(pill.className).toContain("tabular-nums");
    // 왼쪽 아래 꼭짓점이 (아이콘 폭 − 8, 14)
    expect(pill.className).toContain("left-[calc(100%-8px)]");
    expect(pill.className).toContain("bottom-[calc(100%-14px)]");
  });

  it("글에 붙으면 글 끝 + 2 · 줄 상자 위 끝", () => {
    const target = render(
      <NotificationBadge attach="text">공지</NotificationBadge>,
    );
    expect(target.textContent).toBe("공지");
    const dot = badge()!;
    expect(dot.className).toContain("left-full");
    expect(dot.className).toContain("ml-x0_5");
    expect(dot.className).toContain("top-0");
    expect(dot.className).not.toContain("right-px");
  });

  it("쓰는 쪽의 className · ref 는 붙을 대상이 받는다", () => {
    const ref = createRef<HTMLSpanElement>();
    const target = render(
      <NotificationBadge ref={ref} className="shrink-0">
        <Icon />
      </NotificationBadge>,
    );
    expect(ref.current).toBe(target);
    expect(target.className).toContain("shrink-0");
  });
});
