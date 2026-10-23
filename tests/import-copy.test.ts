import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 가져오기 실패 사유 문구는 앱(`importFailReason*` arb)과 글자 그대로 같다 — 한쪽만 고치면 같은 사유가
 * 웹 · 앱에서 다르게 읽힌다. Writing: "실패" 를 명사로 끝내지 않는다("못 가져왔어요").
 */
const rows = new Map<string, string>();
for (const line of readFileSync("i18n/translations.csv", "utf-8").split("\n")) {
  const m = line.match(/^export,(import\.failReason\.[A-Za-z]+),([^,]*),/);
  if (m) rows.set(m[1]!, m[2]!);
}

describe("가져오기 실패 사유 문구", () => {
  it("앱과 같은 글 — 수입 · 지출 구분", () => {
    expect(rows.get("import.failReason.type")).toBe(
      "수입 · 지출 구분을 읽을 수 없어요",
    );
  });
  it("앱과 같은 글 — 알 수 없는 이유", () => {
    expect(rows.get("import.failReason.unknown")).toBe(
      "알 수 없는 이유로 못 가져왔어요",
    );
  });
  it("사유 문구가 '실패' 명사로 끝나지 않는다", () => {
    for (const [k, v] of rows) expect(v, k).not.toMatch(/실패$/);
  });
});
