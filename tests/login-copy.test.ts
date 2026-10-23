// 로그인 화면 문구 — "SSO" 대신 "그루 계정"(Q12 12B, I-05 75). 사명은 영어 문구에서도 한글이다.
// 설명서(desk-guide)와 한 벌이라 글자를 리터럴로 잠근다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rows = readFileSync(
  path.join(__dirname, "../i18n/translations.csv"),
  "utf8",
)
  .split("\n")
  .filter((l) => l.startsWith("login,"));

// 값에 쉼표가 없는 행만 있다(필드 4개)
const row = (key: string) => {
  const line = rows.find((l) => l.startsWith(`login,${key},`));
  if (!line) throw new Error(`login,${key} 없음`);
  const [, , ko, en] = line.split(",");
  return { ko, en };
};

describe("로그인 문구(75)", () => {
  it("ko · en 모든 login 문구에 SSO 가 없다", () => {
    for (const line of rows) {
      const [, , ko, en] = line.split(",");
      expect(ko).not.toMatch(/SSO/i);
      expect(en).not.toMatch(/SSO/i);
    }
  });

  it("부제 · 버튼 글이 결정 12B 그대로다", () => {
    expect(row("sso.description")).toEqual({
      ko: "그루 계정으로 로그인해주세요.",
      en: "Sign in with your 그루 account.",
    });
    expect(row("sso.login")).toEqual({
      ko: "그루 계정으로 로그인",
      en: "Sign in with 그루",
    });
  });
});
