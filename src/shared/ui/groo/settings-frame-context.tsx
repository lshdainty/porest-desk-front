import { createContext, useContext, useEffect } from "react";

/**
 * 설정 데스크톱 · 태블릿 틀(I-16)이 본문 위젯에 건네는 것 둘.
 *
 * ① `headSlot` — 틀이 본문 칸 맨 위에 둔 "제목 줄 자리". 위젯이 그리는 `ManagerHead` 는 위젯 안이 아니라 이 자리로 그려져,
 *    제목 줄 ↔ 첫 내용 간격(T7)이 위젯마다 갈리지 않는다(위젯이 감싸는 사이가 16 · 32 로 다르다).
 * ② `leaveGuard` — 화면을 떠나기 전에 묻는 위젯(금액 가리기: 바꾼 채면 "버릴까요?")이 맡겨 두는 가드.
 *    틀의 "‹ {부모}" 가 이동 전에 부른다.
 */
export type LeaveGuard = (proceed: () => void) => void;

export interface SettingsFrameContextValue {
  headSlot: HTMLElement | null;
  /** 떠나기 가드를 맡긴다(null 이면 거둔다) */
  setLeaveGuard: (guard: LeaveGuard | null) => void;
  /** 지금 맡겨진 가드 */
  getLeaveGuard: () => LeaveGuard | null;
}

export const SettingsFrameContext =
  createContext<SettingsFrameContextValue | null>(null);

export function useSettingsFrame() {
  return useContext(SettingsFrameContext);
}

/** 위젯이 떠나기 가드를 틀에 맡긴다 — 틀 밖(폰 · 단독 렌더)에서는 아무 일도 하지 않는다. */
export function useSettingsLeaveGuard(guard: LeaveGuard | null) {
  const frame = useSettingsFrame();
  const set = frame?.setLeaveGuard;
  useEffect(() => {
    if (!set) return;
    set(guard);
    return () => set(null);
  }, [set, guard]);
}
