// 가계부 필터 v2 의 **진리표** — filter-combos.md 의 15줄을 그대로 옮긴 것.
//
// 앱(`lib/features/expense/domain/expense_filter.dart`)이 같은 표를 미러한다.
// 한쪽만 고치면 같은 필터가 두 화면에서 다른 결과를 낸다 — 그래서 조합 번호를
// 테스트 이름에 박아 둔다.
//
// 규칙은 셋뿐이다.
//   ① 기간은 **항상 AND** (periods 안에서만 OR)
//   ② 제외(빼고)는 **항상 AND** — match 와 무관하게 먼저 걸러진다
//   ③ 포함 조건은 켜진 것만 보고, match=all 이면 전부 / any 면 하나라도
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTER,
  activeConditionCount,
  filterSpan,
  matchesFilter,
  type FilterRow,
  type FilterValue,
} from "./filter";

/** 식비(1)·카페(2) 카테고리, S통장(10)·S카드(11) 계좌를 쓴다. */
const row = (over: Partial<FilterRow> = {}): FilterRow => ({
  date: "2026-09-10",
  amount: 30000,
  type: "EXPENSE",
  categoryIds: [1],
  assetIds: [10],
  ...over,
});

const f = (over: Partial<FilterValue> = {}): FilterValue => ({
  ...DEFAULT_FILTER,
  ...over,
});

const SEP = {
  preset: "custom",
  start: "2026-09-01",
  end: "2026-09-30",
} as const;
const AUG = {
  preset: "custom",
  start: "2026-08-01",
  end: "2026-08-31",
} as const;

describe("① 기간은 항상 AND", () => {
  it("periods 가 비면 기간 조건 없음 — 통과", () => {
    expect(matchesFilter(row(), f())).toBe(true);
  });

  it("11 · 기간 여러 개 — 둘 중 하나에 들면 통과", () => {
    const filter = f({ periods: [SEP, AUG] });
    expect(matchesFilter(row({ date: "2026-09-10" }), filter)).toBe(true);
    expect(matchesFilter(row({ date: "2026-08-15" }), filter)).toBe(true);
    expect(matchesFilter(row({ date: "2026-07-31" }), filter)).toBe(false);
  });

  it("any 여도 기간은 AND — 기간 밖이면 다른 조건이 맞아도 빠진다", () => {
    const filter = f({
      match: "any",
      periods: [SEP],
      categories: { include: [1], exclude: [] },
    });
    expect(matchesFilter(row({ date: "2026-08-15" }), filter)).toBe(false);
  });
});

describe("② 제외는 항상 AND", () => {
  it("12 · 카테고리 빼고 — match 와 무관하게 빠진다", () => {
    for (const match of ["all", "any"] as const) {
      const filter = f({ match, categories: { include: [], exclude: [1] } });
      expect(matchesFilter(row({ categoryIds: [1] }), filter)).toBe(false);
      expect(matchesFilter(row({ categoryIds: [2] }), filter)).toBe(true);
    }
  });

  it("12 · 계좌 빼고", () => {
    const filter = f({ assets: { include: [], exclude: [10] } });
    expect(matchesFilter(row({ assetIds: [10] }), filter)).toBe(false);
    expect(matchesFilter(row({ assetIds: [11] }), filter)).toBe(true);
  });

  it("분할은 항목 중 하나라도 제외면 뺀다", () => {
    const filter = f({ categories: { include: [], exclude: [2] } });
    // 거래는 식비(1)인데 분할 항목에 카페(2)가 섞여 있다.
    expect(matchesFilter(row({ categoryIds: [1, 2] }), filter)).toBe(false);
  });

  it("포함과 제외가 같이 걸리면 제외가 이긴다", () => {
    const filter = f({ categories: { include: [1], exclude: [2] } });
    expect(matchesFilter(row({ categoryIds: [1, 2] }), filter)).toBe(false);
  });
});

describe("③ 포함 — all(모두 일치)", () => {
  it("1 · 카테고리 여러 개는 칸 안에서 OR", () => {
    const filter = f({ categories: { include: [1, 2], exclude: [] } });
    expect(matchesFilter(row({ categoryIds: [2] }), filter)).toBe(true);
    expect(matchesFilter(row({ categoryIds: [3] }), filter)).toBe(false);
  });

  it("2 · 계좌 여러 개도 OR", () => {
    const filter = f({ assets: { include: [10, 11], exclude: [] } });
    expect(matchesFilter(row({ assetIds: [11] }), filter)).toBe(true);
    expect(matchesFilter(row({ assetIds: [12] }), filter)).toBe(false);
  });

  it("칸 사이는 AND — 카테고리와 계좌 둘 다 맞아야 한다", () => {
    const filter = f({
      categories: { include: [1], exclude: [] },
      assets: { include: [10], exclude: [] },
    });
    expect(
      matchesFilter(row({ categoryIds: [1], assetIds: [10] }), filter),
    ).toBe(true);
    expect(
      matchesFilter(row({ categoryIds: [1], assetIds: [11] }), filter),
    ).toBe(false);
  });

  it("10 · 금액 구간 두 개 — 소액이거나 고액", () => {
    const filter = f({
      amountRanges: [
        { min: "", max: "5000" },
        { min: "100000", max: "" },
      ],
    });
    expect(matchesFilter(row({ amount: 3000 }), filter)).toBe(true);
    expect(matchesFilter(row({ amount: 150000 }), filter)).toBe(true);
    expect(matchesFilter(row({ amount: 30000 }), filter)).toBe(false);
  });

  it("종류는 하나만 골랐을 때만 조건이 된다", () => {
    expect(
      matchesFilter(
        row({ type: "INCOME" }),
        f({ types: ["EXPENSE", "INCOME"] }),
      ),
    ).toBe(true);
    expect(
      matchesFilter(row({ type: "INCOME" }), f({ types: ["EXPENSE"] })),
    ).toBe(false);
  });
});

describe("③ 포함 — any(하나라도 일치)", () => {
  const anyRow = row({ categoryIds: [2], assetIds: [11], amount: 70000 });

  it("3 · 카테고리 또는 계좌", () => {
    const filter = f({
      match: "any",
      categories: { include: [2], exclude: [] },
      assets: { include: [99], exclude: [] },
    });
    expect(matchesFilter(anyRow, filter)).toBe(true);
  });

  it("4 · 카테고리 또는 금액", () => {
    const filter = f({
      match: "any",
      categories: { include: [1], exclude: [] },
      amountRanges: [{ min: "50000", max: "" }],
    });
    // 카테고리는 안 맞지만(2) 금액이 맞는다(70000).
    expect(matchesFilter(anyRow, filter)).toBe(true);
  });

  it("5 · 계좌 또는 금액", () => {
    const filter = f({
      match: "any",
      assets: { include: [11], exclude: [] },
      amountRanges: [{ min: "1000000", max: "" }],
    });
    expect(matchesFilter(anyRow, filter)).toBe(true);
  });

  it("6 · 종류 또는 카테고리 — 수입 전부 + 지출 중 월세만", () => {
    const filter = f({
      match: "any",
      types: ["INCOME"],
      categories: { include: [7], exclude: [] },
    });
    expect(
      matchesFilter(row({ type: "INCOME", categoryIds: [3] }), filter),
    ).toBe(true);
    expect(
      matchesFilter(row({ type: "EXPENSE", categoryIds: [7] }), filter),
    ).toBe(true);
    expect(
      matchesFilter(row({ type: "EXPENSE", categoryIds: [3] }), filter),
    ).toBe(false);
  });

  it("7 · 종류 또는 계좌", () => {
    const filter = f({
      match: "any",
      types: ["INCOME"],
      assets: { include: [11], exclude: [] },
    });
    expect(
      matchesFilter(row({ type: "EXPENSE", assetIds: [11] }), filter),
    ).toBe(true);
  });

  it("8 · 종류 또는 금액", () => {
    const filter = f({
      match: "any",
      types: ["INCOME"],
      amountRanges: [{ min: "50000", max: "" }],
    });
    expect(matchesFilter(row({ type: "EXPENSE", amount: 70000 }), filter)).toBe(
      true,
    );
    expect(matchesFilter(row({ type: "EXPENSE", amount: 1000 }), filter)).toBe(
      false,
    );
  });

  it("9 · 세 필드 이상 — 카페이거나 S카드이거나 5만원 이상", () => {
    const filter = f({
      match: "any",
      categories: { include: [2], exclude: [] },
      assets: { include: [11], exclude: [] },
      amountRanges: [{ min: "50000", max: "" }],
    });
    expect(
      matchesFilter(
        row({ categoryIds: [9], assetIds: [99], amount: 60000 }),
        filter,
      ),
    ).toBe(true);
    expect(
      matchesFilter(
        row({ categoryIds: [9], assetIds: [99], amount: 100 }),
        filter,
      ),
    ).toBe(false);
  });
});

describe("④ 이체 — 종류·카테고리 개념이 없다", () => {
  const transfer = (over: Partial<FilterRow> = {}): FilterRow =>
    row({ type: null, categoryIds: [], assetIds: [10, 11], ...over });

  it("13 · all 에서 카테고리를 고르면 이체는 빠진다 — 규칙의 결과다", () => {
    const filter = f({ categories: { include: [1], exclude: [] } });
    expect(matchesFilter(transfer(), filter)).toBe(false);
  });

  it("13 · any 에서는 계좌로 이체가 나온다", () => {
    const filter = f({
      match: "any",
      categories: { include: [1], exclude: [] },
      assets: { include: [11], exclude: [] },
    });
    expect(matchesFilter(transfer(), filter)).toBe(true);
  });

  it("계좌 조건은 보내는 쪽·받는 쪽 둘 다 본다", () => {
    expect(
      matchesFilter(transfer(), f({ assets: { include: [10], exclude: [] } })),
    ).toBe(true);
    expect(
      matchesFilter(transfer(), f({ assets: { include: [11], exclude: [] } })),
    ).toBe(true);
    expect(
      matchesFilter(transfer(), f({ assets: { include: [12], exclude: [] } })),
    ).toBe(false);
  });

  it("조건이 하나도 없으면 이체도 그대로 나온다", () => {
    expect(matchesFilter(transfer(), f())).toBe(true);
  });

  it("종류를 하나 고르면 이체는 빠진다", () => {
    expect(matchesFilter(transfer(), f({ types: ["EXPENSE"] }))).toBe(false);
  });
});

describe("⑤ 14 · 분할 거래", () => {
  it("분할 항목 중 하나라도 맞으면 나온다", () => {
    const filter = f({ categories: { include: [2], exclude: [] } });
    expect(matchesFilter(row({ categoryIds: [1, 2] }), filter)).toBe(true);
  });
});

describe("배지·범위 계산", () => {
  it("켜진 조건 수를 센다 — 종류는 하나만 골랐을 때만", () => {
    expect(activeConditionCount(DEFAULT_FILTER)).toBe(0);
    expect(activeConditionCount(f({ types: ["EXPENSE"] }))).toBe(1);
    expect(
      activeConditionCount(
        f({
          types: ["EXPENSE"],
          categories: { include: [1], exclude: [] },
          assets: { include: [10], exclude: [] },
          amountRanges: [{ min: "1", max: "" }],
        }),
      ),
    ).toBe(4);
  });

  it("제외만 걸린 것은 조건 수에 안 센다 — 포함 조건이 아니다", () => {
    expect(
      activeConditionCount(f({ categories: { include: [], exclude: [1] } })),
    ).toBe(0);
  });

  it("조회 범위는 기간들의 최소~최대", () => {
    expect(filterSpan(f({ periods: [SEP, AUG] }))).toEqual({
      start: "2026-08-01",
      end: "2026-09-30",
    });
    expect(filterSpan(f())).toBeNull();
  });
});
