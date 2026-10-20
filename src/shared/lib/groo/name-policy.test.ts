import { describe, it, expect } from "vitest";
import { nameIssue } from "./name-policy";

describe("nameIssue", () => {
  it("빈 이름·공백만은 required", () => {
    expect(nameIssue("", 12)).toBe("required");
    expect(nameIssue("   ", 12)).toBe("required");
  });

  it("상한을 넘기면 tooLong — 경계는 통과", () => {
    expect(nameIssue("가".repeat(12), 12)).toBeNull();
    expect(nameIssue("가".repeat(13), 12)).toBe("tooLong");
  });

  it("앞뒤 공백은 길이에서 뺀다", () => {
    expect(nameIssue(`  ${"가".repeat(12)}  `, 12)).toBeNull();
  });

  it("기존 이름과 같으면 duplicate — QA 가 두 번 만들 수 있던 자리", () => {
    expect(nameIssue("QA 주거래", 30, ["QA 주거래", "월급"])).toBe("duplicate");
  });

  it("자기 자신을 뺀 목록을 받으므로 수정 저장이 막히지 않는다", () => {
    expect(nameIssue("QA 주거래", 30, ["월급"])).toBeNull();
  });

  it("중복 판정은 trim 후 완전 일치 — 대소문자는 서버에 맡긴다", () => {
    expect(nameIssue("qa", 12, ["QA"])).toBeNull();
    expect(nameIssue("qa", 12, ["  qa "])).toBe("duplicate");
  });

  it("길이가 중복보다 먼저 — 13자짜리 중복은 tooLong 을 낸다", () => {
    const long = "가".repeat(13);
    expect(nameIssue(long, 12, [long])).toBe("tooLong");
  });
});
