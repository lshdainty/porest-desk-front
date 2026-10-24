import { createElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRightLeft,
  EllipsisVertical,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/shared/ds/button";
import {
  List,
  ListButtonItem,
  ListItem,
  ListParentItem,
  ListTile,
} from "@/shared/ds/list";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuGroup,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/shared/ds/menu";
import { Skeleton } from "@/shared/ds/skeleton";
import { Icon } from "@/shared/ui/groo/primitives";
import { isIconName } from "@/shared/lib";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import type { ExpenseCategory } from "@/entities/expense";

/**
 * 카테고리 나무(I-20 B 6 · 7) — 최상위는 List 부모 줄(꺾쇠 단추 44 · 타일), 하위는 List 하위 줄, 줄 끝은 ⋮ 하나.
 * 줄 누르기 = 수정 폼, 꺾쇠 = 펴고 접기만. 순서 바꾸기 모드에서는 ⋮ 자리에 끄는 손잡이가 서고 줄 누름은 막힌다.
 */

export interface CategoryRowActions {
  onEdit: (c: ExpenseCategory) => void;
  onAddChild: (parent: ExpenseCategory) => void;
  onMoveTx: (c: ExpenseCategory) => void;
  onDelete: (c: ExpenseCategory) => void;
}

function Tile({ cat }: { cat: ExpenseCategory }) {
  const palette = getPaletteByColor(cat.color);
  return (
    <ListTile style={{ background: palette.bg, color: palette.color }}>
      <Icon name={isIconName(cat.icon) ? cat.icon : "tag"} size={20} />
    </ListTile>
  );
}

/** 줄 끝 ⋮ — 1280 미만 Menu Sheet(머리 = 카테고리 이름) · 이상 Menu. 줄의 처지에 따라 메뉴 줄이 다르다(B 7) */
function RowMenu({
  cat,
  isChild,
  hasKids,
  actions,
}: {
  cat: ExpenseCategory;
  isChild: boolean;
  hasKids: boolean;
  actions: CategoryRowActions;
}) {
  const { t } = useTranslation("category");
  const { t: tc } = useTranslation("common");
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger asChild>
        <Button
          variant="ghost"
          ghostColor="neutralSubtle"
          layout="iconOnly"
          size="medium"
          className="-mr-x3"
          aria-label={t("moreOf", { name: cat.categoryName })}
        >
          <EllipsisVertical aria-hidden />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent title={cat.categoryName} align="end">
        <ResponsiveMenuGroup>
          {/* 2단계까지 — 하위 줄에는 하위 추가를 두지 않는다 */}
          {!isChild && (
            <ResponsiveMenuItem
              label={t("addSub")}
              icon={<Plus aria-hidden />}
              onSelect={() => actions.onAddChild(cat)}
            />
          )}
          <ResponsiveMenuItem
            label={t("edit")}
            icon={<Pencil aria-hidden />}
            onSelect={() => actions.onEdit(cat)}
          />
          {/* 하위가 있는 부모에는 거래가 달릴 수 없어 옮길 것이 0 이다 */}
          {!hasKids && (
            <ResponsiveMenuItem
              label={t("moveTx.entry")}
              icon={<ArrowRightLeft aria-hidden />}
              onSelect={() => actions.onMoveTx(cat)}
            />
          )}
        </ResponsiveMenuGroup>
        <ResponsiveMenuGroup>
          <ResponsiveMenuItem
            label={tc("delete")}
            icon={<Trash2 aria-hidden />}
            tone="critical"
            onSelect={() => actions.onDelete(cat)}
          />
        </ResponsiveMenuGroup>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

/** 끄는 줄 하나 — 손잡이를 활성 자리로 내준다. 키보드 센서(dnd-kit)는 그대로 손잡이에서 시작한다 */
function Sortable({
  id,
  as,
  name,
  children,
}: {
  id: number;
  as: "div" | "li";
  name: string;
  children: (grip: ReactNode) => ReactNode;
}) {
  const { t } = useTranslation("category");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const grip = (
    <Button
      ref={setActivatorNodeRef}
      variant="ghost"
      ghostColor="neutralSubtle"
      layout="iconOnly"
      size="medium"
      className="-mr-x3 cursor-grab touch-none"
      aria-label={t("dragReorderOf", { name })}
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden />
    </Button>
  );
  return createElement(
    as,
    {
      ref: setNodeRef,
      style: {
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
      },
    },
    children(grip),
  );
}

export function CategoryTree({
  tree,
  reorder,
  actions,
  sensors,
  onReorder,
  ariaLabelledBy,
}: {
  tree: { parent: ExpenseCategory; children: ExpenseCategory[] }[];
  reorder: boolean;
  actions: CategoryRowActions;
  sensors: ReturnType<typeof useSensors>;
  /** 같은 형제끼리만 옮긴다 — 형제 id 차례를 넘겨 서버에 보낼 값을 부르는 쪽이 만든다 */
  onReorder: (ev: DragEndEvent, siblingIds: number[]) => void;
  ariaLabelledBy: string;
}) {
  const { t } = useTranslation("category");

  if (!reorder) {
    return (
      <List aria-labelledby={ariaLabelledBy}>
        {tree.map(({ parent, children }) => (
          <ListParentItem
            key={parent.rowId}
            title={parent.categoryName}
            prefix={<Tile cat={parent} />}
            expandLabel={t("expandOf", { name: parent.categoryName })}
            defaultOpen
            onClick={() => actions.onEdit(parent)}
            suffix={
              <RowMenu
                cat={parent}
                isChild={false}
                hasKids={children.length > 0 || parent.hasChildren}
                actions={actions}
              />
            }
          >
            {children.map((c) => (
              <ListButtonItem
                key={c.rowId}
                title={c.categoryName}
                prefix={<Tile cat={c} />}
                onClick={() => actions.onEdit(c)}
                suffix={
                  <RowMenu cat={c} isChild hasKids={false} actions={actions} />
                }
              />
            ))}
          </ListParentItem>
        ))}
      </List>
    );
  }

  // 순서 바꾸기 — 하위는 늘 보이고(꺾쇠 자리는 빈 채) 줄 누름은 막힌다. 같은 형제끼리만 옮긴다
  return (
    <div role="group" aria-labelledby={ariaLabelledBy}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(ev) =>
          onReorder(
            ev,
            tree.map((x) => x.parent.rowId),
          )
        }
      >
        <SortableContext
          items={tree.map((x) => x.parent.rowId)}
          strategy={verticalListSortingStrategy}
        >
          {tree.map(({ parent, children }) => (
            <Sortable
              key={parent.rowId}
              id={parent.rowId}
              as="div"
              name={parent.categoryName}
            >
              {(grip) => (
                <List>
                  <ListParentItem
                    collapsible={false}
                    title={parent.categoryName}
                    prefix={<Tile cat={parent} />}
                    className="pointer-events-none"
                    tabIndex={-1}
                    suffix={grip}
                  >
                    {children.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(ev) =>
                          onReorder(
                            ev,
                            children.map((c) => c.rowId),
                          )
                        }
                      >
                        <SortableContext
                          items={children.map((c) => c.rowId)}
                          strategy={verticalListSortingStrategy}
                        >
                          {children.map((c) => (
                            <Sortable
                              key={c.rowId}
                              id={c.rowId}
                              as="li"
                              name={c.categoryName}
                            >
                              {(childGrip) => (
                                <ListItem
                                  as="div"
                                  title={c.categoryName}
                                  prefix={<Tile cat={c} />}
                                  suffix={childGrip}
                                />
                              )}
                            </Sortable>
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </ListParentItem>
                </List>
              )}
            </Sortable>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

/** 불러오는 중 — 목록 제목 아래 부모 줄 넷(꺾쇠 자리 · 타일 40 · 한 줄) · 하위 둘(I-20 F) */
export function CategoryListSkeleton() {
  const rows: { depth: 0 | 1 }[] = [
    { depth: 0 },
    { depth: 1 },
    { depth: 1 },
    { depth: 0 },
    { depth: 0 },
    { depth: 0 },
  ];
  return (
    <div aria-hidden>
      {rows.map((r, i) => (
        <div
          key={i}
          className={
            r.depth === 0
              ? "flex items-center gap-x3 py-x3 pl-x13 pr-global-gutter"
              : "flex items-center gap-x3 py-x3 pl-[calc(var(--spacing-x13)*2)] pr-global-gutter"
          }
        >
          <Skeleton radius="12" className="size-x10 shrink-0" />
          <Skeleton text="t5" className="w-1/2" />
        </div>
      ))}
    </div>
  );
}
