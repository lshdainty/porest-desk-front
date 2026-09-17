import { i18n } from "@/shared/i18n/config";

/**
 * 서버가 문구 대신 **에러 코드**를 돌려준 응답인가.
 *
 * 백엔드는 에러마다 문구 키를 들고 있는데, 그 키가 `messages*.properties` 에 없으면
 * 코드 문자열(`CAL_012`)이 그대로 `message` 로 내려온다. 그걸 그대로 띄우면 캘린더
 * 초대 코드 오류 토스트가 `초대 코드를 확인해 주세요 / CAL_012` 로 보였다(QA #127).
 * 이건 그 화면 하나의 문제가 아니라 **모든 토스트가 같은 자리를 지난다** — 서버에
 * 키가 빠질 때마다 다른 화면에서 같은 일이 난다. 그래서 여기서 한 번에 거른다.
 *
 * 판정은 모양으로 한다: 대문자·숫자 낱말이 밑줄로 이어진 한 덩어리
 * (`CAL_012` · `COMMON_404` · `SUBS_001`). 사람이 읽을 문구에는 공백이나 조사가 반드시
 * 섞이므로 오탐이 나지 않는다.
 */
export const RAW_ERROR_CODE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

/**
 * 토스트에 띄울 문구.
 *
 * 코드가 새어 나오면 사용자에겐 일반 문구를, 개발자에겐 콘솔을 준다 — 화면에서 코드를
 * 지우기만 하면 무엇이 터졌는지 알 길이 사라진다.
 */
export function userFacingMessage(raw: unknown, url?: string): string {
  const fallback = i18n.t("common:apiError");
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const message = raw.trim();
  if (!RAW_ERROR_CODE.test(message)) return raw;
  console.error(`[api] ${message} — ${url ?? "(unknown url)"}`);
  return fallback;
}

/**
 * 서버가 보낸 문장을 꺼낸다.
 *
 * <p>axios 는 실패를 `Error` 로 감싸는데 그 `message` 는 <b>"Request failed with status
 * code 400"</b> 이다. 그대로 화면에 붙이면 사용자는 영문 상태 코드를 읽게 된다 —
 * 정작 "인증 코드가 올바르지 않아요" 는 응답 본문에 들어 있다(2026-09-17 QA).
 *
 * <p>꺼낸 값도 {@link userFacingMessage} 를 거친다 — 서버에 문구 키가 빠지면 코드
 * 문자열(`AUTH_021`)이 그대로 내려오는데 그건 사용자에게 보여 줄 말이 아니다.
 *
 * @param fallback 서버가 아무 문장도 안 줬을 때 쓸 화면 문구
 */
export function serverErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: unknown } } })
    ?.response?.data;
  const raw = typeof data?.message === "string" ? data.message.trim() : "";
  if (!raw) return fallback;
  const shown = userFacingMessage(raw);
  // userFacingMessage 는 코드가 새면 공용 문구로 바꾼다 — 그 자리에는 이 화면의
  // 문구를 쓰는 편이 낫다(무엇을 하다 실패했는지가 남는다).
  return shown === i18n.t("common:apiError") ? fallback : shown;
}
