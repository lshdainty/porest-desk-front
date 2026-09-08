// 자산 상세의 '수정' 이 설정 목록까지만 데려다주던 자리(QA #126).
//
// 고친 방향은 "주소에 어느 자산인지를 싣고, 관리 화면이 그 폼을 연다" 다. 여기서
// 잠그는 건 셋이다 — ① 폼이 그 자산으로 열린다 ② 그 자산이 있는 탭으로 옮긴다
// (다른 탭이면 폼 뒤로 엉뚱한 목록이 보인다) ③ 쓰고 나면 주소에서 지운다.
// ③ 이 없으면 설정 안에서 섹션을 다녀오는 것만으로 폼이 혼자 다시 열린다.
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/entities/asset";
import { editAssetPath } from "../lib/edit-deep-link";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({
  assets: [] as unknown[],
  isLoading: false,
  /** 열린 편집 폼이 무엇을 받았는지. */
  opened: null as { rowId: number | null; group: string } | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({
    data: { assets: state.assets },
    isLoading: state.isLoading,
  }),
  useCreateAsset: () => ({ mutate: () => {}, isPending: false }),
  useUpdateAsset: () => ({ mutate: () => {}, isPending: false }),
  useDeleteAsset: () => ({ mutate: () => {}, isPending: false }),
}));
// 편집 폼 자체는 자기 쿼리를 여럿 건다 — 여기선 "무엇으로 열렸는가" 만 본다.
vi.mock("./AssetEditDialog", () => ({
  AssetEditDialog: (p: { item: { rowId: number } | null; group: string }) => {
    state.opened = { rowId: p.item?.rowId ?? null, group: p.group };
    return null;
  },
}));
vi.mock("./AssetDetailDialog", () => ({ AssetDetailDialog: () => null }));

const { AccountManager } = await import("./AccountManager");

const assetOf = (rowId: number, assetType: string, assetName: string) =>
  ({
    rowId,
    assetName,
    assetType,
    balance: 1000,
    institution: null,
    color: null,
    memo: null,
    isIncludedInTotal: "Y",
    createAt: "2026-01-01T00:00:00",
    modifyAt: "2026-01-01T00:00:00",
  }) as unknown as Asset;

let container: HTMLDivElement;
let root: Root;
let seen: string | null = null;

/** 주소가 실제로 어떻게 남았는지 읽어 둔다. */
function Spy() {
  const loc = useLocation();
  // 렌더 중에 바깥 변수를 건드리지 않는다 — effect 로 옮긴다(`act` 가 flush 한다).
  useEffect(() => {
    seen = `${loc.pathname}${loc.search}`;
  });
  return null;
}

let entry = "/desk/settings?section=accounts";

/** 같은 자리에 같은 타입을 그린다 — 언마운트 없이 다시 그리는 것과 같다.
 *  (`MemoryRouter` 는 `initialEntries` 를 마운트할 때 한 번만 읽는다.) */
const tree = () => (
  <MemoryRouter initialEntries={[entry]}>
    <Spy />
    <AccountManager mobile={false} />
  </MemoryRouter>
);

function render(url: string) {
  entry = url;
  act(() => root.render(tree()));
}

function rerender() {
  act(() => root.render(tree()));
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.assets = [
    assetOf(7, "BANK_ACCOUNT", "주거래"),
    assetOf(9, "CREDIT_CARD", "신용카드"),
  ];
  state.isLoading = false;
  state.opened = null;
  seen = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("AccountManager 편집 딥링크 (QA #126)", () => {
  it("자산 상세가 만든 주소로 들어오면 그 자산의 폼이 열린다", () => {
    render(editAssetPath({ rowId: 7 }));
    expect(state.opened).toEqual({ rowId: 7, group: "account" });
  });

  it("그 자산이 있는 탭으로 옮긴다 — 폼 뒤로 엉뚱한 목록이 보이면 안 된다", () => {
    render(editAssetPath({ rowId: 9 }));
    expect(state.opened).toEqual({ rowId: 9, group: "card" });
    // 기본 탭은 계좌다 — 안 옮기면 카드 폼 뒤에 계좌 목록이 깔린다.
    const list = document.body.textContent ?? "";
    expect(list).toContain("신용카드");
    expect(list).not.toContain("주거래");
  });

  it("쓰고 나면 주소에서 지운다 — 남으면 섹션을 다녀올 때마다 다시 열린다", () => {
    render(editAssetPath({ rowId: 7 }));
    expect(seen).toBe("/desk/settings?section=accounts");
  });

  it("목록이 아직 안 왔으면 기다렸다가 연다 — 주소는 그 사이에 이미 지워진다", () => {
    // 마운트할 때 값을 받아 두지 않으면 여기서 딥링크가 사라진다: 주소를 터는 건
    // 목록을 기다려 주지 않기 때문이다.
    state.isLoading = true;
    render(editAssetPath({ rowId: 7 }));
    expect(state.opened).toBeNull();
    expect(seen).toBe("/desk/settings?section=accounts");

    // 같은 자리에 다시 그린다 = 언마운트 없이 목록만 도착한 상황.
    state.isLoading = false;
    rerender();
    expect(state.opened).toEqual({ rowId: 7, group: "account" });
  });

  it("없는 자산이면 목록만 보여 준다 — 빈 폼을 열지 않는다", () => {
    render(editAssetPath({ rowId: 404 }));
    expect(state.opened).toBeNull();
    expect(seen).toBe("/desk/settings?section=accounts");
  });

  it("파라미터가 없으면 아무것도 안 연다", () => {
    render("/desk/settings?section=accounts");
    expect(state.opened).toBeNull();
  });
});
