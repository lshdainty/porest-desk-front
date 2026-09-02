// 데스크톱 캘린더에서 빈 날짜를 고르면 **선택 단계 없이** 일정 추가 폼이 바로 뜬다.
//
// 예전엔 "일정 / 거래" 를 고르는 팝업이 한 번 더 있었다. 가계부가 자체 캘린더를 갖기 전에는
// 거래도 여기서 넣어야 했기 때문인데, 그 이유가 사라졌다. 되살아나면 클릭이 다시 한 번
// 늘어나므로 여기서 고정한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DragSelectProvider } from "./drag-select-provider";
import { useDragSelect } from "./drag-select-context";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("@/widgets/calendar/model/useCalendarEvents", () => ({
  useCreateEvent: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/features/event-label", () => ({
  useEventLabels: () => ({ data: [] }),
}));
// 폼 자체는 이 테스트의 관심사가 아니다 — "떴는가" 와 "어느 날짜로 열렸나" 만 본다.
// `toISOString()` 은 UTC 로 옮겨 KST 자정이 전날이 되므로 로컬 그대로 찍는다.
vi.mock("@/widgets/calendar/ui/EventForm", () => ({
  EventForm: ({ selectedDate: d }: { selectedDate: Date }) => (
    <div data-testid="event-form">
      {`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`}
    </div>
  ),
}));

let container: HTMLDivElement;
let root: Root;

/**
 * 셀 하나를 눌렀다 떼는 흐름.
 *
 * 누르기와 떼기를 **다른 렌더**로 나눈다 — 실제로도 mousedown 과 mouseup 은 서로 다른
 * 이벤트이고, `endSelection` 은 직전 렌더에 커밋된 `isDragSelecting` 을 본다. 한 핸들러
 * 안에서 둘 다 부르면 아직 false 라 아무 일도 안 일어난다.
 */
function Probe() {
  const { startSelection, endSelection } = useDragSelect();
  return (
    <>
      <button
        data-testid="down"
        onClick={() => startSelection(new Date(2026, 8, 15))}
      >
        down
      </button>
      <button data-testid="up" onClick={endSelection}>
        up
      </button>
    </>
  );
}

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

describe("빈 날짜 선택", () => {
  it("고르기 전에는 아무 다이얼로그도 없다", () => {
    act(() => {
      root.render(
        <DragSelectProvider>
          <Probe />
        </DragSelectProvider>,
      );
    });
    expect(container.querySelector("[data-testid=event-form]")).toBeNull();
  });

  it("고르면 선택 팝업 없이 일정 폼이 바로 뜬다", () => {
    act(() => {
      root.render(
        <DragSelectProvider>
          <Probe />
        </DragSelectProvider>,
      );
    });
    act(() => {
      container.querySelector<HTMLButtonElement>("[data-testid=down]")!.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>("[data-testid=up]")!.click();
    });

    const form = container.querySelector("[data-testid=event-form]");
    expect(form).not.toBeNull();
    expect(form!.textContent).toBe("2026-09-15");
    // "거래 추가" 를 고르는 단계가 남아 있지 않다.
    expect(container.textContent).not.toContain("거래");
  });
});
