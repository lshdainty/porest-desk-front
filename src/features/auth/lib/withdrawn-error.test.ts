import { describe, it, expect } from "vitest";
import { isWithdrawnAccountError } from "./withdrawn-error";

describe("isWithdrawnAccountError", () => {
  it("USER_021 이면 해지 계정으로 본다", () => {
    expect(
      isWithdrawnAccountError({ response: { data: { code: "USER_021" } } }),
    ).toBe(true);
  });

  it("다른 코드는 보통의 로그인 실패다 — 안내 화면으로 보내면 안 된다", () => {
    expect(
      isWithdrawnAccountError({ response: { data: { code: "AUTH_001" } } }),
    ).toBe(false);
  });

  // 문구가 아니라 코드로 판정한다 — 문구는 로케일마다 다르고 서버가 고치면 따라 바뀐다.
  it("문구에 해지가 들어 있어도 코드가 없으면 아니다", () => {
    expect(
      isWithdrawnAccountError({
        response: { data: { message: "이용을 해지한 계정이에요" } },
      }),
    ).toBe(false);
  });

  it("응답 없는 오류(네트워크 끊김 등)도 아니다", () => {
    expect(isWithdrawnAccountError(new Error("Network Error"))).toBe(false);
    expect(isWithdrawnAccountError(null)).toBe(false);
    expect(isWithdrawnAccountError(undefined)).toBe(false);
  });
});
