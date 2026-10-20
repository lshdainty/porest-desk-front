// 내역 추가 시트의 Enter 저장이 **무엇을 거르는지**(QA #132). 저장이 되는 것보다
// 엉뚱한 Enter 가 저장하지 않는 쪽이 중요하다 — 한글을 확정하려던 Enter 나 셀렉트
// 안의 Enter 가 거래를 만들면 #122(연타로 여러 건)와 같은 자리에 서게 된다.
import { describe, expect, it } from "vitest";
import type { KeyboardEvent } from "react";
import { isEnterSave } from "./enter-save";

/** 시트 본문 역할을 하는 div + 그 안의 입력칸. */
function mount(): { body: HTMLDivElement; input: HTMLInputElement } {
  const body = document.createElement("div");
  const input = document.createElement("input");
  body.appendChild(input);
  document.body.appendChild(body);
  return { body, input };
}

type Overrides = Partial<{
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
  isComposing: boolean;
  target: EventTarget;
  currentTarget: HTMLElement;
}>;

function ev(o: Overrides = {}): KeyboardEvent<HTMLElement> {
  const { body, input } = mount();
  return {
    key: o.key ?? "Enter",
    shiftKey: o.shiftKey ?? false,
    ctrlKey: o.ctrlKey ?? false,
    altKey: o.altKey ?? false,
    metaKey: o.metaKey ?? false,
    defaultPrevented: o.defaultPrevented ?? false,
    target: o.target ?? input,
    currentTarget: o.currentTarget ?? body,
    nativeEvent: { isComposing: o.isComposing ?? false },
  } as unknown as KeyboardEvent<HTMLElement>;
}

describe("isEnterSave", () => {
  it("입력칸에서 누른 맨 Enter 는 저장이다", () => {
    expect(isEnterSave(ev())).toBe(true);
  });

  it("조합 중인 Enter 는 글자를 확정하는 키다 — 저장하지 않는다", () => {
    // 파이어폭스가 주는 모양: key 는 Enter 인데 isComposing 이 켜져 있다.
    expect(isEnterSave(ev({ isComposing: true }))).toBe(false);
    // 크롬·사파리는 아예 Process 로 준다.
    expect(isEnterSave(ev({ key: "Process" }))).toBe(false);
  });

  it("Enter 가 아니면 아니다", () => {
    expect(isEnterSave(ev({ key: "a" }))).toBe(false);
    expect(isEnterSave(ev({ key: " " }))).toBe(false);
    expect(isEnterSave(ev({ key: "NumpadEnter" }))).toBe(false);
  });

  it("조합키가 눌린 Enter 와 이미 처리된 키는 지나간다", () => {
    expect(isEnterSave(ev({ shiftKey: true }))).toBe(false);
    expect(isEnterSave(ev({ ctrlKey: true }))).toBe(false);
    expect(isEnterSave(ev({ altKey: true }))).toBe(false);
    expect(isEnterSave(ev({ metaKey: true }))).toBe(false);
    expect(isEnterSave(ev({ defaultPrevented: true }))).toBe(false);
  });

  it("여러 줄 칸·버튼의 Enter 는 그 자리의 뜻이 따로 있다", () => {
    const body = document.createElement("div");
    const area = document.createElement("textarea");
    const button = document.createElement("button");
    body.append(area, button);
    expect(isEnterSave(ev({ target: area, currentTarget: body }))).toBe(false);
    expect(isEnterSave(ev({ target: button, currentTarget: body }))).toBe(
      false,
    );
  });

  it("글을 치는 칸이 아닌 input 은 뺀다", () => {
    for (const type of ["checkbox", "radio", "file", "submit", "button"]) {
      const body = document.createElement("div");
      const input = document.createElement("input");
      input.type = type;
      body.appendChild(input);
      expect(isEnterSave(ev({ target: input, currentTarget: body }))).toBe(
        false,
      );
    }
  });

  it("읽기 전용·비활성 칸은 저장 대상이 아니다", () => {
    const body = document.createElement("div");
    const ro = document.createElement("input");
    ro.readOnly = true;
    const off = document.createElement("input");
    off.disabled = true;
    body.append(ro, off);
    expect(isEnterSave(ev({ target: ro, currentTarget: body }))).toBe(false);
    expect(isEnterSave(ev({ target: off, currentTarget: body }))).toBe(false);
  });

  it("포털 안(중첩 대화상자·셀렉트·달력)에서 온 Enter 는 우리 것이 아니다", () => {
    // React 트리로는 여기까지 올라오지만 DOM 으로는 본문 밖에 있다.
    const body = document.createElement("div");
    const portal = document.createElement("div");
    const inputInPortal = document.createElement("input");
    portal.appendChild(inputInPortal);
    document.body.append(body, portal);
    expect(
      isEnterSave(ev({ target: inputInPortal, currentTarget: body })),
    ).toBe(false);
  });
});
