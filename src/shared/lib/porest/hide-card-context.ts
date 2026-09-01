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
