// 할 일 태그가 하드코딩 7종에서 서버 마스터로 옮겨 간 자리(QA #103 · #105).
//
// 메모(`pages/memo/lib/memo-tags.test.ts`)와 같은 항목을 같은 순서로 검사한다 —
// 두 화면이 사용자에겐 같은 개념이라, 한쪽만 고쳐서 갈리는 게 이번 버그였다.
//
// 두 가지가 같이 걸려 있다.
// (1) 목록의 출처 — 서버가 주는 목록이 SoT 다. 비었을 때 이름을 지어내면, 설정 목록엔
//     없는 이름이 편집기에만 떠서 그걸 고른 채 저장할 때 서버가 그 문자열로 마스터를
//     새로 만든다(`TodoServiceImpl.resolveCategoryTag`).
// (2) 태그 없음의 표기 — 종전엔 `todo.category || "개인"` 이라 태그를 지운 할 일이
//     '개인' 으로 보였다. 서버는 태그를 지울 때 `category` 를 실제로 비우므로, 그대로
//     두면 삭제 확인창이 약속한 "태그 없음으로 남아요" 와 화면이 어긋난다.
import { describe, expect, it } from "vitest";
import type { TodoTag } from "@/entities/todo-tag";
import {
  NO_TAG_KEY,
  tagValueToPayload,
  todoTagInitialValue,
  todoTagKey,
  todoTagOptions,
} from "./todo-tags";

const tagOf = (rowId: number, tagName: string): TodoTag => ({
  rowId,
  userRowId: 1,
  tagName,
  color: null,
  createAt: "2026-09-08 00:00:00",
  modifyAt: "2026-09-08 00:00:00",
  usageCount: 0,
});

describe("todoTagOptions", () => {
  it("서버 목록을 그대로 쓴다 — 하드코딩 7종이 섞이지 않는다", () => {
    const options = todoTagOptions([tagOf(1, "운동"), tagOf(2, "공부")], []);
    expect(options).toEqual(["운동", "공부"]);
    // 종전 하드코딩이 되살아나면 여기서 잡힌다.
    expect(options).not.toContain("가계부");
  });

  it("마스터에 없는 이름이 할 일에 남아 있으면 뒤에 붙인다", () => {
    // 백필 전이거나 다른 클라이언트가 만든 할 일. 목록에 없으면 그 할 일을 열었을 때
    // select 가 빈칸으로 뜬다.
    const options = todoTagOptions(
      [tagOf(1, "운동")],
      [{ category: "출장" }, { category: "운동" }, { category: null }],
    );
    expect(options).toEqual(["운동", "출장"]);
  });

  it("같은 이름을 두 번 넣지 않는다", () => {
    const options = todoTagOptions(
      [tagOf(1, "운동")],
      [{ category: "운동" }, { category: "운동" }],
    );
    expect(options).toEqual(["운동"]);
  });

  it("서버 목록도 할 일도 비면 빈 목록이다 — 이름을 지어내지 않는다", () => {
    // 폴백이 되살아나면 여기서 잡힌다. 설정에 없는 이름을 편집기가 내밀면,
    // 그걸 고른 채 저장할 때 서버가 그 이름의 태그를 새로 만든다(QA #105).
    expect(todoTagOptions([], [])).toEqual([]);
    expect(todoTagOptions(undefined, [{ category: null }])).toEqual([]);
  });

  it("조회 실패(undefined)도 빈 목록이다 — 없는 태그로 메우지 않는다", () => {
    expect(todoTagOptions(undefined, [])).toEqual([]);
  });

  it("할 일에 남은 이름만 있으면 그것만 준다", () => {
    // 마스터가 비어도 이건 사용자가 실제로 쓰던 이름이라 지어낸 값이 아니다.
    expect(todoTagOptions([], [{ category: "출장" }])).toEqual(["출장"]);
  });
});

describe("todoTagKey", () => {
  it("태그 없는 할 일은 '개인' 이 아니라 태그 없음 묶음이다", () => {
    expect(todoTagKey({ category: null })).toBe(NO_TAG_KEY);
    expect(todoTagKey({ category: "" })).toBe(NO_TAG_KEY);
    // 되돌아가면 여기서 잡힌다 — 태그를 지운 뒤에도 '개인' 이 남는 상태(QA #103).
    expect(todoTagKey({ category: null })).not.toBe("개인");
  });

  it("태그가 있으면 그 이름이 묶음 키다", () => {
    expect(todoTagKey({ category: "운동" })).toBe("운동");
  });

  it("sentinel 은 사용자가 칠 수 있는 이름과 겹치지 않는다", () => {
    // 평범한 문자열을 sentinel 로 쓰면 같은 이름의 태그를 만든 순간 두 묶음이 합쳐진다.
    expect(NO_TAG_KEY).toBe("￿");
    expect(NO_TAG_KEY.trim()).toBe(NO_TAG_KEY);
    // 서버가 준 이름은 절대 sentinel 자리를 차지하지 않는다.
    expect(todoTagOptions([tagOf(1, "운동")], [])).not.toContain(NO_TAG_KEY);
  });
});

describe("todoTagInitialValue", () => {
  it("새 할 일은 '태그 없음' 에서 시작한다 — 목록의 첫 태그를 몰래 붙이지 않는다", () => {
    // 되돌아가면 여기서 잡힌다(QA #103 의 `tags[0] || '개인'`). 제목만 쓰고 저장하면
    // 고른 적 없는 태그가 붙고, 그 이름이 설정에 없으면 서버가 새로 만들기까지 한다.
    expect(todoTagInitialValue(null)).toBe(NO_TAG_KEY);
    expect(todoTagInitialValue(null)).not.toBe("개인");
  });

  it("새 할 일의 기본값은 서버로 null 로 나간다 — 빈 태그로 저장된다", () => {
    // 편집기·빠른 추가가 같이 쓰는 경로다.
    expect(tagValueToPayload(todoTagInitialValue(null))).toBeNull();
  });

  it("있는 할 일은 지금 태그 그대로 연다", () => {
    expect(todoTagInitialValue({ category: "운동" })).toBe("운동");
  });

  it("태그를 뗀 할 일을 열면 '태그 없음' 이 골라져 있다", () => {
    // '개인' 이 골라져 있으면 본문만 고쳐 저장해도 그 태그가 되살아난다.
    expect(todoTagInitialValue({ category: null })).toBe(NO_TAG_KEY);
  });
});

describe("tagValueToPayload", () => {
  it("태그 없음은 null 로 나간다 — sentinel 이 그대로 나가면 안 된다", () => {
    // U+FFFF 를 그대로 실으면 서버가 그 이름의 태그를 만들어 마스터에 쓰레기가 쌓인다.
    // undefined 여도 안 된다 — PUT 은 키가 없으면 옛 category 를 그대로 지킨다(`Patch`).
    expect(tagValueToPayload(NO_TAG_KEY)).toBeNull();
    expect(tagValueToPayload(NO_TAG_KEY)).not.toBeUndefined();
  });

  it("고른 태그는 이름 그대로 나간다", () => {
    expect(tagValueToPayload("운동")).toBe("운동");
  });
});

describe("메모와 갈리지 않는다", () => {
  it("두 화면의 sentinel 이 같은 값이다", async () => {
    // 값이 갈리면 한 화면에서 만든 '태그 없음' 상태를 다른 화면이 이름으로 읽는다.
    const memo = await import("@/pages/memo/lib/memo-tags");
    expect(NO_TAG_KEY).toBe(memo.NO_TAG_KEY);
    expect(tagValueToPayload(NO_TAG_KEY)).toBe(
      memo.tagValueToPayload(memo.NO_TAG_KEY),
    );
  });
});
