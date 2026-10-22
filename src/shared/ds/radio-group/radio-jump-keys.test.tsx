// 하나 고르기 묶음 여섯은 화살표만 받는다 — Home · End · PageUp · PageDown 은 기본 동작을 막고 초점 · 고른 것이 그대로다
// (03-E 결정 3 A + 후속, 2026-10-17 · 세부 확정 2026-10-21). Color Swatch 는 color-swatch.test.tsx 에서 본다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ChipRadio, ChipRadioGroup } from "@/shared/ds/chip";
import { ListRadioGroup, ListRadioItem } from "@/shared/ds/list";
import { Radio, RadioGroup } from "@/shared/ds/radio-group";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/ds/segmented-control";
import { RadioSelectBox, RadioSelectBoxGroup } from "@/shared/ds/select-box";

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

const radios = () =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("[role=radio]"));

function press(el: HTMLElement, key: string) {
  const e = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    el.dispatchEvent(e);
  });
  return e;
}

const CASES: [string, ReactNode][] = [
  [
    "RadioGroup",
    <RadioGroup aria-label="반복" defaultValue="a">
      <Radio value="a" label="하나" />
      <Radio value="b" label="둘" />
      <Radio value="c" label="셋" />
    </RadioGroup>,
  ],
  [
    "ChipRadioGroup",
    <ChipRadioGroup aria-label="종류" defaultValue="a">
      <ChipRadio value="a">하나</ChipRadio>
      <ChipRadio value="b">둘</ChipRadio>
      <ChipRadio value="c">셋</ChipRadio>
    </ChipRadioGroup>,
  ],
  [
    "SegmentedControl",
    <SegmentedControl aria-label="보기" defaultValue="a">
      <SegmentedControlItem value="a">하나</SegmentedControlItem>
      <SegmentedControlItem value="b">둘</SegmentedControlItem>
      <SegmentedControlItem value="c">셋</SegmentedControlItem>
    </SegmentedControl>,
  ],
  [
    "ListRadioGroup",
    <ListRadioGroup aria-label="통화" defaultValue="a">
      <ListRadioItem value="a" title="하나" />
      <ListRadioItem value="b" title="둘" />
      <ListRadioItem value="c" title="셋" />
    </ListRadioGroup>,
  ],
  [
    "RadioSelectBoxGroup",
    <RadioSelectBoxGroup aria-label="종료" defaultValue="a">
      <RadioSelectBox value="a" label="하나" description="가" />
      <RadioSelectBox value="b" label="둘" description="나" />
      <RadioSelectBox value="c" label="셋" description="다" />
    </RadioSelectBoxGroup>,
  ],
];

describe("하나 고르기 묶음 — 화살표만", () => {
  for (const [name, node] of CASES) {
    it(`${name}: Home · End · PageUp · PageDown 을 받지 않는다`, () => {
      act(() => root.render(node));
      const first = radios()[0]!;
      act(() => first.focus());
      for (const k of ["Home", "End", "PageUp", "PageDown"]) {
        const e = press(first, k);
        expect(e.defaultPrevented, `${name} ${k}`).toBe(true);
        expect(document.activeElement).toBe(first);
        expect(radios().map((r) => r.getAttribute("aria-checked"))).toEqual([
          "true",
          "false",
          "false",
        ]);
      }
    });

    it(`${name}: 화살표는 막지 않는다 — 초점이 다음 항목으로 간다`, async () => {
      act(() => root.render(node));
      const first = radios()[0]!;
      act(() => first.focus());
      const e = press(first, "ArrowDown");
      expect(e.defaultPrevented).toBe(true);
      // Radix 로빙 초점은 다음 틱에 옮긴다
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(document.activeElement).toBe(radios()[1]);
    });
  }
});
