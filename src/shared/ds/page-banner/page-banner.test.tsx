// Page Banner 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PageBanner } from "./page-banner";

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

describe("PageBanner", () => {
  it("기본은 neutral · 옅은 바탕 · 보이기 — 역할 없는 띠, 앞 아이콘은 장식", () => {
    const band = render(
      <PageBanner>시세는 하루에 한 번 새로 고쳐져요.</PageBanner>,
    );
    expect(band.tagName).toBe("DIV");
    expect(band.dataset.tone).toBe("neutral");
    expect(band.dataset.variant).toBe("weak");
    expect(band.dataset.interaction).toBe("display");
    expect(band.hasAttribute("role")).toBe(false);
    expect(band.className).toContain("bg-bg-neutral-weak");
    expect(band.className).toContain("px-global-gutter");
    expect(slot("page-banner-body")!.tagName).toBe("P");
    expect(slot("page-banner-icon")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("제목 · 본문은 한 문단 — 사이는 띄어쓰기 두 칸", () => {
    render(
      <PageBanner tone="critical" title="연결 끊김">
        시세를 받지 못해요.
      </PageBanner>,
    );
    expect(slot("page-banner-body")!.textContent).toBe(
      "연결 끊김  시세를 받지 못해요.",
    );
    expect(slot("page-banner-title")!.textContent).toBe("연결 끊김");
  });

  it("글 버튼은 하나 · type=button — 누르면 그 일을 하고, 폼을 제출하지 않는다", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <PageBanner
          tone="critical"
          title="연결 끊김"
          button={{ label: "다시 연결", onClick }}
        >
          토스증권 키가 만료돼 시세를 받지 못해요.
        </PageBanner>
      </form>,
    );
    const button = slot("page-banner-button")!;
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.textContent).toBe("다시 연결");
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("글 버튼은 누르는 순간 축소 기준을 잰다 — 포인터 · Space", () => {
    render(
      <PageBanner button={{ label: "업데이트", onClick: () => {} }}>
        새 버전이 나왔어요.
      </PageBanner>,
    );
    const button = slot("page-banner-button")!;
    act(() => {
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    // jsdom 은 크기가 0 이라 바닥값 24 — max(높이, 폭 ÷ 4, 24)
    expect(button.style.getPropertyValue("--press-basis")).toBe("24");
    button.style.removeProperty("--press-basis");
    act(() => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
    });
    expect(button.style.getPropertyValue("--press-basis")).toBe("24");
  });

  it("짙은 바탕은 bg-*-solid + 흰 글(neutral 은 반전 짝), 버튼 링은 띠 글자색", () => {
    const band = render(
      <PageBanner
        tone="warning"
        variant="solid"
        title="곧 만료"
        button={{ label: "구독 보기", onClick: () => {} }}
      >
        Pro 이용이 10월 31일에 끝나요.
      </PageBanner>,
    );
    expect(band.className).toContain("bg-bg-warning-solid");
    expect(band.className).toContain("text-static-white");
    expect(slot("page-banner-button")!.className).toContain(
      "focus-visible:outline-current",
    );
    act(() =>
      root.render(
        <PageBanner tone="neutral" variant="solid">
          안내
        </PageBanner>,
      ),
    );
    const neutral = container.firstElementChild as HTMLElement;
    expect(neutral.className).toContain("bg-bg-neutral-inverted");
    expect(neutral.className).toContain("text-fg-neutral-inverted");
  });

  it("전체 누르기는 띠 전체가 type=button — 안은 구문 요소만, 뒤 화살표, 누르면 안의 내용만 준다", () => {
    const onClick = vi.fn();
    const band = render(
      <PageBanner
        tone="informative"
        interaction="actionable"
        title="새 버전"
        onClick={onClick}
      >
        더 빨라진 가계부를 쓸 수 있어요.
      </PageBanner>,
    );
    expect(band.tagName).toBe("BUTTON");
    expect(band.getAttribute("type")).toBe("button");
    // 버튼 안에는 <div> · <p> 를 두지 않는다
    expect(band.querySelector("div, p")).toBeNull();
    expect(slot("page-banner-inner")!.className).toContain(
      "group-active/page-banner:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(slot("page-banner-chevron")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(slot("page-banner-button")).toBeNull();
    act(() => band.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("전체 누르기는 띠에서 누르는 순간 축소 기준을 잰다 — 부르는 쪽 핸들러도 부른다", () => {
    const onPointerDown = vi.fn();
    const band = render(
      <PageBanner
        interaction="actionable"
        onClick={() => {}}
        onPointerDown={onPointerDown}
      >
        연결하기
      </PageBanner>,
    );
    act(() => {
      band.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(band.style.getPropertyValue("--press-basis")).toBe("24");
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("닫기 — 이름은 '닫기', 누르면 바로 걷는다(open 을 주지 않으면 스스로)", () => {
    const onDismiss = vi.fn();
    render(
      <PageBanner
        tone="informative"
        title="새 기능"
        interaction="dismissible"
        onDismiss={onDismiss}
      >
        반복 거래를 자동으로 기록할 수 있어요.
      </PageBanner>,
    );
    const close = slot("page-banner-close")!;
    expect(close.getAttribute("aria-label")).toBe("닫기");
    expect(close.getAttribute("type")).toBe("button");
    act(() => close.click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(slot("page-banner")).toBeNull();
  });

  it("open 을 주면 부르는 쪽이 닫는다 — 닫음을 기억해 다시 띄우지 않는다", () => {
    const Remembered = () => {
      const [seen, setSeen] = useState(false);
      return (
        <PageBanner
          interaction="dismissible"
          open={!seen}
          onDismiss={() => setSeen(true)}
        >
          반복 거래를 자동으로 기록할 수 있어요.
        </PageBanner>
      );
    };
    render(<Remembered />);
    act(() => slot("page-banner-close")!.click());
    expect(slot("page-banner")).toBeNull();

    const onDismiss = vi.fn();
    act(() =>
      root.render(
        <PageBanner interaction="dismissible" open onDismiss={onDismiss}>
          그대로
        </PageBanner>,
      ),
    );
    act(() => slot("page-banner-close")!.click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(slot("page-banner")).not.toBeNull();
  });

  it("닫으면 초점은 다음 요소로 — 뒤에 없으면 앞 요소로 간다", () => {
    vi.useFakeTimers();
    // jsdom 은 배치를 하지 않는다 — 보이는 요소로 친다
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      {},
    ] as unknown as DOMRectList);
    render(
      <div>
        <button type="button" id="before">
          앞
        </button>
        <PageBanner interaction="dismissible">새 버전이 나왔어요.</PageBanner>
      </div>,
    );
    const close = slot("page-banner-close")!;
    act(() => close.focus());
    act(() => close.click());
    act(() => vi.advanceTimersByTime(50));
    expect(document.activeElement?.id).toBe("before");
  });

  it("나중에 나타나는 위험은 role=alert, ref 는 띠에 닿는다", () => {
    const ref = createRef<HTMLElement>();
    const band = render(
      <PageBanner ref={ref} tone="critical" role="alert">
        연결이 끊겼어요.
      </PageBanner>,
    );
    expect(band.getAttribute("role")).toBe("alert");
    expect(ref.current).toBe(band);
  });
});
