// 가계부 보기 모드(달력/목록)는 기기에 남는다 — 새로고침·화면 이동마다 달력으로
// 되돌아갔다(QA #97).
//
// 저장소가 막힌 브라우저(사파리 프라이빗 모드, 사이트 데이터 차단)에서는
// `localStorage` 를 **건드리는 것만으로** 예외가 난다. 그때도 화면은 돌아야 한다.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readViewMode, saveViewMode } from "./view-mode";

const KEY = "pd-expense-view";
const real = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

/** 접근 자체가 던지는 저장소로 갈아 끼운다 (getItem 만 던지는 게 아니다). */
function blockStorage() {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("The operation is insecure.");
    },
  });
}

beforeEach(() => {
  if (real) Object.defineProperty(globalThis, "localStorage", real);
  localStorage.clear();
});

afterEach(() => {
  if (real) Object.defineProperty(globalThis, "localStorage", real);
  localStorage.clear();
});

describe("가계부 보기 모드 기억", () => {
  it("고른 적 없으면 달력 — 종전 기본값 그대로", () => {
    expect(readViewMode()).toBe("calendar");
  });

  it("목록으로 바꾸면 다음에도 목록이다", () => {
    saveViewMode("list");

    expect(readViewMode()).toBe("list");
  });

  it("달력으로 되돌리면 달력이다", () => {
    saveViewMode("list");
    saveViewMode("calendar");

    expect(readViewMode()).toBe("calendar");
  });

  it("모르는 값이 들어 있으면 달력 — 손으로 고친 값·옛 키를 믿지 않는다", () => {
    localStorage.setItem(KEY, "grid");

    expect(readViewMode()).toBe("calendar");
  });
});

describe("저장소가 막힌 브라우저", () => {
  it("읽기가 던져도 달력으로 돈다", () => {
    blockStorage();

    expect(() => readViewMode()).not.toThrow();
    expect(readViewMode()).toBe("calendar");
  });

  it("쓰기가 던져도 화면이 멈추지 않는다", () => {
    blockStorage();

    expect(() => saveViewMode("list")).not.toThrow();
  });
});
