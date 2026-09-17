import { createContext, useContext } from "react";
import type { HideCardKey } from "@/shared/lib/porest/hide-amounts-cards";

/*
 * 카드 컨텍스트와 훅 — 컴포넌트 파일(`hide-amounts.tsx`)과 갈라 둔다.
 * 한 파일이 컴포넌트와 그 밖의 것을 함께 export 하면 Fast Refresh 가 그 파일의 상태를
 * 매번 버린다(react-refresh/only-export-components).
 */

/**
 * 이 아래 금액들이 어느 카드에 속하는지.
 *
 * <p>카드 하나에 금액이 여러 개 박혀 있는 게 보통이라, 그때마다 `card=` 를 적으면
 * 빠뜨리기 쉽다. 카드 최상단에서 한 번 감싸면 안쪽 `<MaskAmount>` 가 전부 그 카드로
 * 잡힌다. 개별로 다르게 하고 싶을 때만 `card=` 로 덮어쓴다.
 */
export const HideCardContext = createContext<HideCardKey | undefined>(
  undefined,
);

/** 감싸는 카드가 있으면 그것, 없으면 넘긴 값. 둘 다 없으면 undefined. */
export function useHideCard(
  card?: HideCardKey | HideCardKey[],
): HideCardKey | HideCardKey[] | undefined {
  const ctx = useContext(HideCardContext);
  return card ?? ctx;
}

/**
 * 이 아래 금액들을 화면 카드와 **무관하게** 가린다 — 자산 하나에 붙은 `isAmountHidden`.
 *
 * <p>{@link HideCardContext} 와 같은 이유로 컨텍스트다. 자산 상세 하나에 금액이 열일곱 군데
 * 박혀 있고 그중 아홉은 하위 컴포넌트(카드 청구·보유종목) 안이라 `force=` 를 손으로 다는
 * 방식으로는 `asset` 을 프롭으로 네 겹 내려보내야 하고, 한 자리만 빠뜨려도 가려야 할
 * 금액이 그대로 보인다. 실제로 그렇게 새서 차트 축만 가려졌다(QA 22차 #1).
 */
export const HideForceContext = createContext(false);

/** 넘긴 값이나 감싸는 강제 가리기 중 하나라도 켜져 있으면 가린다 — 합집합이다. */
export function useHideForce(force?: boolean): boolean {
  return useContext(HideForceContext) || !!force;
}
