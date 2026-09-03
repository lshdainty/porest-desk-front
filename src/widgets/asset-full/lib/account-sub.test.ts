import { describe, it, expect } from "vitest";
import { assetTypeToSub, signedBalanceOf, subToAssetType } from "./account-sub";

describe("마이너스통장 (QA #17)", () => {
  it("새 AssetType 을 만들지 않는다 — BANK_ACCOUNT 로 저장한다", () => {
    expect(subToAssetType("마이너스통장")).toBe("BANK_ACCOUNT");
    expect(subToAssetType("입출금")).toBe("BANK_ACCOUNT");
  });

  it("이미 음수로 저장돼 있던 입출금 계좌는 마이너스통장 탭으로 열린다", () => {
    expect(assetTypeToSub("BANK_ACCOUNT", -50_000)).toBe("마이너스통장");
    expect(assetTypeToSub("BANK_ACCOUNT", 0)).toBe("입출금");
    expect(assetTypeToSub("BANK_ACCOUNT", 50_000)).toBe("입출금");
  });

  it("잔액을 안 주면 입출금 — 옛 호출부 회귀", () => {
    expect(assetTypeToSub("BANK_ACCOUNT")).toBe("입출금");
    expect(assetTypeToSub("SAVINGS")).toBe("적금");
    expect(assetTypeToSub("LOAN")).toBe("대출");
    expect(assetTypeToSub("CASH")).toBe("현금");
  });
});

describe("signedBalanceOf (QA #19 — 부호는 종류가 정한다)", () => {
  it("부채군은 음수로 — 사용자는 쓴 금액을 양수로 넣는다", () => {
    expect(signedBalanceOf("마이너스통장", 50_000)).toBe(-50_000);
    expect(signedBalanceOf("대출", 3_000_000)).toBe(-3_000_000);
  });

  it("자산군은 양수로", () => {
    expect(signedBalanceOf("입출금", 50_000)).toBe(50_000);
    expect(signedBalanceOf("적금", 1_000)).toBe(1_000);
    expect(signedBalanceOf("현금", 0)).toBe(0);
  });

  it("멱등 — 저장된 음수를 다시 넣어도 뒤집히지 않는다", () => {
    expect(signedBalanceOf("마이너스통장", -50_000)).toBe(-50_000);
    expect(signedBalanceOf("입출금", -50_000)).toBe(50_000);
    expect(signedBalanceOf("대출", signedBalanceOf("대출", 3_000_000))).toBe(
      -3_000_000,
    );
  });
});
