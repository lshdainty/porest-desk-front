import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 한국어 문구의 띄어쓰기 규범을 CSV 한 곳에서 지킨다.
 *
 * 디자인 시스템 Writing(DESIGN.md "띄어쓰기")은 보조 용언을 **붙인다** — `해주세요` · `해보세요`.
 * 예전엔 `해 주세요` 로 모으는 규범이었으나(QA #128, 사용자 결정이 아니었다) 스펙이 붙임으로 정해
 * 2026-10-23 문구 PR 에서 뒤집었다. 목적은 그대로다 — 한 화면 안에서 글자가 갈리지 않게 한다.
 *
 * 번역 원본은 CSV 하나다(`src/locales/**` 는 생성물). 그래서 여기만 본다.
 */
const CSV = "i18n/translations.csv";

/** 띄어 쓴 보조용언 — 한글 바로 뒤에 띄운 `주세요` · `보세요` · `주시` · `줘요`. */
const SPACED_AUXILIARY = /[가-힣] (주세요|보세요|주시|줘요)/;

describe("한국어 문구 띄어쓰기", () => {
  it("보조용언은 붙여 쓴다 — `해 주세요` 가 아니라 `해주세요`", () => {
    const lines = readFileSync(CSV, "utf-8").split("\n");
    const offenders = lines
      .map((line, i) => ({ line, no: i + 1 }))
      .filter(({ line }) => SPACED_AUXILIARY.test(line))
      .map(({ line, no }) => `${CSV}:${no}  ${line.slice(0, 90)}`);

    expect(offenders).toEqual([]);
  });
});
