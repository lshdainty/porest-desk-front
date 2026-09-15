// 이체 표시·자격 규칙의 진리표.
//
// `transferPartiesLabel` 은 같은 데이터를 그리는 자리 넷(반복 목록·반복 "다가오는 7일"
// 띠·프리셋 목록·프리셋 저장 미리보기)이 같이 쓴다. 넷이 각자 문자열을 만들던 동안
// 반복 목록만 고쳐져 있었고 나머지는 "카테고리 없음" · 출금 계좌만 보였다(2026-09-15).
import { describe, expect, it } from "vitest";
import type { Asset } from "@/entities/asset";
import {
  isLoanTarget,
  transferEligible,
  transferPartiesLabel,
  transferPartiesReady,
} from "./rules";

const asset = (rowId: number, assetType: Asset["assetType"]): Asset =>
  ({ rowId, assetType, assetName: `a${rowId}` }) as Asset;

describe("transferPartiesLabel", () => {
  it("출금 → 입금", () => {
    expect(transferPartiesLabel("QA예금", "QA적금")).toBe("QA예금 → QA적금");
  });

  it("이름이 없으면 자리를 비우지 않고 - 로 채운다 — 화살표가 사라지면 이체로 안 보인다", () => {
    expect(transferPartiesLabel(null, "QA적금")).toBe("- → QA적금");
    expect(transferPartiesLabel("QA예금", undefined)).toBe("QA예금 → -");
  });
});

describe("transferEligible", () => {
  it("카드는 양쪽 다 뺀다 — 체크카드는 잔액이 없고, 신용카드는 자동결제가 맡는다", () => {
    const all = [
      asset(1, "BANK_ACCOUNT"),
      asset(2, "CHECK_CARD"),
      asset(3, "CREDIT_CARD"),
      asset(4, "SAVINGS"),
      asset(5, "LOAN"),
    ];
    expect(transferEligible(all).map((a) => a.rowId)).toEqual([1, 4, 5]);
  });
});

describe("isLoanTarget", () => {
  it("받는 자산이 대출일 때만 참", () => {
    const all = [asset(1, "BANK_ACCOUNT"), asset(2, "LOAN")];
    expect(isLoanTarget(all, 2)).toBe(true);
    expect(isLoanTarget(all, 1)).toBe(false);
    expect(isLoanTarget(all, null)).toBe(false);
  });
});

describe("transferPartiesReady", () => {
  it("양쪽이 있고 서로 달라야 한다", () => {
    expect(transferPartiesReady(1, 2)).toBe(true);
    expect(transferPartiesReady(1, 1)).toBe(false);
    expect(transferPartiesReady(null, 2)).toBe(false);
    expect(transferPartiesReady(1, null)).toBe(false);
  });
});
