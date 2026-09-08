// 서버가 문구 대신 에러 코드를 흘릴 때 토스트가 무엇을 띄우는지(QA #127).
// 캘린더 초대 코드 오류가 `CAL_012` 로 보인 게 그 화면이었지만, 걸러 내는 자리는
// 전역 에러 처리 한 곳이라 그 화면만의 계약이 아니다.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { userFacingMessage } from "./error-message";
import { i18n } from "@/shared/i18n/config";

const fallback = () => i18n.t("common:apiError");

describe("userFacingMessage", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("에러 코드는 사용자에게 안 보이고 일반 문구로 바뀐다", () => {
    expect(userFacingMessage("CAL_012")).toBe(fallback());
    expect(userFacingMessage("SUBS_001")).toBe(fallback());
    expect(userFacingMessage("COMMON_404")).toBe(fallback());
  });

  it("가려진 코드는 콘솔에 남는다 — 화면에서 지우기만 하면 원인을 못 찾는다", () => {
    userFacingMessage("CAL_012", "/v1/calendar/calendars/join");
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("CAL_012"),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("/v1/calendar/calendars/join"),
    );
  });

  it("사람이 읽는 문구는 그대로 지나간다", () => {
    // 오탐이 나면 서버가 공들여 쓴 안내가 전부 "문제가 생겼어요" 로 뭉개진다.
    expect(userFacingMessage("초대 코드를 확인해 주세요")).toBe(
      "초대 코드를 확인해 주세요",
    );
    expect(userFacingMessage("Something went wrong")).toBe(
      "Something went wrong",
    );
    // 밑줄 없는 대문자 낱말은 코드가 아니다(약어로 시작하는 영문 문구).
    expect(userFacingMessage("OK")).toBe("OK");
    expect(userFacingMessage("SMS 원문을 다시 확인해 주세요")).toBe(
      "SMS 원문을 다시 확인해 주세요",
    );
  });

  it("문구가 없으면 일반 문구를 쓴다", () => {
    expect(userFacingMessage(undefined)).toBe(fallback());
    expect(userFacingMessage(null)).toBe(fallback());
    expect(userFacingMessage("")).toBe(fallback());
    expect(userFacingMessage("   ")).toBe(fallback());
    expect(userFacingMessage(500)).toBe(fallback());
  });

  it("일반 문구는 키 이름이 아니다 — CSV 에 실제로 있어야 한다", () => {
    expect(fallback()).not.toBe("common:apiError");
    expect(fallback()).not.toBe("apiError");
  });
});
