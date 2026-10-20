// Select 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(안쪽 그림자 · ::after 테두리 · 전환 · 문장 · Radix 의 자리 계산)은 여기서 클래스 · 속성으로 본다(select.measure.mjs 머리).
import { act, createRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreditCard, Landmark } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "@/shared/ds/field";

import { Select, SelectGroup, SelectItem } from "./select";
import {
  SELECT_CONTENT,
  SELECT_PILL_ON,
  SELECT_SCROLL,
} from "./select-variants";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom 에 없다 — Radix · 여럿 고른 글의 폭 재기가 쓴다
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

// Radix 는 닫힌 뒤 초점 되돌리기 · 바깥 누르기 듣기를 다음 틱에 한다
const tick = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

const trigger = () =>
  document.querySelector<HTMLButtonElement>("[data-slot=select-trigger]")!;
const list = () =>
  document.querySelector<HTMLElement>("[data-slot=select-content]");
const options = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-slot=select-item]"));
const option = (label: string) =>
  options().find((o) => o.textContent?.startsWith(label))!;
// 여럿 고른 글의 폭을 재는 숨긴 글(aria-hidden)은 읽히는 글이 아니다
const valueText = () => {
  const clone = document
    .querySelector("[data-slot=select-value]")!
    .cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[aria-hidden]").forEach((n) => n.remove());
  return clone.textContent;
};
// SVG 의 className 은 문자열이 아니다
const classes = (el: Element) =>
  (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);

function key(el: Element, k: string, init: KeyboardEventInit = {}) {
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

function click(el: Element, detail = 1) {
  act(() => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail }),
    );
  });
}

function pointer(el: Element, type: string, pointerType: string) {
  act(() => {
    const e = new MouseEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, "pointerType", { value: pointerType });
    el.dispatchEvent(e);
  });
}

const CURRENCIES = (
  <>
    <SelectItem value="KRW" label="원" description="KRW" />
    <SelectItem value="USD" label="미국 달러" description="USD" />
    <SelectItem value="JPY" label="일본 엔" description="JPY" />
    <SelectItem value="EUR" label="유로" description="EUR" />
    <SelectItem value="CNY" label="중국 위안" description="CNY" />
  </>
);

describe("Select — 트리거", () => {
  it("버튼 role=combobox · aria-haspopup=listbox · 닫혀 있으면 aria-expanded=false, 열면 true", () => {
    render(
      <Select aria-label="통화" placeholder="통화 선택">
        {CURRENCIES}
      </Select>,
    );
    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger().type).toBe("button");
    expect(trigger().getAttribute("role")).toBe("combobox");
    expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(list()).toBeNull();
    click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(list()).not.toBeNull();
  });

  it("Field 안이면 이름은 Field 의 라벨(<label for>)이다", () => {
    render(
      <Field label="통화">
        <Select placeholder="통화 선택">{CURRENCIES}</Select>
      </Field>,
    );
    const label = document.querySelector("label")!;
    expect(label.htmlFor).toBe(trigger().id);
    expect(trigger().id).not.toBe("");
  });

  it("Field 의 오류 · 필수 · 막힘 · 읽기 전용을 받는다", () => {
    render(
      <Field label="통화" invalid errorMessage="통화를 골라주세요." required>
        <Select placeholder="통화 선택">{CURRENCIES}</Select>
      </Field>,
    );
    expect(trigger().getAttribute("aria-invalid")).toBe("true");
    expect(trigger().dataset.invalid).toBe("true");
    // 오류 안쪽 2px 는 ::after 에 덧그린다 — 눌러도 그대로
    expect(classes(trigger())).toContain("after:border-stroke-critical-solid");
    expect(trigger().getAttribute("aria-describedby")).toBeTruthy();
  });

  it("고르기 전에는 placeholder(fg-placeholder), 고르면 값(fg-neutral)", () => {
    render(
      <Select aria-label="통화" placeholder="통화 선택">
        {CURRENCIES}
      </Select>,
    );
    expect(valueText()).toBe("통화 선택");
    expect(trigger().hasAttribute("data-placeholder")).toBe(true);
    expect(
      classes(document.querySelector("[data-slot=select-value]")!),
    ).toContain("text-fg-placeholder");
    render(
      <Select
        key="filled"
        aria-label="통화"
        placeholder="통화 선택"
        defaultValue="USD"
      >
        {CURRENCIES}
      </Select>,
    );
    expect(valueText()).toBe("미국 달러");
    expect(trigger().hasAttribute("data-placeholder")).toBe(false);
  });

  it("선택지의 설명은 트리거에 보이지 않는다", () => {
    render(
      <Select aria-label="통화" defaultValue="USD">
        {CURRENCIES}
      </Select>,
    );
    expect(trigger().textContent).toBe("미국 달러");
  });

  it("값은 한 줄 말줄임(truncate) — 긴 이름도 트리거를 늘리지 않는다", () => {
    render(
      <Select aria-label="긴 이름" defaultValue="long">
        <SelectItem
          value="long"
          label="주식회사 그루 디자인 시스템 운영팀 서울 본사 3층 공용 회의실 예약 정산용 법인카드"
        />
      </Select>,
    );
    const value = document.querySelector("[data-slot=select-value]")!;
    expect(classes(value)).toContain("truncate");
    expect(classes(value)).toContain("min-w-0");
    expect(classes(trigger())).toContain("min-w-0");
  });

  it("크기 — large 52 · medium 40 · responsive 는 1280(lg:)에서 large → medium", () => {
    render(
      <>
        <Select aria-label="a" size="large">
          {CURRENCIES}
        </Select>
        <Select aria-label="b" size="medium">
          {CURRENCIES}
        </Select>
        <Select aria-label="c">{CURRENCIES}</Select>
      </>,
    );
    const [large, medium, responsive] = Array.from(
      document.querySelectorAll<HTMLElement>("[data-slot=select-trigger]"),
    );
    expect(classes(large!)).toEqual(
      expect.arrayContaining(["min-h-13", "rounded-r3", "px-x4", "text-t5"]),
    );
    expect(classes(medium!)).toEqual(
      expect.arrayContaining(["min-h-10", "rounded-r2", "px-x3_5", "text-t4"]),
    );
    expect(responsive!.dataset.size).toBe("responsive");
    expect(classes(responsive!)).toEqual(
      expect.arrayContaining(["min-h-13", "lg:min-h-10", "lg:rounded-r2"]),
    );
  });

  it("테두리는 안쪽 1px 그림자 · 비활성 · 읽기 전용은 회색 바탕 · 키보드 포커스에만 링", () => {
    render(
      <>
        <Select aria-label="a">{CURRENCIES}</Select>
        <Select aria-label="b" disabled>
          {CURRENCIES}
        </Select>
        <Select aria-label="c" readOnly>
          {CURRENCIES}
        </Select>
      </>,
    );
    const [enabled, disabled, readonly] = Array.from(
      document.querySelectorAll<HTMLElement>("[data-slot=select-trigger]"),
    );
    expect(classes(enabled!)).toContain(
      "shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]",
    );
    expect(classes(enabled!)).toContain("focus-visible:outline-2");
    expect(classes(enabled!)).toContain("hover:bg-bg-layer-default-pressed");
    expect(classes(disabled!)).toContain("bg-bg-disabled");
    expect(classes(disabled!)).toContain("cursor-not-allowed");
    expect(classes(readonly!)).toContain("bg-bg-disabled");
    expect(classes(readonly!)).toContain("cursor-default");
    // 흐리게 하지 않는다(v106)
    expect(classes(disabled!).some((c) => c.startsWith("opacity"))).toBe(false);
  });

  it("누르면 콘텐츠 층만 2px 거리 축소 — 누르는 순간 기준 길이를 잰다(막히면 줄지 않는다)", () => {
    render(
      <>
        <Select aria-label="a">{CURRENCIES}</Select>
        <Select aria-label="b" readOnly>
          {CURRENCIES}
        </Select>
      </>,
    );
    const [a, b] = Array.from(
      document.querySelectorAll<HTMLElement>("[data-slot=select-trigger]"),
    );
    const contentOf = (t: HTMLElement) =>
      t.querySelector<HTMLElement>("[data-slot=select-trigger-content]")!;
    expect(classes(contentOf(a!)).join(" ")).toContain(
      "group-active/select-trigger:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(classes(contentOf(a!)).join(" ")).toContain(
      "motion-reduce:group-active/select-trigger:[scale:1]",
    );
    expect(classes(contentOf(b!)).join(" ")).not.toContain("group-active");
    pointer(a!, "pointerdown", "mouse");
    expect(a!.style.getPropertyValue("--press-basis")).toBe("24");
  });

  it("셰브론은 열리면 180° — 열 때 150ms(d3) · 닫을 때 100ms(d2)", () => {
    render(<Select aria-label="통화">{CURRENCIES}</Select>);
    const chevron = () =>
      document
        .querySelector("[data-slot=select-chevron]")!
        .getAttribute("class")!;
    expect(chevron()).toContain("rotate-0");
    expect(chevron()).toContain("--motion-duration-d2");
    click(trigger());
    expect(chevron()).toContain("rotate-180");
    expect(chevron()).toContain("--motion-duration-d3");
  });

  it("ref 는 트리거(button)다 · className 도 트리거에 간다", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select ref={ref} aria-label="통화" className="mt-x1">
        {CURRENCIES}
      </Select>,
    );
    expect(ref.current).toBe(trigger());
    expect(classes(trigger())).toContain("mt-x1");
  });

  it("name 을 주면 고른 값마다 hidden input — 비활성이면 보내지 않는다", () => {
    render(
      <>
        <Select
          aria-label="a"
          name="days"
          multiple
          defaultValue={["KRW", "USD"]}
        >
          {CURRENCIES}
        </Select>
        <Select aria-label="b" name="off" defaultValue="KRW" disabled>
          {CURRENCIES}
        </Select>
      </>,
    );
    const hidden = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[type=hidden]"),
    );
    expect(hidden.map((i) => [i.name, i.value, i.disabled])).toEqual([
      ["days", "KRW", false],
      ["days", "USD", false],
      ["off", "KRW", true],
    ]);
  });
});

describe("Select — 앞 아이콘", () => {
  const icon = (id: string) => <span data-testid={id} />;
  const prefixed = () =>
    document.querySelector("[data-slot=select-prefix-icon]");

  it("하나를 골랐고 그 선택지에 아이콘이 있으면 그 아이콘, 아니면 트리거의 아이콘, 둘 이상이면 트리거의 아이콘", () => {
    function Test({ value }: { value: string[] }) {
      return (
        <Select
          multiple
          aria-label="수단"
          prefixIcon={icon("base")}
          value={value}
          onValueChange={() => {}}
        >
          <SelectItem value="card" label="카드" prefixIcon={icon("card")} />
          <SelectItem value="bank" label="계좌" prefixIcon={icon("bank")} />
          <SelectItem value="plain" label="현금" />
        </Select>
      );
    }
    render(<Test value={[]} />);
    expect(prefixed()!.querySelector("[data-testid=base]")).not.toBeNull();
    render(<Test value={["card"]} />);
    expect(prefixed()!.querySelector("[data-testid=card]")).not.toBeNull();
    render(<Test value={["card", "bank"]} />);
    expect(prefixed()!.querySelector("[data-testid=base]")).not.toBeNull();
    render(<Test value={["plain"]} />);
    expect(prefixed()!.querySelector("[data-testid=base]")).not.toBeNull();
  });

  it("그릴 아이콘이 없으면 아이콘 자리가 없다 · 아이콘은 화면 읽기 프로그램에 숨긴다", () => {
    render(
      <Select aria-label="수단" defaultValue="a">
        <SelectItem value="a" label="카드" />
      </Select>,
    );
    expect(prefixed()).toBeNull();
    render(
      <Select aria-label="수단" prefixIcon={<CreditCard />}>
        <SelectItem value="a" label="카드" />
      </Select>,
    );
    expect(prefixed()!.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Select — 목록", () => {
  it("role=listbox · 선택지 role=option · 고른 선택지 aria-selected · 고른 선택지에만 체크", () => {
    render(
      <Select aria-label="통화" defaultValue="USD">
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    expect(list()!.getAttribute("role")).toBe("listbox");
    expect(list()!.getAttribute("aria-multiselectable")).toBeNull();
    expect(options().map((o) => o.getAttribute("role"))).toEqual(
      Array(5).fill("option"),
    );
    expect(options().map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
      "false",
      "false",
    ]);
    expect(
      document.querySelectorAll("[data-slot=select-indicator]"),
    ).toHaveLength(1);
    expect(
      option("미국 달러").querySelector("[data-slot=select-indicator]"),
    ).not.toBeNull();
  });

  it("목록 이름은 Field 의 라벨 · aria-label 이 있으면 그것", () => {
    render(
      <Field label="통화">
        <Select>{CURRENCIES}</Select>
      </Field>,
    );
    click(trigger());
    const labelId = document.querySelector("label")!.id;
    expect(labelId).not.toBe("");
    expect(list()!.getAttribute("aria-labelledby")).toBe(labelId);
  });

  it("묶음 role=group + 제목 aria-labelledby · 묶음이 둘이어도 선택지 사이에는 선이 없다", () => {
    render(
      <Select aria-label="결제 수단">
        <SelectGroup>
          <SelectItem value="none" label="결제 수단 없음" />
        </SelectGroup>
        <SelectGroup label="카드">
          <SelectItem value="a" label="현대카드 M" />
          <SelectItem value="b" label="신한카드 Deep" />
        </SelectGroup>
      </Select>,
    );
    click(trigger());
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-slot=select-group]"),
    );
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.getAttribute("role"))).toEqual([
      "group",
      "group",
    ]);
    expect(groups[0]!.getAttribute("aria-labelledby")).toBeNull();
    const title = document.getElementById(
      groups[1]!.getAttribute("aria-labelledby")!,
    )!;
    expect(title.textContent).toBe("카드");
    expect(classes(title)).toContain("text-fg-neutral-subtle");
    // 둘째 묶음부터 위에 1px 선(좌우 16 들임 · 아래 8) — 묶음 사이만, 선택지 사이에는 없다
    expect(classes(groups[1]!).join(" ")).toContain(
      "[[data-select-group]+&]:before:h-px",
    );
    expect(classes(groups[1]!).join(" ")).toContain(
      "[[data-select-group]+&]:before:bg-stroke-neutral-subtle",
    );
    expect(classes(options()[1]!).join(" ")).not.toContain("before:");
  });

  it("묶음 밖에 이어 적은 선택지는 제목 없는 한 묶음 · 빈 묶음은 그리지 않는다 · map 과 Fragment 로 적어도 읽힌다", () => {
    render(
      <Select aria-label="요일">
        <SelectGroup />
        {["월", "화"].map((d) => (
          <SelectItem key={d} value={d} label={d} />
        ))}
        <>
          <SelectItem value="수" label="수" />
        </>
      </Select>,
    );
    click(trigger());
    expect(document.querySelectorAll("[data-slot=select-group]")).toHaveLength(
      1,
    );
    expect(options().map((o) => o.textContent)).toEqual(["월", "화", "수"]);
  });

  it("선택지의 글 · 설명 · 앞 아이콘 — 설명은 목록에만", () => {
    render(
      <Select aria-label="계좌">
        <SelectItem
          value="kb"
          label="국민 주계좌"
          description="123-45-6789"
          prefixIcon={<Landmark />}
        />
      </Select>,
    );
    click(trigger());
    const item = options()[0]!;
    expect(
      item.querySelector("[data-slot=select-item-label]")!.textContent,
    ).toBe("국민 주계좌");
    expect(
      item.querySelector("[data-slot=select-item-description]")!.textContent,
    ).toBe("123-45-6789");
    expect(
      item
        .querySelector("[data-slot=select-item-icon]")!
        .getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("선택지 글은 목록 안에서 줄바꿈된다(자르지 않는다) — 긴 이름 · 설명", () => {
    render(
      <Select aria-label="긴 이름">
        <SelectItem
          value="long"
          label="주식회사 그루 디자인 시스템 운영팀 서울 본사 3층 공용 회의실 예약 정산용 법인카드"
          description="설명도 아주 길면 목록 안에서 줄바꿈돼요"
        />
      </Select>,
    );
    click(trigger());
    const label = document.querySelector("[data-slot=select-item-label]")!;
    const description = document.querySelector(
      "[data-slot=select-item-description]",
    )!;
    for (const el of [label, description]) {
      expect(classes(el)).not.toContain("truncate");
      expect(el.className).not.toContain("whitespace-nowrap");
      expect(el.className).not.toContain("text-ellipsis");
    }
    // 글 칸이 줄어들 수 있어야(min-w-0) 긴 글이 목록 폭 안에서 줄바꿈된다
    expect(classes(label.parentElement!)).toContain("min-w-0");
  });

  it("크기마다 선택지 · 묶음 제목 · 체크 클래스 — large 46 · medium 39 · responsive 는 lg: 에서 바뀐다", () => {
    // 열린 목록이 둘이면 뒤에 연 목록의 포커스가 앞 목록을 닫으므로 하나씩 그린다
    const classesIn = (size: "large" | "medium" | "responsive") => {
      render(
        <Select
          key={size}
          aria-label={size}
          size={size}
          defaultOpen
          defaultValue="KRW"
        >
          <SelectGroup label="묶음">{CURRENCIES}</SelectGroup>
        </Select>,
      );
      const pick = (slot: string) =>
        classes(list()!.querySelector(`[data-slot=${slot}]`)!);
      return {
        item: pick("select-item"),
        indicator: pick("select-indicator"),
        groupLabel: pick("select-group-label"),
        label: pick("select-item-label"),
        description: pick("select-item-description"),
      };
    };
    const large = classesIn("large");
    expect(large.item).toContain("py-x3");
    expect(large.indicator).toContain("size-[14px]");
    expect(large.groupLabel).toEqual(
      expect.arrayContaining(["py-x2_5", "text-t4", "font-medium"]),
    );
    expect(large.label).toContain("text-t5");
    expect(large.description).toContain("text-t3");
    const medium = classesIn("medium");
    expect(medium.item).toContain("py-x2_5");
    expect(medium.indicator).toContain("size-[12px]");
    expect(medium.groupLabel).toEqual(
      expect.arrayContaining(["py-x2", "text-t3", "font-normal"]),
    );
    expect(medium.label).toContain("text-t4");
    expect(medium.description).toContain("text-t2");
    const responsive = classesIn("responsive");
    expect(responsive.item).toEqual(
      expect.arrayContaining(["py-x3", "lg:py-x2_5"]),
    );
    expect(responsive.indicator).toEqual(
      expect.arrayContaining(["size-[14px]", "lg:size-[12px]"]),
    );
    expect(responsive.label).toEqual(
      expect.arrayContaining(["text-t5", "lg:text-t4"]),
    );
  });

  it("목록 모양 — 모서리 20 · 떠 있는 바탕 · s3 · z-floating, 스크롤 자리 위아래 8 · 최대 min(480, 남은 화면 — 200 은 둔다)", () => {
    expect(SELECT_CONTENT).toContain("rounded-r5");
    expect(SELECT_CONTENT).toContain("bg-bg-layer-floating");
    expect(SELECT_CONTENT).toContain("shadow-[var(--shadow-s3)]");
    expect(SELECT_CONTENT).toContain("z-(--z-floating)");
    expect(SELECT_CONTENT).toContain("w-[var(--radix-popover-trigger-width)]");
    expect(SELECT_SCROLL).toContain("py-x2");
    expect(SELECT_SCROLL).toContain("gap-x2");
    expect(SELECT_SCROLL).toContain("overflow-y-auto");
    expect(SELECT_SCROLL).toContain("var(--select-list-max-height,480px)");
    expect(SELECT_SCROLL).toContain("max(200px,");
  });

  it("목록은 트리거 아래(bottom) · 왼쪽 맞춤 · 가장자리와 8 — 폰 폭에서도 시트가 아니라 칸 아래 목록이다", () => {
    // 폰 폭 — 1280 미만. 시트(Bottom Sheet)로 바뀌지 않는다
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      })),
    );
    render(
      <Select aria-label="통화" placeholder="통화 선택">
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    expect(list()!.dataset.side).toBe("bottom");
    expect(list()!.dataset.align).toBe("start");
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(
      document.querySelector("[data-slot=bottom-sheet-content]"),
    ).toBeNull();
    vi.unstubAllGlobals();
  });

  it("listMaxHeight 는 목록의 최대 높이를 줄인다(범위 목록 240)", () => {
    render(
      <Select aria-label="범위" listMaxHeight={240} defaultOpen>
        {CURRENCIES}
      </Select>,
    );
    expect(list()!.style.getPropertyValue("--select-list-max-height")).toBe(
      "240px",
    );
  });

  it("container 를 주면 목록이 그 안에 뜬다", () => {
    const place = document.createElement("div");
    document.body.appendChild(place);
    render(
      <Select aria-label="통화" container={place} defaultOpen>
        {CURRENCIES}
      </Select>,
    );
    expect(place.contains(list())).toBe(true);
    place.remove();
  });

  it("선택지 20개 — 모두 그리고 목록 안에서 스크롤된다(End 로 끝까지)", () => {
    render(
      <Select aria-label="번호">
        {Array.from({ length: 20 }, (_, i) => (
          <SelectItem key={i} value={`n${i}`} label={`${i + 1}번째 선택지`} />
        ))}
      </Select>,
    );
    click(trigger());
    expect(options()).toHaveLength(20);
    key(list()!, "End");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[19]!.id,
    );
    key(list()!, "Home");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
    expect(
      document.querySelector("[data-slot=select-scroll]")!.className,
    ).toContain("overflow-y-auto");
  });

  it("빈 목록 — 선택지가 없어도 열리고 닫힌다", () => {
    render(<Select aria-label="없음">{null}</Select>);
    click(trigger());
    expect(list()).not.toBeNull();
    expect(options()).toHaveLength(0);
    key(list()!, "ArrowDown");
    key(list()!, "Enter");
    expect(list()).toBeNull();
  });
});

describe("Select — 하나 고르기", () => {
  it("선택지를 누르면 고르고 닫는다 · onValueChange", () => {
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="통화"
        placeholder="통화 선택"
        onValueChange={onValueChange}
      >
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    click(option("유로"));
    expect(onValueChange).toHaveBeenCalledWith("EUR");
    expect(list()).toBeNull();
    expect(valueText()).toBe("유로");
  });

  it("고른 선택지를 다시 눌러도 풀리지 않는다 — 닫기만", () => {
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="통화"
        defaultValue="KRW"
        onValueChange={onValueChange}
      >
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    click(option("원"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(list()).toBeNull();
    expect(valueText()).toBe("원");
  });

  it('제어 — value 를 그대로 따른다(고르지 않았으면 "")', () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <Select
          aria-label="통화"
          placeholder="통화 선택"
          value={value}
          onValueChange={setValue}
        >
          {CURRENCIES}
        </Select>
      );
    }
    render(<Controlled />);
    expect(valueText()).toBe("통화 선택");
    click(trigger());
    click(option("일본 엔"));
    expect(valueText()).toBe("일본 엔");
  });

  it("값이 선택지에 없으면 placeholder 로 그린다", () => {
    render(
      <Select
        aria-label="통화"
        placeholder="통화 선택"
        value="XXX"
        onValueChange={() => {}}
      >
        {CURRENCIES}
      </Select>,
    );
    expect(valueText()).toBe("통화 선택");
  });

  it("막힌 선택지는 aria-disabled · 눌러도 고르지 않고 알약이 생기지 않는다", () => {
    const onValueChange = vi.fn();
    render(
      <Select aria-label="통화" onValueChange={onValueChange}>
        <SelectItem value="a" label="가" />
        <SelectItem value="b" label="나" disabled />
      </Select>,
    );
    click(trigger());
    expect(option("나").getAttribute("aria-disabled")).toBe("true");
    expect(classes(option("나"))).toContain("cursor-not-allowed");
    click(option("나"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(list()).not.toBeNull();
    pointer(option("나"), "pointermove", "mouse");
    expect(option("나").dataset.highlighted).toBeUndefined();
    // 막힌 선택지의 글 · 설명 · 아이콘 · 체크는 fg-disabled
    expect(
      classes(option("나").querySelector("[data-slot=select-item-label]")!),
    ).toContain("text-fg-disabled");
  });

  it("바깥을 누르면 닫는다 · 고른 값은 그대로", async () => {
    render(
      <Select aria-label="통화" defaultValue="KRW">
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    await tick();
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    await tick();
    expect(list()).toBeNull();
    expect(valueText()).toBe("원");
  });
});

describe("Select — 키보드", () => {
  it("트리거 ↓ ↑ Enter Space — 열고 고른 선택지(없으면 첫 선택지)를 짚는다", () => {
    for (const k of ["ArrowDown", "ArrowUp", "Enter", " "]) {
      render(<Select aria-label="통화">{CURRENCIES}</Select>);
      key(trigger(), k);
      expect(list()).not.toBeNull();
      expect(list()!.getAttribute("aria-activedescendant")).toBe(
        options()[0]!.id,
      );
      expect(options()[0]!.dataset.keyboard).toBe("true");
      act(() => root.render(null));
    }
    render(
      <Select aria-label="통화" defaultValue="JPY">
        {CURRENCIES}
      </Select>,
    );
    key(trigger(), "ArrowDown");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      option("일본 엔").id,
    );
  });

  it("포인터로 열면 짚지 않는다 · 화면 읽기 프로그램의 누르기(detail 0)는 키처럼 짚는다", () => {
    render(<Select aria-label="통화">{CURRENCIES}</Select>);
    click(trigger(), 1);
    expect(list()!.getAttribute("aria-activedescendant")).toBeNull();
    click(trigger(), 1); // 닫기
    expect(list()).toBeNull();
    click(trigger(), 0);
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
  });

  it("목록 ↓ ↑ 은 다음 · 이전(막힌 선택지는 건너뛴다) · Home · End · 끝에서 멈춘다", () => {
    render(
      <Select aria-label="통화">
        <SelectItem value="a" label="가" />
        <SelectItem value="b" label="나" disabled />
        <SelectItem value="c" label="다" />
      </Select>,
    );
    key(trigger(), "ArrowDown");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
    key(list()!, "ArrowDown");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[2]!.id,
    );
    key(list()!, "ArrowDown");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[2]!.id,
    );
    key(list()!, "ArrowUp");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
    key(list()!, "End");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[2]!.id,
    );
    key(list()!, "Home");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
  });

  it("목록 Enter · Space — 하나 고르기는 고르고 닫는다 · 트리거로 포커스가 돌아온다", async () => {
    const onValueChange = vi.fn();
    render(
      <Select aria-label="통화" onValueChange={onValueChange}>
        {CURRENCIES}
      </Select>,
    );
    key(trigger(), "ArrowDown");
    await tick();
    key(list()!, "ArrowDown");
    key(list()!, "Enter");
    expect(onValueChange).toHaveBeenCalledWith("USD");
    await tick();
    expect(list()).toBeNull();
    expect(document.activeElement).toBe(trigger());

    key(trigger(), "ArrowDown");
    key(list()!, " ");
    expect(onValueChange).toHaveBeenLastCalledWith("USD");
  });

  it("Esc 는 닫고 고른 값은 그대로 · 트리거로 포커스가 돌아온다", async () => {
    render(
      <Select aria-label="통화" defaultValue="KRW">
        {CURRENCIES}
      </Select>,
    );
    click(trigger());
    await tick();
    key(list()!, "ArrowDown");
    key(list()!, "Escape");
    await tick();
    expect(list()).toBeNull();
    expect(valueText()).toBe("원");
    expect(document.activeElement).toBe(trigger());
  });

  it("Tab 은 닫는다 — 트리거로 포커스를 옮겨 브라우저의 Tab 이 다음 칸으로 가게 한다", async () => {
    render(<Select aria-label="통화">{CURRENCIES}</Select>);
    click(trigger());
    await tick();
    key(list()!, "Tab");
    await tick();
    expect(list()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("닫힌 트리거에서 글자 키 — 그 글자로 시작하는 다음 선택지로 값만 바꾼다(열지 않는다 · 네이티브 select)", () => {
    const onValueChange = vi.fn();
    render(
      <Select aria-label="통화" onValueChange={onValueChange}>
        {CURRENCIES}
      </Select>,
    );
    key(trigger(), "유");
    expect(onValueChange).toHaveBeenCalledWith("EUR");
    expect(list()).toBeNull();
    expect(valueText()).toBe("유로");
  });

  it("목록 안에서 글자 키 — 그 글자로 시작하는 선택지로 짚는다(같은 글자를 거듭 치면 돌아가며)", () => {
    render(
      <Select aria-label="수단">
        <SelectItem value="1" label="카드 A" />
        <SelectItem value="2" label="현금" />
        <SelectItem value="3" label="카드 B" />
      </Select>,
    );
    click(trigger());
    key(list()!, "카");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[0]!.id,
    );
    // 같은 글자를 거듭 치면 돌아가며 — 다음 "카" 로 시작하는 선택지
    key(list()!, "카");
    expect(list()!.getAttribute("aria-activedescendant")).toBe(
      options()[2]!.id,
    );
  });

  it("마우스는 호버로 짚고(알약) · 터치는 짚지 않는다", () => {
    render(<Select aria-label="통화">{CURRENCIES}</Select>);
    click(trigger());
    const item = option("유로");
    pointer(item, "pointermove", "touch");
    expect(item.dataset.highlighted).toBeUndefined();
    pointer(item, "pointermove", "mouse");
    expect(item.dataset.highlighted).toBe("true");
    expect(item.dataset.keyboard).toBeUndefined();
    expect(list()!.getAttribute("aria-activedescendant")).toBe(item.id);
    expect(
      classes(item.querySelector("[data-slot=select-pill]")!).join(" "),
    ).toContain("inset-x-x2");
    expect(SELECT_PILL_ON).toContain("bg-bg-layer-floating-pressed");
    pointer(item, "pointerout", "mouse");
    expect(item.dataset.highlighted).toBeUndefined();
  });
});

describe("Select — 여럿 고르기", () => {
  const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
  const days = DAYS.map((d) => (
    <SelectItem key={d} value={d} label={`${d}요일`} />
  ));

  it("목록이 열린 채 이어서 고르고, 다시 누르면 풀린다 · aria-multiselectable", () => {
    const onValueChange = vi.fn();
    render(
      <Select multiple aria-label="요일" onValueChange={onValueChange}>
        {days}
      </Select>,
    );
    click(trigger());
    expect(list()!.getAttribute("aria-multiselectable")).toBe("true");
    click(option("수요일"));
    click(option("월요일"));
    expect(list()).not.toBeNull();
    expect(onValueChange).toHaveBeenLastCalledWith(["수", "월"]);
    // 고른 순서대로 쌓인다
    expect(valueText()).toBe("수요일, 월요일");
    click(option("수요일"));
    expect(onValueChange).toHaveBeenLastCalledWith(["월"]);
    expect(valueText()).toBe("월요일");
  });

  it("목록 Enter · Space 는 고르거나 풀고 열어 둔다", () => {
    render(
      <Select multiple aria-label="요일" defaultValue={[]}>
        {days}
      </Select>,
    );
    key(trigger(), "ArrowDown");
    key(list()!, "Enter");
    expect(list()).not.toBeNull();
    expect(valueText()).toBe("월요일");
    key(list()!, "Enter");
    // 다시 누르면 풀린다 — placeholder 를 주지 않았으니 빈 글
    expect(valueText()).toBe("");
  });

  it('트리거 글 — 다 보이면 쉼표로 잇고, 칸 폭을 넘으면 "첫 값 외 N개"(앞의 값을 뺀 개수)', () => {
    render(
      <Select multiple aria-label="요일" defaultValue={["월", "수", "금"]}>
        {days}
      </Select>,
    );
    expect(valueText()).toBe("월요일, 수요일, 금요일");
    // 칸 폭 100 · 이은 글 폭 200 — jsdom 은 배치를 하지 않아 폭을 흉내 낸다
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.className.includes("invisible") ? 200 : 100;
        return { width } as DOMRect;
      },
    );
    render(
      <Select
        key="narrow"
        multiple
        aria-label="요일"
        defaultValue={["월", "수", "금", "일"]}
      >
        {days}
      </Select>,
    );
    expect(valueText()).toContain("월요일 외 3개");
  });

  it("formatValue 가 트리거 글을 정한다(고른 순서대로 받는다)", () => {
    const formatValue = vi.fn(
      (selected: { value: string; label: string }[]) =>
        `${selected.length}개 고름`,
    );
    render(
      <Select
        multiple
        aria-label="요일"
        defaultValue={["금", "월"]}
        formatValue={formatValue}
      >
        {days}
      </Select>,
    );
    expect(valueText()).toBe("2개 고름");
    expect(formatValue).toHaveBeenLastCalledWith([
      { value: "금", label: "금요일" },
      { value: "월", label: "월요일" },
    ]);
  });
});

describe("Select — 읽기 전용 · 비활성", () => {
  it("읽기 전용 — 포커스는 되고 열리지 않는다(누르기 · 키 · 글자 모두) · 값은 그대로 읽힌다", () => {
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="부서"
        readOnly
        defaultValue="KRW"
        onValueChange={onValueChange}
      >
        {CURRENCIES}
      </Select>,
    );
    expect(trigger().disabled).toBe(false);
    expect(trigger().getAttribute("aria-readonly")).toBe("true");
    expect(trigger().dataset.readonly).toBe("true");
    click(trigger());
    key(trigger(), "ArrowDown");
    key(trigger(), "Enter");
    key(trigger(), "유");
    expect(list()).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(valueText()).toBe("원");
    // 값은 진한 글자 그대로
    expect(
      classes(document.querySelector("[data-slot=select-value]")!),
    ).toContain("text-fg-neutral");
  });

  it("비활성 — 포커스 · 열기 불가 · 글자 · 아이콘 fg-disabled", () => {
    render(
      <Select aria-label="통화" disabled prefixIcon={<CreditCard />}>
        {CURRENCIES}
      </Select>,
    );
    expect(trigger().disabled).toBe(true);
    click(trigger());
    expect(list()).toBeNull();
    expect(
      classes(document.querySelector("[data-slot=select-value]")!),
    ).toContain("text-fg-disabled");
    expect(
      classes(document.querySelector("[data-slot=select-prefix-icon]")!),
    ).toContain("text-fg-disabled");
    expect(
      classes(document.querySelector("[data-slot=select-chevron]")!),
    ).toContain("text-fg-disabled");
  });

  it("열린 채 막히면 닫는다", async () => {
    function Test({ off }: { off: boolean }) {
      return (
        <Select aria-label="통화" readOnly={off}>
          {CURRENCIES}
        </Select>
      );
    }
    render(<Test off={false} />);
    click(trigger());
    expect(list()).not.toBeNull();
    render(<Test off />);
    await tick();
    expect(list()).toBeNull();
  });
});
