import { describe, expect, it } from "vitest";
import type { Expense } from "@/entities/expense";
import { groupCheck, groupForFixed, toggleGroup } from "./fixed-groups";

let seq = 0;
const tx = (over: Partial<Expense>): Expense => ({
  rowId: ++seq,
  categoryRowId: 1,
  categoryName: "주거",
  assetRowId: null,
  assetName: null,
  expenseType: "EXPENSE",
  amount: 1_000,
  description: null,
  expenseDate: "2020-01-05T09:00:00",
  merchant: null,
  paymentMethod: null,
  installmentMonths: null,
  refundedAt: null,
  refundTransferRowId: null,
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  calendarEventRowId: null,
  todoRowId: null,
  autoSource: null,
  createAt: "2020-01-05T09:00:00",
  modifyAt: "2020-01-05T09:00:00",
  ...over,
});

describe("groupForFixed — 같은 이름의 거래를 한 묶음으로", () => {
  it("거래처가 같으면 대소문자·공백이 달라도 한 묶음이다", () => {
    const g = groupForFixed(
      [
        tx({ merchant: "집주인", amount: 700_000 }),
        tx({ merchant: " 집주인 ", amount: 700_000 }),
        tx({ merchant: "스타벅스", amount: 5_000 }),
      ],
      "EXPENSE",
      "기타",
    );
    expect(g).toHaveLength(2);
    expect(g[0]!.name).toBe("집주인");
    expect(g[0]!.count).toBe(2);
    expect(g[0]!.total).toBe(1_400_000);
  });

  it("이름은 거래처 → 메모 → 카테고리 → 대체 이름 순이다 — 행에 보이는 것과 같다", () => {
    const g = groupForFixed(
      [
        tx({ merchant: "A", description: "메모", categoryName: "카테" }),
        tx({ merchant: null, description: "메모", categoryName: "카테" }),
        tx({ merchant: null, description: null, categoryName: "카테" }),
        tx({ merchant: null, description: null, categoryName: undefined }),
      ],
      "EXPENSE",
      "기타",
    );
    expect(g.map((x) => x.name).sort()).toEqual(["A", "기타", "메모", "카테"]);
  });

  it("지출과 수입을 섞지 않는다", () => {
    const rows = [
      tx({ merchant: "회사", expenseType: "INCOME", amount: 3_000_000 }),
      tx({ merchant: "회사", expenseType: "EXPENSE", amount: 10 }),
    ];
    expect(groupForFixed(rows, "INCOME", "기타")[0]!.total).toBe(3_000_000);
    expect(groupForFixed(rows, "EXPENSE", "기타")[0]!.total).toBe(10);
  });

  it("합계에 안 잡히는 환불된 거래는 뺀다", () => {
    const g = groupForFixed(
      [
        tx({ merchant: "집주인" }),
        tx({ merchant: "집주인", refundedAt: "2020-01-06T09:00:00" }),
      ],
      "EXPENSE",
      "기타",
    );
    expect(g[0]!.count).toBe(1);
  });

  it("이미 고정인 거래 수를 센다", () => {
    const g = groupForFixed(
      [
        tx({ merchant: "집주인", isFixed: true }),
        tx({ merchant: "집주인", isFixed: false }),
        tx({ merchant: "집주인" }),
      ],
      "EXPENSE",
      "기타",
    );
    expect(g[0]!.count).toBe(3);
    expect(g[0]!.fixedCount).toBe(1);
  });

  it("건수 많은 순, 같으면 합계 큰 순으로 정렬한다", () => {
    const g = groupForFixed(
      [
        tx({ merchant: "한번", amount: 9_000_000 }),
        tx({ merchant: "두번", amount: 1 }),
        tx({ merchant: "두번", amount: 1 }),
        tx({ merchant: "큰한번", amount: 9_999_999 }),
      ],
      "EXPENSE",
      "기타",
    );
    expect(g.map((x) => x.name)).toEqual(["두번", "큰한번", "한번"]);
  });
});

describe("묶음 선택", () => {
  const g = groupForFixed(
    [tx({ merchant: "A" }), tx({ merchant: "A" }), tx({ merchant: "A" })],
    "EXPENSE",
    "기타",
  )[0]!;

  it("고른 것이 없으면 false, 전부면 true, 일부면 indeterminate", () => {
    expect(groupCheck(g, new Set())).toBe(false);
    expect(groupCheck(g, new Set([g.ids[0]!]))).toBe("indeterminate");
    expect(groupCheck(g, new Set(g.ids))).toBe(true);
  });

  it("묶음을 켜면 안의 거래가 전부 들어가고, 끄면 전부 빠진다 — 다른 묶음은 그대로", () => {
    const other = 99_999;
    const on = toggleGroup(g, new Set([other]), true);
    expect([...on].sort()).toEqual([...g.ids, other].sort());
    const off = toggleGroup(g, on, false);
    expect([...off]).toEqual([other]);
  });

  it("원래 집합을 바꾸지 않는다", () => {
    const base = new Set<number>();
    toggleGroup(g, base, true);
    expect(base.size).toBe(0);
  });
});
