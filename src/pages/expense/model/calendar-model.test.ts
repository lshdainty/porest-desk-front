// 작은 달력 · 주 달력의 계산(I-07 26 · 27) — 6주 42칸 · 날마다 지출(환불 · 예정 · 이체 뺌) · 막대 세기 · 기간 안 달 이동(Q5-C).
import { describe, expect, it } from "vitest";
import type { Expense } from "@/entities/expense";
import {
  barStep,
  clampMonth,
  dailyTotals,
  maxDailyOut,
  monthGrid,
  shiftMonth,
  visibleWeekIndex,
} from "./calendar-model";

const tx = (day: number, amount: number, o: Partial<Expense> = {}): Expense =>
  ({
    rowId: day * 100 + amount,
    expenseType: "EXPENSE",
    amount,
    expenseDate: `2026-10-${String(day).padStart(2, "0")}T10:00:00`,
    refundedAt: null,
    ...o,
  }) as Expense;

describe("monthGrid", () => {
  it("항상 6주 42칸이고 일요일부터 시작한다 — 앞뒤 달 칸은 inMonth false", () => {
    const g = monthGrid("2026-10");
    expect(g).toHaveLength(6);
    expect(g.every((w) => w.length === 7)).toBe(true);
    // 2026-10-01 은 목요일 — 앞에 일 · 월 · 화 · 수 가 9월 말
    expect(g[0]!.map((c) => c.ds)).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(g[0]!.map((c) => c.inMonth)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
    expect(g[5]![6]!.ds).toBe("2026-11-07");
  });

  it("2월처럼 4주로 끝나는 달도 6주를 채운다", () => {
    const g = monthGrid("2026-02");
    expect(g.flat().filter((c) => c.inMonth)).toHaveLength(28);
    expect(g.flat()).toHaveLength(42);
  });
});

describe("dailyTotals · 막대", () => {
  it("환불된 거래 · 예정 거래는 세지 않는다(서버 집계와 같은 셈)", () => {
    const byDay = dailyTotals([
      tx(5, 1_000),
      tx(5, 2_000),
      tx(5, 500, { expenseType: "INCOME" }),
      tx(6, 9_000, { refundedAt: "2026-10-07T00:00:00" }),
      tx(7, 7_000, { expenseDate: "2999-01-01T00:00:00" }),
    ]);
    expect(byDay["2026-10-05"]).toEqual({ out: 3_000, inn: 500 });
    expect(byDay["2026-10-06"]).toBeUndefined();
    expect(Object.keys(byDay)).not.toContain("2999-01-01");
  });

  it("세기는 그 달 가장 많이 쓴 날의 8 · 22 · 45 · 75% 에서 끊는다", () => {
    const byDay = {
      "2026-10-01": { out: 1_000, inn: 0 },
      "2026-11-01": { out: 9_999_999, inn: 0 },
    };
    // 다른 달의 큰 값은 기준에 들지 않는다
    expect(maxDailyOut(byDay, "2026-10")).toBe(1_000);
    expect(barStep(0, 1000)).toBe(-1);
    expect(barStep(70, 1000)).toBe(0);
    expect(barStep(150, 1000)).toBe(1);
    expect(barStep(300, 1000)).toBe(2);
    expect(barStep(600, 1000)).toBe(3);
    expect(barStep(1000, 1000)).toBe(4);
  });
});

describe("주 달력 · 달 이동", () => {
  it("보이는 주는 오늘이 든 주 — 오늘이 그 달이 아니면 첫 주", () => {
    const g = monthGrid("2026-10");
    expect(visibleWeekIndex(g, "2026-10-24")).toBe(3);
    expect(visibleWeekIndex(g, "2026-09-30")).toBe(0);
  });

  it("shiftMonth 는 해를 넘긴다", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("기간이 걸리면 달은 그 기간 안으로만 움직인다(Q5-C) — 기간이 없으면 자유", () => {
    const bounds = { first: "2026-08", last: "2026-09" };
    expect(clampMonth("2026-10", bounds)).toBe("2026-09");
    expect(clampMonth("2026-07", bounds)).toBe("2026-08");
    expect(clampMonth("2026-09", bounds)).toBe("2026-09");
    expect(clampMonth("2026-10", null)).toBe("2026-10");
  });
});
