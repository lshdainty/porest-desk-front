import { useMemo, useRef, useState } from "react";
import { Spinner } from "@/shared/ui/spinner";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  formatMonthDay,
  formatMonthDayDow,
  toLocalDateKey,
  toLocalDateTime,
  todayLocalKey,
} from "@/shared/lib/date";
import { i18n } from "@/shared/i18n/config";
import {
  Plus,
  Check,
  Sparkles,
  CheckCheck,
  AlignLeft,
  Flame,
  CircleDot,
  Leaf,
} from "lucide-react";
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
import {
  dayDiff,
  dueKey,
  inSevenDays,
  isDone,
  visibleTodos,
  type FilterKey,
} from "@/pages/todo/lib/visible-todos";
import {
  NO_TAG_KEY,
  tagValueToPayload,
  todoTagInitialValue,
  todoTagKey,
  todoTagOptions,
} from "@/pages/todo/lib/todo-tags";
import { TodoMobileLedger } from "./TodoMobileLedger";
import type { Todo, TodoFormValues, TodoPriority } from "@/entities/todo";
import { Button, DOUBLE_CLICK_GUARD_MS } from "@/shared/ui/button";
import { Fab } from "@/shared/ui/porest/fab";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Card } from "@/shared/ui/card";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ConfirmDialog, ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter, ModalViewFooter } from "@/shared/ui/porest/modal-footer";
import { MobileBackHeader } from "@/shared/ui/porest/mobile-back-header";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";

/**
 * 제목·본문 입력 상한 — 서버 `FieldLimits`(TITLE_MAX 200 · CONTENT_MAX 10,000)와 같은 값.
 *
 * 종전엔 제한이 없어 500자 제목이 그대로 나갔고 서버가 컬럼 초과를 500 으로 냈다(QA #24).
 * 서버는 이제 400 으로 거절하지만, 다이얼로그가 열린 채 아무 말도 안 하는 건 그대로라
 * 애초에 못 넘게 막는다. `maxLength` 는 타이핑·붙여넣기를 브라우저가 자르고,
 * `slice` 는 프로그램 입력(자동완성·확장)까지 자른다.
 */
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;

type OutletCtx = { onAddTx: () => void; mobile: boolean };

// 우선순위 칩/아이콘 스타일 (양 플랫폼 공통 확정).
//  high = chart-red + bg 14% 틴트 / med = chart-orange + 14% 틴트 /
//  low  = fg-tertiary + bg-sunken.
const PRIO: Record<
  TodoPriority,
  { labelKey: string; color: string; bg: string; order: number }
> = {
  // 중요=error(빨강)/보통=warning(노랑)/여유=info(파랑) — status-*-fg 는
  // 다크에서 *-light 로 스왑되는 토큰 (사용자 결정, 앱 todo_meta 동기).
  HIGH: {
    labelKey: "prio.HIGH",
    color: "var(--status-danger-fg)",
    bg: "color-mix(in oklab, var(--status-danger-fg) 14%, var(--bg-surface))",
    order: 0,
  },
  MEDIUM: {
    labelKey: "prio.MEDIUM",
    color: "var(--status-warning-fg)",
    bg: "color-mix(in oklab, var(--status-warning-fg) 14%, var(--bg-surface))",
    order: 1,
  },
  LOW: {
    labelKey: "prio.LOW",
    color: "var(--status-info-fg)",
    bg: "color-mix(in oklab, var(--status-info-fg) 14%, var(--bg-surface))",
    order: 2,
  },
};
const PRIO_ORDER: TodoPriority[] = ["HIGH", "MEDIUM", "LOW"];

// ── 날짜 유틸 ──────────────────────────────────────────────────────────────
// FilterKey·dueKey·dayDiff·inSevenDays·isDone 은 `lib/visible-todos.ts` 로 옮겼다 —
// 목록 필터에 테스트를 붙이려면 렌더링 없이 부를 수 있어야 했다(QA #29).

/** 'YYYY-MM-DD' → { full: 'M월 D일 (요일)' }. */
function kDate(s: string): { md: string; full: string } {
  return { md: formatMonthDay(s), full: formatMonthDayDow(s) };
}

/** 상대 시간: 오늘/내일/어제/N일 후/N일 전(±7) · 그 외 'M월 D일'. */
function relativeDate(due: string, today: string): string {
  const diff = dayDiff(today, due);
  if (diff === 0) return i18n.t("date:today");
  if (diff === 1) return i18n.t("date:tomorrow");
  if (diff === -1) return i18n.t("date:yesterday");
  if (diff > 0 && diff <= 7) return i18n.t("date:daysLater", { count: diff });
  if (diff < 0 && diff >= -7) return i18n.t("date:daysAgo", { count: -diff });
  return kDate(due).md;
}

// 그룹 정렬 시 맨 뒤로 보내기 위한 sentinel. `todo-tags` 의 `NO_TAG_KEY` 와 값이 같은데,
// 쓰는 키 공간이 다르다(날짜 그룹 · 태그 묶음) — 한쪽에서 다른 쪽을 비교하지 않는다.
const NO_DUE_KEY = "￿";

/**
 * 묶음 키 → 화면 라벨. sentinel 은 번역 문구로 바꿔 그린다 — U+FFFF 를 그대로 그리면
 * 안 보이는 글자 하나가 태그 이름 자리에 남는다.
 */
function tagKeyLabel(key: string): string {
  return key === NO_TAG_KEY ? i18n.t("todo:noTag") : key;
}

/**
 * Todo.category → 태그 라벨. 태그가 없으면 '태그 없음' 이다.
 *
 * 종전엔 `t.category || '개인'` 이라 **태그를 지운 할 일이 '개인' 으로 보였다**(QA #103).
 * 서버는 태그를 지울 때 그 할 일의 `category` 를 실제로 비우므로, 화면이 이름을 지어내면
 * 삭제 확인창이 약속한 "태그 없음으로 남아요" 와 어긋난다. 메모 화면과 같은 규칙이다.
 */
function todoTagLabel(td: Todo): string {
  return tagKeyLabel(todoTagKey(td));
}

/** TodoPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useTodoPageData() {
  const todosQ = useTodos();
  return { isLoading: todosQ.isLoading };
}

export const TodoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  const { isLoading } = useTodoPageData();
  if (isLoading) return <TodoPageSkeleton mobile={mobile} />;
  return <TodoPageInner mobile={mobile} />;
};

const TodoPageInner = ({ mobile }: { mobile: boolean }) => {
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

  const [filter, setFilter] = useState<FilterKey>("today");
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

  // 필터별 카운트 (칩 뱃지).
  const counts = useMemo(() => {
    let t = 0;
    let w = 0;
    let a = 0;
    let d = 0;
    for (const todo of todos) {
      if (isDone(todo)) {
        d++;
        continue;
      }
      a++;
      const key = dueKey(todo.dueDate);
      if (key === today) t++;
      if (inSevenDays(today, key)) w++;
    }
    return { today: t, week: w, all: a, done: d };
  }, [todos, today]);

  // 필터 → 정렬(우선순위 desc → due asc) → 마감일별 그룹.
  // holdIds — 방금 완료를 누른 행은 잠깐 자리를 지킨다(QA #29). 안 지키면 그 행이
  // 즉시 빠지고 아래 행이 올라와, 따닥 누른 두 번째 탭이 다른 할 일을 완료시킨다.
  const groups = useMemo(() => {
    const visible = visibleTodos(todos, filter, today, toggleStatus.holdIds);

    const sorted = [...visible].sort((a, b) => {
      const pa = PRIO[a.priority].order;
      const pb = PRIO[b.priority].order;
      if (pa !== pb) return pa - pb;
      const da = dueKey(a.dueDate) ?? NO_DUE_KEY;
      const db = dueKey(b.dueDate) ?? NO_DUE_KEY;
      return da.localeCompare(db);
    });

    const map = new Map<string, Todo[]>();
    for (const t of sorted) {
      const k = dueKey(t.dueDate) ?? NO_DUE_KEY;
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [todos, filter, today, toggleStatus.holdIds]);

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

  // ── 필터 칩 4종 + 카운트 ──────────────────────────────────────────────────
  const FilterChips = (
    <Tabs value={filter} onValueChange={(v) => v && setFilter(v as FilterKey)}>
      <TabsList variant="pills" size="sm">
        {(
          [
            { id: "today", label: t("today"), count: counts.today },
            { id: "week", label: t("thisWeek"), count: counts.week },
            { id: "all", label: t("status.ALL"), count: counts.all },
            { id: "done", label: t("status.COMPLETED"), count: counts.done },
          ] as const
        ).map((f) => {
          const active = filter === f.id;
          return (
            <TabsTrigger key={f.id} variant="pills" size="sm" value={f.id}>
              {f.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  fontVariantNumeric: "tabular-nums",
                  opacity: active ? 0.85 : 0.55,
                  marginLeft: 2,
                }}
              >
                {f.count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );

  // ── 행 ────────────────────────────────────────────────────────────────────
  const Row = ({ todo, last }: { todo: Todo; last: boolean }) => {
    const prio = PRIO[todo.priority];
    const done = isDone(todo);
    const key = dueKey(todo.dueDate);
    const overdue = !done && !!key && key < today;
    return (
      <div
        onClick={() => setViewing(todo)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 4px",
          cursor: "pointer",
          borderBottom: last ? "none" : "1px solid var(--border-subtle)",
          transition:
            "background var(--motion-duration-fast) var(--motion-ease-out)",
          opacity: done ? 0.55 : 1,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-muted)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <button
          type="button"
          disabled={toggleStatus.pendingIds.has(todo.rowId)}
          aria-busy={toggleStatus.pendingIds.has(todo.rowId) || undefined}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTodo(todo);
          }}
          aria-label={done ? t("uncomplete") : t("status.COMPLETED")}
          aria-pressed={done}
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: done
              ? "0"
              : `2px solid ${overdue ? "var(--color-chart-red)" : "var(--border-strong)"}`,
            background: done ? "var(--color-primary)" : "transparent",
            cursor: "pointer",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            transition:
              "all var(--motion-duration-fast) var(--motion-ease-out)",
          }}
        >
          {toggleStatus.pendingIds.has(todo.rowId) ? (
            <Spinner size="sm" />
          ) : (
            done && <Check size={13} color="#fff" strokeWidth={3} />
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "var(--fg-primary)",
              letterSpacing: "-0.01em",
              textDecoration: done ? "line-through" : "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {todo.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              fontSize: 12,
            }}
          >
            <span
              style={{
                color: overdue
                  ? "var(--color-chart-red)"
                  : "var(--fg-tertiary)",
                fontWeight: overdue ? "600" : "500",
              }}
            >
              {key ? relativeDate(key, today) : t("noDueDate")}
            </span>
            <span style={dot} />
            <span style={{ color: "var(--fg-tertiary)" }}>
              {todoTagLabel(todo)}
            </span>
            {todo.content && (
              <>
                <span style={dot} />
                <AlignLeft size={11} color="var(--fg-tertiary)" />
              </>
            )}
          </div>
        </div>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: "var(--radius-sm)",
            background: prio.bg,
            color: prio.color,
            fontSize: 11,
            fontWeight: "600",
            flexShrink: 0,
          }}
        >
          {t(prio.labelKey)}
        </span>
      </div>
    );
  };

  // ── 빈 상태 ───────────────────────────────────────────────────────────────
  const EmptyState = (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--bg-sunken)",
          color: "var(--fg-tertiary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        {filter === "done" ? <CheckCheck size={24} /> : <Sparkles size={24} />}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: "var(--fg-primary)",
          marginBottom: 4,
        }}
      >
        {filter === "today"
          ? t("empty.today")
          : filter === "week"
            ? t("empty.week")
            : filter === "done"
              ? t("empty.done")
              : t("empty.all")}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>
        {filter === "done" ? t("emptyDesc.done") : t("emptyDesc.default")}
      </div>
    </div>
  );

  // ── 그룹 리스트 ───────────────────────────────────────────────────────────
  const listBody = (
    <>
      {groups.length === 0
        ? EmptyState
        : groups.map(([k, items]) => (
            <div key={k}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "var(--fg-tertiary)",
                  letterSpacing: "0.04em",
                  padding: mobile ? "12px 0 6px" : "14px 0 8px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: 4,
                }}
              >
                {k === NO_DUE_KEY ? t("noDueDate") : kDate(k).full} ·{" "}
                {t("kanban.count", { count: items.length })}
              </div>
              {items.map((td, i) => (
                <Row key={td.rowId} todo={td} last={i === items.length - 1} />
              ))}
            </div>
          ))}
    </>
  );
  // 모바일 카드 다이어트 — 리스트 카드 벗김(날짜 라벨+행이 배경 위에 바로).
  const ListCard = mobile ? (
    <div>{listBody}</div>
  ) : (
    <Card style={{ padding: "8px 20px" }}>{listBody}</Card>
  );

  // ── 데스크톱 우측: 태그별 분포 ────────────────────────────────────────────
  const TagDistribution = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: "700", marginBottom: 14 }}>
        {t("tagDistribution")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* '태그 없음' 도 한 줄이다 — 없으면 태그를 뗀 할 일이 분포에서 통째로 사라진다. */}
        {[...tagNames, NO_TAG_KEY].map((tag) => {
          const tagged = todos.filter((td) => todoTagKey(td) === tag);
          const total = tagged.length;
          if (total === 0) return null;
          const done = tagged.filter(isDone).length;
          return (
            <div
              key={tag}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "var(--fg-primary)",
                  width: 60,
                  flexShrink: 0,
                }}
              >
                {tagKeyLabel(tag)}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--bg-sunken)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(done / total) * 100}%`,
                    height: "100%",
                    background: "var(--color-primary)",
                    borderRadius: 999,
                  }}
                />
              </div>
              <span
                className="num"
                style={{
                  fontSize: 12,
                  color: "var(--fg-tertiary)",
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {done}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );

  // ── 데스크톱 우측: 우선순위 ───────────────────────────────────────────────
  const PriorityCard = (
    <Card style={{ padding: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
        {t("form.priority")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PRIO_ORDER.map((k) => {
          const p = PRIO[k];
          const n = todos.filter((t) => !isDone(t) && t.priority === k).length;
          const PIcon =
            k === "HIGH" ? Flame : k === "MEDIUM" ? CircleDot : Leaf;
          return (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "var(--radius-sm)",
                  background: p.bg,
                  color: p.color,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PIcon size={14} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: "600" }}>
                {t(p.labelKey)}
              </span>
              <span
                className="num"
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: "700",
                  color: p.color,
                }}
              >
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const dialog = (
    <>
      {viewing != null && (
        <TodoDetailDialog
          todo={viewing}
          mobile={mobile}
          today={today}
          onClose={() => setViewing(null)}
          onEdit={(td) => {
            setViewing(null);
            setEditing(td);
          }}
          onDelete={(id) =>
            deleteTodo.mutate(id, { onSuccess: () => setViewing(null) })
          }
          deleting={deleteTodo.isPending}
        />
      )}
      {editing != null && (
        <TodoEditDialog
          todo={"_new" in editing ? null : editing}
          mobile={mobile}
          today={today}
          tags={tagNames}
          onClose={() => setEditing(null)}
          onSave={onSave}
          submitting={createTodo.isPending || updateTodo.isPending}
        />
      )}
    </>
  );

  // ── 모바일 — 캘린더+일별 리스트 원장 (design todo-mobile.jsx) ─────────────
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t("pageTitle")} />
        <div style={{ position: "relative", paddingBottom: 96 }}>
          <TodoMobileLedger
            todos={todos}
            tags={tagNames}
            constellationToday={constellationTodayQ.data}
            sky={skyQ.data ?? []}
            doneToday={doneToday}
            pinTop={46}
            onToggle={onToggleTodo}
            pendingIds={toggleStatus.pendingIds}
            holdIds={toggleStatus.holdIds}
            onRowClick={setViewing}
            // 스와이프 액션 — 상세 footer 의 수정·삭제와 같은 목적지·같은 뮤테이션.
            onEdit={setEditing}
            onDelete={(td) => deleteTodo.mutateAsync(td.rowId)}
            deleting={deleteTodo.isPending}
            openNightSky={() => setNightSky(true)}
            openReport={() => setForestReport(true)}
          />
          <Fab
            aria-label={t("addTodoLabel")}
            onClick={() => setEditing({ _new: true })}
          />
          {dialog}
          {overlays}
        </div>
      </>
    );
  }

  // ── 데스크톱 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 0 }}>
      <div
        className="page__head"
        style={{ padding: "24px 28px 12px", margin: 0, maxWidth: 1320 }}
      >
        <div>
          <h1>{t("pageTitle")}</h1>
          <div className="sub">{t("subtitle")}</div>
        </div>
        <div className="right">
          <Button size="sm" onClick={() => setEditing({ _new: true })}>
            <Plus size={14} /> {t("newTodo")}
          </Button>
        </div>
      </div>
      <div style={{ padding: "0 28px 24px", maxWidth: 1320 }}>
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
            {FilterChips}
            {ListCard}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Strip}
            {TagDistribution}
            {PriorityCard}
          </div>
        </div>
      </div>
      {dialog}
      {overlays}
    </div>
  );
};

const dot = {
  width: 2,
  height: 2,
  borderRadius: 999,
  background: "var(--border-strong)",
  flexShrink: 0,
} as const;

// ───────────────────────────── 상세 다이얼로그 ─────────────────────────────

/** 행 클릭 → 읽기 전용 상세. TxDetailDialog 패턴 미러 (hero + 필드 행 + 뷰 footer). */
function TodoDetailDialog({
  todo,
  mobile,
  today,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  todo: Todo;
  mobile: boolean;
  today: string;
  onClose: () => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}) {
  const { t } = useTranslation("todo");
  const { t: tc } = useTranslation("common");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prio = PRIO[todo.priority];
  const done = isDone(todo);
  const key = dueKey(todo.dueDate);
  const overdue = !done && !!key && key < today;

  const Footer = (
    <ModalViewFooter
      onDelete={() => setConfirmDelete(true)}
      deleting={deleting}
      onEdit={() => onEdit(todo)}
    />
  );

  return (
    <>
      <ModalShell
        title={t("detailTitle")}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {/* Hero — 우선순위 틴트 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${prio.bg}, var(--bg-surface))`,
            border: `1px solid color-mix(in oklch, ${prio.color} 20%, transparent)`,
            borderRadius: "var(--radius-xl)",
            padding: 22,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", marginBottom: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-tile)",
                background: prio.bg,
                color: prio.color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {done ? <CheckCheck size={20} /> : <CircleDot size={20} />}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--text-title-md)",
              fontWeight: "800",
              letterSpacing: "-0.015em",
              color: "var(--fg-primary)",
              textDecoration: done ? "line-through" : "none",
              overflowWrap: "anywhere",
            }}
          >
            {todo.title}
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: overdue ? "var(--color-chart-red)" : "var(--fg-tertiary)",
              fontWeight: overdue ? "600" : "400",
              marginTop: 6,
            }}
          >
            {key ? relativeDate(key, today) : t("noDueDate")}
          </div>
        </div>

        {/* Field rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <DetailFieldRow
            label={t("form.dueDate")}
            value={
              <span style={{ fontWeight: "500" }}>
                {key ? kDate(key).full : t("noDueDate")}
              </span>
            }
          />
          <DetailFieldRow
            label={t("tag")}
            value={
              <span style={{ fontWeight: "500" }}>{todoTagLabel(todo)}</span>
            }
          />
          <DetailFieldRow
            label={t("form.priority")}
            value={
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: prio.bg,
                  color: prio.color,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {t(prio.labelKey)}
              </span>
            }
          />
          <DetailFieldRow
            label={t("detail.status")}
            value={
              <span
                style={{
                  fontWeight: "600",
                  color: done ? "var(--fg-brand)" : "var(--fg-secondary)",
                }}
              >
                {done ? t("status.COMPLETED") : t("status.PENDING")}
              </span>
            }
          />
          {done && todo.completedAt && (
            <DetailFieldRow
              label={t("detail.completedAt")}
              value={
                <span style={{ fontWeight: "500" }}>
                  {/* completedAt 은 `[UTC]` — 파싱해서 로컬 시각으로 찍는다.
                      못 읽으면 원문을 그대로 보여 준다(앱 todo_detail_dialog 와 같은 폴백) —
                      값 칸을 비우면 "완료 시각이 없다" 로 읽혀 서버가 준 값이 사라진다 */}
                  {toLocalDateTime(todo.completedAt) ?? todo.completedAt}
                </span>
              }
            />
          )}
          <DetailFieldRow
            label={t("form.memo")}
            value={
              <span
                style={{
                  fontWeight: "500",
                  color: todo.content
                    ? "var(--fg-primary)"
                    : "var(--fg-tertiary)",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  textAlign: "right",
                }}
              >
                {todo.content || t("detail.none")}
              </span>
            }
          />
        </div>
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteConfirm.title")}
          message={t("deleteConfirm.message", { name: todo.title })}
          confirmLabel={tc("delete")}
          danger
          loading={deleting}
          onCancel={() => !deleting && setConfirmDelete(false)}
          onConfirm={() => onDelete(todo.rowId)}
        />
      )}
    </>
  );
}

/** 상세 필드 행 — TxDetailDialog FieldRow 미러. */
function DetailFieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        background: "var(--bg-surface)",
        fontSize: "var(--text-label-sm)",
        gap: 12,
      }}
    >
      <span
        style={{ color: "var(--fg-tertiary)", minWidth: 72, flexShrink: 0 }}
      >
        {label}
      </span>
      <div style={{ marginLeft: "auto" }}>{value}</div>
    </div>
  );
}

// ───────────────────────────── 편집 다이얼로그 ─────────────────────────────

function TodoEditDialog({
  todo,
  mobile,
  today,
  tags,
  onClose,
  onSave,
  submitting,
}: {
  todo: Todo | null;
  mobile: boolean;
  today: string;
  tags: string[];
  onClose: () => void;
  onSave: (values: TodoFormValues, id?: number) => void;
  submitting?: boolean;
}) {
  const { t } = useTranslation("todo");
  const { t: tc } = useTranslation("common");
  const isNew = !todo;
  const [title, setTitle] = useState(todo?.title ?? "");
  const [due, setDue] = useState(dueKey(todo?.dueDate) ?? today);
  // 있는 할 일은 지금 태그(없으면 '태그 없음'), 새 할 일도 '태그 없음' — 규칙은 lib 에.
  const [tag, setTag] = useState(todoTagInitialValue(todo));
  const [priority, setPriority] = useState<TodoPriority>(
    todo?.priority ?? "MEDIUM",
  );
  const [note, setNote] = useState(todo?.content ?? "");
  const [error, setError] = useState(false);

  const save = () => {
    if (!title.trim()) {
      setError(true);
      return;
    }
    onSave(
      {
        title: title.trim(),
        content: note,
        priority,
        // sentinel 은 서버로 안 나간다 — 태그를 떼는 건 null 이다(키를 빼면 옛 값이 남는다).
        category: tagValueToPayload(tag),
        // 마감일도 같다 — 이 편집기가 그리는 칸이라 비운 채 저장하면 지워져야 한다.
        // `undefined` 로 키를 빼면 화면은 지워진 척 닫히고 옛 마감일이 남았다(QA #111).
        dueDate: due || null,
      },
      todo?.rowId,
    );
  };

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={tc("save")}
      saving={submitting}
      onCancel={onClose}
    />
  );

  return (
    <ModalShell
      title={isNew ? t("newTodo") : t("editTodoTitle")}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 14 }}>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value.slice(0, TITLE_MAX));
            if (error) setError(false);
          }}
          placeholder={t("editTitlePlaceholder")}
          aria-invalid={error}
          maxLength={TITLE_MAX}
          autoFocus
        />
        {error && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "var(--status-danger-subtle)",
              color: "var(--status-danger-fg)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
            }}
          >
            {t("form.titleRequired")}
          </div>
        )}
      </Field>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>{t("form.dueDate")}</FieldLabel>
          <InputDatePicker
            value={due}
            onValueChange={setDue}
            placeholder="yyyy-mm-dd"
          />
        </Field>
        <Field>
          <FieldLabel>{t("tag")}</FieldLabel>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(tags.includes(tag) || tag === NO_TAG_KEY
                ? tags
                : [tag, ...tags]
              ).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
              <SelectItem value={NO_TAG_KEY}>{t("noTag")}</SelectItem>
            </SelectContent>
          </Select>
          {tags.length === 0 && (
            <div
              style={{
                marginTop: 6,
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              {t("tagEmptyHint")}
            </div>
          )}
        </Field>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t("form.priority")}</FieldLabel>
        <div
          style={{
            display: "inline-flex",
            gap: 2,
            padding: 3,
            background: "var(--bg-sunken)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {PRIO_ORDER.map((k) => {
            const p = PRIO[k];
            const active = priority === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPriority(k)}
                style={{
                  background: active ? "var(--bg-surface)" : "transparent",
                  color: active ? p.color : "var(--fg-secondary)",
                  border: 0,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  fontFamily: "inherit",
                }}
              >
                {t(p.labelKey)}
              </button>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>{t("form.memo")}</FieldLabel>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, CONTENT_MAX))}
          placeholder={t("form.memoPlaceholder")}
          maxLength={CONTENT_MAX}
          rows={3}
        />
      </Field>
    </ModalShell>
  );
}

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
 * Todo 페이지 skeleton — 정적 틀(페이지 헤더)은 실제 렌더,
 * 서버 쿼리(useTodos) 의존 영역(원장 핀/리스트 · 칩/리스트/분포)만 skeleton.
 */
function TodoPageSkeleton({ mobile }: { mobile: boolean }) {
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
  const List = mobile ? (
    <div>{rows}</div>
  ) : (
    <Card style={{ padding: "8px 20px" }}>{rows}</Card>
  );

  if (mobile) {
    // 모바일 원장 skeleton — 월네비/오늘상태/캘린더 핀 자리 + 일별 리스트
    return (
      <>
        <MobileBackHeader title={t("pageTitle")} />
        {/* 실렌더 원장(Shell = spacing-xl 24)과 같은 좌우 여백 */}
        <div style={{ padding: "10px 24px 96px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "4px 0 10px",
            }}
          >
            <SkeletonBase className="h-6 w-6 rounded-md" />
            <SkeletonBase className="h-5 w-12" />
            <SkeletonBase className="h-6 w-6 rounded-md" />
            <SkeletonBase className="h-6 w-6 rounded-md ml-auto" />
          </div>
          <SkeletonBase className="h-6 w-40 mb-1.5" />
          <SkeletonBase className="h-3.5 w-56 mb-4" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonBase key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
          {List}
        </div>
      </>
    );
  }
  return (
    <div style={{ padding: 0 }}>
      {/* 정적 페이지 헤더 — 실제 렌더 */}
      <div
        className="page__head"
        style={{ padding: "24px 28px 12px", margin: 0, maxWidth: 1320 }}
      >
        <div>
          <h1>{t("pageTitle")}</h1>
          <div className="sub">{t("subtitle")}</div>
        </div>
        <div className="right">
          <Button size="sm" disabled>
            <Plus size={14} /> {t("newTodo")}
          </Button>
        </div>
      </div>
      <div style={{ padding: "0 28px 24px", maxWidth: 1320 }}>
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
