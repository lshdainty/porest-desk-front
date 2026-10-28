import { act } from "react";

/**
 * 자산 폼 시험 도구 — 시트 · 대화상자(ds)와 ds 칸(Field · Select · Input)을 jsdom 에서 다루는 손.
 * `t` 를 키 그대로 흘려보내는 시험에서 칸은 라벨 키로 찾는다(Field 의 `<label for>` → 칸 id).
 */

/** 시트(1280 미만) · 대화상자(이상) — useWideSurface 가 읽는 질의 하나만 바꾼다 */
export function installDomStubs(opts: { wide?: boolean } = {}) {
  const wide = opts.wide ?? false;
  window.history.replaceState(null, "");
  window.matchMedia = ((query: string) => ({
    matches: wide && query.includes("1280px"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.scrollIntoView = () => {};
}

export const click = (el: Element | null | undefined) => {
  if (!el) throw new Error("누를 것을 찾지 못했다");
  act(() =>
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }),
    ),
  );
};

export function setInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

export const buttons = (text: string) =>
  [...document.body.querySelectorAll("button")].filter(
    (b) => b.textContent?.trim() === text,
  );

/** 그 이름의 마지막 버튼 — 확인창이 뜨면 확인 단추가 나중에 붙는다 */
export const lastButton = (text: string) => {
  const all = buttons(text);
  return all[all.length - 1]!;
};

export const bodyText = () => document.body.textContent ?? "";

/** 칸 이름(라벨 글이 이 글로 시작하는 것)이 가리키는 칸 */
export function fieldControl<T extends HTMLElement = HTMLInputElement>(
  labelKey: string,
): T | null {
  const label = [...document.body.querySelectorAll("label, span")].find(
    (l) =>
      l.id.endsWith("label") &&
      (l.textContent ?? "").trim().startsWith(labelKey),
  ) as HTMLLabelElement | undefined;
  if (!label) return null;
  const forId = (label as HTMLLabelElement).htmlFor;
  return forId ? (document.getElementById(forId) as T | null) : null;
}

/** 금액 칸 뒤 단위 글자 — 라벨에 실려 있던 단위가 칸 뒤로 옮겨 갔다(I-17 12) */
export function unitOf(labelKey: string): string | null {
  const control = fieldControl(labelKey);
  const suffix = control
    ?.closest("[data-slot=text-input]")
    ?.querySelector("[data-slot=text-input-suffix]");
  return suffix ? (suffix.textContent ?? null) : null;
}

/** Select 칸을 열어 선택지 하나를 누른다 — 선택지는 글이 이 글로 시작하는 것 */
export function chooseSelect(labelKey: string, optionText: string) {
  const trigger = fieldControl<HTMLButtonElement>(labelKey);
  if (!trigger) throw new Error(`칸을 찾지 못했다: ${labelKey}`);
  click(trigger);
  const option = [
    ...document.body.querySelectorAll<HTMLElement>("[data-slot=select-item]"),
  ].find((o) => (o.textContent ?? "").trim().startsWith(optionText));
  if (!option) throw new Error(`선택지를 찾지 못했다: ${optionText}`);
  click(option);
}
