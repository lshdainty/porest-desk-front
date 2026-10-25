// 폰 달 줄 (I-09 6) — ‹ 달 글 › 는 한 덩어리, 칩만 따로 흐른다(글자 200% 에서 ‹ › 가 갈라지지 않는다)
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
  it("‹ 달 글 › 가 줄바꿈하지 않는 한 덩어리에 들고 칩은 그 밖이다", () => {
    const prev = container.querySelector("[aria-label='header.prevMonth']")!;
    const next = container.querySelector("[aria-label='header.nextMonth']")!;
    const label = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("2026년 10월"),
    )!;
    const group = prev.parentElement!;
    expect(next.parentElement).toBe(group);
    expect(label.closest("div")).toBe(group);
    expect(group.className).toContain("shrink-0");
    // ‹ › 는 글자 크기와 상관없이 40(px) — 글자 200% 에서 두 단추가 줄 폭을 먹어 달 글을 밀어내지 않게
    expect(prev.className).toContain("size-[40px]");
    expect(next.className).toContain("size-[40px]");
    expect(group.className).not.toContain("flex-wrap");
    // 칩은 덩어리 밖 — 줄이 모자라면 칩만 아래 줄로 내려간다
    expect(
      group.contains(container.querySelector("[data-testid=source]")),
    ).toBe(false);
    expect(group.parentElement!.className).toContain("flex-wrap");
  });
});
