// 월 선택기 트리거 모양 — borderless 는 main 그대로(홈 데스크톱 14 · 700)(예산 달 줄은 I-27 로 ds MonthPicker)
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
vi.mock("@/shared/lib/groo/responsive", () => ({
  useDeviceSize: () => "desktop",
}));

const { MonthPicker } = await import("./primitives");

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
const trigger = (variant: "outline" | "borderless") => {
  act(() =>
    root.render(
      <MonthPicker value="2026-09" onChange={() => {}} variant={variant} />,
    ),
  );
  return container.querySelector("button")!;
};

describe("월 선택기 트리거 변형", () => {
  it("borderless — main 과 같은 인라인 값(14 · 700 · 패딩 4 4 · 꺾쇠 12)", () => {
    const b = trigger("borderless");
    expect(b.style.fontSize).toBe("var(--text-body-sm)");
    expect(b.style.fontWeight).toBe("700");
    expect(b.style.padding).toBe("4px");
    expect(b.querySelector("svg")!.getAttribute("width")).toBe("12");
    expect(b.className).toBe("month-picker__trigger");
  });
});
