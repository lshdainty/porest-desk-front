import { act } from "react";

/**
 * 일정 폼 시험의 손 — jsdom 에는 matchMedia · ResizeObserver 가 없다(폼 표면은 폭으로 갈린다 — 이 환경은 1280 미만, 시트).
 * `t` 는 키를 그대로 돌려주게 mock 한다 — 줄 · 버튼은 키로 집는다.
 */
export function setupFormDom(wide = false) {
  window.history.replaceState(null, "");
  window.matchMedia = ((query: string) => ({
    matches: wide,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
}

export const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

const buttons = () => [...document.body.querySelectorAll("button")];

/** 줄 칸 — 제목 키로 시작하는 줄 버튼(값 글이 뒤에 붙는다) */
export function row(titleKey: string): HTMLButtonElement {
  const el = buttons().find((b) => b.textContent?.startsWith(titleKey));
  if (!el) throw new Error(`${titleKey} 줄을 찾지 못했다`);
  return el;
}

/** 줄 전체(제목 + 값 글) */
export const rowText = (titleKey: string) =>
  row(titleKey).closest("li")?.textContent ?? "";

/** 글이 정확히 같은 버튼 중 가장 나중(맨 위에 뜬 표면)의 것 */
export function lastButton(label: string): HTMLButtonElement {
  const el = buttons()
    .filter((b) => b.textContent?.trim() === label)
    .slice(-1)[0];
  if (!el) throw new Error(`${label} 버튼을 찾지 못했다`);
  return el;
}

/** 열린 고르기 시트의 줄(글이 같은 버튼) */
export const choice = (label: string) => lastButton(label);

/** React 제어 입력칸에 값을 넣는다 — 네이티브 setter 를 거쳐야 onChange 가 돈다 */
export function setValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

export function field(name: string): HTMLInputElement | HTMLTextAreaElement {
  const el = document.body.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >(`[name="${name}"]`);
  if (!el) throw new Error(`${name} 입력칸을 찾지 못했다`);
  return el;
}

/** 시트 안 한 단계의 입력칸(장소 · 설명) */
export function stepInput(): HTMLInputElement | HTMLTextAreaElement {
  const el = [
    ...document.body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "[role=dialog] input, [role=dialog] textarea",
    ),
  ].filter((e) => !e.name);
  const found = el.slice(-1)[0];
  if (!found) throw new Error("한 단계 입력칸을 찾지 못했다");
  return found;
}

export const tick = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** 모션이 끝났다고 알린다 — jsdom 은 animationend 를 쏘지 않아 Radix 가 닫는 표면을 치우지 못한다 */
export const settle = () =>
  act(async () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      "[data-state=closed]",
    )) {
      const e = new Event("animationend", { bubbles: true });
      Object.assign(e, { animationName: getComputedStyle(el).animationName });
      el.dispatchEvent(e);
    }
    await new Promise((r) => setTimeout(r, 0));
  });
