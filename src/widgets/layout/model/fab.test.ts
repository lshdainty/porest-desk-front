// 모바일 하단 `+` 는 **화면마다 다른 것을 연다.**
//
// 캘린더에서는 일정 폼이, 나머지에서는 거래 추가 시트가 뜬다. 그런데 접근성 라벨은
// 탭바 안에 `t("addTransaction")` 으로 굳어 있어 캘린더에서도 "거래 추가" 라고 읽혔다
// — 낭독기와 자동화가 속는다(QA #159).
//
// 여는 것(`target`)과 부르는 이름(`labelKey`)을 **한 객체에서 함께** 고르는 게 이
// 수정의 전부다. 그래서 여기서 잠그는 것도 그 짝이다 — 화면이 하나 늘 때 동작만
// 갈리고 이름이 따라오지 않으면 이 표가 깨진다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { fabFor } from "./fab";

/**
 * `+` 가 실제로 보이는 화면 전부.
 *
 * money 모드(가계부·자산·통계·예산)는 `+` 자리에 자산 탭이 서고, 풀스크린 화면
 * (메모·할 일·더치페이·카드 혜택·증권·설정·알림)은 탭바 자체가 없다 —
 * `AppLayout` 의 `MONEY_PATHS` · `FULLSCREEN_PATHS` 를 뺀 나머지가 여기다.
 */
const SCREENS: [path: string, target: string, labelKey: string][] = [
  ["/desk", "tx", "layout:addTransaction"],
  ["/desk/more", "tx", "layout:addTransaction"],
  ["/desk/search", "tx", "layout:addTransaction"],
  ["/desk/card/12", "tx", "layout:addTransaction"],
  ["/desk/calendar", "event", "calendar:addEvent"],
];

describe("모바일 + 가 여는 것과 부르는 이름", () => {
  it.each(SCREENS)("%s → %s", (path, target, labelKey) => {
    expect(fabFor(path)).toEqual({ target, labelKey });
  });

  it("캘린더 하위 경로도 일정 폼이다 — 접두사로 본다", () => {
    expect(fabFor("/desk/calendar/2026-09").target).toBe("event");
  });
});

/** i18n 키 누락은 타입이 못 잡는다 — 문자열이라 통과하고 화면에 키가 그대로 보인다. */
const lookup = (locale: string, labelKey: string): unknown => {
  const [ns, key] = labelKey.split(":");
  const json = JSON.parse(
    readFileSync(join(cwd(), `src/locales/${locale}/${ns}.json`), "utf8"),
  ) as Record<string, unknown>;
  return json[key!];
};

describe("라벨 키가 실제로 있다", () => {
  const keys = [...new Set(SCREENS.map(([, , labelKey]) => labelKey))];

  it.each(keys)("%s — ko · en 둘 다", (labelKey) => {
    expect(lookup("ko", labelKey)).toEqual(expect.any(String));
    expect(lookup("en", labelKey)).toEqual(expect.any(String));
  });
});
