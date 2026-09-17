// `force` — 화면 카드와 **무관하게** 가린다(자산 하나에 붙은 `isAmountHidden`).
//
// 두 축은 합집합이다. 카드 가리기는 "이 화면의 이 묶음을 가린다" 는 사용자 설정이고,
// 자산 숨김은 "이 자산은 늘 가린다" 는 대상의 속성이라 서로를 덮지 않는다 —
// 한쪽이 다른 쪽을 끄면 사용자는 켜 둔 것이 왜 안 듣는지 알 수 없다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ cardHidden: false }));

vi.mock("@/shared/lib/porest/hide-amounts-core", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  useHideAmounts: () => state.cardHidden,
  useHideCard: () => undefined,
}));

const { MaskAmount, HideUnit, HideForce } = await import("./hide-amounts");

let container: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(node));
  return container.textContent ?? "";
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  state.cardHidden = false;
});

describe("MaskAmount force", () => {
  it("카드도 자산도 안 가리면 금액이 보인다", () => {
    expect(render(<MaskAmount mask="•••">12,000</MaskAmount>)).toContain(
      "12,000",
    );
  });

  it("자산만 가려도 가려진다 — 카드 설정과 무관하다", () => {
    const text = render(
      <MaskAmount mask="•••" force>
        12,000
      </MaskAmount>,
    );
    expect(text).toContain("•••");
  });

  it("카드만 가려도 가려진다 — 종전 동작 그대로", () => {
    state.cardHidden = true;
    expect(render(<MaskAmount mask="•••">12,000</MaskAmount>)).toContain("•••");
  });

  // 합집합이라는 뜻 — 자산을 안 가려 뒀다고 카드 설정이 풀리면 안 된다.
  it("카드가 가리고 있으면 force=false 가 그걸 풀지 않는다", () => {
    state.cardHidden = true;
    const text = render(
      <MaskAmount mask="•••" force={false}>
        12,000
      </MaskAmount>,
    );
    expect(text).toContain("•••");
  });
});

describe("HideUnit force", () => {
  it("자산만 가려도 통째로 숨는다", () => {
    expect(render(<HideUnit force>원</HideUnit>).trim()).toBe("");
  });

  it("아무것도 안 가리면 보인다", () => {
    expect(render(<HideUnit>원</HideUnit>)).toContain("원");
  });
});

// 자산 상세는 금액이 열일곱 군데 박혀 있고 그중 아홉은 하위 컴포넌트 안이다. 자리마다
// `force=` 를 달던 동안 차트 축 하나만 가려지고 히어로 잔액·카드 청구가 그대로 보였다
// (QA 22차 #1) — 그래서 묶음으로 거는 자리를 만들었다.
describe("HideForce — 묶음으로 강제 가리기", () => {
  it("감싸면 안쪽 금액이 force 없이도 가려진다", () => {
    const text = render(
      <HideForce value>
        <MaskAmount mask="•••">12,000</MaskAmount>
      </HideForce>,
    );
    expect(text).toContain("•••");
    expect(text).not.toContain("12,000");
  });

  it("여러 겹 안쪽까지 닿는다 — 하위 컴포넌트가 asset 을 몰라도 된다", () => {
    function Deep() {
      return <MaskAmount mask="•••">12,000</MaskAmount>;
    }
    function Outer() {
      return (
        <div>
          <Deep />
        </div>
      );
    }
    const text = render(
      <HideForce value>
        <Outer />
      </HideForce>,
    );
    expect(text).toContain("•••");
    expect(text).not.toContain("12,000");
  });

  it("단위도 함께 숨는다 — '•••원' 이 남지 않는다", () => {
    const text = render(
      <HideForce value>
        <MaskAmount mask="•••">12,000</MaskAmount>
        <HideUnit>원</HideUnit>
      </HideForce>,
    );
    expect(text).toContain("•••");
    expect(text).not.toContain("원");
  });

  it("value=false 면 아무것도 바뀌지 않는다", () => {
    const text = render(
      <HideForce value={false}>
        <MaskAmount mask="•••">12,000</MaskAmount>
      </HideForce>,
    );
    expect(text).toContain("12,000");
  });

  // 합집합 — 감싼 값이 꺼져 있어도 개별 force 는 살아 있다.
  it("value=false 여도 안쪽 force 는 듣는다", () => {
    const text = render(
      <HideForce value={false}>
        <MaskAmount mask="•••" force>
          12,000
        </MaskAmount>
      </HideForce>,
    );
    expect(text).toContain("•••");
    expect(text).not.toContain("12,000");
  });
});
