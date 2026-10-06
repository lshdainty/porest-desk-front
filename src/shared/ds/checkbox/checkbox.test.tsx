// Checkbox 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(누르는 영역 44 · 누름 축소 · 전환 · 아이콘 모양 · 글꼴 — checkbox.measure.mjs 머리)은 여기서 클래스로 본다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "@/shared/ds/field";

import { Checkbox, CheckboxGroup, Checkmark } from "./checkbox";

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
  return container.firstElementChild as HTMLElement;
}

const controls = () =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("[role=checkbox]"));
const control = () => controls()[0]!;
const indicator = () => control().querySelector("span")!;
const checkIcon = () => control().querySelector("svg.lucide-check")!;
const minusIcon = () => control().querySelector("svg.lucide-minus")!;
const text = (row: Element) => row.querySelector<HTMLElement>(":scope > span")!;
const classes = (el: Element) => el.getAttribute("class")!.split(" ");
const describedBy = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);

describe("Checkbox", () => {
  it("칸은 role=checkbox · aria-checked 이고 라벨과 <label for> 로 잇는다 — 기본은 medium · square · neutral · regular · 선택 안 됨", () => {
    const row = render(<Checkbox label="단종된 카드도 보기" />);
    expect(row.tagName).toBe("LABEL");
    expect(row.getAttribute("for")).toBe(control().id);
    expect(control().labels?.[0]).toBe(row);
    expect(control().type).toBe("button");
    expect(control().getAttribute("aria-checked")).toBe("false");
    expect(control().dataset.state).toBe("unchecked");
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "size-5",
        "rounded-r1",
        "border",
        "border-stroke-neutral-solid",
        "bg-transparent",
        "[&_svg]:size-3",
        "data-[state=checked]:bg-bg-neutral-inverted",
      ]),
    );
    expect(classes(row)).toEqual(
      expect.arrayContaining(["min-h-8", "gap-x2", "self-start"]),
    );
    expect(text(row).textContent).toBe("단종된 카드도 보기");
    expect(classes(text(row))).toEqual(
      expect.arrayContaining([
        "font-sans",
        "text-t4",
        "font-normal",
        "text-fg-neutral",
      ]),
    );
  });

  it("칸이나 라벨을 누르면 선택 ↔ 선택 안 됨 — onCheckedChange 로 알린다", () => {
    const onCheckedChange = vi.fn();
    const row = render(
      <Checkbox label="금액 고정" onCheckedChange={onCheckedChange} />,
    );
    act(() => control().click());
    expect(control().getAttribute("aria-checked")).toBe("true");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    // 라벨 글자를 눌러도 같다 — 줄(<label>)이 칸을 누른다
    act(() => text(row).click());
    expect(control().getAttribute("aria-checked")).toBe("false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("일부 선택은 aria-checked=mixed — 누르면 선택이 된다", () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        label="전체"
        defaultChecked="indeterminate"
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(control().getAttribute("aria-checked")).toBe("mixed");
    expect(control().dataset.state).toBe("indeterminate");
    act(() => control().click());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control().getAttribute("aria-checked")).toBe("true");
  });

  it("아이콘(icon.glyph) — 체크 · 가로줄(lucide, 선 3)을 늘 그려 두고, 일부 선택일 때만 가로줄 · 아니면 체크를 보인다. Square 의 선택 안 됨은 숨긴다", () => {
    render(<Checkbox label="예산" />);
    expect(classes(control())).toContain("group/checkmark");
    // 선택 안 됨에도 그려 둔다(forceMount) — Square 는 숨기고(none), Ghost 는 옅게 보인다
    expect(indicator().dataset.state).toBe("unchecked");
    expect(classes(indicator())).toEqual([
      "grid",
      "place-items-center",
      "data-[state=unchecked]:invisible",
    ]);
    expect(classes(checkIcon())).toContain(
      "group-data-[state=indeterminate]/checkmark:hidden",
    );
    expect(classes(minusIcon())).toEqual(
      expect.arrayContaining([
        "hidden",
        "group-data-[state=indeterminate]/checkmark:block",
      ]),
    );
    for (const icon of [checkIcon(), minusIcon()]) {
      expect(icon.getAttribute("stroke-width")).toBe("3");
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
    expect(classes(control())).toContain("[&_svg]:pointer-events-none");
  });

  it("Ghost — 칸 없이 체크만, 선택 안 됨도 옅은 체크(fg-placeholder). 칸이 없어 아이콘이 크다(14 · 18)", () => {
    render(<Checkbox shape="ghost" label="금액 가리기" />);
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "border-0",
        "bg-transparent",
        "text-fg-placeholder",
        "[&_svg]:size-3.5",
        "data-[state=checked]:text-fg-neutral",
        "data-[state=checked]:hover:bg-bg-neutral-weak",
      ]),
    );
    expect(classes(indicator())).not.toContain(
      "data-[state=unchecked]:invisible",
    );

    render(
      <Checkbox
        shape="ghost"
        size="large"
        tone="brand"
        label="지난 달 거래 숨기기"
      />,
    );
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "size-6",
        "[&_svg]:size-[18px]",
        "data-[state=checked]:text-fg-brand",
        "data-[state=checked]:group-hover/checkbox:bg-bg-brand-weak-pressed",
      ]),
    );
  });

  it("크기 · 톤 · 굵기는 칸 · 줄 · 라벨이 함께 받는다", () => {
    const row = render(
      <Checkbox
        size="large"
        tone="brand"
        weight="bold"
        defaultChecked
        label="데이터 내보내기"
      />,
    );
    expect(classes(row)).toContain("min-h-9");
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "size-6",
        "[&_svg]:size-3.5",
        "data-[state=checked]:bg-bg-brand-solid",
        "data-[state=checked]:text-static-white",
        "data-[state=checked]:group-active/checkbox:bg-bg-brand-solid-pressed",
      ]),
    );
    expect(classes(control())).not.toContain(
      "data-[state=checked]:bg-bg-neutral-inverted",
    );
    expect(classes(text(row))).toEqual(
      expect.arrayContaining(["text-t5", "font-bold"]),
    );
  });

  it("막히면 누르지 않고 포커스에서 빠진다 — 값은 그대로, 칸 · 라벨은 전용 색(불투명도가 아니다)", () => {
    const onCheckedChange = vi.fn();
    const row = render(
      <Checkbox
        label="이 카드 기억하기"
        disabled
        defaultChecked
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(control().disabled).toBe(true);
    act(() => text(row).click());
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control().getAttribute("aria-checked")).toBe("true");
    expect(indicator().hasAttribute("data-disabled")).toBe(true);
    // 라벨은 칸(peer)이 막히면 fg-disabled, 줄의 커서는 not-allowed, 막힌 칸은 줄지 않는다
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "peer",
        "disabled:cursor-not-allowed",
        "disabled:[scale:1]",
        "data-[state=checked]:disabled:bg-bg-disabled",
        "data-[state=checked]:disabled:text-fg-disabled",
      ]),
    );
    expect(classes(text(row))).toContain("peer-disabled:text-fg-disabled");
    expect(classes(row)).toContain("has-[:disabled]:cursor-not-allowed");
    expect(row.className).not.toMatch(/opacity/);
    expect(control().className).not.toMatch(/opacity/);
  });

  it("누르는 영역(root.touchTarget 44 × 44) — 줄의 ::before 가 줄을 가운데에 두고 가로 · 세로 44 까지 넓힌다", () => {
    const row = render(<Checkbox label="단종된 카드도 보기" />);
    expect(classes(row)).toEqual(
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

  it("누름(checkmark.scale) — 칸만 기준 길이 24 에서 세로 2px 거리로 준다. 라벨을 눌러도(group/checkbox) 같고, 모션 줄이기면 없다. 전환은 색 150ms + 축소", () => {
    for (const size of ["medium", "large"] as const) {
      const row = render(<Checkbox size={size} label={size} />);
      expect(classes(row)).toContain("group/checkbox");
      expect(classes(control())).toEqual(
        expect.arrayContaining([
          "[--press-basis:24]",
          "active:[scale:calc(1-2/var(--press-basis))]",
          "group-active/checkbox:[scale:calc(1-2/var(--press-basis))]",
          "motion-reduce:active:[scale:1]",
          "motion-reduce:group-active/checkbox:[scale:1]",
          "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
        ]),
      );
      // 라벨은 줄지 않는다
      expect(text(row).className).not.toMatch(/scale/);
    }
  });

  it("키보드 포커스에만 링 2px · 띄움 2px(stroke-focus-ring)", () => {
    render(<Checkbox label="단종된 카드도 보기" />);
    expect(classes(control())).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-stroke-focus-ring",
      ]),
    );
    expect(control().tabIndex).toBe(0);
  });

  it("id 를 주면 라벨이 그 id 로 간다", () => {
    const row = render(
      <Checkbox id="remember-card" label="이 카드 기억하기" />,
    );
    expect(control().id).toBe("remember-card");
    expect(row.getAttribute("for")).toBe("remember-card");
  });

  it("값을 밖에서 쥐면 누름은 알리기만 한다 — 바뀐 값을 넣어야 바뀐다", () => {
    const Controlled = () => {
      const [on, setOn] = useState<boolean | "indeterminate">(false);
      return (
        <Checkbox label="금액 고정" checked={on} onCheckedChange={setOn} />
      );
    };
    render(<Controlled />);
    act(() => control().click());
    expect(control().getAttribute("aria-checked")).toBe("true");

    const onCheckedChange = vi.fn();
    act(() =>
      root.render(
        <Checkbox
          label="금액 고정"
          checked={false}
          onCheckedChange={onCheckedChange}
        />,
      ),
    );
    act(() => control().click());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control().getAttribute("aria-checked")).toBe("false");
  });

  it("폼 안에서는 숨은 input 으로 제출된다 — 라벨 글은 그대로 줄 바로 아래 span", () => {
    // jsdom 에 없다 — Radix 의 숨은 input 이 칸 크기를 잴 때 쓴다
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
        <Checkbox name="remember" defaultChecked label="이 카드 기억하기" />
      </form>,
    ) as HTMLFormElement;
    const row = form.querySelector("label")!;
    const input = row.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    expect(input.getAttribute("aria-hidden")).toBe("true");
    expect(new FormData(form).get("remember")).toBe("on");
    expect(text(row).textContent).toBe("이 카드 기억하기");
    act(() => control().click());
    expect(new FormData(form).get("remember")).toBeNull();
  });
});

describe("CheckboxGroup", () => {
  it("묶음은 role=group · 세로로 쌓고 줄 사이 12 — Field 없이 쓰면 이름은 aria-label", () => {
    const group = render(
      <CheckboxGroup aria-label="내보낼 데이터">
        <Checkbox label="거래 내역" />
        <Checkbox label="예산" />
      </CheckboxGroup>,
    );
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("내보낼 데이터");
    expect(classes(group)).toEqual(["flex", "flex-col", "gap-x3"]);
    expect(controls()).toHaveLength(2);
  });

  it("Field 로 감싸면 Field 라벨이 묶음의 이름, 오류 글이 묶음의 설명 — 라벨은 <label> 이 아니라 span", () => {
    render(
      <Field
        label="내보낼 데이터"
        invalid
        errorMessage="내보낼 데이터를 하나 이상 골라 주세요."
      >
        <CheckboxGroup>
          <Checkbox label="거래 내역" />
          <Checkbox label="예산" />
        </CheckboxGroup>
      </Field>,
    );
    const group = container.querySelector("[role=group]")!;
    const label = container.querySelector("[id$=label]")!;
    expect(label.tagName).toBe("SPAN");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(describedBy(group)).toEqual([
      "내보낼 데이터를 하나 이상 골라 주세요.",
    ]);
    // 오류는 칸을 바꾸지 않는다 — 칸에 aria-invalid 를 달지 않는다
    expect(controls().some((c) => c.hasAttribute("aria-invalid"))).toBe(false);
  });

  it("묶음에 준 이름 · 설명이 이긴다 — 설명은 Field 의 설명 뒤에 잇는다", () => {
    render(
      <Field label="내보낼 데이터" description="고른 데이터만 내보내요.">
        <span id="extra">한 파일로</span>
        <CheckboxGroup aria-label="내보낼 항목" aria-describedby="extra">
          <Checkbox label="거래 내역" />
        </CheckboxGroup>
      </Field>,
    );
    const group = container.querySelector("[role=group]")!;
    expect(group.hasAttribute("aria-labelledby")).toBe(false);
    expect(group.getAttribute("aria-label")).toBe("내보낼 항목");
    expect(describedBy(group)).toEqual([
      "고른 데이터만 내보내요.",
      "한 파일로",
    ]);
  });

  it("다시 그려도 Field 연결은 그대로고, 묶음이 빠지면 Field 라벨은 다시 <label> 이 된다", () => {
    const Form = ({ group, hint }: { group: boolean; hint: string }) => (
      <Field label="내보낼 데이터" description={hint}>
        {group ? (
          <CheckboxGroup>
            <Checkbox label="거래 내역" />
          </CheckboxGroup>
        ) : (
          <input aria-label="이름" />
        )}
      </Field>
    );
    render(<Form group hint="첫 설명" />);
    const labelId = container.querySelector("[id$=label]")!.id;
    for (const hint of ["둘째 설명", "셋째 설명"]) {
      act(() => root.render(<Form group hint={hint} />));
      const group = container.querySelector("[role=group]")!;
      expect(container.querySelector("[id$=label]")!.tagName).toBe("SPAN");
      expect(group.getAttribute("aria-labelledby")).toBe(labelId);
      expect(describedBy(group)).toEqual([hint]);
    }
    act(() => root.render(<Form group={false} hint="셋째 설명" />));
    expect(container.querySelector("[id$=label]")!.tagName).toBe("LABEL");
  });

  it("부모 · 자식 — 자식을 일부만 고르면 부모는 일부 선택, 부모를 누르면 모두 고른다(checkbox.md 코드)", () => {
    const all = ["tx", "budget", "memo"];
    const Export = () => {
      const [picked, setPicked] = useState<string[]>(["tx"]);
      const parent =
        picked.length === all.length
          ? true
          : picked.length
            ? "indeterminate"
            : false;
      return (
        <CheckboxGroup aria-label="내보낼 데이터">
          <Checkbox
            weight="bold"
            label="전체"
            checked={parent}
            onCheckedChange={(v) => setPicked(v === true ? [...all] : [])}
          />
          {all.map((id) => (
            <Checkbox
              key={id}
              label={id}
              checked={picked.includes(id)}
              onCheckedChange={(v) =>
                setPicked((p) => (v ? [...p, id] : p.filter((x) => x !== id)))
              }
            />
          ))}
        </CheckboxGroup>
      );
    };
    render(<Export />);
    const state = () => controls().map((c) => c.getAttribute("aria-checked"));
    expect(state()).toEqual(["mixed", "true", "false", "false"]);
    act(() => controls()[0]!.click());
    expect(state()).toEqual(["true", "true", "true", "true"]);
    act(() => controls()[0]!.click());
    expect(state()).toEqual(["false", "false", "false", "false"]);
  });
});

describe("Checkmark", () => {
  it("칸만 — 이름은 aria-label, 행을 <label className='group/checkbox'> 로 감싸면 행 어디를 눌러도 고른다", () => {
    const onCheckedChange = vi.fn();
    const row = render(
      <label className="group/checkbox flex">
        <Checkmark
          aria-label="9월 25일 월급 선택"
          onCheckedChange={onCheckedChange}
        />
        <span>월급</span>
        <span>+3,200,000원</span>
      </label>,
    );
    expect(control().getAttribute("aria-label")).toBe("9월 25일 월급 선택");
    expect(control().labels?.[0]).toBe(row);
    act(() =>
      row.querySelector<HTMLElement>(":scope > span:last-child")!.click(),
    );
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control().getAttribute("aria-checked")).toBe("true");
  });
});
