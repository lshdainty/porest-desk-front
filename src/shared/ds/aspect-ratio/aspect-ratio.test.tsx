// Aspect Ratio 의 동작 — 모양 · 비율은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AspectRatio } from "./aspect-ratio";
import { aspectRatioVariants } from "./aspect-ratio-variants";

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

describe("AspectRatio", () => {
  it("기본은 4:3 — 부모 폭을 채우고 넘친 자식은 자른다", () => {
    const box = render(
      <AspectRatio>
        <video aria-label="자산 연결 안내 동영상" />
      </AspectRatio>,
    );
    expect(box.dataset.slot).toBe("aspect-ratio");
    expect(box.dataset.ratio).toBe("4:3");
    expect(box.className).toContain("aspect-[4/3]");
    expect(box.className).toContain("w-full");
    expect(box.className).toContain("overflow-hidden");
  });

  it("비율은 여덟 가지 — 카드는 1.586", () => {
    const cases = {
      "1:1": "aspect-square",
      "2:1": "aspect-[2/1]",
      "16:9": "aspect-[16/9]",
      "4:3": "aspect-[4/3]",
      "6:7": "aspect-[6/7]",
      "4:5": "aspect-[4/5]",
      "2:3": "aspect-[2/3]",
      card: "aspect-[1.586]",
    } as const;
    for (const [ratio, cls] of Object.entries(cases)) {
      const box = render(<AspectRatio ratio={ratio as keyof typeof cases} />);
      expect(box.dataset.ratio).toBe(ratio);
      expect(box.className).toContain(cls);
      // Image Frame · Logo Tile 이 쓰는 비율 정의도 같은 값이다
      expect(
        aspectRatioVariants({ ratio: ratio as keyof typeof cases }),
      ).toContain(cls);
    }
  });

  it("역할 · 이름이 없다 — 자식이 말하고, 초점이 서지 않는다", () => {
    const box = render(
      <AspectRatio ratio="1:1">
        <img src="map.png" alt="김밥천국 강남점 위치" />
      </AspectRatio>,
    );
    expect(box.hasAttribute("role")).toBe(false);
    expect(box.hasAttribute("aria-label")).toBe(false);
    expect(box.hasAttribute("tabindex")).toBe(false);
    expect(box.querySelector("img")?.getAttribute("alt")).toBe(
      "김밥천국 강남점 위치",
    );
  });

  it("자식은 상자를 채우고 img · video 는 cover", () => {
    const box = render(<AspectRatio />);
    expect(box.className).toContain("*:absolute");
    expect(box.className).toContain("*:inset-0");
    expect(box.className).toContain("[&>img]:object-cover");
    expect(box.className).toContain("[&>video]:object-cover");
  });

  it("div 속성 · className · ref 를 넘긴다", () => {
    const ref = createRef<HTMLDivElement>();
    const box = render(
      <AspectRatio ref={ref} ratio="16:9" id="guide" className="max-w-120" />,
    );
    expect(ref.current).toBe(box);
    expect(box.id).toBe("guide");
    expect(box.className).toContain("max-w-120");
  });
});
