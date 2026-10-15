// Slider 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// jsdom 은 길이를 재지 못해 손잡이 줄 폭을 320 으로 속인다 — 손잡이 가운데는 트랙 끝에서 10 들어오므로 x = 10 + 300 × 비율.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "@/shared/ds/field";

import { RangeSlider, Slider, SliderValue } from "./slider";

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
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 320,
    bottom: 44,
    width: 320,
    height: 44,
    toJSON: () => ({}),
  });
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.hasPointerCapture = () => false;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

const thumbs = () =>
  Array.from(container.querySelectorAll<HTMLElement>("[role=slider]"));
const thumb = (i = 0) => thumbs()[i]!;
const control = () =>
  container.querySelector<HTMLElement>("[data-slot=slider-control]")!;
const indicator = (i = 0) =>
  container.querySelectorAll<HTMLElement>("[data-slot=slider-value-indicator]")[
    i
  ]!;
const markers = () =>
  Array.from(
    container.querySelectorAll("[data-slot=slider-marker]"),
    (n) => n.textContent,
  );

function key(el: HTMLElement, k: string, init: KeyboardEventInit = {}) {
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: k,
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );
  });
}

function pointer(
  el: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
  pointerType = "mouse",
) {
  const e = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    button: 0,
  });
  Object.assign(e, { pointerId: 1, pointerType });
  act(() => {
    el.dispatchEvent(e);
  });
}

describe("Slider — 읽기", () => {
  it("손잡이는 role=slider · 범위 · 지금 값 · 단위 붙은 값 글을 갖는다", () => {
    render(
      <Slider
        aria-label="예산 알림 임계값"
        min={50}
        max={100}
        step={5}
        defaultValue={80}
        formatValue={(v) => `${v}%`}
      />,
    );
    const t = thumb();
    expect(t.getAttribute("aria-valuemin")).toBe("50");
    expect(t.getAttribute("aria-valuemax")).toBe("100");
    expect(t.getAttribute("aria-valuenow")).toBe("80");
    expect(t.getAttribute("aria-valuetext")).toBe("80%");
    expect(t.getAttribute("aria-label")).toBe("예산 알림 임계값");
    expect(t.getAttribute("aria-orientation")).toBe("horizontal");
    expect(t.tabIndex).toBe(0);
  });

  it("Field 안이면 Field 라벨이 이름 · 설명이 설명이고, 머리 값 · 말풍선 · 표식은 보조 기술에 숨긴다", () => {
    render(
      <Field
        label="예산 알림 임계값"
        headerAction={<SliderValue>80%</SliderValue>}
        description="예산 사용률이 이 값을 넘으면 알려줘요."
      >
        <Slider min={50} max={100} step={5} defaultValue={80} />
      </Field>,
    );
    const t = thumb();
    const name = t.getAttribute("aria-labelledby")!;
    expect(document.getElementById(name)?.textContent).toContain(
      "예산 알림 임계값",
    );
    const described = t.getAttribute("aria-describedby")!;
    expect(document.getElementById(described)?.textContent).toContain(
      "넘으면 알려줘요",
    );
    // 이름 자리에 값을 넣지 않는다
    expect(t.getAttribute("aria-label")).toBeNull();
    const value = container.querySelector("[data-slot=slider-value]")!;
    expect(value.getAttribute("aria-hidden")).toBe("true");
    expect(
      container
        .querySelector("[data-slot=slider-markers]")!
        .getAttribute("aria-hidden"),
    ).toBe("true");
    expect(indicator().getAttribute("aria-hidden")).toBe("true");
  });

  it("Field 의 막힘을 받는다 — 손잡이도 머리 값도", () => {
    render(
      <Field
        label="만족도"
        disabled
        headerAction={<SliderValue>4점</SliderValue>}
      >
        <Slider min={1} max={5} defaultValue={4} />
      </Field>,
    );
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
    expect(
      container
        .querySelector("[data-slot=slider-value]")!
        .hasAttribute("data-disabled"),
    ).toBe(true);
  });

  it("Field 가 invalid 면 손잡이가 aria-invalid — 모양은 바뀌지 않는다", () => {
    render(
      <Field label="임계값" invalid errorMessage="저장하지 못했어요.">
        <Slider defaultValue={30} />
      </Field>,
    );
    expect(thumb().getAttribute("aria-invalid")).toBe("true");
  });
});

describe("Slider — 키보드", () => {
  const setup = (props: Partial<Parameters<typeof Slider>[0]> = {}) => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="값"
        defaultValue={50}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        {...props}
      />,
    );
    return { onValueChange, onValueCommit };
  };

  it("화살표는 한 단계, 키마다 onValueCommit 이 한 번", () => {
    const { onValueChange, onValueCommit } = setup({ step: 5 });
    key(thumb(), "ArrowRight");
    expect(thumb().getAttribute("aria-valuenow")).toBe("55");
    key(thumb(), "ArrowUp");
    expect(thumb().getAttribute("aria-valuenow")).toBe("60");
    key(thumb(), "ArrowLeft");
    key(thumb(), "ArrowDown");
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    expect(onValueChange).toHaveBeenCalledTimes(4);
    expect(onValueCommit).toHaveBeenCalledTimes(4);
    expect(onValueCommit).toHaveBeenLastCalledWith(50);
  });

  it("Shift + 화살표 · PageUp · PageDown 은 10단계 — 끝에서 멈춘다", () => {
    setup();
    key(thumb(), "ArrowRight", { shiftKey: true });
    expect(thumb().getAttribute("aria-valuenow")).toBe("60");
    key(thumb(), "PageUp");
    expect(thumb().getAttribute("aria-valuenow")).toBe("70");
    key(thumb(), "PageDown");
    key(thumb(), "ArrowLeft", { shiftKey: true });
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    key(thumb(), "PageUp");
    key(thumb(), "PageUp");
    key(thumb(), "PageUp");
    key(thumb(), "PageUp");
    key(thumb(), "PageUp");
    expect(thumb().getAttribute("aria-valuenow")).toBe("100");
  });

  it("Home · End 는 최솟값 · 최댓값 — 이미 끝이면 값이 안 바뀌니 저장도 안 한다", () => {
    const { onValueCommit } = setup({ min: 10, max: 90 });
    key(thumb(), "End");
    expect(thumb().getAttribute("aria-valuenow")).toBe("90");
    key(thumb(), "End");
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    key(thumb(), "Home");
    expect(thumb().getAttribute("aria-valuenow")).toBe("10");
    key(thumb(), "ArrowLeft");
    expect(thumb().getAttribute("aria-valuenow")).toBe("10");
    expect(onValueCommit).toHaveBeenCalledTimes(2);
  });

  it("RTL 은 ← → 가 반대이고 ↑ 는 늘 늘린다", () => {
    setup({ dir: "rtl" });
    key(thumb(), "ArrowLeft");
    expect(thumb().getAttribute("aria-valuenow")).toBe("51");
    key(thumb(), "ArrowRight");
    key(thumb(), "ArrowRight");
    expect(thumb().getAttribute("aria-valuenow")).toBe("49");
    key(thumb(), "ArrowUp");
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
  });

  it("그 밖의 키는 건드리지 않는다", () => {
    const { onValueCommit } = setup();
    key(thumb(), "a");
    key(thumb(), "Tab");
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it("소수 단계는 부동소수 오차 없이 맞춘다 — 0.1 씩", () => {
    setup({ min: 0, max: 1, step: 0.1, defaultValue: 0.2 });
    key(thumb(), "ArrowRight");
    expect(thumb().getAttribute("aria-valuenow")).toBe("0.3");
  });

  it("막히면 키가 먹지 않고 Tab 순서에서 빠진다", () => {
    const { onValueCommit } = setup({ disabled: true });
    expect(thumb().tabIndex).toBe(-1);
    expect(thumb().getAttribute("aria-disabled")).toBe("true");
    key(thumb(), "ArrowRight");
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    expect(onValueCommit).not.toHaveBeenCalled();
  });
});

describe("Slider — 눈금 · 표식", () => {
  it("구간이 6개 이상이면 눈금 없이 양 끝 표식만", () => {
    render(
      <Slider
        aria-label="값"
        min={50}
        max={100}
        step={5}
        formatValue={(v) => `${v}%`}
      />,
    );
    expect(markers()).toEqual(["50%", "100%"]);
    expect(control().parentElement!.dataset.ticks).toBe("none");
  });

  it("구간이 2 ~ 5개면 단계마다 표식 · 트랙을 끊는 틈 — 별점 1 ~ 5 는 틈 3 · 표식 5", () => {
    render(
      <Slider
        aria-label="만족도"
        min={1}
        max={5}
        formatValue={(v) => `${v}점`}
      />,
    );
    expect(markers()).toEqual(["1점", "2점", "3점", "4점", "5점"]);
    const track = container.querySelector<HTMLElement>(
      "[data-slot=slider-track]",
    )!;
    expect(control().parentElement!.dataset.ticks).toBe("discrete");
    // 틈(마스크)은 jsdom 이 그리지 못해 크로미움 검사(ds:check 견본)가 본다 — 여기서는 눈금 갈래만
    expect(track).not.toBeNull();
  });

  it("구간이 정수로 떨어지지 않거나 한 구간이면 눈금이 없다", () => {
    render(<Slider aria-label="값" min={0} max={10} step={4} />);
    expect(markers()).toEqual(["0", "10"]);
    act(() => root.render(<Slider aria-label="값" min={0} max={5} step={5} />));
    expect(markers()).toEqual(["0", "5"]);
  });

  it("min = max 여도 깨지지 않는다", () => {
    render(<Slider aria-label="값" min={3} max={3} defaultValue={3} />);
    expect(thumb().getAttribute("aria-valuenow")).toBe("3");
    key(thumb(), "ArrowRight");
    expect(thumb().getAttribute("aria-valuenow")).toBe("3");
  });
});

describe("Slider — 누르기 · 끌기", () => {
  it("트랙을 누르면 가장 가까운 단계로 건너뛰고 말풍선은 뜨지 않으며, 놓으면 한 번 저장한다", () => {
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="값"
        min={50}
        max={100}
        step={5}
        defaultValue={80}
        onValueCommit={onValueCommit}
      />,
    );
    // 값 70 의 자리 = 10 + 300 × 0.4 = 130
    pointer(control(), "pointerdown", 130);
    expect(thumb().getAttribute("aria-valuenow")).toBe("70");
    expect(indicator().dataset.state).toBe("closed");
    expect(onValueCommit).not.toHaveBeenCalled();
    pointer(control(), "pointerup", 130);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(70);
  });

  it("누른 자리가 두 단계 사이면 가까운 단계로 맞춘다", () => {
    render(
      <Slider aria-label="값" min={0} max={100} step={10} defaultValue={0} />,
    );
    // 값 33 의 자리 = 10 + 99 = 109 → 30
    pointer(control(), "pointerdown", 109);
    expect(thumb().getAttribute("aria-valuenow")).toBe("30");
    pointer(control(), "pointerup", 109);
  });

  it("손잡이를 누르면 바로 끌기 — 말풍선이 뜨고 따라가며, 놓으면 한 번만 저장한다", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="값"
        defaultValue={50}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    // 값 50 의 자리 = 160
    pointer(thumb(), "pointerdown", 160);
    expect(thumb().dataset.pressed).toBe("true");
    expect(indicator().dataset.state).toBe("open");
    pointer(control(), "pointermove", 220);
    pointer(control(), "pointermove", 260);
    expect(thumb().getAttribute("aria-valuenow")).toBe("83");
    expect(onValueCommit).not.toHaveBeenCalled();
    pointer(control(), "pointerup", 260);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(83);
    expect(thumb().dataset.pressed).toBeUndefined();
    expect(indicator().dataset.state).toBe("closed");
  });

  it("끌어도 값이 그대로면 저장하지 않는다", () => {
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="값"
        defaultValue={50}
        onValueCommit={onValueCommit}
      />,
    );
    pointer(thumb(), "pointerdown", 160);
    pointer(control(), "pointerup", 160);
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it("줄 밖까지 끌어도 범위 끝에서 멈춘다 — 최솟값 · 최댓값", () => {
    render(<Slider aria-label="값" defaultValue={50} />);
    pointer(thumb(), "pointerdown", 160);
    pointer(control(), "pointermove", 900);
    expect(thumb().getAttribute("aria-valuenow")).toBe("100");
    pointer(control(), "pointermove", -500);
    expect(thumb().getAttribute("aria-valuenow")).toBe("0");
    pointer(control(), "pointerup", -500);
  });

  it("손잡이 밖을 150ms 넘게 누르고 있으면 끌기가 된다 — 말풍선", () => {
    vi.useFakeTimers();
    render(<Slider aria-label="값" defaultValue={10} />);
    pointer(control(), "pointerdown", 250);
    expect(indicator().dataset.state).toBe("closed");
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(indicator().dataset.state).toBe("open");
    pointer(control(), "pointerup", 250);
  });

  it("막히면 누르기 · 끌기가 먹지 않는다", () => {
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="값"
        defaultValue={50}
        disabled
        onValueCommit={onValueCommit}
      />,
    );
    pointer(control(), "pointerdown", 250);
    pointer(control(), "pointerup", 250);
    expect(thumb().getAttribute("aria-valuenow")).toBe("50");
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it("RTL 은 줄의 오른쪽이 시작이다", () => {
    render(<Slider aria-label="값" dir="rtl" defaultValue={0} />);
    // 줄 폭 320 — 왼쪽 끝(x = 10)은 시작에서 310 → 최댓값
    pointer(control(), "pointerdown", 10);
    expect(thumb().getAttribute("aria-valuenow")).toBe("100");
    pointer(control(), "pointerup", 10);
  });
});

describe("Slider — 말풍선 · 값 모으기", () => {
  it("마우스를 올리면 말풍선이 뜨고 내리면 사라진다 — 손가락은 올림이 없다", () => {
    render(
      <Slider aria-label="값" defaultValue={50} formatValue={(v) => `${v}%`} />,
    );
    expect(indicator().dataset.state).toBe("closed");
    const enter = (pointerType: string) => {
      const e = new MouseEvent("pointerover", { bubbles: true });
      Object.assign(e, { pointerType });
      act(() => {
        thumb().dispatchEvent(e);
      });
    };
    enter("touch");
    expect(indicator().dataset.state).toBe("closed");
    enter("mouse");
    expect(indicator().dataset.state).toBe("open");
    expect(indicator().textContent).toBe("50%");
    act(() => {
      const e = new MouseEvent("pointerout", { bubbles: true });
      Object.assign(e, { pointerType: "mouse" });
      thumb().dispatchEvent(e);
    });
    expect(indicator().dataset.state).toBe("closed");
  });

  it("키보드로 초점이 오면 말풍선과 링 — 마우스로 눌러 온 초점에는 링이 없다", () => {
    render(<Slider aria-label="값" defaultValue={50} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      thumb().focus();
    });
    expect(indicator().dataset.state).toBe("open");
    expect(thumb().hasAttribute("data-focus-visible")).toBe(true);
    act(() => thumb().blur());
    expect(indicator().dataset.state).toBe("closed");
    act(() => {
      document.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      thumb().focus();
    });
    expect(thumb().hasAttribute("data-focus-visible")).toBe(false);
  });

  it("막힘이면 말풍선이 뜨지 않는다", () => {
    render(<Slider aria-label="값" defaultValue={50} disabled />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      thumb().focus();
    });
    expect(indicator().dataset.state).toBe("closed");
  });
});

describe("Slider — 값", () => {
  it("값을 밖에서 쥐면 바뀐 값을 넣어야 바뀐다", () => {
    const Controlled = () => {
      const [v, setV] = useState(80);
      return (
        <Slider
          aria-label="값"
          value={v}
          onValueChange={setV}
          formatValue={(n) => `${n}%`}
        />
      );
    };
    render(<Controlled />);
    key(thumb(), "ArrowLeft");
    expect(thumb().getAttribute("aria-valuetext")).toBe("79%");

    const onValueChange = vi.fn();
    act(() =>
      root.render(
        <Slider aria-label="값" value={10} onValueChange={onValueChange} />,
      ),
    );
    key(thumb(), "ArrowRight");
    expect(onValueChange).toHaveBeenCalledWith(11);
    expect(thumb().getAttribute("aria-valuenow")).toBe("10");
  });

  it("name 을 주면 폼으로 갈 숨은 입력이 값을 따라간다", () => {
    render(<Slider aria-label="값" name="threshold" defaultValue={50} />);
    const input = () =>
      container.querySelector<HTMLInputElement>("input[type=hidden]")!;
    expect(input().name).toBe("threshold");
    expect(input().value).toBe("50");
    key(thumb(), "End");
    expect(input().value).toBe("100");
  });

  it("값이 범위 밖이어도 손잡이는 끝에 선다", () => {
    render(<Slider aria-label="값" min={0} max={10} value={99} />);
    const anchor = container.querySelector<HTMLElement>(
      "[data-slot=slider-thumb-anchor]",
    )!;
    expect(anchor.style.insetInlineStart).toBe(
      "calc(10px + 1 * (100% - 20px))",
    );
  });
});

describe("RangeSlider", () => {
  const setup = (value: [number, number] = [30, 70]) => {
    const onValueCommit = vi.fn();
    render(
      <Field label="예산 사용률">
        <RangeSlider
          min={0}
          max={100}
          step={10}
          defaultValue={value}
          onValueCommit={onValueCommit}
        />
      </Field>,
    );
    return { onValueCommit };
  };

  it('손잡이마다 이름이 다르다 — "{라벨} 최소" · "{라벨} 최대"', () => {
    setup();
    expect(thumbs()).toHaveLength(2);
    const nameOf = (t: HTMLElement) =>
      t
        .getAttribute("aria-labelledby")!
        .split(" ")
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    expect(nameOf(thumb(0))).toContain("예산 사용률");
    expect(nameOf(thumb(0))).toContain("최소");
    expect(nameOf(thumb(1))).toContain("최대");
  });

  it("라벨이 없으면 aria-label 에 이름을 붙이고, thumbLabels 로 바꿀 수 있다", () => {
    render(
      <RangeSlider
        aria-label="기간"
        thumbLabels={["시작", "끝"]}
        defaultValue={[10, 20]}
      />,
    );
    expect(thumb(0).getAttribute("aria-label")).toBe("기간 시작");
    expect(thumb(1).getAttribute("aria-label")).toBe("기간 끝");
    act(() => root.render(<RangeSlider aria-label="기간" />));
    expect(thumb(0).getAttribute("aria-label")).toBe("기간 최소");
  });

  it("두 손잡이는 서로를 넘지 않는다", () => {
    const { onValueCommit } = setup([30, 50]);
    key(thumb(0), "PageUp");
    expect(thumb(0).getAttribute("aria-valuenow")).toBe("50");
    key(thumb(1), "PageDown");
    expect(thumb(1).getAttribute("aria-valuenow")).toBe("50");
    expect(onValueCommit).toHaveBeenLastCalledWith([50, 50]);
  });

  it("Home · End 는 포커스한 손잡이를 끝으로 — 범위면 다른 손잡이 값까지", () => {
    setup([30, 70]);
    key(thumb(0), "End");
    expect(thumb(0).getAttribute("aria-valuenow")).toBe("70");
    key(thumb(1), "Home");
    expect(thumb(1).getAttribute("aria-valuenow")).toBe("70");
    key(thumb(0), "Home");
    expect(thumb(0).getAttribute("aria-valuenow")).toBe("0");
    key(thumb(1), "End");
    expect(thumb(1).getAttribute("aria-valuenow")).toBe("100");
  });

  it("트랙을 누르면 가까운 손잡이가 건너뛴다 — 두 값을 함께 알린다", () => {
    const { onValueCommit } = setup([30, 70]);
    // 값 60 의 자리 = 190 → 70 이 더 가깝다
    pointer(control(), "pointerdown", 190);
    expect(thumb(1).getAttribute("aria-valuenow")).toBe("60");
    expect(thumb(0).getAttribute("aria-valuenow")).toBe("30");
    pointer(control(), "pointerup", 190);
    expect(onValueCommit).toHaveBeenCalledWith([30, 60]);
  });

  it("값 둘의 숨은 입력은 같은 이름으로 둘", () => {
    render(
      <RangeSlider aria-label="기간" name="usage" defaultValue={[10, 40]} />,
    );
    const inputs =
      container.querySelectorAll<HTMLInputElement>("input[type=hidden]");
    expect(Array.from(inputs, (i) => i.value)).toEqual(["10", "40"]);
  });
});

describe("SliderValue", () => {
  it("머리 값 — 보조 기술에는 숨기고 고정폭 숫자 · 굵게", () => {
    render(<SliderValue>80%</SliderValue>);
    const v = container.firstElementChild as HTMLElement;
    expect(v.getAttribute("aria-hidden")).toBe("true");
    expect(v.className).toContain("tabular-nums");
    expect(v.className).toContain("font-bold");
    expect(v.className).toContain("text-fg-neutral");
  });

  it("disabled 를 주면 막힘 색", () => {
    render(<SliderValue disabled>80%</SliderValue>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "text-fg-disabled",
    );
  });
});
