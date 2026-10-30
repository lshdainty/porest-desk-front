import { useBackClose } from "@/shared/ds/overlay";

/**
 * 기기 뒤로 가기 = 한 단계 뒤. 단계가 열린 동안 히스토리 칸을 하나 더 쌓아, 시트 전체가 닫히지 않고 이 단계만 닫는다
 * (ds Bottom Sheet 가 쌓은 칸은 그 아래에 그대로 남는다).
 */
export function useStepBack(active: boolean, back: () => void) {
  useBackClose(active, () => back());
}
