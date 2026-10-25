import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Tag, Tags, Trash2 } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { Callout } from "@/shared/ds/callout";
import { useDsText } from "@/shared/ds/i18n";
import { List, ListButtonItem, ListHeader, ListTile } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import { Skeleton } from "@/shared/ds/skeleton";
import { SwipeActions } from "@/shared/ds/swipe-actions";
import { AlertConfirm } from "@/shared/ui/groo/alert-confirm";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import type { TodoTag } from "@/entities/todo-tag";
import {
  useCreateTodoTag,
  useDeleteTodoTag,
  useTodoTags,
  useUpdateTodoTag,
} from "@/features/todo-tag";
import { TagEditDialog } from "./TodoTagEditDialog";

type EditingState = TodoTag | { kind: "new" } | null;

/**
 * 할 일 태그 설정 — 폰 본문(I-10 33 ~ 36). 흰 면 하나(설정 하위 화면 껍데기의 흰 면 위): 안내 Callout(informative · 제목 없음 · 흰 면 위
 * 예외) → 목록 제목 "할 일 태그 · N" + 오른쪽 글 버튼 "태그 추가" → 색 타일 40 줄(제목 줄바꿈 · "N건에 사용 중"). 줄 사이 선 · 카드가 없다.
 * 줄 누름 = 수정 시트, 밀기 = [수정, 삭제](삭제는 확인창 한 번). 줄 끝 ⋮ 는 가계부에서 걷혀 새로 만들지 않는다.
 */
export function TodoTagManagerMobile() {
  const { t } = useTranslation("todo");
  const { t: tc } = useTranslation("common");
  const dsT = useDsText();
  const tagsQ = useTodoTags();
  const createMut = useCreateTodoTag();
  const updateMut = useUpdateTodoTag();
  const deleteMut = useDeleteTodoTag();
  const [editing, setEditing] = useState<EditingState>(null);
  const [askDelete, setAskDelete] = useState<TodoTag | null>(null);

  const list = tagsQ.data ?? [];
  const isLoading = tagsQ.isLoading;
  const failed = tagsQ.isError && !tagsQ.data;
  const submitting = createMut.isPending || updateMut.isPending;

  const onSave = (values: { tagName: string; color: string }) => {
    if (editing && "rowId" in editing) {
      updateMut.mutate(
        { id: editing.rowId, data: values },
        { onSuccess: () => setEditing(null) },
      );
    } else {
      createMut.mutate(values, { onSuccess: () => setEditing(null) });
    }
  };

  let body;
  if (failed) {
    body = (
      <ResultSection
        kind="failure"
        title={t("tags.loadFailed")}
        description={t("tdm.loadFailedDesc")}
        primaryAction={{
          label: dsT("common.retry"),
          onClick: () => void tagsQ.refetch(),
        }}
      />
    );
  } else if (isLoading) {
    body = (
      <div aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-x3 px-x6 py-x3">
            <Skeleton className="size-x10 shrink-0" radius="12" />
            <div className="flex min-w-0 flex-1 flex-col gap-x0_5">
              <Skeleton text="t5" className="w-28" />
              <Skeleton text="t3" className="w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (list.length === 0) {
    body = (
      <ResultSection
        size="medium"
        icon={<Tags />}
        title={t("tags.empty")}
        description={t("tags.emptyHint", { label: `"${t("tags.new")}"` })}
      />
    );
  } else {
    body = list.map((tag) => {
      const palette = getPaletteByColor(tag.color);
      const count = tag.usageCount ?? 0; // 서버 GROUP BY 집계(미배포 시 0)
      return (
        <SwipeActions
          key={tag.rowId}
          rowLabel={tag.tagName}
          enabled
          actions={[
            {
              label: tc("edit"),
              icon: <Pencil />,
              kind: "primary",
              onSelect: () => setEditing(tag),
            },
            {
              label: tc("delete"),
              icon: <Trash2 />,
              kind: "destructive",
              onSelect: () => setAskDelete(tag),
            },
          ]}
        >
          <List>
            <ListButtonItem
              title={tag.tagName}
              detail={t("tags.usage", { count })}
              prefix={
                <ListTile
                  style={{ background: palette.bg, color: palette.color }}
                >
                  <Tag />
                </ListTile>
              }
              onClick={() => setEditing(tag)}
            />
          </List>
        </SwipeActions>
      );
    });
  }

  return (
    <div className="pb-x6">
      {/* 안내 — 흰 면 위 예외. 위 16 · 아래 8 */}
      <div className="px-global-gutter pb-x2 pt-x4">
        <Callout tone="informative" icon={<Tag />}>
          {t("tags.desc")}
        </Callout>
      </div>
      <ListHeader as="div" variant="boldSolid" className="mt-x4">
        <h2 className="m-0 font-[inherit] text-[length:inherit]">
          {t("tags.title")} · {list.length}
        </h2>
        <Button
          variant="ghost"
          size="small"
          flush="right"
          className="-mr-x3_5 text-fg-neutral-muted font-bold"
          onClick={() => setEditing({ kind: "new" })}
        >
          {t("tags.new")}
        </Button>
      </ListHeader>
      {body}

      {editing && (
        <TagEditDialog
          tag={"rowId" in editing ? editing : null}
          existing={list}
          onClose={() => setEditing(null)}
          onSave={onSave}
          submitting={submitting}
        />
      )}
      {askDelete && (
        <AlertConfirm
          title={t("tags.deleteTitle")}
          // count 를 넘긴다 — 안 넘기면 자리표시자가 그대로 보인다(QA #104)
          message={t("tags.deleteMessage", {
            name: askDelete.tagName,
            count: askDelete.usageCount ?? 0,
          })}
          onConfirm={() => deleteMut.mutateAsync(askDelete.rowId)}
          onClose={() => setAskDelete(null)}
        />
      )}
    </div>
  );
}
