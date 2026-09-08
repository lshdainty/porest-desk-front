// 메모 태그 관리 화면(QA #98) — 문구와 실제 동작이 맞는지 본다.
//
// 태그를 지우면 서버는 그 태그를 쓰던 **메모의 태그를 비운다**
// (`MemoTagServiceImpl.deleteTag` → `memoRepository.clearTag`). 그래서 확인창은
// "이 태그를 쓰는 메모 N건은 태그 없음으로 남아요" 라고 약속한다 — 그 N 이 실제
// 사용 수여야 하고, 자리표시자가 글자 그대로 새어 나오면 안 된다.
//
// 할 일 태그 화면은 미는 경로의 확인창에 `count` 를 안 넘겨 "{{count}}건" 이 그대로
// 보인다. 같은 실수를 베끼지 않으려고 여기에 테스트를 건다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import koCommon from "@/locales/ko/common.json";
import koMemo from "@/locales/ko/memo.json";
import type { MemoTag } from "@/entities/memo-tag";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ tags: [] as MemoTag[] }));

vi.mock("@/features/memo-tag", () => ({
  useMemoTags: () => ({ data: state.tags, isLoading: false }),
  useCreateMemoTag: () => ({ mutate: () => {}, isPending: false }),
  useUpdateMemoTag: () => ({ mutate: () => {}, isPending: false }),
  useDeleteMemoTag: () => ({ mutate: () => {}, isPending: false }),
}));

const { MemoTagManager } = await import("./MemoTagManager");

// 실제 번역 번들을 태운다 — 여기서 보려는 게 보간(`{{count}}`)이라 t 를 흉내 내면
// 정작 검사하려던 것이 사라진다.
const i18n = i18next.createInstance();
await i18n.use(initReactI18next).init({
  lng: "ko",
  fallbackLng: "ko",
  ns: ["memo", "common"],
  defaultNS: "common",
  resources: { ko: { memo: koMemo, common: koCommon } },
  interpolation: { escapeValue: false },
});

let container: HTMLDivElement;
let root: Root;

const tagOf = (
  rowId: number,
  tagName: string,
  usageCount: number,
): MemoTag => ({
  rowId,
  userRowId: 1,
  tagName,
  color: "#2c70bf",
  createAt: "2026-09-08 00:00:00",
  modifyAt: "2026-09-08 00:00:00",
  usageCount,
});

const render = () =>
  act(() =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <MemoTagManager mobile={false} />
      </I18nextProvider>,
    ),
  );

/** 화면 전체(포털 포함) 텍스트 — 확인창은 body 에 붙는다. */
const screenText = () => document.body.textContent ?? "";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // 앞 케이스에서 확인창이 닫히면 그 뒤 POINTER_BLOCK_MS 동안 클릭이 삼켜진다
  // (모달 닫힘 직후 오클릭 방어). 케이스끼리 옮지 않게 여기서 푼다.
  __resetPointerBlockForTest();
  state.tags = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  __resetPointerBlockForTest();
});

describe("MemoTagManager", () => {
  it("서버가 준 태그를 그린다 — 하드코딩 7종이 아니다", () => {
    state.tags = [tagOf(1, "회의록", 3), tagOf(2, "아이디어", 0)];
    render();

    const text = screenText();
    expect(text).toContain("회의록");
    expect(text).toContain("아이디어");
    expect(text).not.toContain("고정비");
  });

  it("사용 수를 서버 집계로 보여준다", () => {
    state.tags = [tagOf(1, "회의록", 3)];
    render();

    expect(screenText()).toContain("3건에 사용 중");
  });

  it("태그가 없으면 첫 태그를 만들라고 안내한다 — 빈 화면으로 두지 않는다", () => {
    render();

    expect(screenText()).toContain("태그가 없어요");
  });

  it("삭제 확인창이 실제 사용 수와 '태그 없음' 을 말한다", () => {
    state.tags = [tagOf(1, "회의록", 3)];
    render();

    const del = container.querySelector<HTMLButtonElement>(
      'button[aria-label="삭제"]',
    );
    expect(del).not.toBeNull();
    act(() => del!.click());

    const text = screenText();
    // 서버가 하는 일 그대로 — 메모는 지우지 않고 태그만 비운다.
    expect(text).toContain('"회의록" 태그를 삭제하면');
    expect(text).toContain("메모 3건은 태그 없음으로 남아요");
    // 보간이 빠지면 이 자리표시자가 사용자 눈에 그대로 보인다.
    expect(text).not.toContain("{{count}}");
    expect(text).not.toContain("{{name}}");
  });

  it("사용 수 0 도 숫자로 말한다", () => {
    state.tags = [tagOf(1, "아이디어", 0)];
    render();

    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-label="삭제"]')!
        .click(),
    );

    expect(screenText()).toContain("메모 0건은 태그 없음으로 남아요");
  });
});
