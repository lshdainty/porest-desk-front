// 모바일에서 시트의 추가 버튼을 더블탭하면, 저장 후 두 번째 탭이 시트 footer 바로 아래
// 붙어 있는 하단 탭바를 눌러 통계 화면으로 넘어갔다(QA #37 · 높음). 시트도 `open` 이
// 상수 true 라 닫힘 트랜지션이 한 프레임도 안 돌고 그대로 사라진다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  POINTER_BLOCK_MS,
  __resetPointerBlockForTest,
} from "@/shared/lib/porest/pointer-block";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
/** 하단 탭바 — AppTabBar 의 '통계' 탭 자리. */
let tab: HTMLButtonElement;
let navigate: (e: Event) => void;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-03T00:00:00Z"));
  __resetPointerBlockForTest();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  navigate = vi.fn<(e: Event) => void>();
  tab = document.createElement("button");
  tab.addEventListener("pointerdown", navigate);
  tab.addEventListener("click", navigate);
  document.body.appendChild(tab);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  tab.remove();
  __resetPointerBlockForTest();
  vi.useRealTimers();
});

const render = (node: ReactNode) => act(() => root.render(node));

/** 저장하면 부모가 언마운트해서 닫는 실제 패턴(porest/dialogs.tsx ModalShell 모바일 분기). */
function SheetThatSaves() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <Drawer open={true}>
      <DrawerContent>
        <button type="button" data-testid="add" onClick={() => setOpen(false)}>
          추가
        </button>
      </DrawerContent>
    </Drawer>
  );
}

function tapTab() {
  act(() => {
    tab.dispatchEvent(
      new Event("pointerdown", { bubbles: true, cancelable: true }),
    );
    tab.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
}

describe("DrawerContent 가 닫힌 직후", () => {
  it("두 번째 탭이 하단 탭바로 새 나가지 않는다", () => {
    render(<SheetThatSaves />);
    act(() =>
      document.querySelector<HTMLButtonElement>('[data-testid="add"]')!.click(),
    );
    expect(document.querySelector('[data-testid="add"]')).toBeNull(); // 시트가 사라졌다

    tapTab();
    expect(navigate).not.toHaveBeenCalled();
  });

  // 시트를 controlled 로 쓰는 곳(캘린더 일정 상세·월 선택 시트)은 **닫혀 있어도**
  // `DrawerContent` 래퍼가 그대로 렌더된다. 등록이 래퍼에 있으면 그 닫힌 시트가
  // '떠 있는 오버레이' 로 세어져 수가 0 으로 안 떨어지고, 차단이 아예 안 걸린다.
  // 그래서 등록은 Portal 안(overlay)에 있어야 한다 — `open` 과 생애가 같아진다.
  it("같은 화면에 닫혀 있는 다른 시트가 있어도 차단이 걸린다", () => {
    render(
      <>
        <Drawer open={false}>
          <DrawerContent>
            <span />
          </DrawerContent>
        </Drawer>
        <SheetThatSaves />
      </>,
    );
    act(() =>
      document.querySelector<HTMLButtonElement>('[data-testid="add"]')!.click(),
    );
    tapTab();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("창이 지나면 탭바가 다시 먹는다 — 안 그러면 시트를 닫고 화면을 못 옮긴다", () => {
    render(<SheetThatSaves />);
    act(() =>
      document.querySelector<HTMLButtonElement>('[data-testid="add"]')!.click(),
    );
    act(() => {
      vi.advanceTimersByTime(POINTER_BLOCK_MS + 50);
    });
    tapTab();
    expect(navigate).toHaveBeenCalledTimes(2); // pointerdown + click
  });
});
