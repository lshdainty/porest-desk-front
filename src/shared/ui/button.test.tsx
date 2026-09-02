// 저장 버튼을 따닥 누르면 같은 요청이 두 번 나갔다(거래 2건 저장, QA 2026-09-02).
// isPending 으로 disabled 되는 건 다음 렌더 뒤라, 렌더와 무관한 동기 방어가 필요하다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/shared/ui/button";

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
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

function clickTwiceQuickly() {
  const btn = container.querySelector("button")!;
  act(() => {
    btn.click();
    btn.click();
  });
}

describe("Button 더블클릭 방어", () => {
  it("loading 을 넘긴(비동기) 버튼은 짧은 창 안의 두 번째 클릭을 버린다", () => {
    const onClick = vi.fn();
    render(
      <Button loading={false} onClick={onClick}>
        저장
      </Button>,
    );
    clickTwiceQuickly();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("창이 지나면 다시 눌린다 — 검증 실패로 요청이 안 나간 뒤 다시 저장할 수 있어야 한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T00:00:00Z"));
    const onClick = vi.fn();
    render(
      <Button loading={false} onClick={onClick}>
        저장
      </Button>,
    );
    const btn = container.querySelector("button")!;
    act(() => btn.click());
    vi.setSystemTime(new Date("2026-09-03T00:00:01Z"));
    act(() => btn.click());
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("loading 을 안 넘긴(동기) 버튼은 종전대로 매번 눌린다 — 카운터·토글이 여기 해당한다", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>+</Button>);
    clickTwiceQuickly();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("loading 중엔 disabled 다", () => {
    render(<Button loading>저장</Button>);
    expect(container.querySelector("button")!.disabled).toBe(true);
  });
});
