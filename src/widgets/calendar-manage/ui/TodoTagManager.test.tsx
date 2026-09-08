// 할 일 태그 관리 화면 — 문구와 실제 동작이 맞는지 본다(QA #104).
//
// 태그를 지우면 서버는 그 태그를 쓰던 **할 일의 태그만 비운다**
// (`TodoTagServiceImpl.deleteTag`). 그래서 확인창은 "이 태그를 쓰는 할 일 N건은 태그
// 없음으로 남아요" 라고 약속한다 — 그 N 이 실제 사용 수여야 하고, 자리표시자가 글자 그대로
// 새어 나오면 안 된다.
//
// **확인창으로 가는 길이 둘**이라 둘 다 본다. 데스크톱은 행의 🗑 → `confirmDelete` 상태,
// 모바일은 밀어서 나오는 트레이의 삭제 → `SwipeAction.confirm` 이다. 종전엔 모바일 쪽만
// `count` 를 안 넘겨 "할 일 {{count}}건" 이 그대로 보였다 — 한쪽만 테스트하면 못 잡는다.
// 메모 쪽(`widgets/memo-manage/ui/MemoTagManager.test.tsx`)과 같은 항목을 같은 순서로 둔다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import koCommon from "@/locales/ko/common.json";
import koTodo from "@/locales/ko/todo.json";
import type { TodoTag } from "@/entities/todo-tag";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ tags: [] as TodoTag[] }));

vi.mock("@/features/todo-tag", () => ({
  useTodoTags: () => ({ data: state.tags, isLoading: false }),
  useCreateTodoTag: () => ({ mutate: () => {}, isPending: false }),
  useUpdateTodoTag: () => ({ mutate: () => {}, isPending: false }),
  useDeleteTodoTag: () => ({ mutate: () => {}, isPending: false }),
}));

const { TodoTagManager } = await import("./TodoTagManager");

// 실제 번역 번들을 태운다 — 여기서 보려는 게 보간(`{{count}}`)이라 t 를 흉내 내면
// 정작 검사하려던 것이 사라진다.
const i18n = i18next.createInstance();
await i18n.use(initReactI18next).init({
  lng: "ko",
  fallbackLng: "ko",
  ns: ["todo", "common"],
  defaultNS: "common",
  resources: { ko: { todo: koTodo, common: koCommon } },
  interpolation: { escapeValue: false },
});

let container: HTMLDivElement;
let root: Root;

const tagOf = (
  rowId: number,
  tagName: string,
  usageCount: number,
): TodoTag => ({
  rowId,
  userRowId: 1,
  tagName,
  color: "#2c70bf",
  createAt: "2026-09-08 00:00:00",
  modifyAt: "2026-09-08 00:00:00",
  usageCount,
});

const render = (mobile: boolean) =>
  act(() =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <TodoTagManager mobile={mobile} />
      </I18nextProvider>,
    ),
  );

/** 화면 전체(포털 포함) 텍스트 — 확인창은 body 에 붙는다. */
const screenText = () => document.body.textContent ?? "";

/** 트레이의 삭제 버튼 — 밀지 않아도 DOM 에 늘 있다(접혀 있을 뿐이다). */
const swipeDelete = (rowLabel: string) =>
  container.querySelector<HTMLButtonElement>(
    `button[aria-label="삭제: ${rowLabel}"]`,
  );

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

describe("TodoTagManager", () => {
  it("서버가 준 태그를 그린다 — 하드코딩 7종이 아니다", () => {
    state.tags = [tagOf(1, "운동", 3), tagOf(2, "공부", 0)];
    render(false);

    const text = screenText();
    expect(text).toContain("운동");
    expect(text).toContain("공부");
    expect(text).not.toContain("고정비");
  });

  it("사용 수를 서버 집계로 보여준다", () => {
    state.tags = [tagOf(1, "운동", 3)];
    render(false);

    expect(screenText()).toContain("3건에 사용 중");
  });

  it("데스크톱 삭제 확인창이 실제 사용 수와 '태그 없음' 을 말한다", () => {
    state.tags = [tagOf(1, "운동", 3)];
    render(false);

    const del = container.querySelector<HTMLButtonElement>(
      'button[aria-label="삭제"]',
    );
    expect(del).not.toBeNull();
    act(() => del!.click());

    const text = screenText();
    // 서버가 하는 일 그대로 — 할 일은 지우지 않고 태그만 비운다.
    expect(text).toContain('"운동" 태그를 삭제하면');
    expect(text).toContain("할 일 3건은 태그 없음으로 남아요");
    expect(text).not.toContain("{{count}}");
    expect(text).not.toContain("{{name}}");
  });

  it("모바일(미는 경로) 확인창도 같은 문장을 말한다 — {{count}} 가 새면 안 된다", () => {
    state.tags = [tagOf(1, "운동", 3)];
    render(true);

    const del = swipeDelete("운동");
    expect(del).not.toBeNull();
    act(() => del!.click());

    const text = screenText();
    expect(text).toContain('"운동" 태그를 삭제하면');
    // 이 줄이 QA #104 다 — count 를 안 넘기면 "할 일 {{count}}건" 이 그대로 보인다.
    expect(text).toContain("할 일 3건은 태그 없음으로 남아요");
    expect(text).not.toContain("{{count}}");
    expect(text).not.toContain("{{name}}");
  });

  it("모바일 확인창도 사용 수 0 을 숫자로 말한다", () => {
    state.tags = [tagOf(1, "공부", 0)];
    render(true);

    act(() => swipeDelete("공부")!.click());

    expect(screenText()).toContain("할 일 0건은 태그 없음으로 남아요");
  });

  it("태그가 없으면 첫 태그를 만들라고 안내한다 — 빈 화면으로 두지 않는다", () => {
    render(false);

    expect(screenText()).toContain("태그가 없어요");
  });
});
