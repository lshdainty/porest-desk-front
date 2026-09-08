import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 한국어 문구의 띄어쓰기 규범을 CSV 한 곳에서 지킨다.
 *
 * QA #128 이 메모의 `제목을 입력해주세요` 를 집었는데, 그때 세어 보니 같은 자리가
 * 16 곳이었고 이미 **25 곳은 `~해 주세요`** 로 쓰고 있었다. 규범이 없어서 갈린 게
 * 아니라, 규범을 적어 둔 자리가 없어서 새로 쓰는 문구마다 반반으로 갈렸다.
 *
 * 보조용언 '주다' 는 붙여 써도 맞춤법에 어긋나지 않는다(제47항 허용). 여기서 하나로
 * 모으는 이유는 옳고 그름이 아니라 **한 화면 안에서 글자가 갈리지 않게** 하려는 것이다
 * — 같은 폼의 두 칸이 `입력해 주세요` 와 `입력해주세요` 로 나오면 읽는 사람이 먼저 안다.
 *
 * 번역 원본은 CSV 하나다(`src/locales/**` 는 생성물). 그래서 여기만 본다.
 */
const CSV = "i18n/translations.csv";

/** 붙여 쓴 보조용언 — 왼쪽을 오른쪽으로 고친다. */
const JOINED_AUXILIARY = /해주세요/;

describe("한국어 문구 띄어쓰기", () => {
  it("보조용언 '주다' 는 띄어 쓴다 — `해주세요` 가 아니라 `해 주세요`", () => {
    const lines = readFileSync(CSV, "utf-8").split("\n");
    const offenders = lines
      .map((line, i) => ({ line, no: i + 1 }))
      .filter(({ line }) => JOINED_AUXILIARY.test(line))
      .map(({ line, no }) => `${CSV}:${no}  ${line.slice(0, 90)}`);

    expect(offenders).toEqual([]);
  });
});
