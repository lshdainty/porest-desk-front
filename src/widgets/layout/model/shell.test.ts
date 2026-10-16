import { describe, expect, it } from "vitest";

import { screenFloor } from "./shell";

// 폰 화면 바탕(02-005 C) — 카드 화면 · 띠 화면 · 흰 화면
describe("screenFloor", () => {
  it.each([
    ["/desk", "card"],
    ["/desk/asset", "card"],
    ["/desk/stats", "card"],
    ["/desk/budget", "card"],
    ["/desk/card/12", "card"],
    ["/desk/expense", "white"],
    ["/desk/calendar", "strip"],
    ["/desk/more", "strip"],
    ["/desk/search", "strip"],
  ])("%s → %s", (path, floor) => {
    expect(screenFloor(path)).toBe(floor);
  });
  it("card-benefit 는 /desk/card 아래가 아니다", () => {
    expect(screenFloor("/desk/card-benefit")).toBe("strip");
  });
});
