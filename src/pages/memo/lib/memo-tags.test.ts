// 메모 태그가 하드코딩 7종에서 서버 마스터로 옮겨 간 자리(QA #98).
//
// 두 가지가 같이 걸려 있다.
// (1) 목록의 출처 — 서버가 주는 목록이 SoT 인데, 그것만 쓰면 **태그를 아직 만들지 않은
//     사용자의 select 가 빈다.** 그러면 메모에 태그를 붙일 방법이 없어 설정부터 다녀와야 한다.
// (2) 태그 없음의 표기 — 종전엔 `memo.tag || "개인"` 이라 태그 없는 메모가 '개인' 으로
//     그려졌다. 이제 태그를 지우면 서버가 그 메모의 태그를 실제로 비우므로, 그대로 두면
//     삭제 확인창이 약속한 "태그 없음으로 남아요" 와 화면이 어긋난다.
import { describe, expect, it } from "vitest";
import type { MemoTag } from "@/entities/memo-tag";
import {
  FALLBACK_TAG_NAMES,
  NO_TAG_KEY,
  memoTagKey,
  memoTagOptions,
  tagValueToPayload,
} from "./memo-tags";

const tagOf = (rowId: number, tagName: string): MemoTag => ({
  rowId,
  userRowId: 1,
  tagName,
  color: null,
  createAt: "2026-09-08 00:00:00",
  modifyAt: "2026-09-08 00:00:00",
  usageCount: 0,
});

describe("memoTagOptions", () => {
  it("서버 목록을 그대로 쓴다 — 하드코딩 7종이 섞이지 않는다", () => {
    const options = memoTagOptions(
      [tagOf(1, "회의록"), tagOf(2, "아이디어")],
      [],
    );
    expect(options).toEqual(["회의록", "아이디어"]);
    // 종전 하드코딩이 되살아나면 여기서 잡힌다.
    expect(options).not.toContain("가계부");
  });

  it("마스터에 없는 이름이 메모에 남아 있으면 뒤에 붙인다", () => {
    // 백필 전이거나 다른 클라이언트가 만든 메모. 목록에 없으면 그 메모를 열었을 때
    // select 가 빈칸으로 뜬다.
    const options = memoTagOptions(
      [tagOf(1, "회의록")],
      [{ tag: "출장" }, { tag: "회의록" }, { tag: null }],
    );
    expect(options).toEqual(["회의록", "출장"]);
  });

  it("같은 이름을 두 번 넣지 않는다", () => {
    const options = memoTagOptions(
      [tagOf(1, "회의록")],
      [{ tag: "회의록" }, { tag: "회의록" }],
    );
    expect(options).toEqual(["회의록"]);
  });

  it("서버 목록도 메모도 비면 기본 7종으로 채운다 — select 가 비면 안 된다", () => {
    expect(memoTagOptions([], [])).toEqual([...FALLBACK_TAG_NAMES]);
    expect(memoTagOptions(undefined, [{ tag: null }])).toEqual([
      ...FALLBACK_TAG_NAMES,
    ]);
  });

  it("태그가 0개인 사용자의 새 메모 기본값은 종전과 같은 '개인' 이다", () => {
    // 편집기가 `options[0]` 을 새 메모의 기본값으로 쓴다. 목록 순서를 바꾸면
    // 아직 태그를 만들지 않은 사용자의 기본값이 조용히 달라진다.
    expect(memoTagOptions([], [])[0]).toBe("개인");
  });

  it("서버 태그가 있으면 기본값은 그중 첫 번째다", () => {
    expect(memoTagOptions([tagOf(1, "회의록")], [])[0]).toBe("회의록");
  });
});

describe("memoTagKey", () => {
  it("태그 없는 메모는 '개인' 이 아니라 태그 없음 묶음이다", () => {
    expect(memoTagKey({ tag: null })).toBe(NO_TAG_KEY);
    expect(memoTagKey({ tag: "" })).toBe(NO_TAG_KEY);
    // 되돌아가면 여기서 잡힌다 — 태그를 지운 뒤에도 '개인' 칩이 남는 상태.
    expect(memoTagKey({ tag: null })).not.toBe("개인");
  });

  it("태그가 있으면 그 이름이 묶음 키다", () => {
    expect(memoTagKey({ tag: "회의록" })).toBe("회의록");
  });

  it("sentinel 은 사용자가 칠 수 있는 이름과 겹치지 않는다", () => {
    // 평범한 문자열을 sentinel 로 쓰면 같은 이름의 태그를 만든 순간 두 묶음이 합쳐진다.
    expect(NO_TAG_KEY).toBe("￿");
    expect(NO_TAG_KEY.trim()).toBe(NO_TAG_KEY);
    expect([...FALLBACK_TAG_NAMES]).not.toContain(NO_TAG_KEY);
  });
});

describe("tagValueToPayload", () => {
  it("태그 없음은 null 로 나간다 — sentinel 이 그대로 나가면 안 된다", () => {
    // U+FFFF 를 그대로 실으면 서버가 그 이름의 태그를 만들어 마스터에 쓰레기가 쌓인다.
    expect(tagValueToPayload(NO_TAG_KEY)).toBeNull();
  });

  it("고른 태그는 이름 그대로 나간다", () => {
    expect(tagValueToPayload("회의록")).toBe("회의록");
  });
});
