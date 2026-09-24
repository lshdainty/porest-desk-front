import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 하위 카테고리 편집의 상위 칸 안내는 **웹·앱이 같은 문장**을 쓰고, 서버 거절 문구
 * (EXP_015 "하위 카테고리는 최상위로 올릴 수 없어요. 새 최상위를 만들어 거래를 옮겨 주세요")
 * 와 같은 길을 말한다(2026-09-24 사용자 결정).
 *
 * 전에는 셋이 다 달랐다. 웹 "다른 상위 카테고리로…", 앱 "다른 상위로…" 였고, 둘 다
 * "연결된 거래를 옮긴 뒤 새로 만들어" 라고 순서를 거꾸로 말했다. 거래를 옮길 새 최상위가
 * 먼저 있어야 한다. 앱은 `category_move_hint_copy_test.dart` 에서 같은 전문을 잠근다 —
 * 한쪽만 바뀌면 그쪽 테스트가 깨진다.
 *
 * 번역 원본은 CSV 하나다(`src/locales/**` 는 생성물).
 */
const LINE =
  'category,parentMoveHint,다른 상위 카테고리로 이동할 수 있어요. 최상위로 올리려면 새 최상위를 만들어 거래를 옮겨 주세요.,"You can move it under a different parent. To make it top-level, create a new top-level category and move the transactions."';

describe("카테고리 상위 이동 안내", () => {
  it("웹·앱·서버가 같은 길을 말한다 — 전문 그대로", () => {
    const line = readFileSync("i18n/translations.csv", "utf-8")
      .split("\n")
      .find((l) => l.startsWith("category,parentMoveHint,"));
    expect(line).toBe(LINE);
  });
});
