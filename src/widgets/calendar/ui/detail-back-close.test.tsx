// 폰 그날 시트에서 일정을 누르면 상세가 바로 닫혀 버리던 회귀(09-1, 2026-10-30)의 원인을 잠근다.
//
// 시트(ds `useBackClose`)가 닫히며 쌓아 둔 히스토리 칸을 마이크로태스크에서 `history.go(-1)` 로 되돌린다. 같은 커밋에서 상세가 자기 칸을
// `pushState` 로 쌓으면(effect 가 마이크로태스크보다 먼저 돈다) 그 `go(-1)` 이 지우는 칸은 시트의 것이 아니라 상세의 것이 되고,
// 거기서 난 `popstate` 를 **옛 `useBackClose`(shared/lib/groo)** 는 "뒤로 가기 = 상세 닫기" 로 읽는다. ds `useBackClose` 는 자기가 부른
// `go` 의 `popstate` 를 세어 건너뛰므로(selfPops) 읽지 않는다.
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useBackClose as dsBackClose } from "@/shared/ds/overlay";
import { useBackClose as legacyBackClose } from "@/shared/lib/groo/use-back-close";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
let closedDetail = 0;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "");
  closedDetail = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Screen({ detailHook }: { detailHook: "ds" | "legacy" }) {
  const [sheet, setSheet] = useState(true);
  const [detail, setDetail] = useState(false);
  // 그날 시트 — ds Bottom Sheet 가 하는 일
  dsBackClose(sheet, () => setSheet(false));
  // 상세 Drawer 의 뒤로 가기
  const close = () => {
    closedDetail++;
    setDetail(false);
  };
  if (detailHook === "ds") dsBackClose(detail, () => close());
  else legacyBackClose(close, detail);
  return (
    <button
      onClick={() => {
        // 일정 줄을 누르면: 시트를 닫고 같은 순간 상세를 연다(CalendarMobile 의 onTapEvent)
        setSheet(false);
        setDetail(true);
      }}
    >
      tap
    </button>
  );
}

const run = async (hook: "ds" | "legacy") => {
  act(() => root.render(<Screen detailHook={hook} />));
  await act(async () => {
    container.querySelector("button")!.click();
  });
  // history.go 의 popstate 는 비동기다
  await act(async () => {
    await new Promise((r) => setTimeout(r, 120));
  });
};

describe("그날 시트 → 상세", () => {
  it("옛 useBackClose 는 시트가 되감는 popstate 를 상세 닫기로 읽는다 — 원인", async () => {
    await run("legacy");
    expect(closedDetail).toBe(1);
  });

  it("ds useBackClose 는 자기가 부른 되감기를 건너뛴다 — 상세가 열려 있다", async () => {
    await run("ds");
    expect(closedDetail).toBe(0);
  });
});
