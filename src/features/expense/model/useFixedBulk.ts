import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSnackbar } from "@/shared/ds/snackbar";
import type { ExpenseType } from "@/entities/expense";
import { groupForFixed } from "../lib/fixed-groups";
import { useBulkMarkFixed, useExpenses } from "./useExpenses";

export type FixedBulkTarget = "fixed" | "variable";

/**
 * 거래를 고정으로 정리하는 화면의 상태(대화상자 · 폰 페이지가 함께 쓴다) — 종류(지출 · 수입), 바꿀 방향, 고른 묶음, 적용.
 * 돈 · 잔액은 안 움직이고 통계의 분류만 바뀐다.
 */
export function useFixedBulk({
  startDate,
  endDate,
  onClose,
}: {
  startDate: string;
  endDate: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("stats");
  const [kind, setKindState] = useState<ExpenseType>("EXPENSE");
  const [target, setTarget] = useState<FixedBulkTarget>("fixed");
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const snackbar = useSnackbar();
  const q = useExpenses({ startDate, endDate });
  const mut = useBulkMarkFixed();
  const groups = groupForFixed(q.data ?? [], kind, t("fixed.bulk.untitled"));
  const toFixed = target === "fixed";
  const setKind = (next: ExpenseType) => {
    setKindState(next);
    setPicked(new Set());
  };
  // 같은 id · 같은 방향으로 보낸다 — 실패 스낵바의 [다시 시도] 는 다시 묻지 않고 바로 재전송
  const send = (ids: number[], toFixedDir: boolean) =>
    mut.mutate(
      { ids, isFixed: toFixedDir, silent: true },
      {
        onSuccess: ({ updatedCount }) => {
          toast.success(
            t(toFixedDir ? "fixed.bulk.doneFixed" : "fixed.bulk.doneVariable", {
              count: updatedCount,
            }),
          );
          onClose();
        },
        onError: () =>
          snackbar.show({
            message: t("fixed.bulk.failed"),
            tone: "critical",
            action: {
              label: t("fixed.bulk.retry"),
              onClick: () => send(ids, toFixedDir),
            },
          }),
      },
    );
  const apply = () => {
    if (picked.size === 0 || mut.isPending) return;
    send([...picked], toFixed);
  };
  return {
    kind,
    setKind,
    target,
    setTarget,
    picked,
    setPicked,
    q,
    mut,
    groups,
    toFixed,
    apply,
  };
}
