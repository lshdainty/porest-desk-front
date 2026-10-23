// 내보내기 화면 — ds 부품으로 옮긴 구조와 동작(I-05 40 ~ 47). 모양 값은 ds:check 가 잰다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({
  countsFail: false,
  download: null as null | (() => Promise<Blob>),
  toastError: [] as { msg: string; opts: { action?: { label: string } } }[],
  toastSuccess: [] as string[],
}));

vi.mock("@/features/export/api/exportApi", () => {
  class ExportStalledError extends Error {}
  return {
    ExportStalledError,
    fetchExportCounts: () =>
      state.countsFail
        ? Promise.reject(new Error("x"))
        : Promise.resolve([
            { type: "expense", displayName: "거래", count: 123456 },
            { type: "asset", displayName: "자산", count: 3 },
          ]),
    fetchExportPreview: () => Promise.resolve([]),
    downloadExport: () => state.download!(),
  };
});
vi.mock("@/features/import/api/importApi", () => ({
  analyzeImport: () => Promise.resolve(null),
  executeImport: () => Promise.resolve(null),
}));
vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => state.toastSuccess.push(m),
    error: (msg: string, opts: { action?: { label: string } }) =>
      state.toastError.push({ msg, opts }),
  },
}));
vi.mock("@/shared/lib/download", () => ({ downloadBlob: () => {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: object) => (o ? k + JSON.stringify(o) : k),
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { DataExportSection } = await import("./DataExportSection");
const { ExportStalledError } = await import("@/features/export/api/exportApi");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.countsFail = false;
  state.toastError = [];
  state.toastSuccess = [];
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(mobile: boolean) {
  await act(async () => {
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <DataExportSection mobile={mobile} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
}
const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
const btn = (needle: string) =>
  [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(needle),
  )!;
const btnExact = (text: string) =>
  [...container.querySelectorAll('[data-slot="data-action-bar"] button')].find(
    (b) => (b.textContent ?? "").trim() === text,
  )!;
const groups = () => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="select-box-group"]'),
];

describe("내보내기 · 가져오기 전환 (I-05 40)", () => {
  it("ds Tabs Line 두 칸이고 목록 이름이 있다", async () => {
    await render(false);
    const list = container.querySelector('[role="tablist"]')!;
    expect(list.getAttribute("aria-label")).toBe("section.tabsLabel");
    expect(list.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it("가져오기 칸을 눌러도 내보내기 칸은 지워지지 않는다(숨김만)", async () => {
    await render(false);
    await click(btn("import.tab"));
    expect(container.querySelectorAll('[role="tabpanel"]').length).toBe(2);
  });
});

describe("기간 · 형식 Select Box (I-05 41 · 43)", () => {
  it("기간은 하나 고르기 radiogroup 5개, 형식은 3개", async () => {
    await render(false);
    const [period, format] = groups();
    expect(period!.getAttribute("role")).toBe("radiogroup");
    expect(period!.querySelectorAll('[role="radio"]')).toHaveLength(5);
    expect(format!.querySelectorAll('[role="radio"]')).toHaveLength(3);
  });

  it("폰은 기간 · 형식 모두 1열, 데스크톱은 5열 · 3열이다(Q5 5B)", async () => {
    await render(true);
    for (const g of groups().slice(0, 2)) {
      expect(g.className).toContain("grid-cols-1");
    }
    act(() => root.unmount());
    root = createRoot(container);
    await render(false);
    const [period, format] = groups();
    expect(period!.className).toContain("grid-cols-5");
    expect(format!.className).toContain("grid-cols-3");
  });

  it("'직접' 을 고르면 상자 아래로 기간 칸이 펼쳐진다", async () => {
    await render(false);
    const radios = groups()[0]!.querySelectorAll<HTMLElement>('[role="radio"]');
    expect(radios[4]!.getAttribute("aria-checked")).toBe("false");
    await click(radios[4]!);
    expect(radios[4]!.getAttribute("aria-checked")).toBe("true");
    // 펼침은 고른 상자 안에 있고, 그 안에 기간 칸(Date Picker 기간)이 하나 있다
    const box = radios[4]!.closest('[data-slot="select-box"]')!;
    expect(box.textContent).toContain("section.customRangeLabel");
  });
});

describe("데이터 종류 (I-05 42)", () => {
  it("맨 위 부모 '모두' + 7종, 오른쪽에 체크, 줄 전체가 누르는 자리", async () => {
    await render(false);
    const checks = [
      ...container.querySelectorAll<HTMLElement>('[data-slot="list-mark"]'),
    ];
    expect(checks).toHaveLength(1 + 7);
    expect(checks[0]!.getAttribute("aria-checked")).toBe("mixed");
    // 체크는 줄의 뒤(list-suffix) 안에 있다
    expect(checks[0]!.closest('[data-slot="list-suffix"]')).not.toBeNull();
    expect(checks[0]!.closest("label,[data-list-action]")).not.toBeNull();
  });

  it("부모는 세 상태 — 일부면 mixed, 모두 켜면 true, 끄면 false", async () => {
    await render(false);
    const parent = () =>
      container.querySelector<HTMLElement>('[data-slot="list-mark"]')!;
    expect(parent().getAttribute("aria-checked")).toBe("mixed");
    await click(parent());
    expect(parent().getAttribute("aria-checked")).toBe("true");
    await click(parent());
    expect(parent().getAttribute("aria-checked")).toBe("false");
  });

  it("개수를 받으면 값 자리에 건수가, 못 받으면 오류 글 + 다시 시도가 보인다", async () => {
    await render(false);
    expect(container.textContent).toContain(
      'section.countGeon{"count":"123,456"}',
    );
    act(() => root.unmount());
    root = createRoot(container);
    state.countsFail = true;
    await render(false);
    expect(container.textContent).toContain("section.countsFailed");
    expect(container.textContent).toMatch(/common\.retry|다시 시도|Try again/);
  });
});

describe("민감 정보 가리기 · 버튼 (I-05 44 · 45)", () => {
  it("마스크는 Checkbox 이고 Switch 가 아니다", async () => {
    await render(false);
    expect(container.querySelectorAll('[role="switch"]')).toHaveLength(0);
    expect(
      [...container.querySelectorAll('[role="checkbox"]')].some((c) =>
        c.closest("div")?.textContent?.includes("section.maskSensitive"),
      ),
    ).toBe(true);
  });

  it("[내보내기] 는 neutralSolid, [미리보기] 는 neutralWeak", async () => {
    await render(false);
    expect(btnExact("export").className).toContain("bg-bg-neutral-inverted");
    expect(btnExact("preview").className).toContain("bg-bg-neutral-weak");
  });

  it("폰은 바닥 고정 짝(ResponsivePair), 데스크톱은 오른쪽 정렬", async () => {
    await render(true);
    expect(
      container.querySelector(
        '[data-slot="data-action-bar"] [data-slot="responsive-pair"]',
      ),
    ).not.toBeNull();
    act(() => root.unmount());
    root = createRoot(container);
    await render(false);
    const bar = container.querySelector('[data-slot="data-action-bar"]')!;
    expect(bar.className).toContain("justify-end");
  });
});

describe("내보내기 결과 알림 (I-05 47)", () => {
  it("성공은 '내보냈어요' 문구(옛 길 sonner)", async () => {
    state.download = () => Promise.resolve(new Blob(["x"]));
    await render(false);
    await click(btnExact("export"));
    expect(state.toastSuccess).toEqual(["section.exportDone"]);
  });

  it("받기가 멈추면 실패 띠에 '다시 시도' 동작이 붙는다", async () => {
    state.download = () => Promise.reject(new ExportStalledError());
    await render(false);
    await click(btnExact("export"));
    expect(state.toastError).toHaveLength(1);
    expect(state.toastError[0]!.msg).toBe("section.exportStalled");
    expect(state.toastError[0]!.opts.action?.label).toBeTruthy();
  });
});
