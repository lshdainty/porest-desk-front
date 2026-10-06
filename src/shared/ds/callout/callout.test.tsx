// Callout 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Callout } from "./callout";

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
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const slot = (name: string) =>
  container.querySelector<HTMLElement>(`[data-slot=${name}]`);

describe("Callout", () => {
  it("기본은 neutral · 보이기 — 상자는 문단이고 앞 아이콘은 장식이다", () => {
    const box = render(<Callout>카드 결제일이 지나면 확정돼요.</Callout>);
    expect(box.tagName).toBe("DIV");
    expect(box.dataset.tone).toBe("neutral");
    expect(box.dataset.interaction).toBe("display");
    expect(box.className).toContain("bg-bg-neutral-weak");
    expect(box.hasAttribute("role")).toBe(false);
    expect(slot("callout-content")!.tagName).toBe("P");
    const icon = slot("callout-icon")!;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("svg")).not.toBeNull();
  });

  it("제목 · 본문 · 링크는 한 문단 — 사이는 띄어쓰기 두 칸(진짜 글자)", () => {
    render(
      <Callout
        tone="informative"
        title="안내"
        link={{ label: "자세히", href: "/guide/import" }}
      >
        덮어쓰지 않아요.
      </Callout>,
    );
    expect(slot("callout-content")!.textContent).toBe(
      "안내  덮어쓰지 않아요.  자세히",
    );
    expect(slot("callout-title")!.textContent).toBe("안내");
    const link = slot("callout-link")!;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/guide/import");
  });

  it("href 없는 링크와 닫기는 type=button — 폼 안에서 제출되지 않는다", () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault(),
    );
    const onLink = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Callout
          interaction="dismissible"
          link={{ label: "약관 보기", onClick: onLink }}
        >
          새 약관이 적용돼요.
        </Callout>
      </form>,
    );
    const link = slot("callout-link")!;
    expect(link.tagName).toBe("BUTTON");
    expect(link.getAttribute("type")).toBe("button");
    act(() => link.click());
    expect(onLink).toHaveBeenCalledTimes(1);
    expect(slot("callout-close")!.getAttribute("type")).toBe("button");
    act(() => slot("callout-close")!.click());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("아이콘은 바꾸거나(icon) 뺄 수 있다(null)", () => {
    render(
      <Callout icon={<svg data-testid="own" />} tone="warning">
        분할 금액이 달라요.
      </Callout>,
    );
    expect(slot("callout-icon")!.querySelector("[data-testid=own]")).not.toBe(
      null,
    );
    act(() => root.render(<Callout icon={null}>안내</Callout>));
    expect(slot("callout-icon")).toBeNull();
  });

  it("나중에 나타나는 위험은 role=alert 로 알린다 — 부르는 쪽이 단다", () => {
    const box = render(
      <Callout tone="critical" role="alert">
        저장하지 못했어요.
      </Callout>,
    );
    expect(box.getAttribute("role")).toBe("alert");
    expect(box.className).toContain("text-fg-critical-contrast");
  });

  it("전체 누르기는 상자 전체가 type=button — 뒤 화살표, 문단은 span", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault(),
    );
    const form = render(
      <form onSubmit={onSubmit}>
        <Callout interaction="actionable" onClick={onClick}>
          토스증권을 연결하면 보유 주식이 자산에 더해져요.
        </Callout>
      </form>,
    );
    const box = form.querySelector<HTMLButtonElement>("[data-slot=callout]")!;
    expect(box.tagName).toBe("BUTTON");
    expect(box.getAttribute("type")).toBe("button");
    expect(slot("callout-content")!.tagName).toBe("SPAN");
    expect(slot("callout-chevron")!.getAttribute("aria-hidden")).toBe("true");
    act(() => box.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("전체 누르기는 누르는 순간 축소 기준을 잰다 — 포인터 · Enter · Space, 부르는 쪽 핸들러도 부른다", () => {
    const onPointerDown = vi.fn();
    const onKeyDown = vi.fn();
    const box = render(
      <Callout
        interaction="actionable"
        onClick={() => {}}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      >
        연결하기
      </Callout>,
    );
    act(() => {
      box.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    // jsdom 은 크기가 0 이라 바닥값 24 — max(높이, 폭 ÷ 4, 24)
    expect(box.style.getPropertyValue("--press-basis")).toBe("24");
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    box.style.removeProperty("--press-basis");
    act(() => {
      box.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(box.style.getPropertyValue("--press-basis")).toBe("24");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("닫기 — 이름은 '닫기', 누르면 바로 걷는다(open 을 주지 않으면 스스로)", () => {
    const onDismiss = vi.fn();
    render(
      <Callout
        tone="informative"
        title="새 기능"
        interaction="dismissible"
        onDismiss={onDismiss}
      >
        반복 거래를 자동으로 기록할 수 있어요.
      </Callout>,
    );
    const close = slot("callout-close")!;
    expect(close.getAttribute("aria-label")).toBe("닫기");
    act(() => close.click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(slot("callout")).toBeNull();
  });

  it("open 을 주면 부르는 쪽이 닫는다 — 닫음을 기억해 다시 띄우지 않는다", () => {
    const Remembered = () => {
      const [seen, setSeen] = useState(false);
      return (
        <Callout
          interaction="dismissible"
          open={!seen}
          onDismiss={() => setSeen(true)}
        >
          반복 거래를 자동으로 기록할 수 있어요.
        </Callout>
      );
    };
    render(<Remembered />);
    act(() => slot("callout-close")!.click());
    expect(slot("callout")).toBeNull();

    // 부르는 쪽이 open 을 그대로 두면 닫지 않는다
    const onDismiss = vi.fn();
    act(() =>
      root.render(
        <Callout interaction="dismissible" open onDismiss={onDismiss}>
          그대로
        </Callout>,
      ),
    );
    act(() => slot("callout-close")!.click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(slot("callout")).not.toBeNull();
  });

  it("닫으면 초점은 다음 요소로 간다 — body 로 떨어뜨리지 않는다", () => {
    vi.useFakeTimers();
    // jsdom 은 배치를 하지 않는다 — 보이는 요소로 친다
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      {},
    ] as unknown as DOMRectList);
    render(
      <div>
        <Callout interaction="dismissible">한 번 보면 되는 안내</Callout>
        <button type="button" id="next">
          다음
        </button>
      </div>,
    );
    const close = slot("callout-close")!;
    act(() => close.focus());
    act(() => close.click());
    // 상자가 걷히며 초점을 잃는다 — 다음 프레임에 뒤의 요소로
    act(() => vi.advanceTimersByTime(50));
    expect(document.activeElement?.id).toBe("next");
  });

  it("ref 는 상자에 닿는다", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Callout ref={ref} tone="positive">
        목표에 더 모았어요.
      </Callout>,
    );
    expect(ref.current?.dataset.slot).toBe("callout");
  });
});
