// 메모 태그가 하드코딩 7종에서 서버 마스터로 옮겨 간 자리(QA #98 → #105).
//
// 두 가지가 같이 걸려 있다.
// (1) 목록의 출처 — 서버가 주는 목록이 SoT 다. 한때 그 목록이 비면 기본 7종을 채워 넣었는데
//     (빈 select 를 피하려고), **설정 목록엔 없는 이름이 편집기에만 떠서** 제목만 쓰고
//     저장하면 사용자가 만든 적 없는 태그가 조용히 생겼다(QA #105). 이제 안 채운다 —
//     화면이 '태그 없음' 과 설정 안내로 그 자리를 메운다.
// (2) 태그 없음의 표기 — 종전엔 `memo.tag || "개인"` 이라 태그 없는 메모가 '개인' 으로
//     그려졌다. 이제 태그를 지우면 서버가 그 메모의 태그를 실제로 비우므로, 그대로 두면
//     삭제 확인창이 약속한 "태그 없음으로 남아요" 와 화면이 어긋난다.
import { describe, expect, it } from "vitest";
import type { MemoTag } from "@/entities/memo-tag";
import {
  NO_TAG_KEY,
  memoTagInitialValue,
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

  it("서버 목록도 메모도 비면 빈 목록이다 — 이름을 지어내지 않는다", () => {
    // 폴백이 되살아나면 여기서 잡힌다. 설정에 없는 이름을 편집기가 내밀면,
    // 그걸 고른 채 저장할 때 서버가 그 이름의 마스터를 새로 만든다(QA #105).
    expect(memoTagOptions([], [])).toEqual([]);
    expect(memoTagOptions(undefined, [{ tag: null }])).toEqual([]);
  });

  it("조회 실패(undefined)도 빈 목록이다 — 없는 태그로 메우지 않는다", () => {
    expect(memoTagOptions(undefined, [])).toEqual([]);
  });

  it("메모에 남은 이름만 있으면 그것만 준다", () => {
    // 마스터가 비어도 이건 사용자가 실제로 쓰던 이름이라 지어낸 값이 아니다.
    expect(memoTagOptions([], [{ tag: "출장" }])).toEqual(["출장"]);
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
    // 서버가 준 이름은 절대 sentinel 자리를 차지하지 않는다.
    expect(memoTagOptions([tagOf(1, "회의록")], [])).not.toContain(NO_TAG_KEY);
  });
});

describe("memoTagInitialValue", () => {
  it("새 메모는 '태그 없음' 에서 시작한다 — 목록의 첫 태그를 몰래 붙이지 않는다", () => {
    // 종전엔 `tags[0] ?? NO_TAG_KEY` 라, 태그가 0개인 사용자에게 폴백 '개인' 이 기본값으로
    // 잡혔다. 제목만 쓰고 저장하면 설정에 없던 태그가 조용히 생겼다(QA #105).
    expect(memoTagInitialValue(null)).toBe(NO_TAG_KEY);
    expect(memoTagInitialValue(null)).not.toBe("개인");
  });

  it("새 메모의 기본값은 서버로 null 로 나간다 — 빈 태그로 저장된다", () => {
    expect(tagValueToPayload(memoTagInitialValue(null))).toBeNull();
  });

  it("있는 메모는 지금 태그 그대로 연다", () => {
    expect(memoTagInitialValue({ tag: "회의록" })).toBe("회의록");
  });

  it("태그를 뗀 메모를 열면 '태그 없음' 이 골라져 있다", () => {
    expect(memoTagInitialValue({ tag: null })).toBe(NO_TAG_KEY);
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
