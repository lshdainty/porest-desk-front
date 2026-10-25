import { useState } from "react";
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
import { money, plusOf } from "@/shared/lib/groo/format";
import { useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import { HIDE_AMOUNTS_MASK } from "@/shared/lib/groo/hide-amounts-core";
import type { ClosedCycleSpan } from "@/entities/expense";
import { ClosedCycleNote } from "@/features/expense/ui/ClosedCycleNote";

/**
 * 고른 거래 일괄 삭제 확인창 (I-07 36) — ds Alert Dialog. 제목 "거래 {n}건을 삭제할까요?" · 설명 "지운 거래는 되돌릴 수 없어요.
 * 합계 {금액}이 {달}에서 빠져요." [취소] `neutralWeak` · [삭제] `criticalSolid`. 고른 거래 중 결제가 끝난 회차의 카드 거래가 있으면
 * 닫힌 회차 안내를 한 번 더한다(Q7-A). 요청 중에는 열린 채 로딩, 실패하면 열린 채 둔다(아무것도 안 지워졌다 — 서버가 전부 아니면 전무).
 */
export function BulkDeleteDialog({
  open,
  count,
  sum,
  monthLabel,
  closedSpan,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  /** 고른 줄의 수입 − 지출(합계) */
  sum: number;
  /** 보고 있는 달 이름("10월") */
  monthLabel: string;
  closedSpan: ClosedCycleSpan | null;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
}) {
  const { t } = useTranslation("expense");
  const { t: tc } = useTranslation("common");
  const [running, setRunning] = useState(false);
  const hidden = useHideAmounts("ledger.txList", "net");
  const amount = hidden
    ? HIDE_AMOUNTS_MASK
    : `${plusOf(sum)}${money(Math.abs(sum))}`;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !running) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{t("bulk.deleteTitle", { count })}</AlertDialogTitle>
        <AlertDialogDescription>
          {t("bulk.deleteMessage", { amount, month: monthLabel })}
          <ClosedCycleNote span={closedSpan} />
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="criticalSolid"
            loading={running}
            onClick={async (e) => {
              e.preventDefault();
              setRunning(true);
              try {
                await onConfirm();
              } catch {
                // 실패하면 확인창은 열린 채 둔다 — 아무것도 지워지지 않았고 오류는 전역 알림이 말한다
              } finally {
                setRunning(false);
              }
            }}
          >
            {tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
