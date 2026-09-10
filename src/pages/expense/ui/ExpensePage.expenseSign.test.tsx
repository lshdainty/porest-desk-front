// 지출 합계는 **음수가 될 수 있다.**
//
// 서버 `totalExpense` 는 환불을 상계해서 낸다(`ExpenseServiceImpl` · 화면 쪽은
// `expenseSum`). 지난달에 산 것을 이번 달에 환불하면 그달 지출은 정상적으로 음수가
// 된다. 그런데 화면이 `−{KRW(v)}` 처럼 부호를 문자로 박아 두면 `−-51,999` 가 찍히고,
// 바로 옆 합계 칸은 `+51,999` 라 둘이 짝이 안 맞는다(QA #155).
//
// 부호는 `minusOf` 한 곳에서 붙는다 — 0 이면 안 붙이고(QA #1), 양수면 U+2212(QA #22),
// 음수면 `+` 로 뒤집는다. 홈은 이미 그렇게 갔는데(`DashboardPage` 의 총 부채·월 지출)
// 가계부만 남아 있었다.
//
// 그래서 두 가지를 잠근다.
//   ① 월 요약 카드가 실제로 내는 **글자** — 값이 음수면 `+`, 0 이면 무부호.
//   ② 부호를 문자로 박은 자리가 **하나도 없다**는 것. QA 가 지목한 네 자리를 눈으로
//      고치면 다섯 번째 자리에서 또 샌다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MINUS } from "@/shared/lib/porest/format";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { Summary } = await import("./ExpensePage");

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
});

/** 세 칸은 수입 · 지출 · 합계 순이다 — 가운데가 이 이슈의 자리다. */
function amounts(monthIn: number, monthOut: number) {
  act(() =>
    root.render(
      <Summary
        month="2026-09"
        onMonthChange={() => {}}
        mobile={false}
        monthIn={monthIn}
        monthOut={monthOut}
        isLoading={false}
      />,
    ),
  );
  const nums = [...container.querySelectorAll(".num")].map(
    (el) => el.textContent ?? "",
  );
  expect(nums, "수입·지출·합계 세 칸").toHaveLength(3);
  return { income: nums[0]!, expense: nums[1]!, net: nums[2]! };
}

describe("월 요약 지출 칸 — 부호는 값을 따른다", () => {
  it("환불이 지출보다 많은 달: `−-51,999` 가 아니라 `+51,999`", () => {
    const { expense, net } = amounts(0, -51_999);

    expect(expense).not.toContain("-51,999");
    expect(expense).toContain("+51,999");
    // 합계와 방향이 같아야 한다 — QA 가 짝이 안 맞는다고 지목한 자리다.
    expect(net).toContain("+51,999");
  });

  it("보통 달: U+2212 로 뺀다", () => {
    const { expense } = amounts(3_200_000, 51_999);

    expect(expense).toContain(`${MINUS}51,999`);
    expect(expense).not.toContain("-51,999");
  });

  it("지출이 없으면 `−0` 이 아니라 `0` 이다(QA #1)", () => {
    const { expense } = amounts(0, 0);

    expect(expense).not.toContain(`${MINUS}0`);
    expect(expense).not.toContain("-0");
    expect(expense).toContain("0");
  });
});

describe("부호를 붙이는 자리는 네 곳뿐이고 전부 minusOf 를 지난다", () => {
  const SRC = readFileSync(
    join(cwd(), "src/pages/expense/ui/ExpensePage.tsx"),
    "utf8",
  );

  it("`−{KRW(` · `−{wonPre()` 처럼 문자로 박은 부호가 남아 있지 않다", () => {
    expect(SRC).not.toContain(`${MINUS}{KRW(`);
    expect(SRC).not.toContain(`${MINUS}{wonPre()`);
  });

  it("음수로 올 수 있는 지출 값 네 자리가 모두 minusOf 를 지난다", () => {
    const signed = [...SRC.matchAll(/\{minusOf\(([^)]+)\)\}/g)]
      .map((m) => m[1]!)
      .sort();

    // 월 요약 카드 · 소비 요약 행(둘 다 monthOut) · 날짜 상세 카드 · 캘린더 셀 툴팁.
    expect(signed).toEqual([
      "expenseTotal",
      "monthOut",
      "monthOut",
      "tipDay.out",
    ]);
  });
});
