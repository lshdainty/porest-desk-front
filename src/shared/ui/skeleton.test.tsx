// 스켈레톤은 흰 면 위에서 bg-neutral-weak 다 — 투명 짝(bg-neutral-weak-alpha)은 Chip solid · Segmented 트랙 두 부품에만 쓴다
// (DESIGN "바닥 위의 채움" 01-040 B · skeleton.yaml background). I-01 A2 가 셋을 투명 짝으로 바꾼 것을 스펙 값으로 되돌렸다(I-04 18).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Skeleton, SkeletonShimmer } from "./skeleton";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

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

describe("Skeleton 바탕", () => {
  it("Skeleton · SkeletonShimmer 모두 bg-bg-neutral-weak 이고 투명 짝이 아니다", () => {
    act(() =>
      root.render(
        <>
          <Skeleton data-testid="a" />
          <SkeletonShimmer data-testid="b" />
        </>,
      ),
    );
    for (const id of ["a", "b"]) {
      const cls = container
        .querySelector(`[data-testid=${id}]`)!
        .getAttribute("class")!
        .split(" ");
      expect(cls).toContain("bg-bg-neutral-weak");
      expect(cls).not.toContain("bg-bg-neutral-weak-alpha");
    }
  });
});
