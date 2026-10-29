import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ds/alert-dialog";

/**
 * 삭제 확인 — ds Alert Dialog 한 벌(제목 · 글 · [취소] · [삭제] criticalSolid). 밀기로 지울 때와 상세에서 지울 때가 같은 글이다.
 * 요청 중에는 열린 채 로딩, 실패하면 열린 채 둔다(전역 오류 알림이 말한다). 끝나면 `onClose` 로 닫는다.
 * 지우기 · 잃기가 아닌 확정(예: 지난달 예산 복사)은 `tone="neutralSolid"` 와 동작 이름 `confirmLabel` 을 준다(spec alert-dialog.md "확정 버튼").
 */
export function AlertConfirm({
  title,
  message,
  confirmLabel,
  tone = "criticalSolid",
  onConfirm,
  onClose,
}: {
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  /** 확정의 무게 — 지우기 · 잃기는 criticalSolid(기본), 그 밖은 neutralSolid */
  tone?: "criticalSolid" | "neutralSolid";
  /** 지운다 — 끝날 때까지 로딩. 실패하면 던진다 */
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
}) {
  const { t: tc } = useTranslation("common");
  const [running, setRunning] = useState(false);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !running) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{message}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone}
            loading={running}
            onClick={async (e) => {
              e.preventDefault();
              setRunning(true);
              try {
                await onConfirm();
                onClose();
              } catch {
                // 실패하면 확인창은 열린 채 둔다 — 지워진 것은 없고 오류는 전역 알림이 말한다
              } finally {
                setRunning(false);
              }
            }}
          >
            {confirmLabel ?? tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
