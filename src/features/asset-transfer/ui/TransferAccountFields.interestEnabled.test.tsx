// 이자 칸의 조건은 **호스트가 정한다**.
//
// 이자는 받는 자산이 대출일 때만 뜨는데, 프리셋 폼은 그 위에 "금액을 고정했을 때만"
// 이라는 조건이 하나 더 붙는다(금액이 매달 다르면 이자도 매달 달라서, 박아 둔 이자는
// 불러올 때마다 틀린 값이 된다 — 사용자 결정 2026-09-15).
//
// 그 조건을 공용 위젯 안에 넣으면 안 된다. 이 위젯은 **거래 시트·반복 설정·프리셋 폼**
// 셋이 쓰는데 앞의 둘에는 "금액 고정" 이라는 개념이 아예 없다(`lockAmount` grep 0).
// 넣는 순간 대출 상환 이체에 이자를 못 적게 되고, 이자 지출이 안 생겨 원금이 과다
// 상환된 것으로 기록된다. 그래서 기본은 켜짐이고 프리셋 폼만 끈다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { TransferAccountFields } = await import("./TransferAccountFields");

const bank = {
  rowId: 1,
  assetName: "QA예금",
  assetType: "BANK_ACCOUNT",
} as Asset;
const loan = { rowId: 2, assetName: "QA대출", assetType: "LOAN" } as Asset;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.scrollIntoView = () => {};
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(interestEnabled?: boolean) {
  act(() =>
    root.render(
      <TransferAccountFields
        assets={[bank, loan]}
        fromAssetRowId={1}
        toAssetRowId={2}
        fee=""
        interest=""
        amountNumber={0}
        onFromChange={() => {}}
        onToChange={() => {}}
        onFeeChange={() => {}}
        onInterestChange={() => {}}
        {...(interestEnabled === undefined ? {} : { interestEnabled })}
      />,
    ),
  );
}

const hasInterestField = () =>
  [...document.body.querySelectorAll("label, div")].some(
    (el) => el.textContent?.trim() === "addTx.interest",
  );

describe("이자 칸 조건은 호스트가 정한다", () => {
  it("인자를 안 주면 켜진다 — 거래 시트·반복 설정이 쓰는 기본값", () => {
    render();
    expect(hasInterestField()).toBe(true);
  });

  it("호스트가 끄면 대출이어도 안 뜬다 — 프리셋 폼이 금액 미고정일 때 쓴다", () => {
    render(false);
    expect(hasInterestField()).toBe(false);
  });

  it("호스트가 켜면 뜬다", () => {
    render(true);
    expect(hasInterestField()).toBe(true);
  });
});
