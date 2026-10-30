import { describe, expect, it } from "vitest";

import { marketCodeOf, marketName } from "./market-name";

// 로케일 표(stocks:market.*)의 ko 글 — 실제 CSV 와 같은 값(앱과 같은 표)
const KO: Record<string, string> = {
  KOSPI: "코스피",
  KOSDAQ: "코스닥",
  KONEX: "코넥스",
  NAS: "나스닥",
  NYS: "뉴욕",
  AMS: "아멕스",
  SHS: "상해",
  SZS: "심천",
  TSE: "도쿄",
  HKS: "홍콩",
  HNX: "하노이",
  HSX: "호치민",
};
const t = (key: string, opts?: { defaultValue: string }) =>
  KO[key.replace("market.", "")] ?? opts?.defaultValue ?? key;

describe("marketName — 거래소 코드가 아니라 사용자 말(앱과 같은 표)", () => {
  it("거래소 코드(종목 마스터)", () => {
    expect(marketName(t, "NAS")).toBe("나스닥");
    expect(marketName(t, "NYS")).toBe("뉴욕");
    expect(marketName(t, "AMS")).toBe("아멕스");
  });
  it("시장 이름 글(토스 종목 정보 StockInfo.market) 별칭도 같은 말", () => {
    expect(marketName(t, "NASDAQ")).toBe("나스닥");
    expect(marketName(t, "NYSE")).toBe("뉴욕");
    expect(marketName(t, "AMEX")).toBe("아멕스");
    expect(marketName(t, "KOSPI")).toBe("코스피");
    expect(marketName(t, "KOSDAQ")).toBe("코스닥");
  });
  it("그 밖의 시장 — 코넥스 · 상해 · 심천 · 도쿄 · 홍콩 · 하노이 · 호치민", () => {
    expect(
      ["KONEX", "SHS", "SZS", "TSE", "HKS", "HNX", "HSX"].map((c) =>
        marketName(t, c),
      ),
    ).toEqual(["코넥스", "상해", "심천", "도쿄", "홍콩", "하노이", "호치민"]);
  });
  it("모르는 코드만 원문 · 값이 없으면 빈 글", () => {
    expect(marketName(t, "ZZZ")).toBe("ZZZ");
    expect(marketName(t, null)).toBe("");
    expect(marketName(t, undefined)).toBe("");
  });
  it("별칭은 거래소 코드로 접힌다", () => {
    expect(marketCodeOf("NASDAQ")).toBe("NAS");
    expect(marketCodeOf("NAS")).toBe("NAS");
    expect(marketCodeOf("KOSPI")).toBe("KOSPI");
  });
});
