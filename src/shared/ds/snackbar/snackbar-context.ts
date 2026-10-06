import * as React from "react";

/*
 * Porest Snackbar 의 띄우는 쪽 — 옵션 타입 · useSnackbar · Provider 가 내려 주는 값. 수치 원본은 porest-design
 * specs/components/snackbar.yaml(값은 src/shared/ds/spec/snackbar.json). 컴포넌트(SnackbarProvider ·
 * SnackbarAvoidOverlap)와 규칙은 snackbar.tsx 머리 주석이다 — 컴포넌트 파일은 컴포넌트만 내보내므로(빠른 새로 고침)
 * 레시피 한 파일에 있던 훅 · 컨텍스트를 여기로 옮겼다.
 */

export type SnackbarTone = "neutral" | "positive" | "critical";

export interface SnackbarAction {
  /** 동작 이름 한두 마디 — "되돌리기" · "잔액 고치기"("확인" · "취소" 로 뭉뚱그리지 않는다) */
  label: string;
  /** 누르면 이 일을 하고 띠를 닫는다. 같은 일을 할 다른 길(목록 · 상세)도 둔다 — 띠는 시간이 지나면 사라진다 */
  onClick: () => void;
}

export interface SnackbarOptions {
  /** 해요체 문장 + 마침표, 무엇이 됐는지 먼저 — "거래를 저장했어요." 서버가 보낸 글 · 영어 · 코드는 쓰지 않는다 */
  message: string;
  /** neutral(기본, 아이콘 없음) · positive(체크) · critical(느낌표 — 다시 하면 되는 가벼운 실패) */
  tone?: SnackbarTone;
  /** 액션 하나 — 있으면 6초 */
  action?: SnackbarAction;
}

export interface SnackbarApi {
  /** 띠를 띄운다 — 떠 있는 띠가 있으면 바로 바꾼다(한 번에 하나) */
  show: (options: SnackbarOptions) => void;
  /** 떠 있는 띠를 닫는다(기다리는 띠도 버린다) */
  dismiss: () => void;
}

// Provider 가 내려 주는 값 — 띄우는 쪽(api)과 피할 자리 등록(avoid). Provider 가 한 번 만들고 그대로 쓴다 —
// 이것을 기다리는 이펙트(피할 자리 등록 · 부르는 쪽의 이펙트)가 Provider 가 다시 그릴 때마다 다시 돌지 않게
export interface SnackbarContextValue {
  api: SnackbarApi;
  avoid: (el: HTMLElement) => () => void;
}

export const SnackbarContext = React.createContext<SnackbarContextValue | null>(
  null,
);

/** 띠를 띄우고 닫는다 — SnackbarProvider 안에서 쓴다. 돌려주는 값은 늘 같다(이펙트 의존성에 두어도 된다) */
export function useSnackbar(): SnackbarApi {
  const ctx = React.useContext(SnackbarContext);
  if (!ctx)
    throw new Error(
      "useSnackbar 는 SnackbarProvider 안에서 쓴다 — 앱 맨 위에 SnackbarProvider 를 한 번 둔다.",
    );
  return ctx.api;
}
