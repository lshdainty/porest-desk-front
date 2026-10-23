// AltStore 아이콘(public/app-icon.png)은 앱 iOS 1024 아이콘과 같은 그림이다(I-05 84, 로고 결정 1).
// 앱 CI 가 iconURL 로 이 파일을 가져간다 — 파일 이름 · 주소는 그대로. iOS 1024 는 알파 없는 RGB 정사각이다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const png = readFileSync(path.join(__dirname, "../public/app-icon.png"));

describe("public/app-icon.png", () => {
  it("PNG 1024 × 1024 · 알파 없는 RGB(색 형식 2)다", () => {
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1024);
    expect(png.readUInt32BE(20)).toBe(1024);
    expect(png[24]).toBe(8); // 비트 깊이
    expect(png[25]).toBe(2); // 2 = RGB(알파 없음)
  });
});
