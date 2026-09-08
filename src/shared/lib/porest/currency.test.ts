import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { CURRENCIES, currencySymbol, currencyUnit } from "./currency";

/**
 * 라벨 괄호 안의 통화 단위 — `잔액 (원)` · `잔액 ($)`.
 *
 * 라벨에 `(원)` 이 박혀 있어 USD 를 골라도 원화처럼 보였다(QA 12차). 여기서
 * 잠그는 건 셋이다:
 * ① 고른 통화의 기호가 나온다 ② 기호는 `CURRENCIES` 한 벌에서만 온다
 * ③ 원화만 로케일을 탄다(ko `원` / en `₩`).
 *
 * ②를 안 잠그면 매핑이 두 벌이 되어, 통화를 하나 늘릴 때 한쪽만 늘어난다.
 * **앱도 같은 규칙을 쓴다** — 갈리면 같은 자산을 두 화면이 다른 단위로 읽는다.
 */
describe("currencyUnit", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("한국어 화면의 원화는 `₩` 가 아니라 `원` 이다", () => {
    expect(currencyUnit("KRW")).toBe("원");
  });

  it("영어 화면의 원화는 `₩` — `Balance (원)` 은 남의 글자다", async () => {
    await i18n.changeLanguage("en");
    expect(currencyUnit("KRW")).toBe("₩");
  });

  it("나머지 통화는 로케일과 무관한 기호다", async () => {
    expect(currencyUnit("USD")).toBe("$");
    expect(currencyUnit("EUR")).toBe("€");
    expect(currencyUnit("JPY")).toBe("¥");
    await i18n.changeLanguage("en");
    expect(currencyUnit("USD")).toBe("$");
    expect(currencyUnit("EUR")).toBe("€");
    expect(currencyUnit("JPY")).toBe("¥");
  });

  it("기호는 `CURRENCIES` 한 벌에서만 온다 — 두 벌이 되면 한쪽만 늘어난다", () => {
    for (const c of CURRENCIES) {
      if (c.code === "KRW") continue;
      expect(currencyUnit(c.code)).toBe(currencySymbol(c.code));
    }
  });

  it("통화를 안 적어 둔 자산은 원화로 본다", () => {
    expect(currencyUnit(null)).toBe("원");
    expect(currencyUnit(undefined)).toBe("원");
    expect(currencyUnit("")).toBe("원");
  });

  it("모르는 코드는 코드 그대로 — 빈 괄호보다 낫다", () => {
    expect(currencyUnit("XPT")).toBe("XPT");
  });
});

/**
 * 문구 쪽 절반 — 라벨이 단위를 **슬롯으로** 들고 있어야 한다.
 *
 * 컴포넌트가 `unit` 을 넘기는지는 `AssetEditDialog.currency-label.test.tsx` 가 본다.
 * 그것만으로는 부족하다: CSV 가 `잔액 (원)` 으로 박힌 채면 넘긴 값이 갈 자리가 없어
 * 화면은 그대로인데 그 테스트는 초록이다. 여기서 CSV → 생성물 → i18n 까지를 한 번에 본다.
 */
describe("잔액·한도 라벨은 단위를 슬롯으로 받는다", () => {
  const KEYS = [
    "editDialog.balanceLabelAccount",
    "editDialog.balanceLabelCard",
    "editDialog.balanceLabelInvest",
    "editDialog.balanceLabelOverdraft",
    "editDialog.creditLimit",
    "editDialog.overdraftLimitLabel",
  ];
  const orig = i18n.language;
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  for (const lang of ["ko", "en"] as const) {
    it(`${lang}: 넘긴 단위가 라벨에 실제로 박힌다`, async () => {
      await i18n.changeLanguage(lang);
      for (const key of KEYS) {
        expect(i18n.t(key, { ns: "asset", unit: "$" })).toContain("$");
      }
    });
  }

  it("영문 '약정 한도' 는 `, optional)` 까지 살아 있다 — 쉼표에서 잘려 나갔다", async () => {
    await i18n.changeLanguage("en");
    // CSV 는 쉼표로 칸을 가른다. 따옴표로 안 감싸면 여기가 `Credit Line ($` 이 된다.
    expect(
      i18n.t("editDialog.overdraftLimitLabel", { ns: "asset", unit: "$" }),
    ).toBe("Credit Line ($, optional)");
  });
});
