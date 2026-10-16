// ds 부품의 기본 글 — 한국어(초기화 전 · 기본)와 영어(Intl 형식 포함). 부품 안에 한국어 상수를 두지 않는다(01-043).
import i18next from "i18next";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import enDs from "@/locales/en/ds.json";
import koDs from "@/locales/ko/ds.json";

import {
  datePickerLabels,
  formatDateValue,
  formatRangeValue,
} from "./date-picker";
import { dsMoney, dsText } from "./i18n";
import { formatTimeValue, timePickerLabels } from "./time-picker";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const TODAY = d(2026, 10, 16);

describe("ds 글 — 한국어(초기화 전)", () => {
  it("로케일 문구가 없는 환경에서도 한국어 원본이 나온다", () => {
    expect(dsText("common.close")).toBe("닫기");
    expect(dsText("pagination.status", { current: 2, total: 9 })).toBe(
      "2페이지, 전체 9페이지",
    );
  });
  it("돈 · 시각 · 날짜", () => {
    expect(dsMoney(1234567)).toBe("1,234,567원");
    expect(formatTimeValue({ hour: 15, minute: 0 })).toBe("오후 3:00");
    expect(formatDateValue(d(2026, 10, 15), TODAY)).toBe("10월 15일 (목)");
    expect(datePickerLabels().weekdays[0]).toBe("일");
  });
});

describe("ds 글 — 영어", () => {
  beforeAll(async () => {
    await i18next.init({
      lng: "en",
      fallbackLng: "ko",
      ns: ["ds"],
      defaultNS: "ds",
      keySeparator: false,
      interpolation: { escapeValue: false },
      resources: { en: { ds: enDs }, ko: { ds: koDs } },
    });
  });
  afterAll(async () => {
    await i18next.changeLanguage("ko");
  });

  it("접근성 이름 · 보이는 글이 영어다", () => {
    expect(dsText("common.close")).toBe("Close");
    expect(dsText("bottomNavigation.label")).toBe("Main menu");
    expect(dsText("pagination.status", { current: 2, total: 9 })).toBe(
      "Page 2 of 9",
    );
    expect(timePickerLabels().am).toBe("AM");
  });
  it("돈은 ₩1,234,567, 시각은 3:00 PM, 날짜는 Thu, Oct 15", () => {
    expect(dsMoney(1234567)).toBe("₩1,234,567");
    expect(formatTimeValue({ hour: 15, minute: 0 })).toBe("3:00 PM");
    expect(formatDateValue(d(2026, 10, 15), TODAY)).toBe("Thu, Oct 15");
    expect(formatDateValue(d(2027, 1, 3), TODAY)).toBe("Sun, Jan 3, 2027");
  });
  it("기간은 en dash 로 잇는다", () => {
    expect(
      formatRangeValue({ start: d(2026, 10, 1), end: d(2026, 10, 31) }, TODAY),
    ).toBe("Oct 1–Oct 31");
  });
  it("요일 · 달 이름이 영어다", () => {
    const labels = datePickerLabels();
    expect(labels.weekdaysLong[0]).toBe("Sunday");
    expect(labels.month(2026, 10)).toBe("October 2026");
    expect(labels.presetNames.thisWeek).toBe("This week");
  });
});
