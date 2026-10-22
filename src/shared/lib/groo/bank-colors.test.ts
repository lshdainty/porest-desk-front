import { describe, expect, it } from "vitest";

import { institutionColor } from "@/shared/ds/institution-colors";

import { BANK_ENTRIES, INSTITUTION_INK, getBrandColor } from "./bank-colors";

// WCAG 상대 휘도 · 대비
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

describe("기관 색 — 표 하나(03E-010)", () => {
  it("선택 목록의 모든 기관이 기관 색 표에서 색을 받는다(중립 대체색 없음)", () => {
    for (const entry of BANK_ENTRIES) {
      const hit = institutionColor(entry.name);
      expect(hit, entry.name).not.toBeNull();
      expect(entry.color.bg, entry.name).toBe(hit!.color);
    }
  });

  it("글자색 — 흰 글자든 짙은 글자든 면 위 4.5:1 이상", () => {
    for (const entry of BANK_ENTRIES) {
      // 짙은 글자는 모드마다 갈린다 — 라이트 #1A1F2E · 다크 #242938, 둘 다 면 위 4.5:1
      const inks =
        entry.color.fg === INSTITUTION_INK
          ? ["#1A1F2E", "#242938"]
          : [entry.color.fg ?? "#ffffff"];
      for (const fg of inks)
        expect(contrast(fg, entry.color.bg), entry.name).toBeGreaterThanOrEqual(
          4.5,
        );
    }
  });

  it("getBrandColor — 첫 번째로 맞는 후보, 밝은 면은 짙은 글자", () => {
    expect(getBrandColor(null, "KB국민은행 적금")).toEqual({
      bg: "#FFBC00",
      fg: INSTITUTION_INK,
    });
    expect(getBrandColor("모르는 곳", "신한")).toEqual({ bg: "#0046FF" });
  });
});
