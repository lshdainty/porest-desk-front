import { useState, type ReactNode, type Ref } from "react";
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
import {
  SwipeActions,
  SwipeActionsMenu,
  type SwipeAction,
} from "@/shared/ds/swipe-actions";
import { cn } from "@/shared/lib/cn";
import { ExpenseRow, type Expense } from "@/entities/expense";
import type { ExpenseSwipeAction } from "@/pages/expense/lib/use-expense-swipe-actions";

/**
 * 줄 끝 ⋮ 가 차지하는 폭 — 보이는 40 에서 오른쪽으로 8 을 내민 값(swipe-actions 스펙 `suffixNode` marginRight −8).
 * ⋮ 가 없는 줄(이체 · 시스템 거래)도 이만큼 비워 금액 열이 어긋나지 않게 한다.
 */
export const ROW_MORE_SPACE = "w-x8";

/** ⋮ 가 없는 줄의 오른쪽 빈자리 — 금액 열을 맞춘다 */
export function RowMoreSpacer() {
  return <span aria-hidden className={cn("shrink-0", ROW_MORE_SPACE)} />;
}

/** 이체 줄처럼 밀기 · ⋮ 가 없는 줄을 같은 열에 맞춘다 */
export function PlainRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center">
      <div className="min-w-0 flex-1">{children}</div>
      <RowMoreSpacer />
    </div>
  );
}

/**
 * 가계부 거래 줄 — 밀면 [수정, 삭제], 줄 끝 ⋮ 로 같은 동작(I-07 6).
 *
 * 줄 자체는 `ExpenseRow` 그대로(거래 줄 공용 부품은 I-06 28 몫)이고 이 부품은 **줄을 감싸기만** 한다. 밀기와 ⋮ 는 한 배열에서
 * 나온다 — 스와이프로만 닿는 동작이 없다. 삭제는 확인창부터(`onAsk`) — 글은 상세에서 지울 때와 같다.
 * 시스템이 만든 거래(`actions` 가 빈 배열)는 밀기도 ⋮ 도 없다.
 *
 * 알림 · 검색에서 들어온 줄(`highlighted`)은 List 강조 바탕(bg-brand-weak — list.md Highlight)으로 알린다.
 */
export function ExpenseSwipeRow({
  expense,
  actions,
  rowLabel,
  highlighted,
  rowRef,
  onOpen,
  onAsk,
}: {
  expense: Expense;
  actions: ExpenseSwipeAction[];
  rowLabel: string;
  highlighted?: boolean;
  rowRef?: Ref<HTMLDivElement>;
  onOpen: (e: Expense) => void;
  onAsk: (a: ExpenseSwipeAction) => void;
}) {
  const dsActions: SwipeAction[] = actions.map((a) => ({
    label: a.label,
    icon: a.icon,
    kind: a.kind,
    onSelect: () => {
      if (a.confirm) onAsk(a);
      else void a.onSelect();
    },
  }));
  const row = (
    <div
      className={cn(
        "flex items-center rounded-r2_5 transition-colors",
        highlighted && "bg-bg-brand-weak",
      )}
    >
      <div className="min-w-0 flex-1">
        <ExpenseRow expense={expense} onClick={onOpen} />
      </div>
      {dsActions.length > 0 ? (
        <SwipeActionsMenu
          actions={dsActions}
          rowLabel={rowLabel}
          className="-mr-x2 shrink-0"
        />
      ) : (
        <RowMoreSpacer />
      )}
    </div>
  );
  return (
    <div ref={rowRef}>
      <SwipeActions actions={dsActions} rowLabel={rowLabel} enabled>
        {row}
      </SwipeActions>
    </div>
  );
}

/**
 * 밀기 · ⋮ 로 삭제를 누르면 뜨는 확인창 — ds Alert Dialog. 글은 상세 삭제와 같다(제목 · 설명은 hook 이 넘긴다),
 * 확인 버튼은 누른 동작의 라벨 그대로("삭제"). 요청 중에는 열린 채 로딩, 실패하면 열린 채 둔다(전역 오류 알림이 말한다).
 */
export function SwipeConfirmDialog({
  action,
  onClose,
}: {
  action: ExpenseSwipeAction | null;
  onClose: () => void;
}) {
  const { t: tc } = useTranslation("common");
  const [running, setRunning] = useState(false);
  return (
    <AlertDialog
      open={action != null}
      onOpenChange={(open) => {
        if (!open && !running) onClose();
      }}
    >
      {action?.confirm && (
        <AlertDialogContent>
          <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {action.confirm.message}
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
                  await action.onSelect();
                  onClose();
                } catch {
                  // 실패하면 확인창은 열린 채 둔다 — 지워진 것은 없고 오류는 전역 알림이 말한다
                } finally {
                  setRunning(false);
                }
              }}
            >
              {action.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
