import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Pencil, Trash2 } from "lucide-react";
import {
  useExpenseBudgets,
  useExpenseCategories,
  useRangeSummary,
  useCreateExpenseBudget,
  useUpdateExpenseBudget,
  useDeleteExpenseBudget,
} from "@/features/expense";
import type { ExpenseBudget, ExpenseCategory } from "@/entities/expense";
import { MINUS } from "@/shared/lib/groo/format";
import { won, useMasked } from "@/shared/lib/groo/money-text";
import { Icon } from "@/shared/ui/groo/primitives";
import { AlertConfirm } from "@/shared/ui/groo/alert-confirm";
import { Button } from "@/shared/ds/button";
import { useSnackbar } from "@/shared/ds/snackbar";
import { Callout } from "@/shared/ds/callout";
import { Card, CardContent } from "@/shared/ds/card";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import { SwipeActions, type SwipeAction } from "@/shared/ui/swipe-actions";
import { ManagerHead, ManagerShell } from "@/shared/ui/groo/manager-layout";
import { MonthBar, MonthControls } from "@/shared/ui/groo/month-bar";
import {
  BandEmpty,
  BandFailure,
  BigAmount,
  Eyebrow,
  KeyValueRows,
  BarredItem,
  KeyValueSkeleton,
  ListTitle,
  StackedAmount,
  MeterBar,
  StatGrid,
  type KeyValue,
} from "@/shared/ui/groo/band-parts";
import { BudgetFormDialog, type BudgetDraft } from "./BudgetFormDialog";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";

/*
 * 빈 배열 상수 — `data ?? []` 는 로딩 중 매 렌더 **새 배열**이 되어, 이걸 의존성으로
 * 든 `useMemo` 가 통째로 무효화된다(memo 를 적어 둔 의미가 없어진다). 상수를 돌려주면
 * 참조가 고정된다.
 */
const EMPTY_BUDGETS: ExpenseBudget[] = [];
const EMPTY_CATEGORIES: ExpenseCategory[] = [];

const currentMonthKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
};

const prevMonthKey = (key: string): string => {
  const [y, m] = key.split("-").map(Number) as [number, number];
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
};

export function BudgetManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("budget");
  const { t: tCommon } = useTranslation("common");
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [year, month] = monthKey.split("-").map(Number) as [number, number];
  const prevKey = prevMonthKey(monthKey);
  const [prevY, prevM] = prevKey.split("-").map(Number) as [number, number];

  const budgetsQ = useExpenseBudgets({ year, month });
  const { data: budgets, isLoading: loadingBudgets } = budgetsQ;
  const prevBudgetsQ = useExpenseBudgets({ year: prevY, month: prevM });
  const categoriesQ = useExpenseCategories();
  const { data: categories, isLoading: loadingCategories } = categoriesQ;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate).padStart(2, "0")}`;
  const summaryQ = useRangeSummary(monthStart, monthEnd);
  const { data: monthlySummary, isLoading: loadingSummary } = summaryQ;

  const createMut = useCreateExpenseBudget();
  const updateMut = useUpdateExpenseBudget();
  const deleteMut = useDeleteExpenseBudget();
  const snackbar = useSnackbar();

  const [editing, setEditing] = useState<ExpenseBudget | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExpenseBudget | null>(
    null,
  );
  const [editMonthly, setEditMonthly] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);

  const budgetList = budgets ?? EMPTY_BUDGETS;
  const categoryList: ExpenseCategory[] = categories ?? EMPTY_CATEGORIES;

  // 월 전체 예산 = categoryRowId === null 인 항목
  const monthlyBudget = useMemo(
    () => budgetList.find((b) => b.categoryRowId === null) ?? null,
    [budgetList],
  );
  const monthlyLimit = monthlyBudget?.budgetAmount ?? 0;

  // 카테고리별 예산 (categoryRowId !== null)
  const categoryBudgets = useMemo(
    () => budgetList.filter((b) => b.categoryRowId !== null),
    [budgetList],
  );

  // 예산 추가 가능 카테고리 = EXPENSE top-level(BudgetFormDialog 의 selectable 과 동일).
  // 전부 예산 보유 시 "예산 추가" 버튼 비활성화.
  const allCategoriesBudgeted = useMemo(() => {
    const top = categoryList.filter(
      (c) => c.expenseType === "EXPENSE" && c.parentRowId == null,
    );
    const used = new Set(categoryBudgets.map((b) => b.categoryRowId));
    return top.length > 0 && top.every((c) => used.has(c.rowId));
  }, [categoryList, categoryBudgets]);

  // 카테고리별 실제 사용 금액: monthlySummary.categoryBreakdown 을 categoryRowId + 부모 카테고리(roll-up) 기준으로 집계
  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>();
    const breakdown = monthlySummary?.categoryBreakdown ?? [];
    for (const item of breakdown) {
      // 미분류는 특정 카테고리가 없으니 카테고리 예산에서 빼지 않는다 —
      // 전체 예산(카테고리 없는 예산)에서만 차감된다(서버도 같은 규칙).
      if (item.categoryRowId == null) continue;
      map.set(
        item.categoryRowId,
        (map.get(item.categoryRowId) ?? 0) + item.totalAmount,
      );
      // 부모에도 누적 (예: 예산은 부모 카테고리에 걸려 있을 수 있음)
      if (item.parentCategoryRowId != null) {
        map.set(
          item.parentCategoryRowId,
          (map.get(item.parentCategoryRowId) ?? 0) + item.totalAmount,
        );
      }
    }
    return map;
  }, [monthlySummary]);

  const totalAssigned = useMemo(
    () => categoryBudgets.reduce((s, b) => s + b.budgetAmount, 0),
    [categoryBudgets],
  );
  const totalSpent = monthlySummary?.totalExpense ?? 0;
  const remaining = monthlyLimit - totalAssigned;

  const categoryMap = useMemo(() => {
    const m = new Map<number, ExpenseCategory>();
    categoryList.forEach((c) => m.set(c.rowId, c));
    return m;
  }, [categoryList]);

  const loading = loadingBudgets || loadingCategories || loadingSummary;
  // 질의 하나라도 내용 없이 실패하면 0원 · 빈 목록으로 보이지 않게 실패 한 곳으로(I-08 23)
  const failedQs = [budgetsQ, categoriesQ, summaryQ].filter(
    (q) => q.isError && q.data === undefined,
  );
  const retryAll = () => {
    for (const q of failedQs) void q.refetch();
  };

  const saveCategoryBudget = (draft: BudgetDraft) => {
    const existing = editing !== "new" && editing ? editing : null;
    if (existing) {
      updateMut.mutate(
        { id: existing.rowId, budgetAmount: draft.budgetAmount },
        { onSuccess: () => setEditing(null) },
      );
    } else {
      // 새 카테고리 예산 생성 — 중복 시 update
      const dup = categoryBudgets.find(
        (b) => b.categoryRowId === draft.categoryRowId,
      );
      if (dup) {
        updateMut.mutate(
          { id: dup.rowId, budgetAmount: draft.budgetAmount },
          { onSuccess: () => setEditing(null) },
        );
      } else {
        createMut.mutate(
          {
            categoryRowId: draft.categoryRowId,
            budgetAmount: draft.budgetAmount,
            budgetYear: year,
            budgetMonth: month,
          },
          { onSuccess: () => setEditing(null) },
        );
      }
    }
  };

  const saveMonthlyBudget = (value: number) => {
    if (monthlyBudget) {
      updateMut.mutate(
        { id: monthlyBudget.rowId, budgetAmount: value },
        { onSuccess: () => setEditMonthly(false) },
      );
    } else {
      createMut.mutate(
        {
          categoryRowId: null,
          budgetAmount: value,
          budgetYear: year,
          budgetMonth: month,
        },
        { onSuccess: () => setEditMonthly(false) },
      );
    }
  };

  const copyFromLastMonth = async () => {
    const prevList = prevBudgetsQ.data ?? [];
    if (prevList.length === 0) {
      setConfirmCopy(false);
      return;
    }
    const existingByKey = new Map<string, ExpenseBudget>();
    for (const b of budgetList)
      existingByKey.set(`${b.categoryRowId ?? "overall"}`, b);
    // 확인창을 연 채 '복사' 버튼 로딩 — 모든 mutation 이 끝날 때까지 기다린다(AlertConfirm 이 닫고, 실패하면 열린 채 둔다).
    await Promise.all(
      prevList.map((p) => {
        const key = `${p.categoryRowId ?? "overall"}`;
        const exists = existingByKey.get(key);
        return exists
          ? updateMut.mutateAsync({
              id: exists.rowId,
              budgetAmount: p.budgetAmount,
            })
          : createMut.mutateAsync({
              categoryRowId: p.categoryRowId ?? null,
              budgetAmount: p.budgetAmount,
              budgetYear: year,
              budgetMonth: month,
            });
      }),
    );
  };

  // 확인창이 대상을 이름으로 짚는다 — 줄 이름과 같은 값(spec alert-dialog.md "대상은 이름으로")
  const deleteName = (b: ExpenseBudget) =>
    (b.categoryRowId != null
      ? categoryMap.get(b.categoryRowId)?.categoryName
      : null) ??
    b.categoryName ??
    t("manager.categoryFallback", { id: b.categoryRowId });

  // 이번 달에 이미 있어 지난달 값으로 바뀌는 예산 수 — 0 이면 잃는 것이 없다(alert-dialog.md:99 잃는 확정은 criticalSolid)
  const overwriteCount = (prevBudgetsQ.data ?? []).filter((p) =>
    budgetList.some(
      (x) => (x.categoryRowId ?? "overall") === (p.categoryRowId ?? "overall"),
    ),
  ).length;

  // 실패는 확인창을 닫고 Snackbar 로 — 창 위에 겹치지 않는다. "다시 시도" 는 같은 확정을 다시 한다
  const deleteFailed = (b: ExpenseBudget) =>
    snackbar.show({
      message: t("deleteFailed"),
      tone: "critical",
      action: {
        label: tCommon("retry"),
        onClick: () => {
          deleteMut.mutateAsync(b.rowId).catch(() => deleteFailed(b));
        },
      },
    });
  const copyFailed = () =>
    snackbar.show({
      message: t("copyFailed"),
      tone: "critical",
      action: { label: tCommon("retry"), onClick: () => setConfirmCopy(true) },
    });

  const submitting =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const hasMonthly = monthlyBudget != null;
  const overAllocated = hasMonthly && remaining < 0;

  const copyButton = (
    <Button
      type="button"
      variant={mobile ? "neutralWeak" : "neutralOutline"}
      size="small"
      onClick={() => setConfirmCopy(true)}
      disabled={
        prevBudgetsQ.isLoading || (prevBudgetsQ.data?.length ?? 0) === 0
      }
      title={
        mobile
          ? undefined
          : (prevBudgetsQ.data?.length ?? 0) === 0
            ? t("manager.noPrevBudget")
            : t("manager.copyPrevTitle")
      }
    >
      <Copy aria-hidden />
      {t("copyLastMonth")}
    </Button>
  );

  const body =
    failedQs.length > 0 ? (
      <div className={mobile ? "px-x6 pb-x6 pt-x3" : undefined}>
        <BandFailure title={t("manager.loadFailed")} onRetry={retryAll} />
      </div>
    ) : loading ? (
      <ManagerSkeleton mobile={mobile} />
    ) : (
      <>
        <TotalArea
          mobile={mobile}
          month={month}
          monthlyBudget={monthlyBudget}
          monthlyLimit={monthlyLimit}
          totalSpent={totalSpent}
          totalAssigned={totalAssigned}
          remaining={remaining}
          overAllocated={overAllocated}
          onEdit={() => setEditMonthly(true)}
          disabled={loading}
        />
        <CategoryArea
          mobile={mobile}
          categoryBudgets={categoryBudgets}
          categoryMap={categoryMap}
          spentByCategory={spentByCategory}
          allCategoriesBudgeted={allCategoriesBudgeted}
          loading={loading}
          deleting={deleteMut.isPending}
          onAdd={() => setEditing("new")}
          onEdit={setEditing}
          onDelete={setConfirmDelete}
          onDeleteConfirmed={(b) => deleteMut.mutateAsync(b.rowId)}
        />
      </>
    );

  return (
    <>
      {mobile ? (
        // 폰 — 흰 면 하나(I-08 18). 달 줄이 맨 위, 카드 · 선 · 띠 없음. 좌우 24 는 구역이 갖는다
        <div data-slot="budget-manager-phone">
          <MonthBar
            monthKey={monthKey}
            onChange={setMonthKey}
            right={copyButton}
          />
          <div className="pt-x3">{body}</div>
        </div>
      ) : (
        <ManagerShell>
          {/* 제목 줄 오른쪽은 비운다 — 달 고르기 · 지난달 복사는 본문 위 도구 줄(S4 · I-16 36).
              1024 에서 달 글이 두 줄로 접히던 자리다. 제목 줄 ↔ 도구 줄 ↔ 첫 카드 16 */}
          <ManagerHead
            title={t("manager.title")}
            description={t("manager.description")}
          />
          <div data-slot="budget-tools" className="flex items-center">
            <MonthControls monthKey={monthKey} onChange={setMonthKey} />
            <div className="ml-auto">{copyButton}</div>
          </div>
          {body}
        </ManagerShell>
      )}

      {editing && (
        <BudgetFormDialog
          kind="category"
          budget={editing === "new" ? null : editing}
          month={month}
          categories={categoryList}
          existing={categoryBudgets}
          onClose={() => setEditing(null)}
          onSave={saveCategoryBudget}
          submitting={submitting}
        />
      )}
      {editMonthly && (
        <BudgetFormDialog
          kind="total"
          budget={monthlyBudget}
          month={month}
          categories={categoryList}
          existing={categoryBudgets}
          onClose={() => setEditMonthly(false)}
          onSave={(draft) => saveMonthlyBudget(draft.budgetAmount)}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <AlertConfirm
          title={t("deleteTitle", { name: deleteName(confirmDelete) })}
          message={t("deleteMessage")}
          confirmLabel={tCommon("delete")}
          onConfirm={() => deleteMut.mutateAsync(confirmDelete.rowId)}
          onError={() => deleteFailed(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {confirmCopy && (
        <AlertConfirm
          title={t("copyTitle")}
          message={
            overwriteCount > 0
              ? t("copyOverwriteMessage", { count: overwriteCount })
              : t("copyMessage", {
                  prevYear: prevY,
                  prevMonth: prevM,
                  count: prevBudgetsQ.data?.length ?? 0,
                  year,
                  month,
                })
          }
          confirmLabel={t("copy")}
          tone={overwriteCount > 0 ? "criticalSolid" : "neutralSolid"}
          onError={copyFailed}
          onConfirm={copyFromLastMonth}
          onClose={() => setConfirmCopy(false)}
        />
      )}
    </>
  );
}

// ── 총 예산 ─────────────────────────────────────────────────────
function TotalArea({
  mobile,
  month,
  monthlyBudget,
  monthlyLimit,
  totalSpent,
  totalAssigned,
  remaining,
  overAllocated,
  onEdit,
  disabled,
}: {
  mobile: boolean;
  month: number;
  monthlyBudget: ExpenseBudget | null;
  monthlyLimit: number;
  totalSpent: number;
  totalAssigned: number;
  remaining: number;
  overAllocated: boolean;
  onEdit: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation("budget");
  const { t: tCommon } = useTranslation("common");
  const mask = useMasked("budget.manage");
  const stats: KeyValue[] = [
    { key: "spent", name: t("manager.spent"), value: mask(won(totalSpent)) },
    {
      key: "assigned",
      name: t("manager.assigned"),
      value: mask(won(totalAssigned)),
    },
    {
      key: "assignable",
      name: t("manager.assignable"),
      value: mask((remaining < 0 ? MINUS : "+") + won(Math.abs(remaining))),
      tone: remaining < 0 ? "critical" : "brand",
    },
  ];
  const content = (
    <>
      <div className="flex items-center justify-between gap-x2">
        <Eyebrow>{t("manager.monthlyTotal", { month })}</Eyebrow>
        <Button
          type="button"
          variant="ghost"
          ghostColor="neutralMuted"
          size="small"
          className="-my-x2 -mr-x3_5"
          onClick={onEdit}
          disabled={disabled}
        >
          {monthlyBudget ? tCommon("edit") : t("manager.setBudget")}
        </Button>
      </div>
      {monthlyBudget ? (
        <>
          <BigAmount className="mt-x3" value={mask(won(monthlyLimit))} />
          <MeterBar
            className="mt-x4"
            label={t("manager.monthlyTotal", { month })}
            value={totalSpent}
            max={monthlyLimit}
            formatValue={(n) => mask(won(n))}
          />
        </>
      ) : (
        <p className="m-0 mt-x3 text-t5 text-fg-neutral-subtle">
          {t("manager.notSet")}
        </p>
      )}
    </>
  );
  const alert = overAllocated ? (
    <Callout tone="critical">
      {t("manager.overCap", { amount: mask(won(Math.abs(remaining))) })}
    </Callout>
  ) : null;
  if (mobile) {
    return (
      <section data-section="total">
        <div className="px-x6">{content}</div>
        <KeyValueRows
          className="mt-x3 [&_[data-slot=list-content]]:py-x2"
          items={stats}
        />
        {alert && <div className="px-x6 pt-x3">{alert}</div>}
        <div className={alert ? "pb-x6" : "pb-x4"} />
      </section>
    );
  }
  return (
    <Card>
      <CardContent className="gap-0">
        {content}
        <StatGrid items={stats} />
        {alert && <div className="pt-x3">{alert}</div>}
      </CardContent>
    </Card>
  );
}

// ── 카테고리별 예산 ─────────────────────────────────────────────
function CategoryArea({
  mobile,
  categoryBudgets,
  categoryMap,
  spentByCategory,
  allCategoriesBudgeted,
  loading,
  deleting,
  onAdd,
  onEdit,
  onDelete,
  onDeleteConfirmed,
}: {
  mobile: boolean;
  categoryBudgets: ExpenseBudget[];
  categoryMap: Map<number, ExpenseCategory>;
  spentByCategory: Map<number, number>;
  allCategoriesBudgeted: boolean;
  loading: boolean;
  deleting: boolean;
  onAdd: () => void;
  onEdit: (b: ExpenseBudget) => void;
  onDelete: (b: ExpenseBudget) => void;
  onDeleteConfirmed: (b: ExpenseBudget) => Promise<unknown>;
}) {
  const { t } = useTranslation("budget");
  const { t: tCommon } = useTranslation("common");
  const mask = useMasked("budget.manage");
  const title = (
    <ListTitle
      id="budget-manage-list-title"
      first={!mobile}
      action={{
        label: t("addBudget"),
        onClick: onAdd,
        disabled: loading || allCategoriesBudgeted,
        title: allCategoriesBudgeted
          ? t("manager.allBudgetedTooltip")
          : undefined,
      }}
    >
      {t("manager.categoryBudgets", { count: categoryBudgets.length })}
    </ListTitle>
  );
  const rows =
    categoryBudgets.length === 0 ? (
      <div className="px-x6 pb-x3">
        <BandEmpty>{t("manager.emptyCategory")}</BandEmpty>
      </div>
    ) : (
      <List aria-labelledby="budget-manage-list-title">
        {categoryBudgets.map((b) => {
          const catId = b.categoryRowId as number;
          const cat = categoryMap.get(catId);
          const palette = getPaletteByColor(cat?.color);
          const spent = spentByCategory.get(catId) ?? 0;
          const limitAmt = b.budgetAmount;
          const over = spent > limitAmt;
          const label =
            cat?.categoryName ??
            b.categoryName ??
            t("manager.categoryFallback", { id: catId });
          // 밀면 수정 · 삭제가 바로 나온다. 탭은 그대로 수정으로 — 스와이프는 지름길이지 유일한 경로가 아니다(swipe-actions.md · WCAG 2.1.1).
          // 데스크톱은 줄 끝에 수정 · 삭제 아이콘이 있어 통과시킨다.
          const swipeActions: SwipeAction[] = [
            {
              label: tCommon("edit"),
              icon: <Pencil />,
              kind: "primary",
              onSelect: () => onEdit(b),
            },
            {
              label: tCommon("delete"),
              icon: <Trash2 />,
              kind: "destructive",
              // 아래 AlertConfirm 과 같은 키 — 같은 삭제인데 문구가 갈리면 경로에 따라 다른 말이 나온다
              confirm: {
                title: t("deleteTitle", { name: label }),
                message: t("deleteMessage"),
                loading: deleting,
              },
              onSelect: () => onDeleteConfirmed(b),
            },
          ];
          const common = {
            prefix: (
              <ListTile
                style={{ background: palette.bg, color: palette.color }}
              >
                <Icon name={cat?.icon ?? "tag"} size={20} />
              </ListTile>
            ),
            title: label,
            detail: (
              <span className={over ? "text-fg-critical" : undefined}>
                {over
                  ? t("manager.overLimitAmt", {
                      amount: mask(won(spent - limitAmt)),
                    })
                  : t("remainingAmt", {
                      amount: mask(won(Math.max(0, limitAmt - spent))),
                    })}
              </span>
            ),
          };
          const values = (
            <StackedAmount
              main={mask(won(spent))}
              sub={mask(won(limitAmt))}
              critical={over}
            />
          );
          return (
            <BarredItem
              key={b.rowId}
              wrap={(inner) => (
                <SwipeActions
                  rowId={`budget-${b.rowId}`}
                  groupTag="budget-manager-list"
                  rowLabel={label}
                  enabled={mobile}
                  actions={swipeActions}
                >
                  {inner}
                </SwipeActions>
              )}
              row={
                mobile ? (
                  <ListButtonItem
                    as="div"
                    align="top"
                    {...common}
                    suffix={values}
                    onClick={() => onEdit(b)}
                  />
                ) : (
                  <ListItem
                    as="div"
                    align="top"
                    {...common}
                    suffix={
                      <>
                        {values}
                        <span className="inline-flex shrink-0 items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            layout="iconOnly"
                            size="small"
                            aria-label={t("manager.editNamed", {
                              name: label,
                            })}
                            onClick={() => onEdit(b)}
                          >
                            <Pencil aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            layout="iconOnly"
                            size="small"
                            ghostColor="critical"
                            aria-label={t("manager.deleteNamed", {
                              name: label,
                            })}
                            onClick={() => onDelete(b)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </span>
                      </>
                    }
                  />
                )
              }
              bar={
                <MeterBar
                  label={t("budgetName", { name: label })}
                  value={spent}
                  max={limitAmt}
                  formatValue={(n) => mask(won(n))}
                />
              }
            />
          );
        })}
      </List>
    );
  if (mobile) {
    return (
      <section data-section="list" className="pb-x3">
        {title}
        {rows}
      </section>
    );
  }
  return (
    <Card body="list">
      {title}
      {rows}
    </Card>
  );
}

/** 불러오는 중 — 달 줄 · 틀은 그대로, 값 자리만 스켈레톤(총 예산 구역 + 목록 줄) */
function ManagerSkeleton({ mobile }: { mobile: boolean }) {
  const total = (
    <div aria-hidden>
      <Skeleton text="t3" className="w-1/4" />
      <Skeleton text="t9" radius="8" className="mt-x3 w-1/2" />
      <Skeleton className="mt-x4 h-2 w-full" radius="full" />
    </div>
  );
  const rows = (
    <div aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex items-center gap-x3 px-x6 py-x3">
            <Skeleton radius="12" className="size-x10 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-x0_5">
              <Skeleton text="t5" className="w-1/2" />
              <Skeleton text="t3" className="w-1/3" />
            </div>
            <Skeleton text="t5" className="w-x10 shrink-0" />
          </div>
          <div className="px-x6 pb-x3 pt-x1">
            <Skeleton className="h-2 w-full" radius="full" />
          </div>
        </div>
      ))}
    </div>
  );
  if (mobile) {
    return (
      <>
        <div className="px-x6">{total}</div>
        <KeyValueSkeleton rows={3} />
        <div className="pb-x4" />
        {rows}
      </>
    );
  }
  return (
    <>
      <Card>
        <CardContent className="gap-0">{total}</CardContent>
      </Card>
      <Card body="list">{rows}</Card>
    </>
  );
}
