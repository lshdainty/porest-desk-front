// Radio Group 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(누르는 영역 44 · 누름 축소 · 전환 시간 · 글꼴 — radio-group.measure.mjs 머리)은 여기서 클래스로 본다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "@/shared/ds/field";

import { Radio, RadioGroup, Radiomark } from "./radio-group";

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
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const radios = () =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("[role=radio]"));
const radio = (label: string) =>
  radios().find((r) => r.labels?.[0]?.textContent === label)!;
const dot = (r: HTMLElement) => r.querySelector("span")!;
const text = (row: Element) => row.querySelector<HTMLElement>(":scope > span")!;
const classes = (el: Element) => el.getAttribute("class")!.split(" ");
const checked = () => radios().map((r) => r.getAttribute("aria-checked"));
const describedBy = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);

const Repeat = (props: {
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  disabledYearly?: boolean;
  disabled?: boolean;
}) => (
  <RadioGroup
    aria-label="반복"
    defaultValue={props.defaultValue}
    onValueChange={props.onValueChange}
    disabled={props.disabled}
  >
    <Radio value="none" label="반복 없음" />
    <Radio value="monthly" label="매월" />
    <Radio value="yearly" label="매년" disabled={props.disabledYearly} />
  </RadioGroup>
);

describe("RadioGroup · Radio", () => {
  it("묶음은 role=radiogroup · 세로로 쌓고 줄 사이 12, 선택지는 role=radio 이고 라벨과 <label for> 로 잇는다 — 기본은 medium · neutral · regular", () => {
    const group = render(<Repeat defaultValue="none" />);
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("반복");
    expect(classes(group)).toEqual(["flex", "flex-col", "gap-x3"]);
    const row = radio("매월").labels![0]!;
    expect(row.tagName).toBe("LABEL");
    expect(row.getAttribute("for")).toBe(radio("매월").id);
    expect(radio("매월").type).toBe("button");
    expect(checked()).toEqual(["true", "false", "false"]);
    expect(classes(radio("매월"))).toEqual(
      expect.arrayContaining([
        "size-5",
        "rounded-full",
        "border",
        "border-stroke-neutral-solid",
        "bg-transparent",
        "data-[state=checked]:border-0",
        "data-[state=checked]:bg-bg-neutral-inverted",
      ]),
    );
    expect(classes(row)).toEqual(
      expect.arrayContaining(["min-h-8", "gap-x2", "self-start"]),
    );
    expect(classes(text(row))).toEqual(
      expect.arrayContaining([
        "font-sans",
        "text-t4",
        "font-normal",
        "text-fg-neutral",
      ]),
    );
  });

  it("누르면 그 선택지를 고르고 앞에 고른 것은 풀린다 — 고른 것을 다시 눌러도 그대로다(라벨을 눌러도 같다)", () => {
    const onValueChange = vi.fn();
    render(<Repeat defaultValue="none" onValueChange={onValueChange} />);
    act(() => radio("매월").click());
    expect(checked()).toEqual(["false", "true", "false"]);
    expect(onValueChange).toHaveBeenLastCalledWith("monthly");
    act(() => radio("매월").click());
    expect(checked()).toEqual(["false", "true", "false"]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    act(() => text(radio("매년").labels![0]!).click());
    expect(checked()).toEqual(["false", "false", "true"]);
    expect(onValueChange).toHaveBeenLastCalledWith("yearly");
  });

  it("점은 늘 그려 두고(forceMount) 색만 바꾼다 — 선택 안 됨에도 자리에 있다", () => {
    render(<Repeat defaultValue="none" />);
    expect(dot(radio("매월")).dataset.state).toBe("unchecked");
    expect(classes(dot(radio("매월")))).toEqual(
      expect.arrayContaining([
        "pointer-events-none",
        "block",
        "rounded-full",
        "bg-transparent",
        "size-2",
        "data-[state=checked]:bg-fg-neutral-inverted",
        "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
      ]),
    );
    act(() => radio("매월").click());
    expect(dot(radio("매월")).dataset.state).toBe("checked");
    expect(dot(radio("반복 없음")).dataset.state).toBe("unchecked");
  });

  it("Tab 은 고른 선택지에 선다 — 묶음이 탭 자리를 갖고, 들어오면 고른 선택지(없으면 첫 선택지)로 넘긴다", () => {
    const group = render(<Repeat defaultValue="monthly" />);
    expect(group.tabIndex).toBe(0);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, -1, -1]);
    act(() => group.focus());
    expect(document.activeElement).toBe(radio("매월"));
    // 포커스만으로는 고르지 않는다
    expect(checked()).toEqual(["false", "true", "false"]);

    act(() => root.unmount());
    root = createRoot(container);
    const empty = render(<Repeat />);
    act(() => empty.focus());
    expect(document.activeElement).toBe(radio("반복 없음"));
    expect(checked()).toEqual(["false", "false", "false"]);
  });

  it("화살표로 옮기며 고른다 — 막힌 선택지는 건너뛰고 끝에서 처음으로 돈다", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(
      <Repeat
        defaultValue="monthly"
        onValueChange={onValueChange}
        disabledYearly
      />,
    );
    act(() => radio("매월").focus());
    act(() => {
      radio("매월").dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      vi.runAllTimers();
    });
    // 막힌 "매년" 을 건너뛰고 처음(반복 없음)으로 돈다
    expect(document.activeElement).toBe(radio("반복 없음"));
    expect(checked()).toEqual(["true", "false", "false"]);
    expect(onValueChange).toHaveBeenLastCalledWith("none");
  });

  it("막힌 선택지는 누를 수 없다 — 골라 둔 채로 막을 수 있고(점은 data-disabled → fg-disabled), 묶음에 disabled 를 주면 모두 막힌다", () => {
    const onValueChange = vi.fn();
    render(
      <Repeat
        defaultValue="none"
        onValueChange={onValueChange}
        disabledYearly
      />,
    );
    expect(radio("매년").disabled).toBe(true);
    act(() => radio("매년").click());
    expect(onValueChange).not.toHaveBeenCalled();

    // 기본값은 처음 그릴 때만 읽으므로 새로 그린다(key)
    act(() =>
      root.render(<Repeat key="disabled" defaultValue="monthly" disabled />),
    );
    expect(radios().every((r) => r.disabled)).toBe(true);
    expect(radio("매월").getAttribute("aria-checked")).toBe("true");
    expect(dot(radio("매월")).hasAttribute("data-disabled")).toBe(true);
    expect(classes(dot(radio("매월")))).toContain(
      "data-[disabled]:data-[state=checked]:bg-fg-disabled",
    );
    expect(classes(radio("매월"))).toEqual(
      expect.arrayContaining([
        "peer",
        "disabled:cursor-not-allowed",
        "disabled:[scale:1]",
        "disabled:border-stroke-neutral-weak",
        "disabled:bg-bg-disabled",
        "data-[state=checked]:disabled:bg-bg-disabled",
      ]),
    );
    const row = radio("매월").labels![0]!;
    expect(classes(text(row))).toContain("peer-disabled:text-fg-disabled");
    expect(classes(row)).toContain("has-[:disabled]:cursor-not-allowed");
    expect(row.className).not.toMatch(/opacity/);
    expect(radio("매월").className).not.toMatch(/opacity/);
  });

  it("크기 · 톤 · 굵기는 동그라미 · 점 · 줄 · 라벨이 함께 받는다", () => {
    render(
      <RadioGroup aria-label="크기" defaultValue="bold">
        <Radio
          value="bold"
          size="large"
          tone="brand"
          weight="bold"
          label="large · bold"
        />
      </RadioGroup>,
    );
    const mark = radio("large · bold");
    const row = mark.labels![0]!;
    expect(classes(row)).toContain("min-h-9");
    expect(classes(mark)).toEqual(
      expect.arrayContaining([
        "size-6",
        "data-[state=checked]:bg-bg-brand-solid",
        "data-[state=checked]:group-hover/radio:bg-bg-brand-solid-pressed",
      ]),
    );
    expect(classes(mark)).not.toContain(
      "data-[state=checked]:bg-bg-neutral-inverted",
    );
    expect(classes(dot(mark))).toEqual(
      expect.arrayContaining([
        "size-2.5",
        "data-[state=checked]:bg-static-white",
      ]),
    );
    expect(classes(text(row))).toEqual(
      expect.arrayContaining(["text-t5", "font-bold"]),
    );
  });

  it("누르는 영역(root.touchTarget 44 × 44) — 줄의 ::before 가 줄을 가운데에 두고 가로 · 세로 44 까지 넓힌다", () => {
    render(<Repeat defaultValue="none" />);
    expect(classes(radio("매월").labels![0]!)).toEqual(
      expect.arrayContaining([
        "relative",
        "before:absolute",
        "before:left-1/2",
        "before:top-1/2",
        "before:-translate-x-1/2",
        "before:-translate-y-1/2",
        "before:h-full",
        "before:w-full",
        "before:min-h-11",
        "before:min-w-11",
        "before:content-['']",
      ]),
    );
  });

  it("누름(radiomark.scale) — 동그라미만 기준 길이 24 에서 세로 2px 거리로 준다. 라벨을 눌러도(group/radio) 같고, 모션 줄이기면 없다. 전환은 색 150ms + 축소", () => {
    for (const size of ["medium", "large"] as const) {
      render(
        <RadioGroup aria-label={size}>
          <Radio value={size} size={size} label={size} />
        </RadioGroup>,
      );
      const row = radio(size).labels![0]!;
      expect(classes(row)).toContain("group/radio");
      expect(classes(radio(size))).toEqual(
        expect.arrayContaining([
          "[--press-basis:24]",
          "active:[scale:calc(1-2/var(--press-basis))]",
          "group-active/radio:[scale:calc(1-2/var(--press-basis))]",
          "motion-reduce:active:[scale:1]",
          "motion-reduce:group-active/radio:[scale:1]",
          "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
        ]),
      );
      // 라벨은 줄지 않는다
      expect(text(row).className).not.toMatch(/scale/);
    }
  });

  it("키보드 포커스에만 링 2px · 띄움 2px(stroke-focus-ring)", () => {
    render(<Repeat defaultValue="none" />);
    expect(classes(radio("반복 없음"))).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-stroke-focus-ring",
      ]),
    );
  });

  it("id 를 주면 라벨이 그 id 로 간다", () => {
    render(
      <RadioGroup aria-label="반복">
        <Radio id="repeat-none" value="none" label="반복 없음" />
      </RadioGroup>,
    );
    expect(radio("반복 없음").id).toBe("repeat-none");
    expect(radio("반복 없음").labels![0]!.getAttribute("for")).toBe(
      "repeat-none",
    );
  });

  it("값을 밖에서 쥐면 그 값을 따른다 — null 이면 아무것도 고르지 않은 채로 쥔다", () => {
    const Controlled = () => {
      const [repeat, setRepeat] = useState<string | null>(null);
      return (
        <RadioGroup aria-label="반복" value={repeat} onValueChange={setRepeat}>
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
        </RadioGroup>
      );
    };
    render(<Controlled />);
    expect(checked()).toEqual(["false", "false"]);
    act(() => radio("매월").click());
    expect(checked()).toEqual(["false", "true"]);

    const onValueChange = vi.fn();
    act(() =>
      root.render(
        <RadioGroup
          aria-label="반복"
          value="none"
          onValueChange={onValueChange}
        >
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
        </RadioGroup>,
      ),
    );
    act(() => radio("매월").click());
    expect(onValueChange).toHaveBeenCalledWith("monthly");
    expect(checked()).toEqual(["true", "false"]);
  });

  it("폼 안에서는 묶음의 name 으로 숨은 radio 가 제출된다 — 라벨 글은 그대로 줄 바로 아래 span", () => {
    // jsdom 에 없다 — Radix 의 숨은 input 이 동그라미 크기를 잴 때 쓴다
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const form = render(
      <form>
        <RadioGroup aria-label="반복" name="repeat" defaultValue="monthly">
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
        </RadioGroup>
      </form>,
    ) as HTMLFormElement;
    expect(form.querySelectorAll("input[type=radio]")).toHaveLength(2);
    expect(new FormData(form).get("repeat")).toBe("monthly");
    expect(text(radio("매월").labels![0]!).textContent).toBe("매월");
    act(() => radio("반복 없음").click());
    expect(new FormData(form).get("repeat")).toBe("none");
  });

  it("Field 로 감싸면 Field 라벨이 묶음의 이름, 설명 · 오류가 묶음의 설명 — 라벨은 <label> 이 아니라 span", () => {
    const Form = ({ invalid }: { invalid: boolean }) => (
      <Field
        label="반복"
        description="고른 주기로 일정을 다시 만들어요."
        invalid={invalid}
        errorMessage="반복을 골라 주세요."
      >
        <RadioGroup>
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
        </RadioGroup>
      </Field>
    );
    render(<Form invalid={false} />);
    const group = container.querySelector("[role=radiogroup]")!;
    const label = container.querySelector("[id$=label]")!;
    expect(label.tagName).toBe("SPAN");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(describedBy(group)).toEqual(["고른 주기로 일정을 다시 만들어요."]);
    // 오류는 설명 자리를 대신하고, 동그라미는 바꾸지 않는다
    act(() => root.render(<Form invalid />));
    expect(describedBy(group)).toEqual(["반복을 골라 주세요."]);
    expect(radios().some((r) => r.hasAttribute("aria-invalid"))).toBe(false);
  });
});

describe("Radiomark", () => {
  it("동그라미만 — 줄을 <label className='group/radio'> 로 감싸면 줄 어디를 눌러도 고르고, 줄의 글자가 이름이 된다", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="반복" onValueChange={onValueChange}>
        <label className="group/radio flex">
          <span>반복 없음</span>
          <Radiomark value="none" />
        </label>
        <label className="group/radio flex">
          <span>매월</span>
          <Radiomark value="monthly" />
        </label>
      </RadioGroup>,
    );
    const rows = container.querySelectorAll("label");
    expect(radios()[1]!.labels?.[0]).toBe(rows[1]);
    act(() => rows[1]!.querySelector<HTMLElement>(":scope > span")!.click());
    expect(onValueChange).toHaveBeenCalledWith("monthly");
    expect(checked()).toEqual(["false", "true"]);
  });
});
