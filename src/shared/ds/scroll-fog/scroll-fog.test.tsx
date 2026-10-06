// Scroll Fog 의 동작 — 넘침 · 안쪽 여백 · 스크롤 여유는 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// jsdom 은 토큰 CSS 를 읽지 않으므로 감싸개에 토큰(--gradient-fade-mask)을 둔다 — 화면에서는 porest-tokens.css 가 준다.
import {
  act,
  createRef,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { ScrollFog } from "./scroll-fog";
import { useScrollFog, type ScrollFogUse } from "./use-scroll-fog";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const TOKEN = "linear-gradient(#00000000 0%, #00000080 50%, #000000ff 100%)";

let container: HTMLDivElement;
let root: Root;
let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

// 토큰을 둔 감싸개 안에 그린다 — 돌려주는 것은 감싸개의 첫 요소
function render(node: ReactNode, token: string | null = TOKEN) {
  const style = token
    ? ({ "--gradient-fade-mask": token } as CSSProperties)
    : undefined;
  act(() => root.render(<div style={style}>{node}</div>));
  return container.firstElementChild!.firstElementChild as HTMLElement;
}

const mask = (el: HTMLElement, p: string) => el.style.getPropertyValue(p);
const content = (el: HTMLElement) =>
  el.querySelector<HTMLElement>("[data-slot=scroll-fog-content]")!;

describe("ScrollFog", () => {
  it("box(기본) — 스크롤 상자에 위 · 아래 흐림을 건다, 안쪽 여백 · 스크롤 여유 20", () => {
    const el = render(<ScrollFog>내용</ScrollFog>);
    expect(el.dataset.slot).toBe("scroll-fog");
    expect(el.dataset.use).toBe("box");
    expect(el.dataset.fogAxis).toBe("y");
    expect(el.className).toContain("overflow-y-auto");
    expect(el.className).toContain("scroll-py-[20px]");

    // 토큰에 방향을 붙인 흐림 둘 사이에 불투명한 층 — 위는 0 에서, 가운데는 깊이(20) 아래에서, 아래는 끝에서
    const image = mask(el, "mask-image");
    expect(image).toContain("#000000ff 100%");
    expect(image).toContain("to top");
    expect(image).toContain("linear-gradient(#000, #000)");
    expect(mask(el, "mask-position")).toBe("0 0, 0 20px, 0 100%");
    expect(mask(el, "mask-repeat")).toBe("no-repeat");
    // 사파리 — 접두어 속성도 같은 값
    expect(mask(el, "-webkit-mask-image")).toBe(image);

    // 안쪽 여백은 감싸개에 — 내용과 함께 스크롤되어 흐림 아래에 깔린다
    expect(content(el).textContent).toBe("내용");
    expect(content(el).className).toContain("py-[20px]");
  });

  it("overlayBody · page — 위 20 · 아래 80, 안쪽 여백 · 스크롤 여유도 같게", () => {
    for (const use of ["overlayBody", "page"] as const) {
      const el = render(<ScrollFog use={use}>내용</ScrollFog>);
      expect(el.dataset.use).toBe(use);
      expect(el.dataset.fogAxis).toBe("y");
      expect(mask(el, "mask-position")).toBe("0 0, 0 20px, 0 100%");
      expect(el.className).toContain("scroll-pt-[20px]");
      expect(el.className).toContain("scroll-pb-[80px]");
      expect(content(el).className).toContain("pt-[20px]");
      expect(content(el).className).toContain("pb-[80px]");
    }
  });

  it("row — 좌우 흐림, 여백 · 스크롤 여유는 화면 여백 24, 스크롤바는 숨긴다", () => {
    const el = render(<ScrollFog use="row">칩</ScrollFog>);
    expect(el.dataset.fogAxis).toBe("x");
    const image = mask(el, "mask-image");
    expect(image).toContain("to right");
    expect(image).toContain("to left");
    expect(mask(el, "mask-position")).toBe("0 0, 20px 0, 100% 0");
    for (const cls of [
      "overflow-x-auto",
      "overflow-y-hidden",
      "scroll-px-global-gutter",
      "[scrollbar-width:none]",
    ]) {
      expect(el.className).toContain(cls);
    }
    // 내용 폭만큼 넓어져 끝 여백이 내용 끝에 붙는다
    for (const cls of ["w-max", "min-w-full", "px-global-gutter"]) {
      expect(content(el).className).toContain(cls);
    }
  });

  it("box 는 상자의 넘침으로 축을 정한다 — 가로로만 스크롤하면 좌우, className 이 바뀌면 다시 정한다", () => {
    let el = render(<ScrollFog>카드</ScrollFog>);
    expect(el.dataset.fogAxis).toBe("y");
    // jsdom 은 클래스의 CSS 를 모른다 — 같은 넘침을 style 로도 준다
    el = render(
      <ScrollFog
        className="overflow-x-auto overflow-y-hidden"
        style={{ overflowX: "auto", overflowY: "hidden" }}
      >
        카드
      </ScrollFog>,
    );
    expect(el.dataset.fogAxis).toBe("x");
    expect(mask(el, "mask-position")).toBe("0 0, 20px 0, 100% 0");
    // 부르는 쪽의 넘침이 box 의 세로 넘침을 덮는다
    expect(el.className).not.toContain("overflow-y-auto");
    expect(content(el).className).toContain(
      "group-data-[fog-axis=x]/scroll-fog:px-[20px]",
    );
  });

  it("ref 를 넘기고 div 속성을 그대로 받는다 — 키보드로 스크롤할 상자에 tabIndex · 이름", () => {
    const ref = createRef<HTMLDivElement>();
    const el = render(
      <ScrollFog ref={ref} tabIndex={0} aria-label="이용 약관">
        약관
      </ScrollFog>,
    );
    expect(ref.current).toBe(el);
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute("aria-label")).toBe("이용 약관");
    // 흐림은 장식 — 역할이 없다
    expect(el.hasAttribute("role")).toBe(false);
  });

  it("토큰이 없으면 흐리지 않는다", () => {
    const el = render(<ScrollFog>내용</ScrollFog>, null);
    expect(el.hasAttribute("data-fog-axis")).toBe(false);
    expect(mask(el, "mask-image")).toBe("");
  });

  it("개발 중 — 토큰이 없으면 한 번만 알린다", async () => {
    // 한 번만 알리는 표시는 모듈에 남으므로 새로 불러온 모듈로 본다
    vi.resetModules();
    const fresh = await import("./scroll-fog");
    render(
      <>
        <fresh.ScrollFog>가</fresh.ScrollFog>
        <fresh.ScrollFog>나</fresh.ScrollFog>
      </>,
      null,
    );
    const missing = warn.mock.calls.filter(([m]) =>
      String(m).includes("--gradient-fade-mask"),
    );
    expect(missing).toHaveLength(1);
  });
});

describe("useScrollFog", () => {
  const Body = ({ use }: { use: ScrollFogUse | null }) => {
    const ref = useRef<HTMLDivElement>(null);
    useScrollFog(ref, use);
    return <div ref={ref} />;
  };

  it("다른 부품의 스크롤 상자에 같은 흐림을 걸고, 끄면(null) 걷는다", () => {
    const el = render(<Body use="overlayBody" />);
    expect(el.dataset.fogAxis).toBe("y");
    expect(mask(el, "mask-position")).toBe("0 0, 0 20px, 0 100%");

    render(<Body use={null} />);
    expect(el.hasAttribute("data-fog-axis")).toBe(false);
    expect(mask(el, "mask-image")).toBe("");
    expect(mask(el, "-webkit-mask-image")).toBe("");
    expect(mask(el, "mask-position")).toBe("");
  });
});
