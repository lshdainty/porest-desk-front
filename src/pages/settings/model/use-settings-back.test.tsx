// 폰 ← = History(Q1-A · I-16 6) — 앞 화면이 있으면 그곳으로, 없으면 상위로 주소를 고쳐 쓴다(replace).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SECTIONS } from "./sections";
import { useSettingsBack } from "./use-settings-back";

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
  window.history.replaceState(null, "", "/");
});

const devices = SECTIONS.find((s) => s.id === "devices")!;
const hideAmounts = SECTIONS.find((s) => s.id === "hide-amounts")!;
const categories = SECTIONS.find((s) => s.id === "categories")!;

function Probe({ section }: { section: typeof devices | null }) {
  const goBack = useSettingsBack(section);
  return (
    <button type="button" onClick={goBack}>
      back
    </button>
  );
}

function mount(entries: string[], index: number, section: typeof devices) {
  const router = createMemoryRouter(
    [{ path: "/desk/*", element: <Probe section={section} /> }],
    { initialEntries: entries, initialIndex: index },
  );
  act(() => root.render(<RouterProvider router={router} />));
  return router;
}

describe("useSettingsBack", () => {
  it("앞 화면이 있으면 들어온 화면으로 간다(History) — 홈 → 금액 가리기 → ← = 홈", async () => {
    // 브라우저 history.state.idx 가 1 이상이면 앞 화면이 있다
    window.history.replaceState({ idx: 1 }, "", "/");
    const router = mount(
      ["/desk", "/desk/settings?section=categories"],
      1,
      categories,
    );
    await act(async () => {
      container.querySelector("button")!.click();
    });
    expect(router.state.location.pathname).toBe("/desk");
    expect(router.state.historyAction).toBe("POP");
  });

  it("앞 화면이 없으면 부모 섹션으로 주소를 고쳐 쓴다(replace) — 기기 → 계정", async () => {
    window.history.replaceState({ idx: 0 }, "", "/");
    const router = mount(["/desk/settings?section=devices"], 0, devices);
    await act(async () => {
      container.querySelector("button")!.click();
    });
    expect(router.state.location.pathname + router.state.location.search).toBe(
      "/desk/settings?section=account",
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("앞 화면이 없고 부모도 없으면 설정 메뉴로 고쳐 쓴다", async () => {
    window.history.replaceState({ idx: 0 }, "", "/");
    const router = mount(["/desk/settings?section=categories"], 0, categories);
    await act(async () => {
      container.querySelector("button")!.click();
    });
    expect(router.state.location.pathname + router.state.location.search).toBe(
      "/desk/settings",
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("금액 가리기를 새 탭으로 열고 ← 하면 계정으로 간다(parent: account)", async () => {
    window.history.replaceState({ idx: 0 }, "", "/");
    const router = mount(
      ["/desk/settings?section=hide-amounts"],
      0,
      hideAmounts,
    );
    await act(async () => {
      container.querySelector("button")!.click();
    });
    expect(router.state.location.pathname + router.state.location.search).toBe(
      "/desk/settings?section=account",
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });
});
