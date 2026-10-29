// 폰 달 줄 (I-09 6 · I-27) — 달 글 한 덩어리 + 칩, ‹ › 없음
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
}));
vi.mock("@/widgets/calendar/model/calendar-context", () => ({
  useCalendar: () => ({
    selectedDate: new Date(2026, 9, 22),
    setSelectedDate: () => {},
    view: "month",
  }),
}));
vi.mock("@/widgets/calendar/ui/header/calendar-source-toggle", () => ({
  CalendarSourceToggle: () => <button data-testid="source" type="button" />,
}));
vi.mock("@/shared/lib/groo/use-back-close", () => ({ useBackClose: () => {} }));

const { CalendarHeaderMobile } = await import("./calendar-header-mobile");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<CalendarHeaderMobile />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("폰 달 줄", () => {
  it("달 글 하나 — ‹ › 가 없고 칩은 덩어리 밖이다(I-27)", () => {
    expect(
      container.querySelector("[aria-label='header.prevWeek']"),
    ).toBeNull();
    expect(
      container.querySelector("[aria-label='header.nextWeek']"),
    ).toBeNull();
    const label = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("2026년 10월"),
    )!;
    const group = label.closest("div")!;
    expect(group.className).toContain("shrink-0");
    expect(group.className).not.toContain("flex-wrap");
    expect(
      group.contains(container.querySelector("[data-testid=source]")),
    ).toBe(false);
    expect(group.parentElement!.className).toContain("flex-wrap");
    expect(group.parentElement!.className).toContain("pl-x6");
  });
});
