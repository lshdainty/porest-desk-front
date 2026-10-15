// Image Frame 의 동작 — 값(크기 · 색 · 윤곽)은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙과 맞춘다. 여기는 그 검사가 못 재는 것:
// 모서리 규칙 · 상태 가름 · 10초 · 세로 그림 돌리기 · 그림 위 요소 규칙 · 이름.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOADING_TIMING } from "@/shared/ds/skeleton";

import {
  ImageFrame,
  ImageFrameFloater,
  ImageFrameIndicator,
} from "./image-frame";
import { imageFrameRadius } from "./image-frame-variants";
import { fakeImage } from "./test-utils";

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
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const img = (el: HTMLElement) =>
  el.querySelector<HTMLImageElement>("[data-slot=image-frame-image]");

// 그림이 왔다 — 크기를 정하고 load 를 알린다
function arrive(el: HTMLElement, width: number, height: number) {
  const image = img(el)!;
  fakeImage(image, { width, height });
  act(() => {
    image.dispatchEvent(new Event("load"));
  });
}

describe("imageFrameRadius", () => {
  it("폭으로 고른다 — 24 이하 4 · 48 이하 6 · 그 위 8 · 모르면 8", () => {
    expect(imageFrameRadius(24)).toBe("4");
    expect(imageFrameRadius(25)).toBe("6");
    expect(imageFrameRadius(48)).toBe("6");
    expect(imageFrameRadius(49)).toBe("8");
    expect(imageFrameRadius(undefined)).toBe("8");
    expect(imageFrameRadius(Number.NaN)).toBe("8");
  });
});

describe("틀", () => {
  it("폭을 주면 그 폭 · 모서리를 고르고, 안 주면 부모 폭 · 8", () => {
    const fixed = render(<ImageFrame src="a.png" alt="" width={40} />);
    expect(fixed.style.width).toBe("40px");
    expect(fixed.dataset.radius).toBe("6");
    expect(fixed.className).toContain("rounded-r1_5");
    const fluid = render(<ImageFrame src="a.png" alt="" />);
    expect(fluid.className).toContain("w-full");
    expect(fluid.dataset.radius).toBe("8");
  });

  it("bleed 는 모서리 0, 윤곽은 그대로(끄는 속성이 없다)", () => {
    const el = render(<ImageFrame src="a.png" alt="" bleed />);
    expect(el.dataset.radius).toBe("0");
    expect(el.className).toContain("rounded-none");
    expect(el.className).toContain("--image-frame-border-width:1px");
  });

  it("비율은 여덟 가지 — 기본 4:3 · 카드 1.586", () => {
    expect(render(<ImageFrame src="a.png" alt="" />).className).toContain(
      "aspect-[4/3]",
    );
    expect(
      render(<ImageFrame src="a.png" alt="" ratio="card" />).className,
    ).toContain("aspect-[1.586]");
    expect(
      render(<ImageFrame src="a.png" alt="" ratio="1:1" />).className,
    ).toContain("aspect-square");
  });

  it("ref 와 바깥 div 속성을 받는다", () => {
    const ref = createRef<HTMLDivElement>();
    const el = render(
      <ImageFrame ref={ref} src="a.png" alt="" data-testid="x" />,
    );
    expect(ref.current).toBe(el);
    expect(el.dataset.testid).toBe("x");
  });
});

describe("상태", () => {
  it("받는 중 — 스켈레톤이 보이고 그림은 투명도 0, 다 받으면 스켈레톤을 걷고 나타난다", () => {
    const el = render(<ImageFrame src="a.png" alt="" />);
    expect(el.dataset.state).toBe("loading");
    expect(el.querySelector("[data-slot=skeleton]")).not.toBeNull();
    expect(img(el)!.className).toContain("opacity-0");
    arrive(el, 600, 450);
    expect(el.dataset.state).toBe("loaded");
    expect(el.querySelector("[data-slot=skeleton]")).toBeNull();
    expect(img(el)!.className).not.toContain("opacity-0");
    expect(img(el)!.className).toContain("animate-[fade-in_");
    expect(img(el)!.className).toContain("motion-reduce:animate-none");
  });

  it("그림이 없으면 처음부터 대체 그림 — 스켈레톤 없이", () => {
    for (const src of [undefined, null, ""]) {
      const el = render(<ImageFrame src={src} alt="" />);
      expect(el.dataset.state).toBe("fallback");
      expect(el.querySelector("[data-slot=skeleton]")).toBeNull();
      expect(img(el)).toBeNull();
      expect(
        el.querySelector("[data-slot=content-placeholder]"),
      ).not.toBeNull();
    }
  });

  it("못 불러오면 대체 그림 — img 를 걷어 깨진 그림 · alt 글이 없다, 그 뒤에 와도 다시 바꾸지 않는다", () => {
    const el = render(<ImageFrame src="a.png" alt="제주 바다" />);
    const image = img(el)!;
    act(() => {
      image.dispatchEvent(new Event("error"));
    });
    expect(el.dataset.state).toBe("fallback");
    expect(img(el)).toBeNull();
    // 걷은 뒤에 온 알림은 무시된다
    act(() => {
      image.dispatchEvent(new Event("load"));
    });
    expect(el.dataset.state).toBe("fallback");
  });

  it("10초가 지나도 안 오면 실패와 같다 — 그 뒤에 와도 다시 바꾸지 않는다", () => {
    vi.useFakeTimers();
    const el = render(<ImageFrame src="a.png" alt="" />);
    act(() => {
      vi.advanceTimersByTime(LOADING_TIMING.timeout - 1);
    });
    expect(el.dataset.state).toBe("loading");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(el.dataset.state).toBe("fallback");
  });

  it("src 가 바뀌면 다시 받는 중", () => {
    const el = render(<ImageFrame src="a.png" alt="" />);
    arrive(el, 600, 450);
    expect(el.dataset.state).toBe("loaded");
    act(() => root.render(<ImageFrame src="b.png" alt="" />));
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe(
      "loading",
    );
  });

  it("lazy 가 기본, eager · srcSet · sizes 를 img 에 전한다", () => {
    expect(
      img(render(<ImageFrame src="a.png" alt="" />))!.getAttribute("loading"),
    ).toBe("lazy");
    const el = render(
      <ImageFrame
        src="a.png"
        alt=""
        loading="eager"
        srcSet="a.png 1x, b.png 2x"
        sizes="100vw"
      />,
    );
    expect(img(el)!.getAttribute("loading")).toBe("eager");
    expect(img(el)!.getAttribute("srcset")).toBe("a.png 1x, b.png 2x");
    expect(img(el)!.getAttribute("sizes")).toBe("100vw");
  });

  it("contain 은 흰 판 위에 잘리지 않게", () => {
    const el = render(<ImageFrame src="a.png" alt="" fit="contain" />);
    expect(img(el)!.className).toContain("object-contain");
    expect(img(el)!.className).toContain("bg-static-white");
    expect(img(render(<ImageFrame src="a.png" alt="" />))!.className).toContain(
      "object-cover",
    );
  });
});

describe("카드 비율 — 세로 그림은 시계 방향 90°", () => {
  it("다 받은 뒤 원래 폭 < 높이면 돌린다 — 받기 전에는 돌리지 않는다(스켈레톤)", () => {
    const el = render(<ImageFrame src="a.png" alt="" ratio="card" />);
    expect(el.dataset.rotated).toBeUndefined();
    arrive(el, 540, 856);
    expect(el.dataset.rotated).toBe("true");
    expect(img(el)!.className).toContain("rotate-90");
  });

  it("가로 · 정사각 그림은 그대로, 다른 비율은 세로여도 돌리지 않는다", () => {
    const wide = render(<ImageFrame src="a.png" alt="" ratio="card" />);
    arrive(wide, 856, 540);
    expect(wide.dataset.rotated).toBeUndefined();
    const square = render(<ImageFrame src="b.png" alt="" ratio="card" />);
    arrive(square, 500, 500);
    expect(square.dataset.rotated).toBeUndefined();
    const tall = render(<ImageFrame src="c.png" alt="" ratio="4:3" />);
    arrive(tall, 540, 856);
    expect(tall.dataset.rotated).toBeUndefined();
  });
});

describe("이름", () => {
  it("alt 는 img 로, 실패해도 대체 그림이 그 이름을 이어받는다(role=img)", () => {
    const el = render(<ImageFrame src="a.png" alt="제주 바다" />);
    expect(img(el)!.alt).toBe("제주 바다");
    act(() => {
      img(el)!.dispatchEvent(new Event("error"));
    });
    const fallback = el.querySelector("[data-slot=image-frame-fallback]")!;
    expect(fallback.getAttribute("role")).toBe("img");
    expect(fallback.getAttribute("aria-label")).toBe("제주 바다");
  });

  it("alt 가 빈 글이면 장식 — 대체 그림도 숨긴다", () => {
    const el = render(<ImageFrame alt="" />);
    const fallback = el.querySelector("[data-slot=image-frame-fallback]")!;
    expect(fallback.getAttribute("aria-hidden")).toBe("true");
    expect(fallback.getAttribute("role")).toBeNull();
  });

  it("받는 중 스켈레톤은 aria-hidden", () => {
    const el = render(<ImageFrame src="a.png" alt="" />);
    expect(
      el.querySelector("[data-slot=skeleton]")!.getAttribute("aria-hidden"),
    ).toBe("true");
  });
});

describe("그림 위 요소", () => {
  it("네 자리 클래스 — 틀 가장자리에서 6, 짧은 변 80 이상일 때만 보인다, 누르지 않는다", () => {
    const placements = {
      "top-start": ["start-x1_5", "top-x1_5"],
      "top-end": ["end-x1_5", "top-x1_5"],
      "bottom-start": ["bottom-x1_5", "start-x1_5"],
      "bottom-end": ["bottom-x1_5", "end-x1_5"],
    } as const;
    for (const [placement, classes] of Object.entries(placements)) {
      const el = render(
        <ImageFrame src="a.png" alt="">
          <ImageFrameFloater placement={placement as keyof typeof placements}>
            <span>x</span>
          </ImageFrameFloater>
        </ImageFrame>,
      );
      const floater = el.querySelector("[data-slot=image-frame-floater]")!;
      for (const c of classes) expect(floater.className).toContain(c);
      expect(floater.className).toContain("pointer-events-none");
      expect(floater.className).toContain("min-width:80px");
      expect(floater.className).toContain("min-height:80px");
    }
  });

  it("틀 하나에 둘까지, 한 자리에 하나 — 나머지는 그리지 않는다", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const el = render(
      <ImageFrame src="a.png" alt="">
        <ImageFrameFloater placement="top-start">
          <span>a</span>
        </ImageFrameFloater>
        <ImageFrameFloater placement="top-start">
          <span>같은 자리</span>
        </ImageFrameFloater>
        <ImageFrameFloater placement="top-end">
          <span>b</span>
        </ImageFrameFloater>
        <ImageFrameFloater placement="bottom-end">
          <span>셋째</span>
        </ImageFrameFloater>
      </ImageFrame>,
    );
    const shown = [...el.querySelectorAll("[data-slot=image-frame-floater]")];
    expect(shown.map((f) => f.textContent)).toEqual(["a", "b"]);
  });

  it("Indicator — 보이는 글은 숨기고 label 을 숨은 글로 읽는다, 알약 · 검정 65%", () => {
    const el = render(
      <ImageFrame src="a.png" alt="">
        <ImageFrameFloater placement="bottom-end">
          <ImageFrameIndicator label="사진 12장 중 1번째">
            1 / 12
          </ImageFrameIndicator>
        </ImageFrameFloater>
      </ImageFrame>,
    );
    const indicator = el.querySelector("[data-slot=image-frame-indicator]")!;
    expect(indicator.querySelector("[aria-hidden=true]")!.textContent).toBe(
      "1 / 12",
    );
    expect(indicator.querySelector(".sr-only")!.textContent).toBe(
      "사진 12장 중 1번째",
    );
    expect(indicator.className).toContain("rounded-full");
    expect(indicator.className).toContain("--overlay-dim-dark");
  });
});
