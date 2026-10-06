// Tag Group 의 동작 — 글자 · 색 · 아이콘 크기는 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TagGroup, TagGroupItem } from "./tag-group";

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

// 보조 기술이 읽는 글 — aria-hidden 안의 글은 빼고, sr-only 글은 넣는다
function spokenText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.getAttribute("aria-hidden") === "true")
    return "";
  return Array.from(node.childNodes).map(spokenText).join("");
}

const items = (group: HTMLElement) =>
  Array.from(group.querySelectorAll<HTMLElement>("[data-slot=tag-group-item]"));
const separators = (group: HTMLElement) =>
  Array.from(
    group.querySelectorAll<HTMLElement>("[data-slot=tag-group-separator]"),
  );

const Icon = () => <svg data-testid="icon" />;

describe("TagGroup", () => {
  it("항목 사이에 구분을 스스로 넣는다 — 마지막 항목 뒤에는 없다", () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>식비</TagGroupItem>
        <TagGroupItem>신한카드</TagGroupItem>
        <TagGroupItem>오후 2:10</TagGroupItem>
      </TagGroup>,
    );
    expect(group.dataset.slot).toBe("tag-group");
    expect(items(group)).toHaveLength(3);
    const seps = separators(group);
    expect(seps).toHaveLength(2);
    // 보이는 구분은 줄이 안 바뀌는 공백 · 가운뎃점 · 공백 — 보조 기술에는 숨긴다
    const glyph = seps[0]!.querySelector("[aria-hidden=true]")!;
    expect(glyph.textContent).toBe(" · ");
    // 구분은 앞 항목과 한 칸이다 — 줄이 바뀌면 앞 줄 끝에 남는다
    const units = group.querySelectorAll("[data-slot=tag-group-unit]");
    expect(units).toHaveLength(3);
    expect(units[0]!.lastElementChild).toBe(seps[0]);
    expect(
      units[2]!.querySelector("[data-slot=tag-group-separator]"),
    ).toBeNull();
  });

  it('보조 기술은 항목마다 끊어 읽는다 — 구분 자리에 보이지 않는 ", "', () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>식비</TagGroupItem>
        <TagGroupItem>신한카드</TagGroupItem>
        <TagGroupItem>오후 2:10</TagGroupItem>
      </TagGroup>,
    );
    const sr = separators(group)[0]!.querySelector(".sr-only")!;
    expect(sr.textContent).toBe(", ");
    expect(spokenText(group)).toBe("식비, 신한카드, 오후 2:10");
  });

  it("역할이 없다 — 줄마다 목록으로 읽지 않는다", () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>인사팀</TagGroupItem>
        <TagGroupItem>10월 2일</TagGroupItem>
      </TagGroup>,
    );
    expect(group.tagName).toBe("SPAN");
    expect(group.querySelector("[role]")).toBeNull();
    expect(group.hasAttribute("role")).toBe(false);
  });

  it("빈 항목은 건너뛴다 — 구분이 두 번 찍히거나 끝에 남지 않는다", () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>식비</TagGroupItem>
        {null}
        {false}
        {""}
        {"  "}
        <TagGroupItem>{""}</TagGroupItem>
        <TagGroupItem />
        <TagGroupItem>오후 2:10</TagGroupItem>
      </TagGroup>,
    );
    expect(items(group)).toHaveLength(2);
    expect(separators(group)).toHaveLength(1);
    expect(spokenText(group)).toBe("식비, 오후 2:10");
  });

  it("글 · 숫자 자식은 항목이 되고, 아이콘만 있는 항목은 남긴다", () => {
    const group = render(
      <TagGroup>
        {"식비"}
        {3}
        <TagGroupItem prefixIcon={<Icon />} srLabel="반복" />
      </TagGroup>,
    );
    expect(items(group)).toHaveLength(3);
    expect(separators(group)).toHaveLength(2);
    expect(spokenText(group)).toBe("식비, 3, 반복");
  });

  it("묶음의 톤 · 굵기는 항목의 기본값이고 항목이 덮는다", () => {
    const plain = render(
      <TagGroup>
        <TagGroupItem>할인형</TagGroupItem>
      </TagGroup>,
    );
    expect(items(plain)[0]!.className).toContain("text-fg-neutral-subtle");
    expect(items(plain)[0]!.className).toContain("font-normal");

    const group = render(
      <TagGroup tone="neutral" weight="bold">
        <TagGroupItem>전월 30만원 이상</TagGroupItem>
        <TagGroupItem tone="brand" weight="regular">
          내가 씀
        </TagGroupItem>
      </TagGroup>,
    );
    const [first, second] = items(group);
    expect(first!.className).toContain("text-fg-neutral");
    expect(first!.className).toContain("font-bold");
    expect(second!.className).toContain("text-fg-brand");
    expect(second!.className).toContain("font-normal");
  });

  it("구분은 톤 · 굵기와 관계없이 fg-disabled · 400", () => {
    const group = render(
      <TagGroup tone="brand" weight="bold">
        <TagGroupItem>내가 씀</TagGroupItem>
        <TagGroupItem>3분 전</TagGroupItem>
      </TagGroup>,
    );
    const sep = separators(group)[0]!;
    expect(sep.className).toContain("text-fg-disabled");
    expect(sep.className).toContain("font-normal");
  });

  it("srLabel 을 주면 보이는 글 · 아이콘을 숨기고 그 글을 읽는다", () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>인사팀</TagGroupItem>
        <TagGroupItem prefixIcon={<Icon />} srLabel="조회 12">
          12
        </TagGroupItem>
      </TagGroup>,
    );
    const item = items(group)[1]!;
    const label = item.querySelector("[data-slot=tag-group-item-label]")!;
    expect(label.getAttribute("aria-hidden")).toBe("true");
    expect(item.querySelector(".sr-only")!.textContent).toBe("조회 12");
    expect(spokenText(group)).toBe("인사팀, 조회 12");
  });

  it("아이콘은 늘 숨기고 크기는 묶음이 정한다(12 · 13 · 14), 글과 사이 2", () => {
    const group = render(
      <TagGroup size="t3">
        <TagGroupItem prefixIcon={<Icon />}>12</TagGroupItem>
      </TagGroup>,
    );
    const icon = group.querySelector("[data-slot=tag-group-item-prefix-icon]")!;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.className).toContain("[&>svg]:size-[13px]");
    expect(icon.className).toContain("mr-x0_5");
    // 앞 아이콘은 글보다 앞이다
    expect(items(group)[0]!.firstElementChild).toBe(icon);
  });

  it("줄바꿈(기본) — 낱말 단위, 뒤 아이콘은 마지막 낱말과 한 덩어리", () => {
    const group = render(
      <TagGroup>
        <TagGroupItem>식비</TagGroupItem>
        <TagGroupItem suffixIcon={<Icon />} srLabel="카드 분할 2건">
          카드 분할 2
        </TagGroupItem>
      </TagGroup>,
    );
    expect(group.className).toContain("inline-block");
    expect(group.className).toContain("break-keep");
    expect(group.className).toContain("[overflow-wrap:break-word]");
    // 항목 + 구분 칸은 nowrap — 줄은 글 안 · 구분 뒤 띄어쓰기에서만 바뀐다
    const unit = group.querySelector("[data-slot=tag-group-unit]")!;
    expect(unit.className).toContain("whitespace-nowrap");
    expect(separators(group)[0]!.className).toContain("whitespace-normal");

    const label = items(group)[1]!.querySelector(
      "[data-slot=tag-group-item-label]",
    )!;
    expect(label.className).toContain("whitespace-normal");
    const glued = label.querySelector(".whitespace-nowrap")!;
    expect(glued.textContent).toBe("2");
    expect(
      glued.querySelector("[data-slot=tag-group-item-suffix-icon]"),
    ).not.toBeNull();
    expect(label.textContent).toBe("카드 분할 2");
    // wrap 이면 줄어드는 차례를 두지 않는다
    expect(items(group)[0]!.style.flexShrink).toBe("");
  });

  it("한 줄 말줄임(truncate) — 항목마다 줄어드는 차례, 구분은 줄지 않는다", () => {
    const group = render(
      <TagGroup size="t3" truncate>
        <TagGroupItem>교통</TagGroupItem>
        <TagGroupItem shrink={2}>신한카드 Deep Dream 체크(1234)</TagGroupItem>
        <TagGroupItem shrink={0} suffixIcon={<Icon />}>
          오후 2:10
        </TagGroupItem>
      </TagGroup>,
    );
    expect(group.className).toContain("inline-flex");
    expect(group.className).toContain("whitespace-nowrap");
    expect(group.className).toContain("max-w-full");
    // 칸을 지워 항목 · 구분이 묶음의 flex 칸이 된다
    expect(
      group.querySelector("[data-slot=tag-group-unit]")!.className,
    ).toContain("contents");
    expect(items(group).map((item) => item.style.flexShrink)).toEqual([
      "1",
      "2",
      "0",
    ]);
    for (const sep of separators(group)) {
      expect(sep.className).toContain("shrink-0");
    }
    const last = items(group)[2]!;
    const label = last.querySelector("[data-slot=tag-group-item-label]")!;
    expect(label.className).toContain("truncate");
    // 글만 말줄임 — 뒤 아이콘은 글 밖이라 잘리지 않는다
    expect(
      label.querySelector("[data-slot=tag-group-item-suffix-icon]"),
    ).toBeNull();
    expect(last.lastElementChild!.getAttribute("data-slot")).toBe(
      "tag-group-item-suffix-icon",
    );
  });

  it("쓰는 쪽의 className · style · ref 를 받는다", () => {
    const groupRef = createRef<HTMLSpanElement>();
    const itemRef = createRef<HTMLSpanElement>();
    const group = render(
      <TagGroup ref={groupRef} className="mt-x1" truncate>
        <TagGroupItem ref={itemRef} style={{ maxWidth: 80 }}>
          식비
        </TagGroupItem>
      </TagGroup>,
    );
    expect(groupRef.current).toBe(group);
    expect(group.className).toContain("mt-x1");
    expect(itemRef.current).toBe(items(group)[0]);
    expect(itemRef.current!.style.maxWidth).toBe("80px");
    expect(itemRef.current!.style.flexShrink).toBe("1");
  });
});
