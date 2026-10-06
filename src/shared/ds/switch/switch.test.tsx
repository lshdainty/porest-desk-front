// Switch 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Switch, Switchmark } from "./switch";

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

const control = () =>
  container.querySelector<HTMLButtonElement>("[role=switch]")!;
const thumb = () => control().querySelector("span")!;

describe("Switch", () => {
  it("스위치는 role=switch · aria-checked 이고 라벨과 <label for> 로 잇는다 — 기본은 24 · neutral · 끔", () => {
    const row = render(<Switch label="종일" />);
    expect(row.tagName).toBe("LABEL");
    expect(row.getAttribute("for")).toBe(control().id);
    expect(control().labels?.[0]).toBe(row);
    expect(control().getAttribute("aria-checked")).toBe("false");
    expect(control().className).toContain("h-6");
    expect(control().className).toContain("w-[38px]");
    expect(thumb().className).toContain("bg-fg-neutral-inverted");
  });

  it("스위치나 라벨을 누르면 켬 ↔ 끔 — 바로 바뀌고 onCheckedChange 로 알린다", () => {
    const onCheckedChange = vi.fn();
    const row = render(
      <Switch label="종일" onCheckedChange={onCheckedChange} />,
    );
    act(() => control().click());
    expect(control().getAttribute("aria-checked")).toBe("true");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    // 라벨 글자를 눌러도 같다 — 줄(<label>)이 스위치를 누른다
    const text = row.querySelector<HTMLElement>(":scope > span")!;
    expect(text.textContent).toBe("종일");
    act(() => text.click());
    expect(control().getAttribute("aria-checked")).toBe("false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("엄지는 켬 · 끔을 따라간다 — 끄면 0.8 · 자리 0, 켜면 1 · 트랙 폭 − 트랙 높이만큼", () => {
    render(<Switch label="종일" defaultChecked />);
    expect(thumb().dataset.state).toBe("checked");
    act(() => control().click());
    expect(thumb().dataset.state).toBe("unchecked");
    expect(thumb().className).toContain("scale-[0.8]");
    expect(thumb().className).toContain("translate-x-0");
    expect(thumb().className).toContain(
      "data-[state=checked]:translate-x-[14px]",
    );
  });

  it("값을 밖에서 쥐면 누름은 알리기만 한다 — 바뀐 값을 넣어야 바뀐다", () => {
    const Controlled = () => {
      const [on, setOn] = useState(false);
      return <Switch label="알림" checked={on} onCheckedChange={setOn} />;
    };
    render(<Controlled />);
    act(() => control().click());
    expect(control().getAttribute("aria-checked")).toBe("true");

    const onCheckedChange = vi.fn();
    act(() =>
      root.render(
        <Switch
          label="알림"
          checked={false}
          onCheckedChange={onCheckedChange}
        />,
      ),
    );
    act(() => control().click());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control().getAttribute("aria-checked")).toBe("false");
  });

  it("막히면 누르지 않고 포커스에서 빠진다 — 값은 그대로 보인다", () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        label="종일"
        disabled
        defaultChecked
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(control().disabled).toBe(true);
    act(() => control().click());
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control().getAttribute("aria-checked")).toBe("true");
    expect(thumb().hasAttribute("data-disabled")).toBe(true);
  });

  it("id 를 주면 라벨이 그 id 로 간다", () => {
    const row = render(<Switch id="all-day" label="종일" />);
    expect(control().id).toBe("all-day");
    expect(row.getAttribute("for")).toBe("all-day");
  });

  it("크기 · 톤은 스위치 · 엄지 · 줄 · 라벨이 함께 받는다", () => {
    const row = render(
      <Switch size="32" tone="brand" defaultChecked label="큰 줄" />,
    );
    expect(row.className).toContain("min-h-8");
    expect(control().className).toContain("w-[52px]");
    expect(control().className).toContain(
      "data-[state=checked]:bg-bg-brand-solid",
    );
    expect(thumb().className).toContain("bg-static-white");
    expect(row.querySelector(":scope > span")!.className).toContain("text-t5");
  });
});

describe("Switchmark", () => {
  it("스위치만 — 이름은 쓰는 쪽이 준다(줄 <label> · aria-label)", () => {
    const onCheckedChange = vi.fn();
    const row = render(
      <label>
        <span>결제 알림</span>
        <Switchmark onCheckedChange={onCheckedChange} />
      </label>,
    );
    expect(control().labels?.[0]).toBe(row);
    // 줄의 글자를 눌러도 바뀐다 — 줄 전체가 누르는 영역
    act(() => row.querySelector("span")!.click());
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    act(() => root.render(<Switchmark aria-label="결제 알림" />));
    expect(control().getAttribute("aria-label")).toBe("결제 알림");
  });
});
