// 키보드가 내려가면 시트가 제 높이로 돌아온다 (2026-09-18 사용자 제보).
//
// vaul 은 키보드가 뜨면 시트의 `style.height`·`style.bottom` 을 픽셀로 박고 내려가면
// 되돌린다. 그런데 **레이아웃 뷰포트까지 함께 줄어드는 브라우저**(삼성 인터넷 · 구 크롬)
// 에서는 `innerHeight` 와 `visualViewport.height` 가 늘 같아, vaul 이 키보드를 감지하지
// 못하고 되돌릴 기준 높이마저 이미 줄어든 값으로 잡는다. 결과는 키보드가 사라진 뒤에도
// 시트가 반쪽으로 남는 것이다(재현: 743px → 370px 고착).
//
// 여기서 잠그는 규칙은 하나다 — **키보드가 없으면 키보드 때문에 박힌 값도 없어야 한다.**
// 반대로 키보드가 떠 있는 동안은 vaul 이 관리 중이므로 건드리면 안 된다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

/** jsdom 엔 visualViewport 가 없다 — 키보드 유무를 흉내 낼 최소한만 심는다. */
function setViewport({ inner, visual }: { inner: number; visual: number }) {
  Object.defineProperty(window, "innerHeight", {
    value: inner,
    configurable: true,
  });
  Object.defineProperty(window, "visualViewport", {
    value: { height: visual, addEventListener() {}, removeEventListener() {} },
    configurable: true,
  });
}

/** 시트 엘리먼트 — vaul 이 높이를 박는 그 노드. */
const sheet = () =>
  document.querySelector<HTMLElement>("[data-vaul-drawer]") ??
  document.querySelector<HTMLElement>('[role="dialog"]');

/** resize 한 번 + 다음 프레임(우리 복구는 rAF 뒤에 돈다). */
async function resize() {
  await act(async () => {
    window.dispatchEvent(new Event("resize"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  setViewport({ inner: 844, visual: 844 });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <Drawer open>
        <DrawerContent>
          <input />
        </DrawerContent>
      </Drawer>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("시트 키보드 높이 복구", () => {
  it("키보드가 내려가면 박혀 있던 높이를 지운다", async () => {
    const el = sheet()!;
    expect(el).toBeTruthy();
    // vaul 이 키보드 때 박아 놓은 상태.
    el.style.height = "369.594px";
    el.style.bottom = "0px";

    // 키보드가 내려가 뷰포트가 원래대로.
    setViewport({ inner: 844, visual: 844 });
    await resize();

    expect(el.style.height).toBe("");
    expect(el.style.bottom).toBe("");
  });

  // 레이아웃 뷰포트는 그대로고 시각 뷰포트만 줄어드는 브라우저(크롬 기본) — 이때는
  // vaul 이 제대로 관리하므로 끼어들면 시트가 키보드 뒤로 내려간다.
  it("키보드가 떠 있는 동안은 건드리지 않는다", async () => {
    const el = sheet()!;
    el.style.height = "369.594px";
    el.style.bottom = "424px";

    setViewport({ inner: 844, visual: 420 });
    await resize();

    expect(el.style.height).toBe("369.594px");
    expect(el.style.bottom).toBe("424px");
  });

  it("그 밖의 인라인 스타일은 남긴다 — 그림자는 우리 것이다", async () => {
    const el = sheet()!;
    el.style.height = "369.594px";
    await resize();

    expect(el.style.height).toBe("");
    expect(el.style.boxShadow).not.toBe("");
  });

  // visualViewport 가 없는 환경(구형 브라우저·jsdom)에서도 죽지 않아야 한다.
  it("visualViewport 가 없어도 동작한다", async () => {
    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      configurable: true,
    });
    const el = sheet()!;
    el.style.height = "369.594px";
    await resize();

    expect(el.style.height).toBe("");
  });
});
