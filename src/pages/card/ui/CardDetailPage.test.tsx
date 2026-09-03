// `/desk/card/999999` 는 토스트 하나만 띄우고 본문은 뒤로 버튼만 남은 빈 화면이었다(QA #4).
// 여기서 고정하는 건 "조회 결과가 없을 때 화면에 무엇이 남느냐" 다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

type AssetStub = { rowId: number; cardCatalog?: { rowId: number } } | undefined;

const state = vi.hoisted(() => ({
  asset: undefined as AssetStub,
  isLoading: false,
}));

vi.mock("@/features/asset", () => ({
  useAsset: () => ({ data: state.asset, isLoading: state.isLoading }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 본문 위젯은 자체 쿼리를 여럿 건다 — 여기선 "떴나 안 떴나" 만 본다.
vi.mock("@/widgets/card-detail", () => ({
  CardDetailWidget: () => <div data-widget />,
}));
vi.mock("@/shared/lib/porest/responsive", () => ({
  useDeviceSize: () => "desktop",
}));

const { CardDetailPage } = await import("./CardDetailPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.asset = undefined;
  state.isLoading = false;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderAt(path: string) {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/desk/card/:assetRowId" element={<CardDetailPage />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
}

describe("CardDetailPage", () => {
  it("없는 카드는 빈 화면 대신 안내를 남긴다", () => {
    state.asset = undefined;
    renderAt("/desk/card/999999");
    expect(container.textContent).toContain("cardDetail.notFound");
    expect(container.querySelector("[data-widget]")).toBeNull();
  });

  it("아직 불러오는 중엔 안내를 띄우지 않는다 — 스켈레톤 자리다", () => {
    state.asset = undefined;
    state.isLoading = true;
    renderAt("/desk/card/999999");
    expect(container.textContent).not.toContain("cardDetail.notFound");
  });

  it("카드가 있으면 안내 없이 본문을 그린다", () => {
    state.asset = { rowId: 1, cardCatalog: { rowId: 9 } };
    renderAt("/desk/card/1");
    expect(container.textContent).not.toContain("cardDetail.notFound");
    expect(container.querySelector("[data-widget]")).not.toBeNull();
  });

  it("카드 정보가 없는 자산은 종전 안내를 그대로 쓴다", () => {
    state.asset = { rowId: 1 };
    renderAt("/desk/card/1");
    expect(container.textContent).toContain("cardDetail.noCardCatalog");
    expect(container.textContent).not.toContain("cardDetail.notFound");
  });

  it("숫자가 아닌 주소는 잘못된 주소 안내가 먼저다", () => {
    renderAt("/desk/card/abc");
    expect(container.textContent).toContain("cardDetail.invalidAssetId");
  });
});
