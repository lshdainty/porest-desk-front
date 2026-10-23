import { describe, expect, it } from "vitest";

import { screenFloor, screenTitleKey } from "./shell";

// 폰 화면 바탕(02-005 C) — 카드 화면 · 띠 화면 · 흰 화면
describe("screenFloor", () => {
  it.each([
    ["/desk", "bands"],
    ["/desk/asset", "bands"],
    ["/desk/stats", "bands"],
    ["/desk/budget", "bands"],
    ["/desk/expense", "white"],
    ["/desk/calendar", "strip"],
    ["/desk/more", "bands"],
    ["/desk/search", "strip"],
  ])("%s → %s", (path, floor) => {
    expect(screenFloor(path)).toBe(floor);
  });
  it("card-benefit 는 /desk/card 아래가 아니다", () => {
    expect(screenFloor("/desk/card-benefit")).toBe("strip");
  });
  it("옛 카드 상세 길(/desk/card/:id)은 띠 화면이 아니다 — 걷었다", () => {
    expect(screenFloor("/desk/card/12")).toBe("strip");
  });
});

describe("screenTitleKey", () => {
  it("가계부 묶음은 모두 가계부다", () => {
    expect(screenTitleKey("/desk/stats")).toBe("expense");
  });
});
