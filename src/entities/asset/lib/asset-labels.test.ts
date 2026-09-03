import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { assetTypeLabel } from "./asset-labels";

describe("assetTypeLabel", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("잔액이 음수인 입출금은 마이너스통장으로 읽는다 (QA #17)", () => {
    expect(assetTypeLabel("BANK_ACCOUNT", -1)).toBe("마이너스통장");
  });

  it("0·양수는 그대로 입출금", () => {
    expect(assetTypeLabel("BANK_ACCOUNT", 0)).toBe("입출금");
    expect(assetTypeLabel("BANK_ACCOUNT", 10)).toBe("입출금");
    // 잔액 인자 없이 부르던 기존 호출부 회귀
    expect(assetTypeLabel("BANK_ACCOUNT")).toBe("입출금");
  });

  it("부호 규칙은 입출금에만 — 음수 대출은 계속 '대출'", () => {
    expect(assetTypeLabel("LOAN", -3_000_000)).toBe("대출");
    expect(assetTypeLabel("CREDIT_CARD", -7_000)).toBe("신용카드");
  });
});
