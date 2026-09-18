// 삭제·수정 확인창의 **환급 안내 한 줄**(설계 13-2).
//
// 결제 완료 회차의 카드 거래를 지우면 돈이 결제계좌로 돌아간다. 그 예고를 확인창에서
// 하는데, 금액은 서버만 안다(회차마다 "실제 낸 이체액 − 다시 계산한 청구액"). 그래서
// 확인창이 열릴 때 미리보기를 부르고, 그 답에 따라 네 갈래로 갈린다.
//
// 여기서 잠그는 것은 그 **갈림**이다. 특히 둘:
//   1) 못 물어봤을 때(실패·3초 초과)만 금액 없는 문구로 넘어간다 — 물어봐서 "0" 이면
//      조용히 둔다. 안 그러면 돌려줄 돈이 없는 거래에도 환급 얘기가 붙는다.
//   2) 카드가 아니면 도는 중에도 자리를 비운다 — 계좌 거래 확인창에 빈 줄이 깜빡이면
//      버튼이 밀린다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RefundPreview } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o?.amount ? `${k}:${String(o.amount)}` : k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { PaidRefundNote } = await import("./PaidRefundNote");

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

function render(
  query: { data?: RefundPreview; isPending: boolean; isError: boolean },
  opts: { isCreditCard?: boolean; hasPaymentAsset?: boolean } = {},
) {
  act(() =>
    root.render(
      <PaidRefundNote
        query={query}
        isCreditCard={opts.isCreditCard ?? true}
        cardHasPaymentAsset={opts.hasPaymentAsset ?? true}
      />,
    ),
  );
}

const text = () => container.textContent ?? "";
const skeleton = () =>
  container.querySelector('[data-testid="paid-refund-skeleton"]');

describe("미리보기 답에 따라 갈린다", () => {
  it("도는 중에는 자리만 잡는다 — 줄이 나중에 나타나며 버튼이 밀리지 않게", () => {
    render({ isPending: true, isError: false });

    expect(skeleton()).not.toBeNull();
    expect(text()).toBe("");
  });

  it("돌려줄 돈이 있으면 금액을 말한다", () => {
    render({
      data: { applies: true, refundAmount: 58_600, reason: "OK" },
      isPending: false,
      isError: false,
    });

    expect(text()).toContain("txDetail.paidDeleteNote");
    expect(text()).toContain("58,600");
  });

  it("이미 환불된 거래는 그렇다고 말한다 — 환급은 그때 끝났다", () => {
    render({
      data: { applies: false, refundAmount: 0, reason: "ALREADY_REFUNDED" },
      isPending: false,
      isError: false,
    });

    expect(text()).toBe("txDetail.refundedDeleteNote");
  });

  it("물어봐서 0 이면 줄이 없다 — 결제 전 거래에 환급 얘기를 붙이지 않는다", () => {
    render({
      data: { applies: false, refundAmount: 0, reason: "NOT_PAID_CYCLE" },
      isPending: false,
      isError: false,
    });

    expect(text()).toBe("");
  });

  it("못 물어봤으면 금액 없는 문구로 넘어간다", () => {
    render({ isPending: false, isError: true });

    expect(text()).toBe("txDetail.paidDeleteFallback");
  });

  it("결제계좌가 없으면 못 물어봐도 줄이 없다 — 돌려줄 곳이 없다", () => {
    render({ isPending: false, isError: true }, { hasPaymentAsset: false });

    expect(text()).toBe("");
  });

  it("카드가 아니면 도는 중에도 비운다", () => {
    render({ isPending: true, isError: false }, { isCreditCard: false });

    expect(skeleton()).toBeNull();
    expect(text()).toBe("");
  });
});
