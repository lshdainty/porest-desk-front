// Input Button 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(안쪽 그림자 · ::after 테두리 · 누름 축소 · 반응형 · 말줄임)은 여기서 본다(input-button.measure.mjs 머리).
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "@/shared/ds/field";

import { InputButton } from "./input-button";
import { useInputButtonSurface } from "./use-input-button-surface";

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
  vi.unstubAllGlobals();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

const box = () =>
  container.querySelector<HTMLElement>("[data-slot=input-button]")!;
const trigger = () =>
  container.querySelector<HTMLButtonElement>(
    "[data-slot=input-button-trigger]",
  )!;
const clear = () =>
  container.querySelector<HTMLButtonElement>("[data-slot=input-button-clear]");
const valueEl = () =>
  container.querySelector<HTMLElement>("[data-slot=input-button-value]")!;
const classes = (el: Element) => el.className.split(/\s+/);
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
// 이름 · 설명이 가리키는 요소들의 글
const textsOf = (el: Element, attr: string) =>
  (el.getAttribute(attr) ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent);

describe("구조", () => {
  it("칸은 버튼이고 상자를 덮는 배경 층이다 — 상자 어디를 눌러도 눌린다", () => {
    render(<InputButton aria-label="날짜" placeholder="날짜 선택" />);
    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger().type).toBe("button");
    expect(classes(trigger())).toEqual(
      expect.arrayContaining(["absolute", "inset-0"]),
    );
    // 값 · 붙이개 층은 누름을 지나 보낸다
    expect(
      classes(container.querySelector("[data-slot=input-button-content]")!),
    ).toContain("pointer-events-none");
  });

  it("ref 는 버튼, rootRef · rootClassName 은 상자에 간다", () => {
    const ref = createRef<HTMLButtonElement>();
    const rootRef = createRef<HTMLDivElement>();
    render(
      <InputButton
        ref={ref}
        rootRef={rootRef}
        rootClassName="w-40"
        className="extra"
        aria-label="날짜"
      />,
    );
    expect(ref.current).toBe(trigger());
    expect(rootRef.current).toBe(box());
    expect(classes(box())).toContain("w-40");
    expect(classes(trigger())).toContain("extra");
  });

  it("값이 없으면 placeholder 를 보이고 값이 있으면 값을 보인다", () => {
    render(<InputButton aria-label="날짜" placeholder="날짜 선택" />);
    expect(valueEl().textContent).toBe("날짜 선택");
    expect(valueEl().hasAttribute("data-placeholder")).toBe(true);
    expect(classes(valueEl())).toContain("text-fg-placeholder");
    render(
      <InputButton
        aria-label="날짜"
        placeholder="날짜 선택"
        value="10월 1일 (목)"
      />,
    );
    expect(valueEl().textContent).toBe("10월 1일 (목)");
    expect(valueEl().hasAttribute("data-placeholder")).toBe(false);
    expect(classes(valueEl())).toContain("text-fg-neutral");
    // 빈 글 · null 도 값이 없는 것이다
    render(<InputButton aria-label="날짜" placeholder="날짜 선택" value="" />);
    expect(valueEl().textContent).toBe("날짜 선택");
    render(
      <InputButton aria-label="날짜" placeholder="날짜 선택" value={null} />,
    );
    expect(valueEl().textContent).toBe("날짜 선택");
  });

  it("긴 값은 한 줄로 말줄임한다 — 상자가 늘어나지 않는다", () => {
    render(
      <InputButton aria-label="참조자" value={"가나다라마바사 ".repeat(30)} />,
    );
    expect(classes(valueEl())).toEqual(
      expect.arrayContaining(["truncate", "min-w-0", "flex-1"]),
    );
    expect(classes(box())).toContain("min-w-0");
  });

  it("붙이개는 보조 기술에 숨기고, 아이콘은 값 둘레 순서대로 놓인다", () => {
    render(
      <InputButton
        aria-label="나이"
        prefixIcon={<svg />}
        prefix="만"
        value="29"
        suffix="세"
        suffixIcon={<svg />}
      />,
    );
    const slots = Array.from(
      container.querySelectorAll("[data-slot=input-button-content] > span"),
    ).map((el) => el.getAttribute("data-slot"));
    expect(slots).toEqual([
      "input-button-prefix-icon",
      "input-button-prefix",
      "input-button-value",
      "input-button-suffix",
      "input-button-suffix-icon",
    ]);
    for (const slot of slots) {
      expect(
        container
          .querySelector(`[data-slot=${slot}]`)!
          .getAttribute("aria-hidden"),
      ).toBe("true");
    }
  });
});

describe("크기", () => {
  it("large 52 · medium 40 · responsive 는 1280 에서 바뀐다", () => {
    render(<InputButton aria-label="a" size="large" />);
    expect(classes(box())).toEqual(
      expect.arrayContaining(["min-h-13", "rounded-r3", "px-x4", "text-t5"]),
    );
    render(<InputButton aria-label="a" size="medium" />);
    expect(classes(box())).toEqual(
      expect.arrayContaining(["min-h-10", "rounded-r2", "px-x3_5", "text-t4"]),
    );
    render(<InputButton aria-label="a" />);
    expect(box().getAttribute("data-size")).toBe("responsive");
    expect(classes(box())).toEqual(
      expect.arrayContaining(["min-h-13", "lg:min-h-10", "lg:rounded-r2"]),
    );
  });
});

describe("열기", () => {
  it("누르면 onClick 을 부른다 — 칸은 값을 들지 않는다", () => {
    const onClick = vi.fn();
    render(<InputButton aria-label="날짜" onClick={onClick} />);
    click(trigger());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("읽기 전용은 포커스는 되고 열리지 않는다", () => {
    const onClick = vi.fn();
    render(<InputButton aria-label="입사일" readOnly onClick={onClick} />);
    expect(trigger().disabled).toBe(false);
    expect(trigger().getAttribute("aria-disabled")).toBe("true");
    act(() => trigger().focus());
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    expect(onClick).not.toHaveBeenCalled();
    expect(box().hasAttribute("data-readonly")).toBe(true);
    expect(classes(trigger())).toEqual(
      expect.arrayContaining(["bg-bg-disabled", "cursor-default"]),
    );
    // 값은 진한 글자 그대로 — 바탕만으로 가른다
    render(
      <InputButton aria-label="입사일" readOnly value="2024년 3월 4일 (월)" />,
    );
    expect(classes(valueEl())).toContain("text-fg-neutral");
  });

  it("비활성은 포커스도 열기도 안 된다 — 흐리게 하지 않고 회색 바탕", () => {
    const onClick = vi.fn();
    render(
      <InputButton
        aria-label="날짜"
        disabled
        value="10월 1일"
        onClick={onClick}
      />,
    );
    expect(trigger().disabled).toBe(true);
    click(trigger());
    expect(onClick).not.toHaveBeenCalled();
    expect(classes(trigger())).toEqual(
      expect.arrayContaining(["bg-bg-disabled", "cursor-not-allowed"]),
    );
    expect(classes(valueEl())).toContain("text-fg-disabled");
    expect(classes(trigger())).not.toContain("opacity-50");
  });

  it("열려 있다는 것을 aria-haspopup · aria-expanded 로 알린다(쓰는 쪽이 준 그대로)", () => {
    render(
      <InputButton aria-label="날짜" aria-haspopup="dialog" aria-expanded />,
    );
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });
});

describe("지우기", () => {
  it("값이 있을 때만 보이고, 누르면 onClear 만 부르고(열지 않는다) 칸에 포커스를 둔다", () => {
    const onClear = vi.fn();
    const onClick = vi.fn();
    render(
      <InputButton
        aria-label="참조자"
        value="김하나"
        onClear={onClear}
        onClick={onClick}
      />,
    );
    const button = clear()!;
    expect(button.getAttribute("aria-label")).toBe("지우기");
    expect(button.tabIndex).toBe(-1);
    act(() => button.click());
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });

  it("값이 없거나 막히거나 읽기 전용이면 없다", () => {
    render(<InputButton aria-label="참조자" onClear={() => {}} />);
    expect(clear()).toBeNull();
    render(
      <InputButton
        aria-label="참조자"
        value="김"
        disabled
        onClear={() => {}}
      />,
    );
    expect(clear()).toBeNull();
    render(
      <InputButton
        aria-label="참조자"
        value="김"
        readOnly
        onClear={() => {}}
      />,
    );
    expect(clear()).toBeNull();
    render(<InputButton aria-label="참조자" value="김" />);
    expect(clear()).toBeNull();
  });

  it("누름은 지우기 버튼만 준다 — 기준 24 · 누르는 영역 24", () => {
    render(<InputButton aria-label="참조자" value="김" onClear={() => {}} />);
    const c = classes(clear()!);
    expect(c).toEqual(
      expect.arrayContaining([
        "[--press-basis:24]",
        "active:[scale:calc(1-2/var(--press-basis))]",
        "motion-reduce:active:[scale:1]",
        "before:size-6",
        "pointer-events-auto",
      ]),
    );
  });

  it("지우기 이름은 clearLabel 로 바꾼다", () => {
    render(
      <InputButton
        aria-label="cc"
        value="a"
        onClear={() => {}}
        clearLabel="Clear"
      />,
    );
    expect(clear()!.getAttribute("aria-label")).toBe("Clear");
  });
});

describe("누름 · 포커스 · 오류 모양", () => {
  it("누르면 바탕이 칠해지고 콘텐츠 층만 2px 준다 — 모션 줄이기면 줄지 않는다", () => {
    render(<InputButton aria-label="날짜" />);
    expect(classes(trigger())).toEqual(
      expect.arrayContaining([
        "active:bg-bg-layer-default-pressed",
        "group-hover/input-button:bg-bg-layer-default-pressed",
      ]),
    );
    expect(
      classes(container.querySelector("[data-slot=input-button-content]")!),
    ).toEqual(
      expect.arrayContaining([
        "peer-active/input-button:[scale:calc(1-2/var(--press-basis))]",
        "motion-reduce:peer-active/input-button:[scale:1]",
      ]),
    );
  });

  it("막히거나 읽기 전용이면 콘텐츠를 줄이지 않고 누름 바탕도 없다", () => {
    render(<InputButton aria-label="날짜" disabled />);
    expect(
      classes(container.querySelector("[data-slot=input-button-content]")!),
    ).not.toContain(
      "peer-active/input-button:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(classes(trigger())).not.toContain(
      "active:bg-bg-layer-default-pressed",
    );
    render(<InputButton aria-label="날짜" readOnly />);
    expect(classes(trigger())).not.toContain(
      "group-hover/input-button:bg-bg-layer-default-pressed",
    );
  });

  it("누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 잰다", () => {
    render(<InputButton aria-label="날짜" />);
    const el = box();
    Object.defineProperty(el, "offsetHeight", {
      configurable: true,
      value: 52,
    });
    Object.defineProperty(el, "offsetWidth", {
      configurable: true,
      value: 320,
    });
    act(() => {
      trigger().dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(el.style.getPropertyValue("--press-basis")).toBe("80");
    // 좁고 낮은 칸은 24 가 바닥이다
    Object.defineProperty(el, "offsetHeight", {
      configurable: true,
      value: 10,
    });
    Object.defineProperty(el, "offsetWidth", { configurable: true, value: 40 });
    act(() => {
      trigger().dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
    });
    expect(el.style.getPropertyValue("--press-basis")).toBe("24");
  });

  it("포커스 링은 키보드 포커스에만(focus-visible) — 바깥 2px · 띄움 2px", () => {
    render(<InputButton aria-label="날짜" />);
    expect(classes(trigger())).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-stroke-focus-ring",
      ]),
    );
  });

  it("오류는 안쪽 2px(::after)를 빨갛게 — 눌러도 그대로, 내용이 밀리지 않는다", () => {
    render(<InputButton aria-label="날짜" aria-invalid />);
    expect(trigger().getAttribute("aria-invalid")).toBe("true");
    expect(box().hasAttribute("data-invalid")).toBe(true);
    expect(classes(trigger())).toEqual(
      expect.arrayContaining([
        "after:border-stroke-critical-solid",
        "after:border-2",
        "after:absolute",
        "after:inset-0",
      ]),
    );
    render(<InputButton aria-label="날짜" />);
    expect(classes(trigger())).not.toContain(
      "after:border-stroke-critical-solid",
    );
  });
});

describe("이름 · 설명", () => {
  it("Field 안에서는 라벨 + 고른 값이 이름이다 — 비면 라벨 + placeholder", () => {
    render(
      <Field label="날짜">
        <InputButton placeholder="날짜 선택" />
      </Field>,
    );
    expect(textsOf(trigger(), "aria-labelledby")).toEqual([
      "날짜",
      "날짜 선택",
    ]);
    render(
      <Field label="날짜">
        <InputButton placeholder="날짜 선택" value="10월 1일 (목)" />
      </Field>,
    );
    expect(textsOf(trigger(), "aria-labelledby")).toEqual([
      "날짜",
      "10월 1일 (목)",
    ]);
  });

  it("aria-label 을 주면 라벨 대신 그 글 + 값이다 · aria-labelledby 를 주면 그대로", () => {
    render(
      <InputButton
        aria-label="생일"
        value="10월 1일"
        placeholder="날짜 선택"
      />,
    );
    const ids = (trigger().getAttribute("aria-labelledby") ?? "").split(" ");
    expect(ids[0]).toBe(trigger().id);
    expect(textsOf(trigger(), "aria-labelledby").slice(1)).toEqual([
      "10월 1일",
    ]);
    render(
      <>
        <span id="mine">내 이름</span>
        <InputButton aria-labelledby="mine" />
      </>,
    );
    expect(trigger().getAttribute("aria-labelledby")).toBe("mine");
  });

  it("Field 의 설명 · 오류 · 필수 · 막힘을 받는다 — 필수는 설명으로 읽힌다", () => {
    render(
      <Field label="날짜" required invalid errorMessage="날짜를 골라주세요.">
        <InputButton placeholder="날짜 선택" />
      </Field>,
    );
    expect(trigger().getAttribute("aria-invalid")).toBe("true");
    // 버튼에는 aria-required 를 달 수 없다
    expect(trigger().hasAttribute("aria-required")).toBe(false);
    const described = textsOf(trigger(), "aria-describedby");
    expect(described).toContain("필수");
    expect(described).toContain("날짜를 골라주세요.");
    render(
      <Field label="날짜" disabled>
        <InputButton value="10월 1일" />
      </Field>,
    );
    expect(trigger().disabled).toBe(true);
    render(
      <Field label="입사일" readOnly>
        <InputButton value="2024년 3월 4일" />
      </Field>,
    );
    expect(trigger().getAttribute("aria-disabled")).toBe("true");
  });

  it("붙이개 글(단위)은 설명으로 읽힌다", () => {
    render(
      <InputButton aria-label="나이" prefix="만" value="29" suffix="세" />,
    );
    expect(textsOf(trigger(), "aria-describedby")).toEqual(["만", "세"]);
  });

  it("Field 의 라벨을 눌러도 열리지 않는다 — 포커스만 옮긴다", () => {
    const onClick = vi.fn();
    render(
      <Field label="날짜">
        <InputButton placeholder="날짜 선택" onClick={onClick} />
      </Field>,
    );
    const label = container.querySelector("label");
    expect(label).not.toBeNull();
    act(() => label!.click());
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });
});

describe("useInputButtonSurface", () => {
  function Probe() {
    return <span data-testid="surface">{useInputButtonSurface()}</span>;
  }
  const surface = () =>
    container.querySelector("[data-testid=surface]")!.textContent;
  const stubWidth = (wide: boolean) => {
    const listeners = new Set<() => void>();
    const mql = {
      matches: wide,
      addEventListener: (_: string, f: () => void) => listeners.add(f),
      removeEventListener: (_: string, f: () => void) => listeners.delete(f),
    };
    vi.stubGlobal("matchMedia", (q: string) => {
      expect(q).toBe("(min-width: 1280px)");
      return mql;
    });
    return {
      change(next: boolean) {
        mql.matches = next;
        act(() => listeners.forEach((f) => f()));
      },
    };
  };

  it("1280 미만은 시트, 이상은 팝오버 — 폭이 바뀌면 따라간다", () => {
    const m = stubWidth(false);
    render(<Probe />);
    expect(surface()).toBe("sheet");
    m.change(true);
    expect(surface()).toBe("popover");
    m.change(false);
    expect(surface()).toBe("sheet");
  });
});
