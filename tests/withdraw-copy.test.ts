import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 해지 문구는 세 레포가 한 벌이다 — 그루 계정 처리방침 §해지 절 제목 · 앱 arb 와 글자 그대로 같아야 한다
 * (I-05 34 · D-2 78). 한쪽만 고치면 해지 화면이 가리키는 문서와 이름이 갈린다.
 */
const CSV = "i18n/translations.csv";

function rows() {
  const out = new Map<string, { ko: string; en: string }>();
  for (const line of readFileSync(CSV, "utf-8").split("\n")) {
    // namespace,key,ko,en — 이 문서는 쉼표 안 따옴표 값을 쓴다
    const cells = [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)]
      .map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"'))
      .slice(0, 4);
    if (cells.length === 4)
      out.set(`${cells[0]},${cells[1]}`, { ko: cells[2], en: cells[3] });
  }
  return out;
}

describe("해지 문구 — 옛 이름 desk 를 쓰지 않는다", () => {
  const all = rows();
  const KEYS = [...all.keys()].filter(
    (k) =>
      k.startsWith("user,withdraw") || k === "settings,account.withdraw.label",
  );

  it("해지 키가 있다", () => {
    expect(KEYS.length).toBeGreaterThan(20);
  });

  it.each(KEYS)("%s 의 ko · en 에 desk 가 없다", (k) => {
    const { ko, en } = all.get(k)!;
    expect(ko).not.toMatch(/desk/i);
    expect(en).not.toMatch(/desk/i);
  });

  it("절 제목은 처리방침과 같은 글 '그루 담다 이용 해지' 다(리터럴)", () => {
    expect(all.get("user,withdraw.title")!.ko).toBe("그루 담다 이용 해지");
    expect(all.get("settings,account.withdraw.label")!.ko).toBe(
      "그루 담다 이용 해지",
    );
  });

  it("영어에서도 사명은 한글이다", () => {
    expect(all.get("user,withdraw.title")!.en).toBe("Stop using 그루 담다");
    expect(all.get("user,withdrawn.body")!.en).toContain("그루 담다");
  });

  it("해지 완료 본문은 '감사했습니다' 를 그대로 둔다(사용자 지정)", () => {
    expect(all.get("user,withdrawn.body")!.ko).toBe(
      "그동안 그루 담다를 써 주셔서 감사했습니다. 남은 데이터는 개인정보 처리방침에 따라 보관 후 파기돼요.",
    );
  });
});
