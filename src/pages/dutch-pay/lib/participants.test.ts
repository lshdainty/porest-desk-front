// 친구 목록에 있는 이름을 참여자로 치면 아무 반응 없이 무시되고, 인원수가 모자란 채
// 정산이 저장됐다(QA #42, 높음). 같은 자리가 "같은 이름 두 번" 도 삼켰다(QA #39).
// 여기서 고정하는 건 네 갈래가 각각 살아 있다는 것과, 인원수가 바뀌어도 분배 합이
// 총액과 어긋나지 않는다는 것(QA #43)이다.
import { describe, expect, it } from "vitest";
import { resolveAddParticipant, splitEqually } from "./participants";

const ME = "나";

describe("resolveAddParticipant", () => {
  it("친구 목록에 있고 아직 안 고른 이름은 그 자리를 켠다 — #42 의 회귀선", () => {
    // 예전 코드는 여기서 아무것도 하지 않고 입력만 지웠다.
    expect(resolveAddParticipant("A", ["A", "B"], new Set([ME]), ME)).toEqual({
      kind: "selected",
      name: "A",
    });
  });

  it("이미 참여자인 이름은 안내로 돌린다 — 조용히 토글되지 않는다(#39)", () => {
    expect(
      resolveAddParticipant("철수", ["철수"], new Set([ME, "철수"]), ME),
    ).toEqual({ kind: "already", name: "철수" });
  });

  it("앞뒤 공백도 같은 이름으로 본다", () => {
    expect(
      resolveAddParticipant(" 철수 ", ["철수"], new Set([ME, "철수"]), ME),
    ).toEqual({ kind: "already", name: "철수" });
  });

  it("처음 보는 이름은 후보에 새로 넣는다", () => {
    expect(resolveAddParticipant("영희", ["철수"], new Set([ME]), ME)).toEqual({
      kind: "added",
      name: "영희",
    });
  });

  it("'나' 는 항상 참여자라 더할 게 없다", () => {
    expect(resolveAddParticipant(ME, [], new Set([ME]), ME)).toEqual({
      kind: "isMe",
    });
  });

  it("빈 입력·공백만은 아무 말 없이 넘긴다", () => {
    expect(resolveAddParticipant("", [], new Set([ME]), ME)).toEqual({
      kind: "empty",
    });
    expect(resolveAddParticipant("   ", [], new Set([ME]), ME)).toEqual({
      kind: "empty",
    });
  });

  it("친구 6명을 차례로 넣으면 6명 모두 참여자가 된다 — QA 가 재현한 흐름", () => {
    const friends = ["A", "B"];
    const picked = new Set([ME]);
    const extras: string[] = [];
    for (const n of ["A", "B", "C", "D", "E", "F"]) {
      const candidates = [...friends, ...extras];
      const r = resolveAddParticipant(n, candidates, picked, ME);
      if (r.kind === "added") {
        extras.push(r.name);
        picked.add(r.name);
      } else if (r.kind === "selected") {
        picked.add(r.name);
      }
    }
    expect(picked.size).toBe(7); // 나 + 6명
  });
});

describe("splitEqually", () => {
  it("10,000원 3명 → 3,334 · 3,333 · 3,333 (QA #43 회귀 기준)", () => {
    expect(splitEqually(10_000, 3)).toEqual([3334, 3333, 3333]);
  });

  it("나머지는 늘 첫 참여자(나)가 진다", () => {
    expect(splitEqually(1000, 7)).toEqual([148, 142, 142, 142, 142, 142, 142]);
  });

  it("인원이 몇이든 합은 총액과 같다 — #42 로 인원수가 바뀌는 자리다", () => {
    for (let n = 1; n <= 12; n++) {
      const parts = splitEqually(10_000, n);
      expect(parts).toHaveLength(n);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(10_000);
    }
  });

  it("나누어떨어지면 나머지가 없다", () => {
    expect(splitEqually(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it("인원이 0이면 빈 배열 — 0 나누기를 하지 않는다", () => {
    expect(splitEqually(10_000, 0)).toEqual([]);
  });
});
