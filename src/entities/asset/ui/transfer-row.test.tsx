// 이체 줄 — 거래 줄과 같은 ds List 줄 값이다(I-07 5): 회색 타일 · 부호 · 예정 · 호스트가 24 를 쥘 때(gutter).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssetTransfer } from "../model/types";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { TransferRow } = await import("./transfer-row");

const base: AssetTransfer = {
  rowId: 5,
  userRowId: 1,
  fromAssetRowId: 1,
  fromAssetName: "주거래 통장",
  toAssetRowId: 2,
  toAssetName: "비상금 통장",
  amount: 120_000,
  fee: 0,
  interestAmount: 0,
  principalAmount: 120_000,
  description: null,
  autoSource: null,
  transferDate: "2020-08-20T10:00:00",
  createAt: "2020-08-20T10:00:00",
};

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

const render = (props: Partial<Parameters<typeof TransferRow>[0]> = {}) =>
  act(() => root.render(<TransferRow transfer={base} {...props} />));
const text = () => container.textContent ?? "";

describe("이체 줄 — ds List 줄", () => {
  it("앞 타일은 회색(chart-gray-weak 바탕 + chart-gray 아이콘)이다", () => {
    render();
    const tile = container.querySelector<HTMLElement>("[data-slot=list-tile]");

    expect(tile).not.toBeNull();
    expect(tile!.style.background).toBe("var(--color-chart-gray-weak)");
    expect(tile!.style.color).toBe("var(--color-chart-gray)");
    expect(tile!.querySelector("svg")).not.toBeNull();
  });

  it("제목은 설명(없으면 '이체'), 설명 줄에 보내는 쪽 → 받는 쪽이 있다", () => {
    render();
    expect(text()).toContain("addTx.transfer");
    expect(text()).toContain("주거래 통장 → 비상금 통장");

    render({ transfer: { ...base, description: "월세 보내기" } });
    expect(text()).toContain("월세 보내기");
    expect(text()).not.toContain("addTx.transfer");
  });

  it("관점이 없으면 부호가 없고, 있으면 출금 −(금액+수수료) · 입금 +", () => {
    render();
    expect(text()).toContain("120,000");
    expect(text()).not.toMatch(/[−+]₩?120,000/);

    render({ perspectiveAssetRowId: 1, transfer: { ...base, fee: 500 } });
    expect(text()).toMatch(/−₩?120,500/);

    render({ perspectiveAssetRowId: 2 });
    expect(text()).toMatch(/\+₩?120,000/);
  });

  it("예정 이체는 배지를 달고 금액만 옅다 — 줄을 흐리게 하지 않는다", () => {
    render({ transfer: { ...base, transferDate: "2999-01-01T09:00:00" } });
    const amount = container.querySelector("[data-slot=list-suffix] span");

    expect(text()).toContain("scheduled");
    expect(amount?.className).toContain("text-fg-neutral-subtle");
    expect(container.querySelector("[class*=opacity-60]")).toBeNull();
  });

  it("gutter 를 켜지 않으면 줄의 좌우 24 를 걷는다 — 호스트가 24 를 쥔 동안", () => {
    render();
    expect(container.querySelector("ul")!.className).toContain(
      "[&_[data-slot=list-content]]:px-0",
    );

    render({ gutter: true });
    expect(container.querySelector("ul")!.className).not.toContain(
      "[&_[data-slot=list-content]]:px-0",
    );
  });

  it("누를 수 있으면 버튼 줄이고, 누르면 이체를 넘긴다", () => {
    const seen: number[] = [];
    render({ onClick: (t) => seen.push(t.rowId) });
    const button = container.querySelector("button")!;

    act(() => button.click());
    expect(seen).toEqual([5]);

    render();
    expect(container.querySelector("button")).toBeNull();
  });
});
