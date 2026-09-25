// 월 선택기의 미래 달(QA 30 17, 사용자 결정 2026-09-25 "미래 달 허용").
//
// 예산은 미리 정해 두는 화면이라 다음 달 이후도 고를 수 있어야 한다. 종전엔 공용 월 선택기가
// 미래 달을 늘 흐리게 막아서 데스크톱 예산 설정만 다음 달부터 못 골랐다(모바일·앱은 됨).
// 홈·통계처럼 지나간 달만 뜻이 있는 화면은 그대로 막는다 — 옵션으로 가른다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/shared/lib/porest/responsive", () => ({
  useDeviceSize: () => "desktop",
}));

const { MonthPicker } = await import("./primitives");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 25, 12, 0)); // 9월
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

/** 열어 둔 달력 격자의 월 버튼 — 격자는 1~12월 버튼 열두 개다. */
function openGrid(allowFuture: boolean) {
  act(() =>
    root.render(
      <MonthPicker
        value="2026-09"
        onChange={() => {}}
        allowFuture={allowFuture}
      />,
    ),
  );
  const trigger = container.querySelector("button")!;
  act(() => trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  // 격자(4열) 안의 월 버튼만 — 격자 뒤에도 버튼이 있어 끝에서 세면 한 칸 밀린다.
  const grid = [
    ...document.body.querySelectorAll<HTMLButtonElement>(
      'div[style*="repeat(4, 1fr)"] > button',
    ),
  ];
  expect(grid).toHaveLength(12);
  return grid;
}

describe("월 선택기 — 미래 달", () => {
  it("기본은 이번 달까지 — 10·11·12월이 막혀 있다(홈·통계)", () => {
    const grid = openGrid(false);
    expect(grid[8]!.disabled).toBe(false); // 9월
    expect(grid.slice(9).map((b) => b.disabled)).toEqual([true, true, true]);
  });

  it("allowFuture 면 다음 달 이후도 고른다(예산)", () => {
    const grid = openGrid(true);
    expect(grid.map((b) => b.disabled)).toEqual(Array(12).fill(false));
  });
});
