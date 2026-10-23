// 옛 카드 혜택 화면(/desk/card/:assetRowId)은 들어오는 길이 없어 걷었다(I-05 3 · 사용자 "삭제할 것").
// 라우트 표에 다시 들어오지 않게 잠근다. /desk/card-benefit(카드 혜택 라이브러리)은 남는다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routes = readFileSync(
  path.join(__dirname, "../src/app/router/routes.tsx"),
  "utf8",
);

describe("라우트 표", () => {
  it("/desk/card/:id 라우트와 카드 상세 화면 가져오기가 없다", () => {
    expect(routes).not.toMatch(/path="\/desk\/card\/:/);
    expect(routes).not.toContain("CardDetailPage");
  });

  it("카드 혜택 라이브러리 라우트는 남아 있다", () => {
    expect(routes).toContain('path="/desk/card-benefit"');
  });
});
