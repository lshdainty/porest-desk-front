// 가져오기 완료 화면은 "건너뜀 20 · 실패 2" 숫자만 보여 줬다 — 서버는 어느 행이 왜
// 실패했는지 이미 내려주는데 화면이 안 읽었다(QA #61). 매핑 단계는 새 카테고리가
// 몇 개 생길지 말해 주지 않아 오타가 그대로 카테고리가 됐다(QA #59).
// 가져오기는 거래를 수백 건 만들면서 쿼리를 하나도 안 비웠다(QA #144).
// 여기서 고정하는 건 그 두 화면이 서버 응답을 실제로 그린다는 것, 모르는 사유 코드가
// 사용자 눈에 영문으로 새지 않는다는 것, 그리고 가져오기가 만든 데이터를 읽는 화면들의
// 캐시가 실제로 비워진다는 것이다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ImportAnalyzeResult,
  ImportExecuteResult,
} from "@/features/import/api/importApi";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const analysis: ImportAnalyzeResult = {
  fileName: "qa.csv",
  totalRows: 30,
  validRows: 30,
  duplicateCount: 20,
  blockedParents: [],
  columns: [
    { index: 0, name: "날짜" },
    { index: 1, name: "금액" },
    { index: 2, name: "분류" },
  ],
  suggestedMapping: { DATE: 0, AMOUNT: 1, CATEGORY: 2 },
  preview: [],
  newCategories: [],
  newCategoryCount: 0,
};

const state = vi.hoisted(() => ({
  analyze: null as unknown,
  execute: null as unknown,
}));

vi.mock("@/features/import/api/importApi", () => ({
  analyzeImport: () => Promise.resolve(state.analyze),
  executeImport: () => Promise.resolve(state.execute),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: object) => (o ? k + JSON.stringify(o) : k),
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { DataImportSection } = await import("./DataImportSection");

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  queryClient = new QueryClient();
  vi.spyOn(queryClient, "invalidateQueries");
  state.analyze = { ...analysis };
  state.execute = null;
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  }
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const btn = (needle: string) =>
  Array.from(container.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(needle),
  );

/** 무효화된 루트 키들 — 호출 순서와 무관하게 본다. */
const invalidatedKeys = () =>
  vi
    .mocked(queryClient.invalidateQueries)
    .mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));

/** 파일 선택 → 분석까지. 매핑 단계에 선다. */
async function toMapping() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <DataImportSection mobile={false} />
      </QueryClientProvider>,
    );
  });
  const input =
    container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["a"], "qa.csv", { type: "text/csv" });
  Object.defineProperty(input, "files", { value: [file] });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

/** 매핑 단계에서 실행까지. 완료 화면에 선다. */
async function toDone(result: ImportExecuteResult) {
  state.execute = result;
  await toMapping();
  await act(async () => {
    btn("import.doImport")!.click();
  });
}

const baseResult: ImportExecuteResult = {
  imported: 8,
  skipped: 20,
  failed: 2,
  failures: [
    { lineNo: 21, reason: "amount" },
    { lineNo: 34, reason: "date" },
  ],
  failuresTruncated: false,
  createdCategories: [],
  createdCategoryCount: 0,
};

describe("가져오기 완료 화면 — 실패한 행 (QA #61)", () => {
  it("어느 행이 실패했는지 행 번호로 알려 준다", async () => {
    await toDone(baseResult);
    expect(container.textContent).toContain('import.failureLine{"line":21}');
    expect(container.textContent).toContain('import.failureLine{"line":34}');
  });

  it("사유 코드를 번역해서 보여 준다 — 코드 원문이 아니다", async () => {
    await toDone(baseResult);
    expect(container.textContent).toContain("import.failReason.amount");
    expect(container.textContent).toContain("import.failReason.date");
  });

  it("모르는 코드는 기본 문구로 떨어뜨린다 — 영문 코드가 새지 않는다", async () => {
    await toDone({
      ...baseResult,
      failed: 1,
      failures: [{ lineNo: 7, reason: "fxRate" }],
    });
    expect(container.textContent).toContain("import.failReason.unknown");
    expect(container.textContent).not.toContain("fxRate");
  });

  it("서버가 목록을 잘랐으면 잘랐다고 적는다", async () => {
    await toDone({
      ...baseResult,
      failed: 120,
      failures: Array.from({ length: 50 }, (_, i) => ({
        lineNo: i + 2,
        reason: "save",
      })),
      failuresTruncated: true,
    });
    expect(container.textContent).toContain(
      'import.failuresCapped{"shown":50,"total":120}',
    );
  });

  it("자르지 않았으면 그 안내를 띄우지 않는다", async () => {
    await toDone(baseResult);
    expect(container.textContent).not.toContain("import.failuresCapped");
  });

  it("실패 수와 목록 길이가 어긋나면 그것만으로도 잘렸다고 본다", async () => {
    // 옛 서버가 failuresTruncated 를 안 보내도 "실패 120 · 50줄" 을 그대로 두지 않는다.
    await toDone({
      ...baseResult,
      failed: 120,
      failures: Array.from({ length: 50 }, (_, i) => ({
        lineNo: i + 2,
        reason: "save",
      })),
      failuresTruncated: false,
    });
    expect(container.textContent).toContain(
      'import.failuresCapped{"shown":50,"total":120}',
    );
  });

  it("실패가 없으면 목록 자체가 없다", async () => {
    await toDone({ ...baseResult, failed: 0, failures: [] });
    expect(container.textContent).not.toContain("import.failuresTitle");
  });

  it("실제로 만든 카테고리를 완료 화면에 남긴다", async () => {
    await toDone({
      ...baseResult,
      createdCategories: ["싟비", "식비 > 커피"],
      createdCategoryCount: 2,
    });
    expect(container.textContent).toContain("싟비");
    expect(container.textContent).toContain("식비 > 커피");
  });
});

describe("가져오기 매핑 단계 — 새로 만들 카테고리 (QA #59)", () => {
  it("새로 생길 카테고리 이름을 실행 전에 보여 준다", async () => {
    state.analyze = {
      ...analysis,
      newCategories: ["싟비", "식비 > 커피"],
      newCategoryCount: 2,
    };
    await toMapping();
    expect(container.textContent).toContain('import.newCatTitle{"count":2}');
    expect(container.textContent).toContain("싟비");
    expect(container.textContent).toContain("식비 > 커피");
  });

  it("상한을 넘으면 몇 개가 더 있는지 적는다", async () => {
    state.analyze = {
      ...analysis,
      newCategories: ["A", "B"],
      newCategoryCount: 60,
    };
    await toMapping();
    expect(container.textContent).toContain('import.newCatMore{"count":58}');
  });

  it("새로 생길 게 없으면 블록이 없다", async () => {
    await toMapping();
    expect(container.textContent).not.toContain("import.newCatTitle");
  });

  it("자동 생성을 끄면 블록이 사라진다 — 끄면 미분류로 들어간다", async () => {
    state.analyze = {
      ...analysis,
      newCategories: ["싟비"],
      newCategoryCount: 1,
    };
    await toMapping();
    const autoCat = container.querySelectorAll('[role="switch"]')[1]!;
    await act(async () => {
      (autoCat as HTMLElement).click();
    });
    expect(container.textContent).not.toContain("import.newCatTitle");
  });
});

describe("가져오기 성공 — 캐시 비우기 (QA #144)", () => {
  // 가져오기는 거래를 수백 건 만든다. 캐시를 안 비우면 가계부·통계·예산·자산·홈이
  // 전부 옛 값이라, 방금 수백 건을 넣은 사용자가 화면마다 새로고침을 눌러야 했다.
  it("가계부·자산·카드·홈 캐시를 전부 비운다", async () => {
    await toDone(baseResult);
    const keys = invalidatedKeys();
    expect(keys).toContain(JSON.stringify(["expenses"]));
    expect(keys).toContain(JSON.stringify(["assets"]));
    expect(keys).toContain(JSON.stringify(["cards"]));
    expect(keys).toContain(JSON.stringify(["dashboard"]));
  });

  it("한 건도 안 들어와도 비운다 — 건너뛴 게 있으면 중복 판정이 이미 바뀌었다", async () => {
    await toDone({ ...baseResult, imported: 0 });
    expect(invalidatedKeys()).toContain(JSON.stringify(["expenses"]));
  });

  it("실행 전에는 아무것도 안 비운다", async () => {
    state.execute = baseResult;
    await toMapping();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it("실행이 실패하면 비우지 않는다 — 만들어진 게 없다", async () => {
    // 떠 있는 rejected promise 를 만들지 않으려고 thenable 로 거절한다.
    state.execute = {
      then: (_ok: unknown, fail: (e: Error) => void) => fail(new Error("boom")),
    };
    await toMapping();
    await act(async () => {
      btn("import.doImport")!.click();
    });
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});
