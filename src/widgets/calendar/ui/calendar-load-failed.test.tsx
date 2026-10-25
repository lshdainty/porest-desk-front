import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const { CalendarLoadFailed } = await import("./calendar-load-failed");
const { i18n: appI18n } = await import("@/shared/i18n/config");

let container: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  await appI18n.changeLanguage("ko");
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("일정 불러오기 실패 자리", () => {
  it('Result Section 실패 + 해요체 설명 + "다시 시도" — 서버 원문이 없다', () => {
    const onRetry = vi.fn();
    act(() => root.render(<CalendarLoadFailed onRetry={onRetry} />));
    const r = container.querySelector("[data-slot=calendar-load-failed]")!;
    expect(r.textContent).toContain("일정을 불러오지 못했어요");
    expect(r.textContent).toContain("다시 시도해주세요.");
    const retry = [...r.querySelectorAll("button")].find(
      (b) => b.textContent === "다시 시도",
    )!;
    act(() => retry.click());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
