// 통계 기간 고르기 — ds Date Picker 기간(칸 하나 · 빠른 기간 · 초기화 + 완료). 모양은 ds:check 가 잰다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { RangePickerSheet } = await import("./RangePickerSheet");
const { monthRangeOf } = await import("./stats-range");

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Element.prototype.scrollTo = function () {};
  Element.prototype.scrollIntoView = function () {};
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 29, 13, 0, 0));
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const buttons = () => [...document.querySelectorAll("button")];
const chips = () => [
  ...document.querySelectorAll<HTMLButtonElement>(
    "[data-slot=date-picker-presets] [role=radio]",
  ),
];
const byText = (s: string | RegExp) =>
  buttons().find((b) =>
    typeof s === "string"
      ? b.textContent?.trim() === s
      : s.test(b.textContent ?? ""),
  );

function mount(onConfirm = vi.fn()) {
  const initial = monthRangeOf(new Date(2026, 9, 29));
  act(() =>
    root.render(
      <RangePickerSheet
        open
        onOpenChange={() => {}}
        initial={initial}
        onConfirm={onConfirm}
        trigger={({ onClick }) => (
          <button type="button" onClick={onClick}>
            trigger
          </button>
        )}
      />,
    ),
  );
  return onConfirm;
}

describe("RangePickerSheet", () => {
  it("시작 · 종료 두 칸이 없다 — 날짜 입력칸 0, 바닥은 초기화 + 완료", () => {
    mount();
    expect(document.querySelectorAll("input").length).toBe(0);
    expect(byText("picker.reset")).toBeTruthy();
    expect(byText("picker.done")).toBeTruthy();
  });

  it("빠른 기간은 통계가 쓰던 다섯 — 7일 · 30일 · 3개월 · 6개월 · 1년 순서", () => {
    mount();
    expect(chips().map((c) => c.getAttribute("data-value") ?? c.value)).toEqual(
      ["last7Days", "last30Days", "last3Months", "last6Months", "last1Year"],
    );
  });

  it("바꾸지 않고 완료 — 지금 기간 · 보기(월)를 그대로 돌려준다", () => {
    const onConfirm = mount();
    act(() => byText("picker.done")!.click());
    const r = onConfirm.mock.calls[0]![0];
    expect(r.segMode).toBe("m");
    expect([r.from.getMonth(), r.from.getDate()]).toEqual([9, 1]);
    expect([r.to.getMonth(), r.to.getDate()]).toEqual([9, 31]);
  });

  it("최근 3개월 칩 → 완료 — 8월 1일 ~ 10월 31일, 직접", () => {
    const onConfirm = mount();
    act(() => chips()[2]!.click());
    act(() => byText("picker.done")!.click());
    const r = onConfirm.mock.calls[0]![0];
    expect(r.segMode).toBe("custom");
    expect([r.from.getMonth(), r.from.getDate()]).toEqual([7, 1]);
    expect([r.to.getMonth(), r.to.getDate()]).toEqual([9, 31]);
  });

  it("초기화하면 완료가 막힌다 — 통계 기간은 비울 수 없다", () => {
    const onConfirm = mount();
    act(() => byText("picker.reset")!.click());
    const done = byText("picker.done") as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    act(() => done.click());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
