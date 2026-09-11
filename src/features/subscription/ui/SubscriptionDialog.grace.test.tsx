// 해지해도 **기간 끝까지 Pro** 다(desk-back #332) — 그 유예 기간의 날짜 라벨을 잠근다.
//
// 서버는 해지에서 `autoRenew=false` 만 적고 만료일을 앞당기지 않는다. 그래서 해지한
// 사람도 남은 기간 동안 Pro 로 서는데, 배너는 그 날짜를 여전히 '다음 결제'로 말하고
// 있었다 — **해지한 구독에 다음 결제는 없다.** 그날은 결제일이 아니라 종료일이다.
//
// 여기서 잠그는 건 셋이다:
// ① 자동갱신이 꺼졌으면 종료일로 말한다 ② 켜져 있으면 종전 '다음 결제' 그대로다
// ③ 유예 기간에 '구독하기'(startPro)가 뜨지 않는다 — 서버가 재구독을 막으므로
//    눌러 봐야 SUBSCRIPTION_ALREADY_ACTIVE 로 튕긴다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { SubscriptionInfo } from "../api/subscriptionApi";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// vi.mock 팩토리는 호이스팅돼 파일 맨 위에서 돌아간다 — 케이스마다 갈아 끼울 응답은
// vi.hoisted 로 같이 끌어올려야 참조할 수 있다.
const server = vi.hoisted(() => ({
  features: [] as string[],
  sub: undefined as SubscriptionInfo | null | undefined,
}));

// 키와 넘긴 날짜를 그대로 흘려보낸다 — 화면이 **어느 키로** 말했는지를 텍스트로 읽는다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, p?: { date?: string }) => (p?.date ? `${k}:${p.date}` : k),
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));
vi.mock("../model/useSubscription", () => ({
  useMyFeatures: () => ({ data: { features: server.features } }),
  useMySubscription: () => ({ data: server.sub }),
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
  server.features = [];
  server.sub = undefined;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/**
 * 서버 응답 한 벌. `currentPeriodEnd` 는 정오(UTC)로 둔다 — 날짜를 로컬 달력으로
 * 옮기는 자리라 자정으로 두면 기기 시간대에 따라 하루가 밀린다.
 */
function subscription(over: Partial<SubscriptionInfo>): SubscriptionInfo {
  return {
    planCode: "SECURITIES",
    planName: "Porest Pro",
    status: "ACTIVE",
    startedAt: "2026-09-11T12:00:00",
    currentPeriodEnd: "2026-10-11T12:00:00",
    autoRenew: true,
    ...over,
  };
}

function open(features: string[], sub: SubscriptionInfo | null | undefined) {
  server.features = features;
  server.sub = sub;
  act(() =>
    root.render(<SubscriptionDialog onClose={() => {}} mobile={false} />),
  );
}

/** 다이얼로그는 포털로 body 에 붙는다. */
const text = () => document.body.textContent ?? "";
const buttonLabels = () =>
  [...document.body.querySelectorAll("button")].map((b) => b.textContent ?? "");

describe("해지 유예 기간의 날짜 라벨", () => {
  it("자동갱신이 꺼졌으면 종료일로 말한다 — '다음 결제'가 아니다", () => {
    open(
      ["SECURITIES"],
      subscription({ status: "CANCELLED", autoRenew: false }),
    );

    expect(text()).toContain("activeUntil:2026-10-11");
    expect(text()).not.toContain("nextBill");
  });

  it("자동갱신이 켜져 있으면 종전 '다음 결제' 문구 그대로다", () => {
    open(["SECURITIES"], subscription({ autoRenew: true }));

    expect(text()).toContain("nextBill:2026-10-11");
    expect(text()).not.toContain("activeUntil");
  });

  it("만료일이 없으면 날짜 라벨 없이 그냥 선다 — 안 터진다", () => {
    open(
      ["SECURITIES"],
      subscription({ autoRenew: false, currentPeriodEnd: null }),
    );

    expect(text()).toContain("proInUse");
    expect(text()).not.toContain("activeUntil");
    expect(text()).not.toContain("nextBill");
  });

  it("구독 조회가 아직 안 왔어도 안 터진다", () => {
    open(["SECURITIES"], undefined);

    expect(text()).toContain("proInUse");
    expect(text()).not.toContain("activeUntil");
    expect(text()).not.toContain("nextBill");
  });

  it("유예 기간에 '구독하기'가 뜨지 않는다 — 서버가 재구독을 막는다", () => {
    open(
      ["SECURITIES"],
      subscription({ status: "CANCELLED", autoRenew: false }),
    );

    expect(buttonLabels()).toContain("cancelSub");
    expect(buttonLabels()).not.toContain("startPro");
  });

  it("권한이 없으면 종전대로 Free 안내와 '구독하기'가 선다", () => {
    open([], null);

    expect(text()).toContain("freeLocked");
    expect(buttonLabels()).toContain("startPro");
  });
});
