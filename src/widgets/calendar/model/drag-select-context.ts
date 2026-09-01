import { createContext, useContext } from "react";

/*
 * 드래그 선택 컨텍스트와 훅 — 프로바이더 컴포넌트(`drag-select-provider.tsx`)와
 * 갈라 둔다. 한 파일이 컴포넌트와 그 밖의 것을 함께 export 하면 Fast Refresh 가
 * 그 파일의 상태를 매번 버린다(react-refresh/only-export-components).
 */

export interface DragSelectContextType {
  isDragSelecting: boolean;
  selectionStart: Date | null;
  selectionEnd: Date | null;
  startSelection: (date: Date) => void;
  updateSelection: (date: Date) => void;
  endSelection: () => void;
  isDateInSelection: (date: Date) => boolean;
}

export const DragSelectContext = createContext<DragSelectContextType | null>(
  null,
);

export const useDragSelect = () => {
  const context = useContext(DragSelectContext);
  if (!context) {
    throw new Error("useDragSelect must be used within a DragSelectProvider");
  }
  return context;
};
