// 자산 편집은 **설정의 관리 화면에서만** 연다 (QA 12차 결정).
//
// 사용자가 정한 규칙은 "각각의 페이지에서 수정을 누르면 설정 페이지로 이동하고,
// 모든 편집은 설정에서 진행한다" 다. QA #126 은 자산 상세의 '수정' 이 목록까지만
// 간다고 적었지만 그게 의도된 동작이었고, 한 번 `?edit=<rowId>` 로 폼을 자동으로
// 여는 쪽으로 갔다가 되돌렸다.
//
// 그래서 여기서 잠그는 건 둘이다:
// ① 주소에 자산을 실어 보내도 관리 화면이 폼을 **안 연다** — 목록으로 들어온다
// ② 그래도 편집은 여기서 된다 — 목록의 연필이 그 자산의 폼을 연다
//
// ②가 없으면 "안 열린다" 만 잠기고, 편집 자체가 사라져도 초록불이 난다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({
  assets: [] as unknown[],
  /** 열린 편집 폼이 무엇을 받았는지. */
  opened: null as { rowId: number | null; group: string } | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: state.assets }, isLoading: false }),
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

function render(url: string) {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <AccountManager mobile={false} />
      </MemoryRouter>,
    ),
  );
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.assets = [
    assetOf(7, "BANK_ACCOUNT", "주거래"),
    assetOf(9, "CREDIT_CARD", "신용카드"),
  ];
  state.opened = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("자산 편집은 설정의 관리 화면에서만 연다", () => {
  it("주소에 자산을 실어 보내도 폼이 안 열린다 — 목록으로 들어온다", () => {
    render("/desk/settings?section=accounts&edit=7");
    expect(state.opened).toBeNull();
  });

  it("탭도 안 옮긴다 — 기본 탭(계좌) 그대로다", () => {
    // 카드 `rowId` 를 실어 보낸다. 딥링크가 살아 있으면 카드 탭으로 옮겨 간다.
    render("/desk/settings?section=accounts&edit=9");
    const shown = document.body.textContent ?? "";
    expect(shown).toContain("주거래");
    expect(shown).not.toContain("신용카드");
  });

  it("그래도 편집은 여기서 한다 — 목록의 연필이 그 자산의 폼을 연다", () => {
    render("/desk/settings?section=accounts");
    expect(state.opened).toBeNull();
    const pencil = document.body.querySelector<HTMLButtonElement>(
      'button[title="editAction"]',
    );
    expect(pencil).not.toBeNull();
    act(() =>
      pencil!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(state.opened).toEqual({ rowId: 7, group: "account" });
  });
});
