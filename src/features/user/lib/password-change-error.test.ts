// 비밀번호 변경 실패 문구는 **desk 가 정한다** (QA #128).
//
// 종전엔 전역 인터셉터가 응답 body 의 `message` 를 그대로 띄웠고, 그 문장은 desk 가
// 아니라 SSO 가 쓴 것이었다 — `현재 비밀번호가 올바르지 않습니다`. desk 는 `~어요` 로
// 말하므로 한 문장 때문에 말하는 사람이 바뀐 것처럼 읽혔다.
//
// 그래서 두 방향을 잠근다.
//   ① 요청이 `silent` 로 나간다 — 전역 토스트를 안 타야 서버 문장이 화면에 못 닿는다
//   ② 실패 코드를 desk 문구 **키**로 옮긴다 — 문구가 아니라 코드로 판정한다
//      (문구는 SSO 배포·`Accept-Language` 마다 바뀐다)
import { describe, expect, it, vi } from "vitest";
import {
  PASSWORD_CHANGE_FAILED_CODE,
  passwordChangeErrorKey,
} from "./password-change-error";

const patch = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/shared/api", () => ({
  apiClient: {
    patch: (...args: unknown[]) => {
      patch.calls.push(args);
      return Promise.resolve({ success: true });
    },
  },
}));

/** desk-back 이 실제로 돌려주는 모양 — `code` + relay 된 SSO `message`. */
const axiosError = (code: string | undefined, message: string) => ({
  message: "Request failed with status code 400",
  response: { status: 400, data: { success: false, code, message } },
});

describe("실패 코드 → desk 문구 키 (QA #128)", () => {
  it("현재 비밀번호가 틀리면 desk 문구 키가 나온다 — SSO 문장이 아니라", () => {
    const err = axiosError(
      PASSWORD_CHANGE_FAILED_CODE,
      "현재 비밀번호가 올바르지 않습니다",
    );

    expect(passwordChangeErrorKey(err)).toBe("currentPasswordInvalid");
  });

  it("서버 문장을 보고 판정하지 않는다 — 같은 코드면 문구가 뭐든 같은 키다", () => {
    // SSO 가 문구를 고치거나 영어로 내려도(Accept-Language) 판정은 안 흔들린다.
    expect(
      passwordChangeErrorKey(
        axiosError(
          PASSWORD_CHANGE_FAILED_CODE,
          "Current password is incorrect",
        ),
      ),
    ).toBe("currentPasswordInvalid");
  });

  it("모르는 코드·코드 없음은 일반 실패 문구로 떨어진다", () => {
    expect(passwordChangeErrorKey(axiosError("SSO_001", "SSO 장애"))).toBe(
      "passwordChangeError",
    );
    expect(passwordChangeErrorKey(axiosError(undefined, "알 수 없음"))).toBe(
      "passwordChangeError",
    );
    // 응답 자체가 없는 경우(네트워크 끊김)도 같은 자리로 간다.
    expect(passwordChangeErrorKey(new Error("Network Error"))).toBe(
      "passwordChangeError",
    );
    expect(passwordChangeErrorKey(undefined)).toBe("passwordChangeError");
  });
});

describe("요청이 전역 토스트를 안 탄다 (QA #128)", () => {
  it("비밀번호 변경은 silent 로 나간다 — 안 그러면 SSO 문장이 그대로 토스트가 된다", async () => {
    patch.calls.length = 0;
    const { userApi } = await import("../api/userApi");

    await userApi.changePassword({
      currentPassword: "old-one!",
      newPassword: "new-one!",
      confirmPassword: "new-one!",
    });

    expect(patch.calls).toHaveLength(1);
    expect(patch.calls[0]?.[0]).toBe("/v1/users/me/password");
    expect(patch.calls[0]?.[2]).toMatchObject({ silent: true });
  });
});
