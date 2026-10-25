import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Pencil, Plus, Tag, Tags, Trash2 } from "lucide-react";
import { SwipeActions, type SwipeAction } from "@/shared/ui/swipe-actions";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { settingsRowPadding } from "@/shared/ui/groo/manage-row-tokens";
import { ConfirmDialog } from "@/shared/ui/groo/dialogs";
import { ManagerHead, ManagerShell } from "@/shared/ui/groo/manager-layout";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import type { TodoTag } from "@/entities/todo-tag";
import { TagEditDialog } from "./TodoTagEditDialog";
import { TodoTagManagerMobile } from "./TodoTagManagerMobile";
import {
  useCreateTodoTag,
  useDeleteTodoTag,
  useTodoTags,
  useUpdateTodoTag,
} from "@/features/todo-tag";

type EditingState = TodoTag | { kind: "new" } | null;

// 모바일 카드 다이어트 — 리스트 셸: 모바일은 카드 없이, 데스크톱은 Card (.m-subpage 정합).
function ListShell({
  mobile,
  children,
}: {
  mobile: boolean;
  children: React.ReactNode;
}) {
  // overflow hidden — 행 hover 배경이 카드 라운드 밖으로 새지 않게(첫·마지막 행 모서리).
  return mobile ? (
    <div>{children}</div>
  ) : (
    <Card style={{ overflow: "hidden" }}>
      <CardContent style={{ padding: 0 }}>{children}</CardContent>
    </Card>
  );
}

/**
 * 할일 태그 관리 — 이름 + 색(tone) + 사용 건수. 할일 필터·태그 분포에 사용.
 * 디자인 SoT: settings-todo-tags.jsx TodoTagManager (구조는 CalendarLabelsSection 미러).
 */
export function TodoTagManager({ mobile }: { mobile: boolean }) {
  // 폰은 흰 면 하나(I-10 L) — 데스크톱 갈래는 그대로(머리는 I-16, 본문은 I-15)
  return mobile ? <TodoTagManagerMobile /> : <TodoTagManagerDesktop />;
}

function TodoTagManagerDesktop() {
  const mobile = false;
  const { t } = useTranslation("todo");
  const { t: tc } = useTranslation("common");
  const { data: tags, isLoading } = useTodoTags();
  const createMut = useCreateTodoTag();
  const updateMut = useUpdateTodoTag();
  const deleteMut = useDeleteTodoTag();

  const [editing, setEditing] = useState<EditingState>(null);
  const [confirmDelete, setConfirmDelete] = useState<TodoTag | null>(null);

  const list = useMemo(() => tags ?? [], [tags]);
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
  const onDelete = (tag: TodoTag) => {
    deleteMut.mutate(tag.rowId, { onSuccess: () => setConfirmDelete(null) });
  };

  return (
    <>
      <ManagerShell className="!gap-[var(--spacing-2xl)]">
        {!mobile && (
          <ManagerHead title={t("tags.title")} description={t("tags.desc")} />
        )}

        {/* 안내 카드 — 앱 PCard brand 정합 */}
        <Card variant="brand">
          <CardContent>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-brand)",
                  color: "var(--fg-on-brand)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Tags size={18} strokeWidth={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-label-sm)",
                    fontWeight: "700",
                    color: "var(--fg-primary)",
                  }}
                >
                  {t("tags.title")}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--fg-secondary)",
                    marginTop: 2,
                    lineHeight: "1.5",
                  }}
                >
                  {t("tags.desc")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 태그 리스트 — label + list 한 묶음, 사이 간격 모바일 0 / 데스크톱 8. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: mobile ? 0 : 12,
          }}
        >
          {/* 라벨행 우측 텍스트(accent) 추가 버튼 — 프리셋 정합(사용자 결정, filled 헤더 버튼 폐기) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-label-sm)",
                fontWeight: "700",
                color: "var(--fg-primary)",
              }}
            >
              {t("tags.title")} · {list.length}
            </div>
            <Button
              type="button"
              variant="accent"
              style={{ padding: "7px 12px", fontSize: "var(--text-label-sm)" }}
              onClick={() => setEditing({ kind: "new" })}
            >
              <Plus size={14} /> {t("tags.new")}
            </Button>
          </div>
          <ListShell mobile={mobile}>
            {isLoading ? (
              <TagListSkeleton mobile={mobile} />
            ) : list.length === 0 ? (
              <div
                style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "var(--fg-tertiary)",
                }}
              >
                <Tags
                  size={28}
                  strokeWidth={1.6}
                  style={{ opacity: 0.5, margin: "0 auto" }}
                />
                <div
                  style={{
                    fontSize: "var(--text-body-sm)",
                    fontWeight: "600",
                    marginTop: 8,
                    color: "var(--fg-primary)",
                  }}
                >
                  {t("tags.empty")}
                </div>
                <div style={{ fontSize: "var(--text-caption)", marginTop: 4 }}>
                  {t("tags.emptyHint", { label: `"${t("tags.new")}"` })}
                </div>
              </div>
            ) : (
              list.map((tag, i) => {
                const palette = getPaletteByColor(tag.color);
                const count = tag.usageCount ?? 0; // 서버 GROUP BY 집계(미배포 시 0)
                // 밀면 수정·삭제. 모바일은 행의 🗑·> 를 걷었으므로 탭(편집)이
                // 비제스처 경로다(spec swipe-actions.md · WCAG 2.1.1).
                const swipeActions: SwipeAction[] = [
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
                    confirm: {
                      // count 를 여기서도 넘긴다 — 안 넘기면 i18next 가 자리표시자를
                      // 그대로 두어 "할 일 {{count}}건" 이 보인다(QA #104).
                      title: t("tags.deleteTitle"),
                      message: t("tags.deleteMessage", {
                        name: tag.tagName,
                        count,
                      }),
                    },
                    // 스와이프가 위 confirm 으로 이미 물었다 — 여기서 확인창을 또 열면 두 번 묻는다(QA 30 15).
                    onSelect: () => deleteMut.mutateAsync(tag.rowId),
                  },
                ];
                return (
                  <SwipeActions
                    key={tag.rowId}
                    rowId={`todo-tag-${tag.rowId}`}
                    groupTag="todo-tag-list"
                    rowLabel={tag.tagName}
                    enabled={mobile}
                    actions={swipeActions}
                  >
                    <div
                      onClick={() => setEditing(tag)}
                      className="hover:bg-[var(--bg-muted)]"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: settingsRowPadding(mobile),
                        borderTop:
                          i === 0 ? "none" : "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        transition:
                          "background var(--motion-duration-fast) var(--motion-ease-out)",
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-md)",
                          background: palette.bg,
                          color: palette.color,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Tag size={16} strokeWidth={2} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "var(--text-body-sm)",
                            fontWeight: "600",
                            color: "var(--fg-primary)",
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tag.tagName}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--text-caption)",
                            color: "var(--fg-tertiary)",
                            marginTop: 2,
                          }}
                        >
                          {t("tags.usage", { count })}
                        </div>
                      </div>
                      {/* 모바일은 🗑·> 를 두지 않는다 — 밀면 수정·삭제, 탭하면 편집이라
                        화살표가 있으면 '들어가서 보는 상세'가 따로 있는 것처럼 읽힌다
                        (사용자 결정). 데스크톱은 그대로. */}
                      {!mobile && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!text-[var(--color-fg-critical)]"
                            aria-label={tc("delete")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(tag);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                          <ChevronRight
                            size={15}
                            style={{ color: "var(--fg-tertiary)" }}
                          />
                        </div>
                      )}
                    </div>
                  </SwipeActions>
                );
              })
            )}
          </ListShell>
        </div>
      </ManagerShell>

      {editing && (
        <TagEditDialog
          tag={editing && "rowId" in editing ? editing : null}
          existing={list}
          onClose={() => setEditing(null)}
          onSave={onSave}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t("tags.deleteTitle")}
          message={t("tags.deleteMessage", {
            name: confirmDelete.tagName,
            count: confirmDelete.usageCount ?? 0,
          })}
          confirmLabel={tc("delete")}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  );
}

function TagListSkeleton({ mobile }: { mobile?: boolean }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: settingsRowPadding(mobile),
            borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
          }}
        >
          <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBase className="h-4 w-24" />
            {/* 사용 건수 — 실렌더 caption, marginTop 2 */}
            <SkeletonBase className="h-3 w-20" style={{ marginTop: 2 }} />
          </div>
          {/* 삭제 버튼(icon h-9) + 편집 chevron 한 묶음 */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <SkeletonBase className="h-9 w-9 rounded-md" />
            <SkeletonBase className="h-4 w-4 ml-1" />
          </div>
        </div>
      ))}
    </>
  );
}
