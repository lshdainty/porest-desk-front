// 저장 버튼을 따닥 누르면 같은 요청이 두 번 나갔다(거래 2건 저장, QA 2026-09-02).
// isPending 으로 disabled 되는 건 다음 렌더 뒤라, 렌더와 무관한 동기 방어가 필요하다.
import { act, useState, type ReactNode } from "react";
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

  it("검증 실패 클릭 직후의 클릭은 통과한다", () => {
    // 검증에 걸린 클릭은 아무것도 걸지 않는다 — loading 은 계속 false 다.
    // 그 클릭이 창을 물려받으면 안내를 읽고 고쳐 다시 누른 저장이 버려진다(QA #160).
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <Button loading={false} onClick={onClick}>
        저장
      </Button>,
    );
    const btn = container.querySelector("button")!;
    act(() => btn.click());
    // 이벤트가 끝나고 렌더가 반영된 뒤 — 여기서 "아무것도 안 걸렸다" 가 판명된다.
    act(() => void vi.advanceTimersByTime(1));
    // QA 실측 최단 재클릭 간격(57ms). 가드 창(600ms) 안이다.
    vi.advanceTimersByTime(56);
    act(() => btn.click());
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("검증을 통과한 저장은 진짜 따닥에도 한 번만 나간다", () => {
    // 되돌림이 생겨도 원래 목적은 그대로여야 한다 — 첫 클릭이 작업을 걸었으면
    // 같은 프레임 안의 두 번째 클릭은 버리고, 그 뒤는 disabled 가 이어받는다.
    vi.useFakeTimers();
    const onClick = vi.fn();
    function Saving() {
      const [loading, setLoading] = useState(false);
      return (
        <Button
          loading={loading}
          onClick={() => {
            onClick();
            setLoading(true);
          }}
        >
          저장
        </Button>
      );
    }
    render(<Saving />);
    clickTwiceQuickly();
    expect(onClick).toHaveBeenCalledTimes(1);
    // 되돌림 타이머가 돌아도 작업이 걸린 클릭의 시각은 남는다(그리고 disabled 다).
    act(() => void vi.advanceTimersByTime(1));
    act(() => container.querySelector("button")!.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading 을 안 넘긴 버튼은 되돌림 타이머와 무관하게 연타가 통과한다", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>+</Button>);
    const btn = container.querySelector("button")!;
    act(() => btn.click());
    act(() => void vi.advanceTimersByTime(1));
    act(() => btn.click());
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("loading 중엔 disabled 다", () => {
    render(<Button loading>저장</Button>);
    expect(container.querySelector("button")!.disabled).toBe(true);
  });
});
