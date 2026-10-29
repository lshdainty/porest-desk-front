import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ds/badge";
import { Checkmark } from "@/shared/ds/checkbox";
import { ListButtonItem } from "@/shared/ds/list";
import { TagGroup, TagGroupItem } from "@/shared/ds/tag-group";
import { cn } from "@/shared/lib/cn";
import { dueOf, isDone, tagOf } from "@/pages/todo/model/todo-ledger";
import type { Todo } from "@/entities/todo";

/**
 * 할 일 줄(I-10 12 · 13) — ds List 누르는 줄 + 앞 Checkbox(24 · square · neutral). 줄을 누르면 상세, 체크는 따로 누르는 자리다.
 * 제목은 줄바꿈(말줄임 없음) · 위 맞춤, 설명은 Tag Group 한 줄(태그 이름 또는 "태그 없음" · 메모가 있으면 "메모"),
 * 뒤는 우선순위 Badge(중요만 critical, 보통 · 여유 neutral — 사용자 결정 10-23).
 * 끝낸 줄은 취소선 + fg-disabled 로 그리고 흐리지 않는다 — 누름 · 상세는 그대로다(막힌 줄이 아니다).
 * 체크 이름은 "{제목} 완료"(끝냄은 체크 상태가 읽는다), 지난 마감이면 ", 마감 지남" — 색만으로 알리지 않는다.
 * 누르면 바로 바뀐다: 요청 중에도 칸을 막지 않고 스피너를 그리지 않는다(낙관 갱신은 훅이 한다).
 */
export function TodoRow({
  todo,
  today,
  onToggle,
  onOpen,
}: {
  todo: Todo;
  today: string;
  onToggle: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
}) {
  const { t } = useTranslation("todo");
  const done = isDone(todo);
  const due = dueOf(todo);
  const overdue = !done && !!due && due < today;
  const muted = done && "text-fg-disabled";
  return (
    <ListButtonItem
      align="top"
      onClick={() => onOpen(todo)}
      title={
        <span
          className={cn(
            "transition-colors duration-[var(--motion-duration-color-transition)] ease-[var(--motion-ease-easing)] motion-reduce:transition-none",
            done && "text-fg-disabled line-through",
          )}
        >
          {todo.title}
        </span>
      }
      detail={
        <TagGroup
          size="t3"
          truncate
          className={cn(
            "transition-colors duration-[var(--motion-duration-color-transition)] ease-[var(--motion-ease-easing)] motion-reduce:transition-none",
            muted && "[&_[data-slot=tag-group-item]]:text-fg-disabled",
          )}
        >
          <TagGroupItem>{tagOf(todo) || t("noTag")}</TagGroupItem>
          {todo.content ? <TagGroupItem>{t("memoTag")}</TagGroupItem> : null}
        </TagGroup>
      }
      prefix={
        <Checkmark
          size="large"
          shape="square"
          tone="neutral"
          checked={done}
          onCheckedChange={() => onToggle(todo)}
          aria-label={t(overdue ? "check.nameOverdue" : "check.name", {
            title: todo.title,
          })}
          className={cn(
            // 누르는 영역 44 — 칸 24 둘레로 넓힌다. 줄의 누름 층(::after) 위(z 1)에 놓여 따로 눌린다
            "z-1 before:absolute before:left-1/2 before:top-1/2 before:size-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
            overdue && "data-[state=unchecked]:border-stroke-critical-solid",
          )}
        />
      }
      suffix={
        <Badge
          variant="weak"
          tone={todo.priority === "HIGH" ? "critical" : "neutral"}
          className={cn(
            done && "bg-bg-disabled text-fg-disabled",
            "transition-colors duration-[var(--motion-duration-color-transition)] ease-[var(--motion-ease-easing)] motion-reduce:transition-none",
          )}
        >
          {t(`prio.${todo.priority}`)}
        </Badge>
      }
    />
  );
}
