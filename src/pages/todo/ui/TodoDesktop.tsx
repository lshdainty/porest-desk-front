import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { PageHead } from "@/shared/ui/groo/page-head";
import {
  dueKey,
  inSevenDays,
  isDone,
  visibleTodos,
  type FilterKey,
} from "@/pages/todo/lib/visible-todos";
import { NO_TAG_KEY, todoTagKey } from "@/pages/todo/lib/todo-tags";
import {
  NO_DUE_KEY,
  PRIO,
  PRIO_ORDER,
  dot,
  kDate,
  relativeDate,
  tagKeyLabel,
  todoTagLabel,
} from "@/pages/todo/model/todo-view";
import type { Todo } from "@/entities/todo";

/**
 * 데스크톱 · 태블릿 할 일 — 탭 + 마감일 묶음 카드 + 오른쪽 요약 카드(10-2 가 달력 + 날짜 묶음으로 다시 짠다).
 * 폰이 아닌 폭의 갈래를 `TodoPage` 에서 그대로 옮긴 파일이다(I-10 4 — 값 · 글 · 클래스 변화 0).
 */
export function TodoDesktop({
  todos,
  tagNames,
  today,
  pendingIds,
  holdIds,
  onToggle,
  onOpen,
  onAdd,
  strip,
}: {
  todos: Todo[];
  tagNames: string[];
  today: string;
  pendingIds: ReadonlySet<number>;
  holdIds: ReadonlySet<number>;
  onToggle: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
  onAdd: () => void;
  /** 밤하늘 진입 줄(범위 밖 — 들어가는 길만) */
  strip: ReactNode;
}) {
  const { t } = useTranslation("todo");
  const mobile = false;
  const [filter, setFilter] = useState<FilterKey>("today");

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
    const visible = visibleTodos(todos, filter, today, holdIds);

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
  }, [todos, filter, today, holdIds]);

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
        onClick={() => onOpen(todo)}
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
          disabled={pendingIds.has(todo.rowId)}
          aria-busy={pendingIds.has(todo.rowId) || undefined}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo);
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
            background: done ? "var(--color-bg-brand-solid)" : "transparent",
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
          {pendingIds.has(todo.rowId) ? (
            <Spinner size="sm" />
          ) : (
            done && (
              <Check
                size={13}
                color="var(--color-static-white)"
                strokeWidth={3}
              />
            )
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
                    background: "var(--color-bg-brand-solid)",
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

  return (
    <div style={{ padding: 0 }}>
      <PageHead
        title={t("pageTitle")}
        description={t("subtitle")}
        actions={
          <>
            <Button size="sm" onClick={onAdd}>
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
            {FilterChips}
            {ListCard}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {strip}
            {TagDistribution}
            {PriorityCard}
          </div>
        </div>
      </div>
    </div>
  );
}
