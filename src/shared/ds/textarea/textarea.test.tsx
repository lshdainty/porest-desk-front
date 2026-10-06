// Textarea 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(안쪽 그림자 · ::after 테두리 · 그 전환 · placeholder · 반응형 · 최대 높이)은 여기서 본다(textarea.measure.mjs 머리).
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field, setNativeValue } from "@/shared/ds/field";

import { Textarea } from "./textarea";

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

const box = () => container.querySelector<HTMLElement>("[data-slot=textarea]")!;
const area = () => container.querySelector("textarea")!;
const classes = (el: Element) => el.className.split(/\s+/);
const describedBy = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);

// jsdom 은 레이아웃이 없다 — 내용 높이(scrollHeight)를 정해 준다
let contentHeight = 0;
beforeEach(() => {
  contentHeight = 0;
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => contentHeight,
  });
});
afterEach(() => {
  delete (HTMLTextAreaElement.prototype as { scrollHeight?: number })
    .scrollHeight;
});

// 폭 관찰 — 만든 수 · 끊은 수를 세고, 관찰 콜백을 직접 부른다
function stubResizeObserver() {
  const made: { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[] =
    [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect = vi.fn();
      constructor(callback: () => void) {
        made.push({ callback, disconnect: this.disconnect });
      }
      observe() {}
      unobserve() {}
    },
  );
  return made;
}

describe("Textarea", () => {
  it("기본은 자동 높이 · responsive — 3줄(rows 3)에서 시작하고, 끄면 2줄(rows 2). rows 를 주면 그 값", () => {
    render(<Textarea aria-label="메모" />);
    expect(box().dataset.size).toBe("responsive");
    expect(area().rows).toBe(3);
    expect(classes(area())).toEqual(
      expect.arrayContaining(["min-h-[5.875rem]", "lg:min-h-[5.125rem]"]),
    );

    render(<Textarea aria-label="메모" autoSize={false} />);
    expect(area().rows).toBe(2);
    expect(classes(area())).toEqual(
      expect.arrayContaining([
        "min-h-[4.5rem]",
        "lg:min-h-[3.875rem]",
        "overflow-y-auto",
      ]),
    );

    render(<Textarea aria-label="메모" rows={6} />);
    expect(area().rows).toBe(6);
  });

  it("className 은 입력(<textarea>)에(최대 · 고정 높이도 여기), rootClassName 은 상자에 · ref 는 입력", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(
      <Textarea
        ref={ref}
        aria-label="메모"
        className="max-h-60"
        rootClassName="mt-x1"
      />,
    );
    expect(ref.current).toBe(area());
    expect(classes(area())).toContain("max-h-60");
    expect(classes(box())).toContain("mt-x1");
  });

  it("자동 높이 — 쓴 만큼 자라고, 최대 높이에서 멈추고 칸 안에서 스크롤한다", () => {
    const onChange = vi.fn();
    contentHeight = 94;
    render(
      <Textarea
        aria-label="메모"
        style={{ maxHeight: "136px" }}
        onChange={onChange}
      />,
    );
    expect(area().style.height).toBe("94px");
    expect(area().style.overflowY).toBe("hidden");

    contentHeight = 116;
    act(() => setNativeValue(area(), "한 줄\n두 줄\n세 줄\n네 줄"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(area().style.height).toBe("116px");
    expect(area().style.overflowY).toBe("hidden");

    contentHeight = 200;
    act(() => setNativeValue(area(), "한 줄\n두 줄\n세 줄\n네 줄\n…\n…"));
    expect(area().style.height).toBe("136px");
    expect(area().style.overflowY).toBe("auto");
  });

  it("값이 밖에서 바뀌어도(제어 값) 높이를 다시 맞춘다", () => {
    contentHeight = 94;
    render(<Textarea aria-label="메모" value="" onChange={() => {}} />);
    expect(area().style.height).toBe("94px");
    contentHeight = 160;
    render(
      <Textarea
        aria-label="메모"
        value={"가\n나\n다\n라\n마\n바"}
        onChange={() => {}}
      />,
    );
    expect(area().style.height).toBe("160px");
  });

  it("고정 높이(autoSize false)는 맞추지 않는다 — 높이는 자리마다, 넘치면 칸 안에서 스크롤", () => {
    contentHeight = 400;
    render(
      <Textarea aria-label="공지 본문" autoSize={false} className="h-60" />,
    );
    act(() => setNativeValue(area(), "긴 글"));
    expect(area().style.height).toBe("");
    expect(area().style.overflowY).toBe("");
  });

  it("폭 관찰은 한 번만 건다 — 다시 그려도 다시 걸지 않고(컴파일하지 않은 코드에서도), 폭이 바뀔 때만 높이를 맞춘다", () => {
    const made = stubResizeObserver();
    contentHeight = 94;
    render(<Textarea aria-label="메모" placeholder="하나" />);
    render(<Textarea aria-label="메모" placeholder="둘" />);
    act(() => setNativeValue(area(), "가"));
    render(<Textarea aria-label="메모" placeholder="셋" onChange={() => {}} />);
    expect(made).toHaveLength(1);
    expect(made[0]!.disconnect).not.toHaveBeenCalled();

    // 높이만 바뀐 것(맞추기가 바꾼 높이)은 넘긴다
    contentHeight = 140;
    act(() => made[0]!.callback());
    expect(area().style.height).toBe("94px");
    // 폭이 바뀌어 줄이 다시 감기면 맞춘다
    Object.defineProperty(area(), "offsetWidth", {
      configurable: true,
      get: () => 240,
    });
    act(() => made[0]!.callback());
    expect(area().style.height).toBe("140px");

    // 자동 높이를 끄면 관찰을 끊는다
    render(<Textarea aria-label="메모" autoSize={false} />);
    expect(made[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(made).toHaveLength(1);
  });

  it("테두리는 안쪽 1px 그림자, 포커스 · 오류 2px 는 ::after 에 덧그린다 — 읽기 전용이면 포커스 테두리가 없고, 오류는 포커스해도 빨갛다", () => {
    render(<Textarea aria-label="메모" size="large" />);
    expect(classes(box())).toEqual(
      expect.arrayContaining([
        "shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]",
        "after:border-2",
        "after:border-transparent",
        "[&:has(textarea:focus):not([data-invalid]):not([data-readonly])]:after:border-stroke-neutral-contrast",
        "data-[invalid]:after:border-stroke-critical-solid",
        "after:[transition:border-color_var(--motion-duration-d2)_var(--motion-ease-easing)]",
        "data-[disabled]:bg-bg-disabled",
        "data-[readonly]:bg-bg-disabled",
      ]),
    );
    // 반응형(기본)은 1280(lg) 이상에서 medium 의 값
    render(<Textarea aria-label="메모" />);
    expect(classes(box())).toEqual(
      expect.arrayContaining([
        "rounded-r3",
        "text-t5",
        "lg:rounded-r2",
        "lg:text-t4",
        "lg:[--textarea-px:var(--spacing-x3_5)]",
        "lg:[--textarea-py:var(--spacing-x3)]",
      ]),
    );
  });

  it("오류 · 비활성 · 읽기 전용은 상자의 data-* 로 — 글자 · placeholder 는 비활성이면 fg-disabled", () => {
    render(<Textarea aria-label="메모" aria-invalid />);
    expect(box().dataset.invalid).toBe("true");
    expect(classes(area())).toEqual(
      expect.arrayContaining([
        "text-fg-neutral",
        "placeholder:text-fg-placeholder",
        "resize-none",
      ]),
    );

    render(<Textarea aria-label="메모" disabled />);
    expect(box().dataset.disabled).toBe("true");
    expect(area().disabled).toBe(true);
    expect(classes(area())).toEqual(
      expect.arrayContaining([
        "text-fg-disabled",
        "placeholder:text-fg-disabled",
      ]),
    );

    // 읽기 전용은 바탕만 — 값은 진한 글자 그대로
    render(<Textarea aria-label="메모" readOnly />);
    expect(box().dataset.readonly).toBe("true");
    expect(area().readOnly).toBe(true);
    expect(classes(area())).toContain("text-fg-neutral");
  });

  it("Field 안이면 id · 설명 · 오류 · 필수 · 막힘을 받고, 최대 글자 수에서 멈춘다", () => {
    const onChange = vi.fn();
    render(
      <Field
        label="휴가 사유"
        description="결재자에게 보여요."
        required
        maxGraphemeCount={4}
      >
        <Textarea onChange={onChange} />
      </Field>,
    );
    const label = container.querySelector("label")!;
    expect(label.getAttribute("for")).toBe(area().id);
    expect(area().getAttribute("aria-required")).toBe("true");
    expect(describedBy(area())).toEqual(["결재자에게 보여요.", "0/4"]);

    act(() => setNativeValue(area(), "가족 행사"));
    expect(area().value).toBe("가족 행");
    expect(container.querySelector("[id$=count]")!.textContent).toBe("4/4");
    expect(onChange).toHaveBeenCalledTimes(1);

    render(
      <Field
        label="휴가 사유"
        invalid
        errorMessage="사유를 입력해 주세요."
        readOnly
      >
        <Textarea />
      </Field>,
    );
    expect(area().getAttribute("aria-invalid")).toBe("true");
    expect(area().readOnly).toBe(true);
    expect(box().dataset.invalid).toBe("true");
    expect(box().dataset.readonly).toBe("true");
  });
});
