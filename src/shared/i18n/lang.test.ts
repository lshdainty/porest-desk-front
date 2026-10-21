// 문서 언어(html lang)는 화면 언어를 따른다 — I-01 결과 확인 고치기 W1(WCAG 3.1.1)
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "./config";

afterEach(async () => {
  await i18n.changeLanguage("ko");
});

describe("html lang", () => {
  it("언어를 바꾸면 documentElement.lang 이 따라간다", async () => {
    await i18n.changeLanguage("en");
    expect(document.documentElement.lang).toBe("en");
    await i18n.changeLanguage("ko");
    expect(document.documentElement.lang).toBe("ko");
  });
});
