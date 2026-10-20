// Logo Tile 의 동작 — 크기 · 색(face name) · 윤곽은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙과 맞춘다. 여기는 그 검사가 못 재는 것:
// 기관 색 · 글자색 · 이름 색 가름 · 첫 글자 · 그림이 덮는 순서 · 실패 · 이름.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { fakeImage } from "@/shared/ds/image-frame/test-utils";

import { LogoTile } from "./logo-tile";

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

const initial = (el: HTMLElement) =>
  el.querySelector<HTMLElement>("[data-slot=logo-tile-initial]");
const picture = (el: HTMLElement) => el.querySelector<HTMLImageElement>("img");

describe("면과 첫 글자", () => {
  it("기관 이름이 표에 있으면 그 색 · 표의 글자색", () => {
    const white = render(<LogoTile name="신한" />);
    expect(initial(white)!.style.backgroundColor).toBe("rgb(0, 70, 255)");
    expect(initial(white)!.className).toContain("text-static-white");
    expect(white.dataset.face).toBe("institution");
    const dark = render(<LogoTile name="KB국민" />);
    expect(initial(dark)!.className).toContain("text-fg-neutral");
    expect(initial(dark)!.className).toContain("dark:text-fg-neutral-inverted");
  });

  it("face=name 은 표를 보지 않는다 — '우리 아이 적금' · '하나투어' 가 걸리지 않는다", () => {
    for (const name of ["우리 아이 적금", "하나투어", "비상금"]) {
      const el = render(<LogoTile name={name} face="name" />);
      expect(el.dataset.face).toBe("name");
      expect(initial(el)!.style.backgroundColor).toBe("");
      expect(initial(el)!.className).toContain("text-fg-neutral-inverted");
    }
  });

  it("표에 없는 기관도 이름 색(Avatar 와 같은 함수 — 코드 포인트 합 % 10)", () => {
    const el = render(<LogoTile name="어떤은행" />);
    expect(el.dataset.face).toBe("name");
    expect(initial(el)!.className).toMatch(/bg-chart-[a-z]+/);
    // 비상금 — 설명서의 예: 코드 포인트 합 % 10 = 5 → indigo
    expect(
      initial(render(<LogoTile name="비상금" face="name" />))!.className,
    ).toContain("bg-chart-indigo");
  });

  it("첫 글자는 글자 단위 하나 · 로마자는 대문자 — 긴 이름도 하나", () => {
    expect(initial(render(<LogoTile name="신한" />))!.textContent).toBe("신");
    expect(initial(render(<LogoTile name="KB국민" />))!.textContent).toBe("K");
    expect(initial(render(<LogoTile name="Upbit" />))!.textContent).toBe("U");
    expect(
      initial(render(<LogoTile name={"가".repeat(80)} face="name" />))!
        .textContent,
    ).toBe("가");
    expect(
      initial(render(<LogoTile name="👨‍👩‍👧 우리집" face="name" />))!.textContent,
    ).toBe("👨‍👩‍👧");
  });

  it("이름이 비면 글자 없이 회색 — 타일은 숨긴다", () => {
    const el = render(<LogoTile name="  " face="name" decorative={false} />);
    expect(initial(el)!.textContent).toBe("");
    expect(initial(el)!.className).toContain("bg-chart-gray");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("크기는 32 · 40 · 48 — 모서리 × 0.3 · 글자 40%, 기본 40", () => {
    const rows = [
      [32, "size-[32px]", "rounded-r2_5", "text-[13px]"],
      [40, "size-[40px]", "rounded-r3", "text-[16px]"],
      [48, "size-[48px]", "rounded-r3_5", "text-[19px]"],
    ] as const;
    for (const [size, box, radius, text] of rows) {
      const el = render(<LogoTile name="신한" size={size} />);
      expect(el.className).toContain(box);
      expect(el.className).toContain(radius);
      expect(initial(el)!.className).toContain(text);
    }
    expect(render(<LogoTile name="신한" />).className).toContain("size-[40px]");
  });

  it("윤곽은 늘 — 끄는 속성이 없다", () => {
    expect(render(<LogoTile name="신한" />).className).toContain(
      "--logo-tile-border-width:1px",
    );
  });
});

describe("그림", () => {
  it("그림이 오기 전에는 첫 글자 — 판은 보이지 않는다(받기는 한다), 오면 첫 글자를 덮는다", () => {
    const el = render(<LogoTile name="그루" face="name" src="a.svg" />);
    expect(initial(el)).not.toBeNull();
    const plate = el.querySelector("[data-slot=logo-tile-plate]")!;
    expect(plate.className).toContain("invisible");
    const image = picture(el)!;
    fakeImage(image, { width: 200, height: 120 });
    act(() => {
      image.dispatchEvent(new Event("load"));
    });
    expect(initial(el)).toBeNull();
    expect(plate.className).not.toContain("invisible");
    expect(el.dataset.status).toBe("loaded");
  });

  it("로고는 흰 판 위 contain — alt 는 늘 빈 글", () => {
    const el = render(
      <LogoTile name="회사" face="name" src="a.svg" imageType="logo" />,
    );
    const plate = el.querySelector("[data-slot=logo-tile-plate]")!;
    expect(plate.className).toContain("bg-static-white");
    expect(plate.className).toContain("p-x1");
    expect(picture(el)!.className).toContain("object-contain");
    expect(picture(el)!.alt).toBe("");
  });

  it("카드는 옅은 판 안의 카드 비율 틀 — 폭은 크기 − 8, 모서리는 그 폭으로, 세로 그림은 90° 돌린다", () => {
    const cases = [
      [32, 24, "rounded-r1"],
      [40, 32, "rounded-r1_5"],
      [48, 40, "rounded-r1_5"],
    ] as const;
    for (const [size, width, radius] of cases) {
      const el = render(
        <LogoTile name="삼성카드" size={size} src="a.png" imageType="card" />,
      );
      const card = el.querySelector<HTMLElement>("[data-slot=logo-tile-card]")!;
      expect(card.style.width).toBe(`${width}px`);
      expect(card.className).toContain(radius);
      expect(card.className).toContain("aspect-[1.586]");
      expect(card.className).toContain("--image-frame-border-width:1px");
    }
    const el = render(
      <LogoTile name="삼성카드" src="a.png" imageType="card" />,
    );
    expect(
      el.querySelector("[data-slot=logo-tile-plate]")!.className,
    ).toContain("bg-bg-neutral-weak");
    const image = picture(el)!;
    expect(image.className).not.toContain("rotate-90");
    fakeImage(image, { width: 540, height: 856 });
    act(() => {
      image.dispatchEvent(new Event("load"));
    });
    expect(picture(el)!.className).toContain("rotate-90");
    // 가로 그림은 돌리지 않는다
    const wide = render(
      <LogoTile name="삼성카드" src="b.png" imageType="card" />,
    );
    fakeImage(picture(wide)!, { width: 856, height: 540 });
    act(() => {
      picture(wide)!.dispatchEvent(new Event("load"));
    });
    expect(picture(wide)!.className).not.toContain("rotate-90");
  });

  it("못 불러오면 첫 글자 그대로 — 깨진 그림 · 빈 칸이 없다", () => {
    const el = render(<LogoTile name="새회사" face="name" src="a.svg" />);
    act(() => {
      picture(el)!.dispatchEvent(new Event("error"));
    });
    expect(picture(el)).toBeNull();
    expect(el.querySelector("[data-slot=logo-tile-plate]")).toBeNull();
    expect(initial(el)!.textContent).toBe("새");
    expect(el.dataset.status).toBe("error");
  });

  it("그림이 바뀌면 다시 첫 글자부터", () => {
    const el = render(<LogoTile name="회사" face="name" src="a.svg" />);
    fakeImage(picture(el)!, { width: 100, height: 100 });
    act(() => {
      picture(el)!.dispatchEvent(new Event("load"));
    });
    expect(initial(el)).toBeNull();
    act(() => root.render(<LogoTile name="회사" face="name" src="b.svg" />));
    expect(initial(container.firstElementChild as HTMLElement)).not.toBeNull();
  });

  it("그림 없음 값(undefined · null · '')은 첫 글자만", () => {
    for (const src of [undefined, null, ""]) {
      const el = render(<LogoTile name="신한" src={src} />);
      expect(picture(el)).toBeNull();
      expect(el.dataset.image).toBe("none");
    }
  });
});

describe("이름", () => {
  it("옆에 이름이 있으면(기본) 타일 전체를 숨긴다 — 첫 글자 · 그림을 읽지 않는다", () => {
    const el = render(<LogoTile name="신한" />);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
  });

  it("혼자면 role=img + 이름 하나 — 그림이 있어도 실패해도 같은 이름", () => {
    const alone = render(<LogoTile name="신한" decorative={false} />);
    expect(alone.getAttribute("role")).toBe("img");
    expect(alone.getAttribute("aria-label")).toBe("신한");
    const withImage = render(
      <LogoTile name="신한" decorative={false} src="a.svg" />,
    );
    expect(withImage.getAttribute("aria-label")).toBe("신한");
    act(() => {
      picture(withImage)!.dispatchEvent(new Event("error"));
    });
    expect(withImage.getAttribute("aria-label")).toBe("신한");
  });

  it("누르지 않는다 — 버튼이 아니고 ref · 바깥 속성을 받는다", () => {
    const ref = createRef<HTMLSpanElement>();
    const el = render(<LogoTile ref={ref} name="신한" data-testid="t" />);
    expect(ref.current).toBe(el);
    expect(el.tagName).toBe("SPAN");
    expect(el.dataset.testid).toBe("t");
  });
});
