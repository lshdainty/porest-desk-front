// 저축목표 아이콘은 **lucide 카탈로그에 있는 이름일 때만** DynamicIcon 으로 간다.
//
// `icon` 은 API 로 아무 문자열이나 저장된다 — 이모지도 들어온다. DynamicIcon 은
// 모르는 이름을 만나면 렌더마다 console.error 를 남기고 아무것도 그리지 않아서,
// 자산 화면 하나에 오류 12건이 쌓였다(QA #95).
//
// 레포에는 이미 `isIconName` 으로 거른 뒤 넘기는 길이 있다(icon-picker · renderIcon).
// 저축목표만 그 길을 안 지나고 있었다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SavingGoal } from "@/entities/savingGoal";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

// DynamicIcon 에 **무엇이 넘어갔는지**를 본다 — 진짜 컴포넌트는 비동기 로드라
// 오류가 effect 뒤에 나고, 그걸 기다리는 테스트는 흔들린다.
const names = vi.hoisted(() => [] as string[]);
vi.mock("lucide-react/dynamic", async (importOriginal) => ({
  ...(await importOriginal<typeof import("lucide-react/dynamic")>()),
  DynamicIcon: ({ name }: { name: string }) => {
    names.push(name);
    return <span data-testid="dyn" />;
  },
}));

const { SavingGoalItem } = await import("./AssetPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  names.length = 0;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const goalWith = (icon: string | null): SavingGoal =>
  ({
    rowId: 1,
    userRowId: 1,
    title: "여행",
    description: null,
    targetAmount: 1_000_000,
    currentAmount: 0,
    currency: "KRW",
    deadlineDate: null,
    icon,
    color: null,
    linkedAssetRowId: null,
    sortOrder: 0,
    isAchieved: "N",
    achievedAt: null,
    createAt: "2026-01-01T00:00:00",
    modifyAt: "2026-01-01T00:00:00",
  }) as SavingGoal;

function renderGoal(icon: string | null) {
  act(() => root.render(<SavingGoalItem goal={goalWith(icon)} />));
}

describe("저축목표 아이콘", () => {
  it("이모지는 DynamicIcon 으로 넘기지 않는다 — 콘솔 오류의 원인이었다(QA #95)", () => {
    renderGoal("🐷");

    expect(names).toEqual([]);
    expect(container.querySelector("[data-testid='dyn']")).toBeNull();
    // 대신 기본 아이콘(Target)이 자리를 지킨다 — 빈 칸이 남지 않는다.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("카탈로그에서 사라진 이름도 마찬가지", () => {
    renderGoal("twitter");

    expect(names).toEqual([]);
  });

  it("lucide 이름이면 그대로 그린다", () => {
    renderGoal("wallet");

    expect(names).toEqual(["wallet"]);
  });

  it("아이콘이 없으면 종전처럼 piggy-bank", () => {
    renderGoal(null);

    expect(names).toEqual(["piggy-bank"]);
  });

  it("공백만 있는 값도 piggy-bank", () => {
    renderGoal("   ");

    expect(names).toEqual(["piggy-bank"]);
  });
});
