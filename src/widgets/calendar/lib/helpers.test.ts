import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { convertExpenseToIEvent } from "./helpers";
import type { Expense } from "@/entities/expense";

/**
 * 캘린더 일별 합계는 title 이 아니라 expenseAmount 를 쓴다.
 *
 * 예전엔 title 을 `([+-])?([\d,]+)` 로 되파싱했는데,
 *  - en 로케일 `-₩50,000` 은 부호와 숫자 사이 ₩ 때문에 부호를 놓쳐
 *    지출이 전부 환불(양수)로 뒤집혔고,
 *  - `2차회식 -50,000원` 은 카테고리명의 `2` 를 금액으로 읽었다.
 * 그래서 converter 가 부호 값을 직접 실어 준다 — 지출 음수 / 수입·환불 양수.
 */
function tx(over: Partial<Expense>): Expense {
  return {
    rowId: 1,
    categoryRowId: 1,
    categoryName: "식비",
    assetRowId: null,
    assetName: null,
    expenseType: "EXPENSE",
    amount: 50000,
    merchant: "가맹점",
    description: "",
    expenseDate: "2026-09-01T12:00:00",
    ...over,
  } as Expense;
}

describe("convertExpenseToIEvent.expenseAmount", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("지출은 음수 — en 로케일 ₩ 가 부호를 가리지 않는다", () => {
    const ev = convertExpenseToIEvent(tx({}));
    expect(ev.title).toContain("-₩50,000");
    expect(ev.expenseAmount).toBe(-50000);
  });

  it("수입은 양수", () => {
    const ev = convertExpenseToIEvent(tx({ expenseType: "INCOME" }));
    expect(ev.expenseAmount).toBe(50000);
  });

  it("환불(수입+원거래)은 양수 — 지출 상계용", () => {
    const ev = convertExpenseToIEvent(
      tx({ expenseType: "INCOME", refundOfExpenseRowId: 9, amount: 3000 }),
    );
    expect(ev.expenseAmount).toBe(3000);
    // 지출 계열 색 그대로 (파랑이면 수입으로 합산돼 버린다)
    expect(ev.color).toBe("#c73838");
  });

  it("숫자로 시작하는 카테고리명도 금액과 섞이지 않는다", () => {
    const ev = convertExpenseToIEvent(tx({ categoryName: "2차회식" }));
    expect(ev.expenseAmount).toBe(-50000);
  });
});
