// 할 일 줄 체크의 누르는 영역은 px 44 다(I-29) — rem(size-11)이면 글자 200% 에서 88 이 된다. 실제 렌더 값은 결과표(200% 실측)에 있다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

it("체크 누르는 영역은 before:size-[44px] 다", () => {
  const src = readFileSync(path.join(__dirname, "TodoRow.tsx"), "utf8");
  expect(src).toContain("before:size-[44px]");
  expect(src).not.toMatch(/before:size-11\b/);
});
