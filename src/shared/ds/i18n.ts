import i18next from "i18next";
import { useTranslation } from "react-i18next";

import koDs from "@/locales/ko/ds.json";

/*
 * ds 부품의 기본 글 — 로케일 문구(namespace `ds`, 키 `{부품}.{자리}`)와 Intl 포맷터.
 * 호출부가 prop 으로 준 글이 늘 이긴다(그 prop 의 기본값으로 이 글을 쓴다). 개발자 경고(console)는 번역하지 않는다.
 *
 * 앱이 i18n 을 초기화하지 않은 곳(테스트 · 카탈로그 밖 렌더)에서는 한국어 원본(ko/ds.json)으로 떨어진다 —
 * 부품이 키 이름을 그대로 화면에 내지 않게.
 */

type Vars = Record<string, string | number>;

const fill = (text: string, vars?: Vars) =>
  vars
    ? text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ""))
    : text;

/** 지금 언어 — 초기화 전이면 한국어 */
export const dsLanguage = () => i18next.resolvedLanguage ?? "ko";

/** 렌더 밖(상수 · 헬퍼)에서 쓰는 글 — 언어가 바뀌면 다음에 부를 때 따라간다. 렌더 안에서는 `useDsText` 를 쓴다. */
export function dsText(key: string, vars?: Vars): string {
  if (i18next.isInitialized && i18next.exists(key, { ns: "ds" }))
    return i18next.t(key, { ns: "ds", ...vars }) as string;
  return fill((koDs as Record<string, string>)[key] ?? key, vars);
}

/** 렌더 안에서 쓰는 글 — 언어가 바뀌면 다시 그린다 */
export function useDsText() {
  // 언어 변경 구독(react-i18next) — 값은 dsText 가 읽는다
  useTranslation("ds");
  return dsText;
}

/** 숫자 · 날짜 포맷터의 로케일 — ko-KR / en-US */
export const dsLocale = () =>
  dsLanguage().startsWith("en") ? "en-US" : "ko-KR";

/** 돈 — 한국어 "1,234,567원", 영어 "₩1,234,567"(International Design v106). 빼기 기호는 부르는 쪽이 붙인다 */
export const dsMoney = (n: number) => {
  const v = Math.round(n);
  return dsLanguage().startsWith("en")
    ? `₩${v.toLocaleString("en-US")}`
    : `${v.toLocaleString("ko-KR")}원`;
};

/** 숫자를 지금 로케일로 */
export const dsNumber = (n: number, opts?: Intl.NumberFormatOptions) =>
  n.toLocaleString(dsLocale(), opts);
