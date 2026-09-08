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
