// 기능 비교표는 **Pro 가 실제로 주는 것만** 적는다(QA #161).
//
// 표에 '월 100건'·'CSV 가져오기/내보내기'·'다중 캘린더 공유'·'카드 혜택 추천' 네 줄이
// Free ✗ / Pro ✓ 로 서 있었는데, 코드 어디에도 그런 제한이 없다 — 플랜 features 는
// `["SECURITIES"]` 하나고, 서버 게이트는 증권 API·시세 스냅샷뿐이며, 웹 게이트도
// `SecuritiesGate`·사이드바·자산 상세뿐이다. Free 계정으로 내보내기·캘린더 공유·
// 카드 혜택이 전부 됐다. 없는 제한을 표가 광고하고 있던 셈이다.
//
// 여기서 잠그는 건 둘이다:
// ① 그 네 줄이 표에 없다 ② 증권 줄은 남고 Free/Pro 두 칸 모양(대시·체크)이 안 깨진다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// 키를 그대로 흘려보낸다 — 표에 어떤 항목이 서 있는지를 키로 읽는다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));
vi.mock("../model/useSubscription", () => ({
  useMyFeatures: () => ({ data: { features: [] } }),
  useMySubscription: () => ({ data: undefined }),
  useSubscriptionPlans: () => ({ data: [] }),
  useSubscribe: () => ({ mutate: () => {}, isPending: false }),
  useCancelSubscription: () => ({ mutate: () => {}, isPending: false }),
}));

const { SubscriptionDialog } = await import("./SubscriptionDialog");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function open(mobile = false) {
  act(() =>
    root.render(<SubscriptionDialog onClose={() => {}} mobile={mobile} />),
  );
}

/**
 * 비교표 본문 행들. 표는 머리줄(`colFeature` | Free | Pro) + 기능 행으로,
 * 전부 `grid-template-columns: 1fr 52px 52px` 인 3칸 그리드다 — 머리줄만 걷어낸다.
 */
function rows(): HTMLElement[] {
  const grid = [...document.body.querySelectorAll<HTMLElement>("div")].filter(
    (d) => d.style.gridTemplateColumns === "1fr 52px 52px",
  );
  return grid.slice(1);
}

/** 행 라벨 = 첫 칸 텍스트(= i18n 키). */
const labelOf = (row: Element) => row.firstElementChild?.textContent ?? null;
const labels = () => rows().map(labelOf);

/** 행의 Free/Pro 칸(첫 칸 뒤 두 칸)에 그려진 아이콘 이름(check · minus). */
function cells(row: HTMLElement): (string | null)[] {
  return [...row.children].slice(1, 3).map((cell) => {
    const svg = cell.querySelector("svg");
    if (!svg) return null;
    return (
      [...svg.classList].find((c) => c.startsWith("lucide-"))?.slice(7) ?? null
    );
  });
}

describe("구독 기능 비교표", () => {
  it("없는 제한을 광고하지 않는다 — 거래 건수·가져오기/내보내기·캘린더 공유·카드 혜택 줄이 없다", () => {
    open();
    const text = labels().join("|");
    for (const gone of [
      "feature.txLog",
      "feature.txFree",
      "feature.txUnlimited",
      "feature.importExport",
      "feature.multiCalendar",
      "feature.cardBenefit",
    ]) {
      expect(text).not.toContain(gone);
    }
  });

  it("Pro 가 실제로 주는 증권 줄은 남는다", () => {
    open();
    expect(labels()).toEqual([
      "feature.core",
      "feature.budget",
      "feature.securities",
    ]);
  });

  it("Free/Pro 두 칸 모양이 안 깨진다 — 모든 행이 체크 아니면 대시 두 칸", () => {
    open();
    const all = rows();
    expect(all.length).toBeGreaterThan(0);
    for (const r of all) {
      for (const c of cells(r)) {
        expect(["check", "minus"]).toContain(c);
      }
    }
  });

  it("증권은 Free 대시 · Pro 체크", () => {
    open();
    const securities = rows().find((r) => labelOf(r) === "feature.securities");
    expect(securities).toBeDefined();
    expect(cells(securities!)).toEqual(["minus", "check"]);
  });

  it("모바일 시트에서도 같은 표가 선다", () => {
    open(true);
    expect(labels()).toEqual([
      "feature.core",
      "feature.budget",
      "feature.securities",
    ]);
  });
});
