// Accordion 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(머리말 단계 · 보임 · 숨김 · 문장 · 시간 · 누름 축소 — accordion.measure.mjs 머리)은 여기서 클래스 · 속성으로 본다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionExpandAll,
  AccordionHeader,
  AccordionItem,
  AccordionPlainItem,
  AccordionTrigger,
} from "./accordion";

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

const classes = (el: Element) => (el.getAttribute("class") ?? "").split(" ");
const slot = (name: string, from: ParentNode = container) =>
  from.querySelector<HTMLElement>(`[data-slot=${name}]`)!;
const slots = (name: string, from: ParentNode = container) =>
  Array.from(from.querySelectorAll<HTMLElement>(`[data-slot=${name}]`));
// 줄 수는 테스트마다 다르다 — 앞 네 칸은 있다고 보고(noUncheckedIndexedAccess), 더 긴 목록은 !(non-null)로 짚는다
type Four<T> = [T, T, T, T, ...T[]];
const triggers = () => slots("accordion-trigger") as Four<HTMLButtonElement>;
const panels = () => slots("accordion-content") as Four<HTMLElement>;
const click = (el: Element) => act(() => (el as HTMLElement).click());
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

const BENEFITS = [
  { id: "coffee", title: "커피", summary: "50% 할인", detail: "■ 월 3만원" },
  { id: "fuel", title: "주유", summary: "리터당 60원", detail: "■ 월 5만원" },
  { id: "bus", title: "대중교통", summary: "10% 할인", detail: undefined },
  { id: "mart", title: "마트", summary: "5% 할인", detail: "■ 월 2만원" },
];

const List = ({
  detail = true,
  ...props
}: Partial<React.ComponentProps<typeof Accordion>> & { detail?: boolean }) => (
  <Accordion {...props}>
    {BENEFITS.map((b) =>
      b.detail || !detail ? (
        <AccordionItem key={b.id} value={b.id}>
          <AccordionTrigger title={b.title} description={b.summary} />
          <AccordionContent>{b.detail ?? "상세"}</AccordionContent>
        </AccordionItem>
      ) : (
        <AccordionPlainItem
          key={b.id}
          title={b.title}
          description={b.summary}
        />
      ),
    )}
  </Accordion>
);

describe("Accordion — 구조 · 읽기", () => {
  it("트리거는 머리말(h3) 안의 단추 — aria-expanded · aria-controls(펼친 내용의 id), 펼친 내용에 role 이 없다", () => {
    render(<List />);
    const [first] = triggers();
    expect(first.closest("h3")).not.toBeNull();
    expect(first.getAttribute("aria-expanded")).toBe("false");
    const content = panels()[0];
    expect(first.getAttribute("aria-controls")).toBe(content.id);
    expect(content.getAttribute("role")).toBeNull();
    expect(slot("accordion-content-text").getAttribute("role")).toBeNull();
  });

  it("headingLevel 로 머리말 단계를 놓인 자리에 맞춘다(2 ~ 6)", () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger title="제목" headingLevel={4} />
          <AccordionContent>상세</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(slot("accordion-heading").tagName).toBe("H4");
  });

  it("이름은 제목 + 설명이고 펼쳐도 바뀌지 않는다 — 펼침은 aria-expanded 가 알린다", () => {
    render(<List />);
    const [first] = triggers();
    const name = first.textContent;
    expect(name).toBe("커피50% 할인");
    click(first);
    expect(first.textContent).toBe(name);
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("꺾쇠 · 앞 아이콘은 읽히지 않는다(aria-hidden)", () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger title="제목" prefixIcon={<svg />} />
          <AccordionContent>상세</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(slot("accordion-chevron").getAttribute("aria-hidden")).toBe("true");
    expect(slot("accordion-prefix-icon").getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(slot("accordion-background").getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("Accordion 밖에서 쓰면 알려 준다", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AccordionItem value="a">밖</AccordionItem>)).toThrow(
      /Accordion 안에 둔다/,
    );
    error.mockRestore();
  });
});

describe("Accordion — 펼침", () => {
  it("처음에는 모두 접힘 — 펼친 내용은 hidden(그리지 않는다)이고 안의 글은 늘 DOM 에 있다", () => {
    render(<List />);
    expect(triggers().map((t) => t.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
      "false",
    ]);
    expect(panels().every((p) => p.hidden)).toBe(true);
    expect(slots("accordion-content-text")).toHaveLength(3);
  });

  it("여럿을 함께 연다 — 하나를 열어도 다른 항목은 닫히지 않고, 다시 누르면 그 항목만 닫는다", () => {
    render(<List />);
    const [a, b] = triggers();
    click(a);
    click(b);
    expect(a.getAttribute("aria-expanded")).toBe("true");
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(panels()[0].hidden).toBe(false);
    expect(panels()[1].hidden).toBe(false);
    click(a);
    expect(a.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(panels()[0].hidden).toBe(true);
  });

  it("defaultValues 로 처음 펼침을 정한다", () => {
    render(<List defaultValues={["fuel"]} />);
    expect(triggers().map((t) => t.getAttribute("aria-expanded"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(panels()[1].hidden).toBe(false);
  });

  it("쥐고 다루는 values — onValuesChange 로 바꾸려는 목록을 알리고 안 바꿔 주면 그대로", () => {
    const onValuesChange = vi.fn();
    render(<List values={["coffee"]} onValuesChange={onValuesChange} />);
    click(triggers()[1]);
    expect(onValuesChange).toHaveBeenLastCalledWith(["coffee", "fuel"]);
    expect(triggers()[1].getAttribute("aria-expanded")).toBe("false");
    click(triggers()[0]);
    expect(onValuesChange).toHaveBeenLastCalledWith([]);
  });

  it("스스로 다룰 때도 onValuesChange 를 부른다", () => {
    const onValuesChange = vi.fn();
    render(<List onValuesChange={onValuesChange} />);
    click(triggers()[0]);
    click(triggers()[1]);
    expect(onValuesChange.mock.calls).toEqual([
      [["coffee"]],
      [["coffee", "fuel"]],
    ]);
  });

  it("펼쳐도 초점은 트리거에 그대로고 화면을 저절로 스크롤하지 않는다", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<List />);
    const [a] = triggers();
    act(() => a.focus());
    click(a);
    expect(document.activeElement).toBe(a);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("꺾쇠는 펼치면 180° — rotate-180 이 붙고 300ms · motion-ease-easing 으로 돈다(모션 줄이기면 바로)", () => {
    render(<List />);
    const chevron = slots("accordion-chevron")[0]!;
    expect(classes(chevron)).not.toContain("rotate-180");
    click(triggers()[0]);
    expect(classes(chevron)).toContain("rotate-180");
    expect(classes(chevron)).toEqual(
      expect.arrayContaining([
        "[transition:rotate_var(--motion-duration-d6)_var(--motion-ease-easing)]",
        "motion-reduce:transition-none",
      ]),
    );
  });
});

describe("Accordion — 펼침 모션", () => {
  const animate = vi.fn();
  const stubMotion = (reduced: boolean) => {
    animate.mockReset();
    animate.mockImplementation(() => ({ cancel: vi.fn(), onfinish: null }));
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: reduced, addEventListener() {} }),
    );
  };
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });

  it("처음 그릴 때는 움직이지 않는다", () => {
    stubMotion(false);
    render(<List defaultValues={["coffee"]} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it("펼칠 때 높이를 300ms 움직인다 — 닫힌 쪽에서 열린 높이로(motion-duration-d6 · 읽지 못하면 300)", () => {
    stubMotion(false);
    render(<List />);
    click(triggers()[0]);
    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, options] = animate.mock.calls[0]!;
    expect(frames).toEqual([{ height: "0px" }, { height: "0px" }]);
    expect(options.duration).toBe(300);
  });

  it("모션 줄이기면 높이를 움직이지 않고 150ms 서서히 나타난다(opacity 만)", () => {
    stubMotion(true);
    render(<List />);
    click(triggers()[0]);
    const [frames, options] = animate.mock.calls[0]!;
    expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(options.duration).toBe(150);
  });
});

describe("Accordion — 키보드(APG)", () => {
  it("↓ ↑ 는 다음 · 앞 트리거로(끝에서 처음으로 돈다), Home · End 는 첫 · 끝 트리거", () => {
    render(<List />);
    const [a, b, c] = triggers();
    act(() => a.focus());
    key(a, "ArrowDown");
    expect(document.activeElement).toBe(b);
    key(b, "ArrowDown");
    expect(document.activeElement).toBe(c);
    key(c, "ArrowDown");
    expect(document.activeElement).toBe(a);
    key(a, "ArrowUp");
    expect(document.activeElement).toBe(c);
    key(c, "Home");
    expect(document.activeElement).toBe(a);
    key(a, "End");
    expect(document.activeElement).toBe(c);
  });

  it("상세가 없는 줄과 막힌 트리거는 건너뛴다 — Tab 정지점도 아니다", () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger title="A" />
          <AccordionContent>a</AccordionContent>
        </AccordionItem>
        <AccordionPlainItem title="그냥 줄" />
        <AccordionItem value="b" disabled>
          <AccordionTrigger title="B" />
          <AccordionContent>b</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger title="C" />
          <AccordionContent>c</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const [a, , c] = triggers();
    act(() => a.focus());
    key(a, "ArrowDown");
    expect(document.activeElement).toBe(c);
    key(c, "ArrowDown");
    expect(document.activeElement).toBe(a);
    expect(container.querySelectorAll("button:not([disabled])")).toHaveLength(
      2,
    );
  });

  it("안에 둔 다른 아코디언의 트리거는 화살표로 가지 않는다", () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger title="바깥 A" />
          <AccordionContent>
            <Accordion>
              <AccordionItem value="in">
                <AccordionTrigger title="안쪽" />
                <AccordionContent>안</AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger title="바깥 B" />
          <AccordionContent>b</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const all = triggers();
    const outerA = all.find((t) => t.textContent === "바깥 A")!;
    const outerB = all.find((t) => t.textContent === "바깥 B")!;
    act(() => outerA.focus());
    key(outerA, "ArrowDown");
    expect(document.activeElement).toBe(outerB);
  });

  it("Enter · Space 는 단추 그대로(클릭) — 화살표 키는 기본 동작을 막는다", () => {
    render(<List />);
    const [a] = triggers();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      a.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    const enter = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      a.dispatchEvent(enter);
    });
    expect(enter.defaultPrevented).toBe(false);
  });
});

describe("Accordion — 상세가 없는 항목 · 막힘", () => {
  it("그냥 줄 — 단추 · 머리말 · 꺾쇠가 없고 글만 읽힌다", () => {
    render(<AccordionWithPlain />);
    const plain = slot("accordion-plain-item");
    expect(plain.querySelector("button")).toBeNull();
    expect(plain.querySelector("h3")).toBeNull();
    expect(plain.querySelector("[data-slot=accordion-chevron]")).toBeNull();
    expect(plain.textContent).toBe("대중교통10% 할인");
  });

  it("그냥 줄도 트리거와 같은 위아래 16 · 좌우 24 · 높이 54(설명이 있으면 74)이고 커서 · 바탕이 없다", () => {
    render(<AccordionWithPlain />);
    const content = slot("accordion-plain-item-content");
    expect(classes(content)).toEqual(
      expect.arrayContaining([
        "py-x4",
        "px-global-gutter",
        "min-h-[74px]",
        "cursor-default",
      ]),
    );
    expect(
      content.querySelector("[data-slot=accordion-background]"),
    ).toBeNull();
    expect(classes(content).some((c) => c.includes("active"))).toBe(false);

    render(
      <Accordion>
        <AccordionPlainItem title="제목만" />
        <AccordionPlainItem title="설명도" description="요약" />
      </Accordion>,
    );
    const [only, both] = slots(
      "accordion-plain-item-content",
    ) as Four<HTMLElement>;
    expect(classes(only)).toContain("min-h-[54px]");
    expect(classes(both)).toContain("min-h-[74px]");
  });

  it("막힌 항목 — 단추가 막히고 앞 아이콘 · 제목 · 설명 · 꺾쇠가 모두 fg-disabled(흐리게 하지 않는다), 펼친 채 막히면 내용은 그대로 보인다", () => {
    render(
      <Accordion defaultValues={["a"]}>
        <AccordionItem value="a" disabled>
          <AccordionTrigger
            title="제목"
            description="설명"
            prefixIcon={<svg />}
          />
          <AccordionContent>상세</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const [button] = triggers();
    expect(button.disabled).toBe(true);
    for (const name of [
      "accordion-title",
      "accordion-description",
      "accordion-chevron",
      "accordion-prefix-icon",
    ]) {
      expect(classes(slot(name))).toContain("text-fg-disabled");
    }
    expect(classes(button).join(" ")).not.toMatch(/opacity/);
    expect(panels()[0].hidden).toBe(false);
    click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("Accordion disabled 는 전체를 막는다", () => {
    render(<List disabled />);
    expect(triggers().every((t) => t.disabled)).toBe(true);
  });
});

function AccordionWithPlain() {
  return (
    <Accordion>
      <AccordionItem value="a">
        <AccordionTrigger title="커피" />
        <AccordionContent>상세</AccordionContent>
      </AccordionItem>
      <AccordionPlainItem title="대중교통" description="10% 할인" />
    </Accordion>
  );
}

describe("Accordion — 모양 규칙", () => {
  it("트리거 — 줄 전체가 누르는 자리(폭 100%), 설명이 있으면 74 · 없으면 54, 포커스 링은 안쪽 2px", () => {
    render(<List />);
    const [a] = triggers();
    expect(classes(a)).toEqual(
      expect.arrayContaining([
        "w-full",
        "min-h-[74px]",
        "focus-visible:outline-2",
        "focus-visible:-outline-offset-2",
        "focus-visible:outline-stroke-focus-ring",
        "disabled:cursor-not-allowed",
      ]),
    );
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger title="제목만" />
          <AccordionContent>상세</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(classes(triggers()[0])).toContain("min-h-[54px]");
  });

  it("바탕 층은 누르면 좌우 6 · 모서리 10 · 불투명한 bg-layer-default-pressed, 콘텐츠 층만 2px 거리로 준다(모션 줄이기면 줄지 않는다)", () => {
    render(<List />);
    const bg = slot("accordion-background").className;
    expect(bg).toContain("group-active/accordion-trigger:inset-x-x1_5");
    expect(bg).toContain("group-active/accordion-trigger:rounded-r2_5");
    expect(bg).toContain("bg-(--trigger-pressed)");
    expect(classes(triggers()[0])).toContain(
      "[--trigger-pressed:var(--color-bg-layer-default-pressed)]",
    );
    const content = slot("accordion-trigger-content").className;
    expect(content).toContain(
      "group-active/accordion-trigger:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(content).toContain(
      "motion-reduce:group-active/accordion-trigger:[scale:1]",
    );
  });

  it("누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 넘긴다", () => {
    render(<List />);
    const [a] = triggers();
    Object.defineProperty(a, "offsetHeight", { value: 74 });
    Object.defineProperty(a, "offsetWidth", { value: 390 });
    act(() => {
      a.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(a.style.getPropertyValue("--press-basis")).toBe("97.5");
  });

  it("막힌 트리거는 누름 축소가 없다", () => {
    render(<List disabled />);
    expect(slot("accordion-trigger-content").className).not.toContain(
      "group-active/accordion-trigger:[scale",
    );
  });

  it("제목 · 설명은 늘 줄을 바꾼다 — 말줄임 · 줄 수 제한이 없고 단어 단위(break-keep)", () => {
    render(<List />);
    for (const name of ["accordion-title", "accordion-description"]) {
      const c = classes(slot(name));
      expect(c).toEqual(
        expect.arrayContaining(["break-keep", "[overflow-wrap:break-word]"]),
      );
      expect(c).not.toContain("truncate");
      expect(c.some((x) => x.startsWith("line-clamp"))).toBe(false);
    }
  });

  it("펼친 내용 — 0 / 24 / 16 · 14 / 22 · fg-neutral-muted · 줄바꿈 문자를 지킨다, 안에서 스크롤하지 않는다", () => {
    render(<List />);
    const text = slot("accordion-content-text");
    expect(classes(text)).toEqual(
      expect.arrayContaining([
        "px-global-gutter",
        "pb-x4",
        "pt-0",
        "text-article-note",
        "text-fg-neutral-muted",
        "whitespace-pre-line",
      ]),
    );
    expect(classes(text).some((c) => c.startsWith("overflow"))).toBe(false);
    expect(classes(text).some((c) => c.startsWith("max-h"))).toBe(false);
  });

  it("inline — 항목 사이 선(1px · 좌우 24)은 앞에 형제 항목이 있을 때만 보인다(첫 위 · 끝 아래에는 없다)", () => {
    render(<List />);
    expect(classes(slot("accordion"))).toContain(
      "[&>[data-accordion-row]+[data-accordion-row]>[data-slot=accordion-divider]]:block",
    );
    expect(classes(slot("accordion"))).toContain("gap-0");
    const divider = slot("accordion-divider");
    expect(classes(divider)).toEqual(
      expect.arrayContaining([
        "hidden",
        "h-px",
        "mx-x6",
        "bg-stroke-neutral-subtle",
      ]),
    );
    // 선은 항목 맨 위에만 있다 — 마지막 항목 아래에 따로 긋지 않는다
    for (const row of container.querySelectorAll("[data-accordion-row]")) {
      expect(row.firstElementChild).toBe(
        row.querySelector("[data-slot=accordion-divider]"),
      );
      expect(
        row.querySelectorAll("[data-slot=accordion-divider]"),
      ).toHaveLength(1);
    }
  });

  it("separated — 항목마다 Card 면(1px · 모서리 16 · 그림자 없음)이고 사이 8, 선은 없고 포커스 링은 모서리 14", () => {
    render(<List variant="separated" />);
    expect(classes(slot("accordion"))).toContain("gap-x2");
    expect(classes(slot("accordion")).join(" ")).not.toContain(
      "accordion-divider",
    );
    const item = slot("accordion-item");
    expect(classes(item)).toEqual(
      expect.arrayContaining([
        "overflow-hidden",
        "rounded-r4",
        "border",
        "border-stroke-neutral-weak",
      ]),
    );
    expect(classes(item).some((c) => c.startsWith("shadow"))).toBe(false);
    expect(classes(triggers()[0])).toContain("rounded-r3_5");
  });
});

describe("AccordionHeader · AccordionExpandAll", () => {
  const Sheet = ({ initial = [] as string[] }) => {
    const [open, setOpen] = useState(initial);
    const expandable = BENEFITS.filter((b) => b.detail).map((b) => b.id);
    return (
      <>
        <AccordionHeader title="혜택 상세 · 4건">
          <AccordionExpandAll
            controls="sheet"
            values={open}
            expandable={expandable}
            onValuesChange={setOpen}
          />
        </AccordionHeader>
        <List
          id="sheet"
          variant="separated"
          values={open}
          onValuesChange={setOpen}
        />
      </>
    );
  };
  const expandAll = () => slot("accordion-expand-all");

  it("목록 머리는 동작이 머리 폭의 절반을 넘으면 제목 아래 줄 오른쪽 끝으로 내려간다 — 제목 최소 50% · 줄바꿈(03-G 4A)", () => {
    render(<Sheet />);
    expect(slot("accordion-header").className.split(" ")).toEqual(
      expect.arrayContaining([
        "flex-wrap",
        "[&>:first-child:not(:last-child)]:min-w-[50%]",
        "[&>:first-child:not(:last-child)]:flex-1",
        "[&>:last-child:not(:first-child)]:ml-auto",
      ]),
    );
  });

  it("목록 머리 — 제목(건수 포함)과 오른쪽 자식, 높이 36 · 아래 8", () => {
    render(<Sheet />);
    const header = slot("accordion-header");
    expect(slot("accordion-header-title").textContent).toBe("혜택 상세 · 4건");
    expect(header.lastElementChild).toBe(expandAll());
    expect(classes(header)).toEqual(
      expect.arrayContaining(["min-h-9", "mb-x2", "justify-between"]),
    );
  });

  it("모두 펼치기 — 상세가 있는 항목만 모두 펼치고 글이 모두 접기로 바뀐다, 다시 누르면 모두 접는다", () => {
    render(<Sheet />);
    expect(expandAll().textContent).toBe("모두 펼치기");
    click(expandAll());
    expect(triggers().map((t) => t.getAttribute("aria-expanded"))).toEqual([
      "true",
      "true",
      "true",
    ]);
    expect(expandAll().textContent).toBe("모두 접기");
    expect(expandAll().getAttribute("data-state")).toBe("expanded");
    click(expandAll());
    expect(
      triggers().every((t) => t.getAttribute("aria-expanded") === "false"),
    ).toBe(true);
    expect(expandAll().textContent).toBe("모두 펼치기");
  });

  it("하나라도 접혀 있으면 다시 모두 펼치기, 이름은 보이는 글이고 aria-controls 만 가진다(aria-expanded 없음)", () => {
    render(<Sheet initial={["coffee", "fuel"]} />);
    expect(expandAll().textContent).toBe("모두 펼치기");
    expect(expandAll().getAttribute("aria-controls")).toBe("sheet");
    expect(expandAll().getAttribute("aria-expanded")).toBeNull();
    click(expandAll());
    expect(expandAll().textContent).toBe("모두 접기");
  });

  it("모두 접을 때는 상세가 있는 항목만 닫는다 — 목록에 없는 값은 그대로", () => {
    const onValuesChange = vi.fn();
    render(
      <AccordionExpandAll
        controls="x"
        values={["coffee", "fuel", "other"]}
        expandable={["coffee", "fuel"]}
        onValuesChange={onValuesChange}
      />,
    );
    click(expandAll());
    expect(onValuesChange).toHaveBeenCalledWith(["other"]);
  });

  it("펼칠 항목이 없으면 늘 모두 펼치기이고 눌러도 목록이 그대로다", () => {
    const onValuesChange = vi.fn();
    render(
      <AccordionExpandAll
        controls="x"
        values={[]}
        expandable={[]}
        onValuesChange={onValuesChange}
      />,
    );
    expect(expandAll().textContent).toBe("모두 펼치기");
    click(expandAll());
    expect(onValuesChange).toHaveBeenCalledWith([]);
  });

  it("글은 호출하는 쪽이 바꿀 수 있다(expandLabel · collapseLabel)", () => {
    render(
      <AccordionExpandAll
        controls="x"
        values={["a"]}
        expandable={["a"]}
        onValuesChange={() => {}}
        expandLabel="Expand all"
        collapseLabel="Collapse all"
      />,
    );
    expect(expandAll().textContent).toBe("Collapse all");
  });

  it("글 버튼 — 보이는 상자 36 · 누르는 영역 44(::before) · 누르면 바탕 + 2px 거리 축소 · 키보드 링은 단추 바깥 2px", () => {
    render(<Sheet />);
    const c = classes(expandAll());
    expect(c).toEqual(
      expect.arrayContaining([
        "h-9",
        "before:h-11",
        "before:min-w-11",
        "rounded-r2",
        "px-x3_5",
        "font-bold",
        "text-fg-neutral-muted",
        "focus-visible:outline-offset-2",
      ]),
    );
    expect(expandAll().className).toContain(
      "active:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(expandAll().className).toContain("motion-reduce:active:[scale:1]");
  });
});

describe("20개 항목 · 긴 제목 · 펼침 중 내용 변화", () => {
  it("항목 20개 — 화살표로 돌며 다닌다, 열린 항목이 여럿이어도 다른 항목은 닫히지 않는다", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `n${i}`);
    render(
      <Accordion>
        {ids.map((id, i) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger
              title={i === 0 ? "연회비 ".repeat(40) : `유의사항 ${i}`}
            />
            <AccordionContent>상세 {i}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>,
    );
    expect(triggers()).toHaveLength(20);
    for (const t of triggers().slice(0, 10)) click(t);
    expect(
      triggers().filter((t) => t.getAttribute("aria-expanded") === "true"),
    ).toHaveLength(10);
    const first = triggers()[0];
    act(() => first.focus());
    key(first, "End");
    expect(document.activeElement).toBe(triggers()[19]!);
    key(triggers()[19]!, "ArrowDown");
    expect(document.activeElement).toBe(first);
  });

  it("펼친 채 내용이 늘어나도 열린 상태와 트리거 초점이 그대로다", () => {
    const Grow = () => {
      const [n, setN] = useState(1);
      return (
        <Accordion defaultValues={["a"]}>
          <AccordionItem value="a">
            <AccordionTrigger title="제목" />
            <AccordionContent>
              {Array.from({ length: n }, (_, i) => (
                <p key={i}>줄 {i}</p>
              ))}
              <button type="button" data-more onClick={() => setN(n + 5)}>
                더
              </button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    };
    render(<Grow />);
    const [trigger] = triggers();
    act(() => trigger.focus());
    click(container.querySelector("[data-more]")!);
    expect(container.querySelectorAll("p")).toHaveLength(6);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panels()[0].hidden).toBe(false);
  });
});
