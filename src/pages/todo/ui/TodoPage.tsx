import { useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toLocalDateKey, todayLocalKey } from "@/shared/lib/date";
import { Plus, Sparkles } from "lucide-react";
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodoStatus,
  useDeleteTodo,
} from "@/features/todo";
import { useTodoTags } from "@/features/todo-tag";
import {
  useConstellationSky,
  useConstellationToday,
} from "@/features/constellation";
import {
  ForestReport,
  ForestStrip,
  NightSkyPanel,
} from "@/widgets/constellation";
import { isDone } from "@/pages/todo/lib/visible-todos";
import { todoTagOptions } from "@/pages/todo/lib/todo-tags";
import { TodoMobileLedger } from "./TodoMobileLedger";
import { TodoDesktop } from "./TodoDesktop";
import { TodoDetailDialog } from "./TodoDetailDialog";
import { TodoFormDialog } from "./TodoFormDialog";
import type { Todo, TodoFormValues } from "@/entities/todo";
import { Button, DOUBLE_CLICK_GUARD_MS } from "@/shared/ui/button";
import { FloatingActionButton } from "@/shared/ds/floating-action-button";
import {
  TopNavigation,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { Card } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { PageHead } from "@/shared/ui/groo/page-head";

type OutletCtx = { onAddTx: () => void; mobile: boolean };

// ── 날짜 유틸 ──────────────────────────────────────────────────────────────
// FilterKey·dueKey·dayDiff·inSevenDays·isDone 은 `lib/visible-todos.ts` 로 옮겼다 —
// 목록 필터에 테스트를 붙이려면 렌더링 없이 부를 수 있어야 했다(QA #29).

/** TodoPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useTodoPageData() {
  const todosQ = useTodos();
  return {
    isLoading: todosQ.isLoading,
    failed: todosQ.isError && !todosQ.data,
  };
}

export const TodoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  const { isLoading, failed } = useTodoPageData();
  // 폰은 틀(상단 바 · 달 · 요일 · 단추)을 그리고 데이터 자리만 기다린다(I-10 18) — 데스크톱 스켈레톤은 10-2 가 다시 짠다
  if (isLoading && !mobile) return <TodoPageSkeleton />;
  return <TodoPageInner mobile={mobile} loading={isLoading} failed={failed} />;
};

const TodoPageInner = ({
  mobile,
  loading,
  failed,
}: {
  mobile: boolean;
  loading: boolean;
  failed: boolean;
}) => {
  const { t } = useTranslation("todo");
  const todosQ = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const toggleStatus = useToggleTodoStatus();
  const deleteTodo = useDeleteTodo();
  const todoTagsQ = useTodoTags();

  const todos: Todo[] = useMemo(() => todosQ.data ?? [], [todosQ.data]);
  const today = useMemo(() => todayLocalKey(), []);

  // ── 별자리 게이미피케이션 — 할일 화면엔 스트립/토글 진입점만, 상세는 밤하늘 화면 ──
  const constellationTodayQ = useConstellationToday();
  // 모바일 원장 캘린더 마크(수집★/구름)용 — 이번 달 커버 확보(45일)
  const skyQ = useConstellationSky(45);
  // 오늘 완료 건수 — 완료 이벤트(completedAt) 기준 (히어로 캡션용)
  // completedAt 은 서버가 주는 `[UTC]` 라 로컬 날짜로 바꿔서 비교한다. 문자열을 자르면
  // UTC 날짜라, KST 새벽 0~9시에 끝낸 할일이 전날로 빠진다(today 는 로컬 날짜다).
  const doneToday = useMemo(
    () =>
      todos.filter(
        (td) => isDone(td) && toLocalDateKey(td.completedAt) === today,
      ).length,
    [todos, today],
  );

  // 태그 목록 — TodoTag(설정 관리) + 기존 할 일에 남은 카테고리 union. 둘 다 비면 빈 목록.
  const tagNames = todoTagOptions(todoTagsQ.data, todos);

  // editing: Todo(편집) | { _new: true }(신규) | null(닫힘)
  const [editing, setEditing] = useState<Todo | { _new: true } | null>(null);
  // viewing: 행 클릭 → 읽기 전용 상세 (수정 버튼으로 editing 전환)
  const [viewing, setViewing] = useState<Todo | null>(null);
  // 밤하늘 화면 / 관측 리포트 오버레이
  const [nightSky, setNightSky] = useState(false);
  const [forestReport, setForestReport] = useState(false);
  // 별빛 획득 토스트 — 완료 시 "+N · 수집까지 N별"
  const [starToast, setStarToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 같은 행을 따닥 눌러도 토글은 한 번만 나간다. `pendingIds` 잠금은 요청이 끝나면
  // 풀리는데(통신이 빠르면 100ms 남짓) 두 번째 탭이 그 뒤에 올 수 있고, 완료 원은
  // 공용 Button 이 아니라 원시 <button> 이라 거기 든 더블클릭 방어도 안 걸린다.
  const lastToggleAt = useRef(new Map<number, number>());

  // 완료 토글 + 별빛 토스트 — 서버가 돌려준 실제 적립량(earnedStarlight)으로만 띄운다.
  // 낙관적으로 계산하면 평생 1회 정책에 걸려 적립이 0 이어도 "+N" 이 떠서 거짓말이 된다.
  const onToggleTodo = (td: Todo) => {
    const now = Date.now();
    if (now - (lastToggleAt.current.get(td.rowId) ?? 0) < DOUBLE_CLICK_GUARD_MS)
      return;
    lastToggleAt.current.set(td.rowId, now);
    toggleStatus.mutate(td.rowId, {
      onSuccess: (updated) => {
        const gain = updated.earnedStarlight ?? 0;
        const sky = constellationTodayQ.data;
        if (gain <= 0 || !sky || sky.collected) return;
        const left = Math.max(0, sky.goal - (sky.points + gain));
        setStarToast(
          left === 0
            ? t("starToast.collected", { gain })
            : t("starToast.progress", { gain, left }),
        );
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setStarToast(null), 2200);
      },
    });
  };

  const onSave = (values: TodoFormValues, id?: number) => {
    if (id != null)
      updateTodo.mutate(
        { id, data: values },
        { onSuccess: () => setEditing(null) },
      );
    else createTodo.mutate(values, { onSuccess: () => setEditing(null) });
  };

  // ── 밤하늘 진입점 — 스트립(데스크톱)·토글(모바일 원장). 상세는 오버레이 화면 ──
  const Strip = constellationTodayQ.data ? (
    <ForestStrip
      today={constellationTodayQ.data}
      mobile={mobile}
      onOpen={() => setNightSky(true)}
    />
  ) : null;
  const overlays = (
    <>
      {starToast && (
        <div className="star-toast">
          <Sparkles size={14} /> {starToast}
        </div>
      )}
      {nightSky && (
        <NightSkyPanel
          mobile={mobile}
          doneToday={doneToday}
          onClose={() => setNightSky(false)}
          onOpenReport={() => setForestReport(true)}
        />
      )}
      {forestReport && (
        <ForestReport mobile={mobile} onClose={() => setForestReport(false)} />
      )}
    </>
  );

  const dialog = (
    <>
      {viewing != null && (
        <TodoDetailDialog
          todo={viewing}
          today={today}
          onClose={() => setViewing(null)}
          onEdit={(td) => {
            setViewing(null);
            setEditing(td);
          }}
          onDelete={(id) =>
            deleteTodo.mutateAsync(id).then(() => setViewing(null))
          }
        />
      )}
      {editing != null && (
        <TodoFormDialog
          todo={"_new" in editing ? null : editing}
          today={today}
          tags={tagNames}
          onClose={() => setEditing(null)}
          onSave={onSave}
          submitting={createTodo.isPending || updateTodo.isPending}
        />
      )}
    </>
  );

  // ── 모바일 — 흰 면 하나: 상단 바 + 원장(머리 · 선 · 날짜 묶음) + 떠 있는 [+] ──────
  if (mobile) {
    return (
      <>
        <TopNavigation type="standard">
          <TopNavigationBackButton fallbackHref="/desk/more" />
          <TopNavigationTitle>{t("pageTitle")}</TopNavigationTitle>
        </TopNavigation>
        {/* 목록이 짧아도 흰 면이 화면 아래 끝까지 닿는다 — 아래 96 은 [+] 가 마지막 줄을 가리지 않게 하는 흰 면 안 여백 */}
        <div className="relative flex-1 bg-bg-layer-default pb-[96px]">
          <TodoMobileLedger
            todos={todos}
            tags={tagNames}
            constellationToday={constellationTodayQ.data}
            sky={skyQ.data ?? []}
            doneToday={doneToday}
            pinTop={56}
            loading={loading}
            failed={failed}
            onRetry={() => void todosQ.refetch()}
            onToggle={onToggleTodo}
            holdIds={toggleStatus.holdIds}
            onRowClick={setViewing}
            // 밀기 액션 — 상세 footer 의 수정·삭제와 같은 목적지·같은 뮤테이션.
            onEdit={setEditing}
            onDelete={(td) => deleteTodo.mutateAsync(td.rowId)}
            openNightSky={() => setNightSky(true)}
            openReport={() => setForestReport(true)}
          />
          <FloatingActionButton
            icon={<Plus />}
            aria-label={t("addTodoLabel")}
            onClick={() => setEditing({ _new: true })}
          />
          {dialog}
          {overlays}
        </div>
      </>
    );
  }

  // ── 데스크톱 · 태블릿 ─────────────────────────────────────────────────────
  return (
    <>
      <TodoDesktop
        todos={todos}
        tagNames={tagNames}
        today={today}
        pendingIds={toggleStatus.pendingIds}
        holdIds={toggleStatus.holdIds}
        onToggle={onToggleTodo}
        onOpen={setViewing}
        onAdd={() => setEditing({ _new: true })}
        strip={Strip}
      />
      {dialog}
      {overlays}
    </>
  );
};

// ───────────────────────────── 로딩 스켈레톤 ─────────────────────────────

/** Todo 행 1줄 skeleton — 원형 체크 + 제목/메타 + 우선순위 칩. */
function TodoRowSkeleton({ last }: { last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 4px",
        borderBottom: last ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      <SkeletonBase className="h-[22px] w-[22px] rounded-full shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBase className="h-4 w-3/5 mb-1.5" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="h-5 w-10 rounded-sm shrink-0" />
    </div>
  );
}

/** 데스크톱 우측 분포/우선순위 카드 skeleton — 실제 타이틀 + 막대 행 구조 미러. */
function RatioCardSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: "700", marginBottom: 14 }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <SkeletonBase className="h-4 w-[60px] shrink-0" />
            <SkeletonBase className="h-1.5 flex-1 rounded-full" />
            <SkeletonBase className="h-3 w-9 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * 데스크톱 · 태블릿 Todo 페이지 skeleton — 정적 틀(페이지 헤더)은 실제 렌더,
 * 서버 쿼리(useTodos) 의존 영역(칩/리스트/분포)만 skeleton. 폰은 원장이 틀을 그리고 자리만 기다린다.
 */
function TodoPageSkeleton() {
  const { t } = useTranslation("todo");
  // ── 필터 칩 4개 placeholder ──
  const Chips = (
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBase key={i} className="h-7 w-16 rounded-full" />
      ))}
    </div>
  );
  // ── 리스트 — 날짜 라벨 + 행 skeleton ──
  const rows = (
    <>
      <SkeletonBase className="h-3 w-36 mt-3 mb-2" />
      {[0, 1, 2].map((i) => (
        <TodoRowSkeleton key={i} last={i === 2} />
      ))}
      <SkeletonBase className="h-3 w-36 mt-4 mb-2" />
      {[0, 1].map((i) => (
        <TodoRowSkeleton key={i} last={i === 1} />
      ))}
    </>
  );
  const List = <Card style={{ padding: "8px 20px" }}>{rows}</Card>;

  return (
    <div style={{ padding: 0 }}>
      {/* 정적 페이지 헤더 — 실제 렌더 */}
      <PageHead
        title={t("pageTitle")}
        description={t("subtitle")}
        actions={
          <>
            <Button size="sm" disabled>
              <Plus size={14} /> {t("newTodo")}
            </Button>
          </>
        }
        style={{ padding: "20px 32px 12px", margin: 0, maxWidth: 1320 }}
      />
      <div style={{ padding: "0 32px 24px", maxWidth: 1320 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 20,
            alignItems: "flex-start",
            marginTop: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Chips}
            {List}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SkeletonBase className="h-[62px] w-full rounded-lg" />
            <RatioCardSkeleton title={t("tagDistribution")} rows={4} />
            <RatioCardSkeleton title={t("form.priority")} rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
