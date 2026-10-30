import { useBackClose } from "@/shared/ds/overlay";

/**
 * 기기 뒤로 가기 = 한 단계 뒤. 단계가 열린 동안 히스토리 칸을 하나 더 쌓아, 시트 전체가 닫히지 않고 이 단계만 닫는다
 * (ds Bottom Sheet 가 쌓은 칸은 그 아래에 그대로 남는다).
 *
 * `back` 은 단계를 닫았으면 true, 바뀐 글이 있어 물었으면 false 를 돌려준다. 물어서 닫지 않았을 때는 ds 훅의 `keep` 으로 칸을 다시 쌓는다 —
 * 안 쌓으면 [계속 작성] 을 두 번 고른 뒤 뒤로 가기가 칸을 소진해 묻지 않고 페이지를 떠난다(검수 M1).
 */
export function useStepBack(active: boolean, back: () => boolean) {
  useBackClose(active, (keep) => {
    if (!back()) keep();
  });
}
