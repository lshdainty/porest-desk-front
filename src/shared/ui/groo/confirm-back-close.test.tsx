// 폰에서 폼 시트의 [삭제] 로 확인창을 열면 확인창이 뜨자마자 닫히던 회귀(09-2 — 시트가 ds 로 바뀌며 생김)를 잠근다.
//
// 차례: 시트(ds `useBackClose`)가 닫히며 마이크로태스크에서 `history.go(-1)` 을 예약하고, 같은 커밋에서 확인창이 자기 칸을 `pushState` 한다.
// `go(-1)` 이 지우는 칸은 확인창의 것이 되고, 그 `popstate` 를 옛 훅(`shared/lib/groo/use-back-close`)은 "뒤로 가기 = 확인창 닫기" 로 읽었다.
// ds 훅은 자기가 부른 `go` 의 popstate 를 세어 건너뛴다. ModalShell · ConfirmDialog 가 ds 훅이면 확인창이 남는다. (#491 `detail-back-close.test.tsx` 와 같은 원인)
//
// 이 시험은 작성만 했고 이 묶음에서는 돌리지 않았다(heavy.sh 규칙) — 다음 전체 실행에서 확인한다.
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBackClose as dsBackClose } from "@/shared/ds/overlay";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 확인창은 모바일에서만 뒤로 가기를 건다
vi.mock("@/shared/lib/groo/responsive", () => ({
  useDeviceSize: () => "mobile",
}));

const { ConfirmDialog, ModalShell } = await import("./dialogs");

let container: HTMLDivElement;
let root: Root;
let cancelled = 0;
let shellClosed = 0;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "");
  cancelled = 0;
  shellClosed = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 50));
});

const alertOpen = () => document.querySelector("[role=alertdialog]") !== null;
const wait = (ms = 150) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

/** 폼 시트(ds 훅) → [삭제] → 같은 순간 시트를 내리고 확인창을 올린다(`CalendarContainer` 의 수정 폼 [삭제]) */
function SheetToConfirm() {
  const [sheet, setSheet] = useState(true);
  const [confirm, setConfirm] = useState(false);
  dsBackClose(sheet, () => setSheet(false));
  return (
    <>
      <button
        data-testid="delete"
        onClick={() => {
          setSheet(false);
          setConfirm(true);
        }}
      >
        delete
      </button>
      {confirm && (
        <ConfirmDialog
          title="일정 삭제"
          message="지울까요?"
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onCancel={() => {
            cancelled++;
            setConfirm(false);
          }}
          onConfirm={() => {}}
        />
      )}
    </>
  );
}

describe("폼 시트 [삭제] → 확인창 (폰)", () => {
  it("시트가 닫히며 되감는 popstate 로 확인창이 닫히지 않는다 — 확인창이 남고 취소로 알리지 않는다", async () => {
    act(() => root.render(<SheetToConfirm />));
    await act(async () => {
      container.querySelector<HTMLElement>("[data-testid=delete]")!.click();
    });
    await wait();
    expect(alertOpen()).toBe(true);
    expect(cancelled).toBe(0);
  });

  it("뒤로 가기 한 번은 확인창 하나를 닫는다(취소와 같다)", async () => {
    act(() => root.render(<SheetToConfirm />));
    await act(async () => {
      container.querySelector<HTMLElement>("[data-testid=delete]")!.click();
    });
    await wait();
    await act(async () => {
      window.history.back();
    });
    await wait();
    expect(cancelled).toBe(1);
    expect(alertOpen()).toBe(false);
  });

  it("확인창을 취소 버튼으로 닫으면 쌓은 칸을 되돌려 뒤로 가기가 한 번 헛돌지 않는다", async () => {
    act(() => root.render(<SheetToConfirm />));
    const before = window.history.length;
    await act(async () => {
      container.querySelector<HTMLElement>("[data-testid=delete]")!.click();
    });
    await wait();
    const cancel = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "취소",
    )!;
    await act(async () => {
      cancel.click();
    });
    await wait();
    expect(cancelled).toBe(1);
    // 시트 칸 · 확인창 칸 둘 다 되돌렸다 — 지금 칸이 처음 위치다(go(-n) 뒤 popstate 가 끝난 뒤)
    expect(window.history.state?.grooOverlayBack).not.toBe(true);
    expect(window.history.length).toBeGreaterThanOrEqual(before);
  });
});

describe("ModalShell 위의 확인창 — 같은 훅이라 뒤로 가기 한 번은 맨 위 하나만 닫는다", () => {
  it("확인창이 ModalShell 위에 떠 있을 때 뒤로 가기는 확인창만 닫는다", async () => {
    function Stack() {
      const [confirm, setConfirm] = useState(false);
      return (
        <>
          <ModalShell
            title="폼"
            mobile
            onClose={() => {
              shellClosed++;
            }}
          >
            <button data-testid="open" onClick={() => setConfirm(true)}>
              open
            </button>
          </ModalShell>
          {confirm && (
            <ConfirmDialog
              title="삭제"
              message="지울까요?"
              confirmLabel="삭제"
              cancelLabel="취소"
              onCancel={() => {
                cancelled++;
                setConfirm(false);
              }}
              onConfirm={() => {}}
            />
          )}
        </>
      );
    }
    act(() => root.render(<Stack />));
    await wait(50);
    await act(async () => {
      document.querySelector<HTMLElement>("[data-testid=open]")!.click();
    });
    await wait(50);
    await act(async () => {
      window.history.back();
    });
    await wait();
    expect(cancelled).toBe(1);
    expect(shellClosed).toBe(0);
  });
});
