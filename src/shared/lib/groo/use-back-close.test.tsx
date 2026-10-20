// 모바일 뒤로가기가 대화상자를 닫는지(QA #129). 여기서 잠그는 건 셋이다:
// ① 뒤로가기 한 번은 **맨 위 하나만** 닫는다 ② 버튼으로 닫을 때 쌓아 둔 칸을
// 되돌린다(안 그러면 닫은 뒤 뒤로가기가 헛돈다) ③ 그 되돌리기가 만드는 뒤로가기가
// 아래 시트까지 닫지 않는다.
//
// `history.back()` 은 스파이로 막고 `popstate` 를 손으로 쏜다 — jsdom 의 back 은
// 비동기라 그대로 두면 어느 틱에 오는지에 테스트가 매달린다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBackCloseForTest, useBackClose } from "./use-back-close";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

function Sheet({
  onClose,
  enabled = true,
}: {
  onClose: () => void;
  enabled?: boolean;
}) {
  useBackClose(onClose, enabled);
  return null;
}

let container: HTMLDivElement;
let root: Root;
let back: ReturnType<typeof vi.spyOn>;

const pop = () =>
  act(() => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetBackCloseForTest();
  window.history.replaceState({ idx: 0 }, "", "/desk/expense");
  back = vi.spyOn(window.history, "back").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  back.mockRestore();
});

describe("useBackClose", () => {
  it("뒤로가기가 시트를 닫는다 — 페이지는 그대로다", () => {
    const onClose = vi.fn();
    act(() => root.render(<Sheet onClose={onClose} />));
    // 주소는 그대로 두고 칸만 하나 쌓는다.
    expect(window.location.pathname).toBe("/desk/expense");
    pop();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("라우터가 세는 위치(`idx`)를 물려받는다", () => {
    // 빈 상태로 덮으면 그 다음 라우터 이동이 몇 번째인지 모르게 된다.
    act(() => root.render(<Sheet onClose={vi.fn()} />));
    expect(window.history.state?.idx).toBe(0);
  });

  it("겹쳐 열리면 맨 위 하나만 닫는다", () => {
    const closeSheet = vi.fn();
    const closeConfirm = vi.fn();
    act(() =>
      root.render(
        <>
          <Sheet onClose={closeSheet} />
          <Sheet onClose={closeConfirm} />
        </>,
      ),
    );
    pop();
    expect(closeConfirm).toHaveBeenCalledTimes(1);
    expect(closeSheet).not.toHaveBeenCalled();
    pop();
    expect(closeSheet).toHaveBeenCalledTimes(1);
  });

  it("버튼으로 닫으면 쌓아 둔 칸을 되돌리고, 그 뒤로가기는 아래 시트를 닫지 않는다", () => {
    const closeSheet = vi.fn();
    const closeConfirm = vi.fn();
    const Tree = ({ confirm }: { confirm: boolean }) => (
      <>
        <Sheet onClose={closeSheet} />
        {confirm && <Sheet onClose={closeConfirm} />}
      </>
    );
    act(() => root.render(<Tree confirm />));
    // 확인창을 '취소' 로 닫는다 = 부모가 언마운트한다.
    act(() => root.render(<Tree confirm={false} />));
    expect(back).toHaveBeenCalledTimes(1);
    // 되돌리기가 만든 popstate 가 그 아래 시트까지 닫으면 한 번의 닫기로 둘이 사라진다.
    pop();
    expect(closeSheet).not.toHaveBeenCalled();
    // 그 다음 진짜 뒤로가기는 시트를 닫는다.
    pop();
    expect(closeSheet).toHaveBeenCalledTimes(1);
  });

  it("뒤로가기로 닫힌 뒤엔 칸을 되돌리지 않는다 — 칸도 함께 사라졌다", () => {
    const onClose = vi.fn();
    const Tree = ({ open }: { open: boolean }) =>
      open ? <Sheet onClose={onClose} /> : null;
    act(() => root.render(<Tree open />));
    pop();
    act(() => root.render(<Tree open={false} />));
    expect(back).not.toHaveBeenCalled();
  });

  it("데스크톱(enabled=false)엔 아무것도 걸지 않는다", () => {
    const onClose = vi.fn();
    act(() => root.render(<Sheet onClose={onClose} enabled={false} />));
    pop();
    expect(onClose).not.toHaveBeenCalled();
    act(() => root.render(<></>));
    expect(back).not.toHaveBeenCalled();
  });

  it("닫기 함수가 새로 그려져도 최신 것을 부른다", () => {
    const first = vi.fn();
    const second = vi.fn();
    act(() => root.render(<Sheet onClose={first} />));
    act(() => root.render(<Sheet onClose={second} />));
    pop();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
