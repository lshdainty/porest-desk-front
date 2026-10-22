import { describe, expect, it } from "vitest";

import { getBrandColor, INSTITUTION_INK } from "@/shared/lib/groo/bank-colors";

import { CARD_FALLBACK_GRADIENT, getCardBrand } from "./cardBrand";

describe("getCardBrand — 기관 색 표 하나(03E-010)", () => {
  it("카드사도 같은 표 — 자산 로고와 같은 회사는 같은 색", () => {
    expect(getCardBrand("신한카드").bg).toBe(getBrandColor("신한")!.bg);
    expect(getCardBrand("KB국민카드 올원")).toEqual({
      bg: "#FFBC00",
      fg: INSTITUTION_INK,
      known: true,
    });
    expect(getCardBrand("없는카드사")).toEqual({
      bg: CARD_FALLBACK_GRADIENT,
      fg: "#fff",
      known: false,
    });
  });
});
