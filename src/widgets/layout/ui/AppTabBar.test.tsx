// 하단 `+` 의 접근성 라벨은 **탭바가 짓지 않는다.**
//
// 예전엔 여기서 `t("addTransaction")` 을 직접 불러 어느 화면에서나 "거래 추가" 였다.
// 캘린더에서 열리는 건 일정 폼인데도 그랬다(QA #159). 무엇을 여는지 아는 쪽
// (`AppLayout` + `fabFor`)이 이름도 함께 넘긴다.
//
// `t` 를 "키를 그대로 돌려주는" 목으로 두면 둘을 구분할 수 있다 — 탭바가 제 이름을
// 지으면 `addTransaction` 이 나오고, 부모 것을 쓰면 넘긴 문구가 나온다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/desk/calendar" }),
  useNavigate: () => () => {},
}));

const { AppTabBar } = await import("./AppTabBar");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const fabLabels = (addLabel: string): (string | null)[] => {
  act(() =>
    root.render(
      <AppTabBar mode="default" onAdd={() => {}} addLabel={addLabel} />,
    ),
  );
  // 라벨 없는 탭 버튼은 제외 — `+` 만 aria-label 을 든다.
  return [...container.querySelectorAll("button[aria-label]")].map((b) =>
    b.getAttribute("aria-label"),
  );
};

describe("+ 라벨", () => {
  it("부모가 넘긴 문구를 그대로 읽는다", () => {
    expect(fabLabels("일정 추가")).toEqual(["일정 추가"]);
  });

  it("탭바가 `addTransaction` 으로 되돌아가지 않는다", () => {
    expect(fabLabels("일정 추가")).not.toContain("addTransaction");
  });
});
