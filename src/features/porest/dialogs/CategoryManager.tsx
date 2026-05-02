import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '@/shared/ui/porest/primitives'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
  useReorderExpenseCategories,
} from '@/features/expense'
import type {
  ExpenseCategory,
  ExpenseCategoryFormValues,
  ExpenseType,
} from '@/entities/expense'
import { CategoryEditDialog, getPaletteByColor } from './CategoryEditDialog'

type EditingState = ExpenseCategory | { kind: 'new'; parentRowId?: number | null } | null

export function CategoryManager({ mobile }: { mobile: boolean }) {
  const { data: categories, isLoading } = useExpenseCategories()
  const createMut = useCreateExpenseCategory()
  const updateMut = useUpdateExpenseCategory()
  const deleteMut = useDeleteExpenseCategory()
  const reorderMut = useReorderExpenseCategories()

  const [tab, setTab] = useState<ExpenseType>('EXPENSE')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<EditingState>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseCategory | null>(null)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const list = useMemo(() => categories ?? [], [categories])

  const counts = useMemo(
    () => ({
      expense: list.filter(c => c.expenseType === 'EXPENSE').length,
      income: list.filter(c => c.expenseType === 'INCOME').length,
    }),
    [list],
  )

  // 현재 탭의 부모-자식 트리 구성 (검색어 매칭된 것만 노출)
  type Tree = { parent: ExpenseCategory; children: ExpenseCategory[] }[]
  const tree: Tree = useMemo(() => {
    const inTab = list.filter(c => c.expenseType === tab)
    const sorted = inTab.slice().sort((a, b) => a.sortOrder - b.sortOrder)
    const byParent = new Map<number, ExpenseCategory[]>()
    const parents: ExpenseCategory[] = []
    for (const c of sorted) {
      if (c.parentRowId == null) parents.push(c)
      else {
        const arr = byParent.get(c.parentRowId) ?? []
        arr.push(c)
        byParent.set(c.parentRowId, arr)
      }
    }
    const q = query.trim()
    return parents
      .map(p => {
        const children = byParent.get(p.rowId) ?? []
        if (q === '') return { parent: p, children }
        // 검색: 부모 또는 자식 중 하나라도 매칭되면 해당 그룹 노출
        const parentMatch = p.categoryName.includes(q)
        const filteredChildren = parentMatch ? children : children.filter(c => c.categoryName.includes(q))
        if (!parentMatch && filteredChildren.length === 0) return null
        return { parent: p, children: filteredChildren }
      })
      .filter((x): x is { parent: ExpenseCategory; children: ExpenseCategory[] } => x != null)
  }, [list, tab, query])

  const submitting = createMut.isPending || updateMut.isPending

  const onSave = (values: ExpenseCategoryFormValues) => {
    if (editing && 'rowId' in editing) {
      updateMut.mutate(
        { id: editing.rowId, data: values },
        { onSuccess: () => setEditing(null) },
      )
    } else {
      createMut.mutate(values, { onSuccess: () => setEditing(null) })
    }
  }

  const onDelete = (c: ExpenseCategory) => {
    deleteMut.mutate(c.rowId, { onSuccess: () => setConfirmDelete(null) })
  }

  const toggleCollapse = (parentRowId: number) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(parentRowId)) next.delete(parentRowId)
      else next.add(parentRowId)
      return next
    })
  }

  // DnD: 같은 형제 레벨(최상위 또는 같은 부모)끼리만 정렬 가능
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (ev: DragEndEvent, siblingIds: number[]) => {
    const { active, over } = ev
    if (!over || active.id === over.id) return
    const oldIndex = siblingIds.indexOf(Number(active.id))
    const newIndex = siblingIds.indexOf(Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(siblingIds, oldIndex, newIndex)
    const items = reordered.map((id, idx) => {
      const cat = list.find(c => c.rowId === id)!
      return {
        categoryRowId: id,
        sortOrder: idx,
        parentRowId: cat.parentRowId,
      }
    })
    reorderMut.mutate(items)
  }

  return (
    <>
      <div className="cat-mgr">
        {!mobile && (
          <div className="cat-mgr__head">
            <div>
              <h2 className="cat-mgr__title">카테고리 관리</h2>
              <p className="cat-mgr__sub">
                지출·수입 내역을 분류할 카테고리를 관리합니다. 드래그로 순서를 바꾸고, 부모 행 하위에 세부 카테고리를 둘 수 있어요.
              </p>
            </div>
            <Button onClick={() => setEditing({ kind: 'new' })}>
              <Plus size={14} strokeWidth={2.4} />
              카테고리 추가
            </Button>
          </div>
        )}

        <div className="cat-mgr__toolbar">
          <div className="cat-mgr__tabs">
            <button className={tab === 'EXPENSE' ? 'active' : ''} onClick={() => setTab('EXPENSE')}>
              지출 <span className="cnt">{counts.expense}</span>
            </button>
            <button className={tab === 'INCOME' ? 'active' : ''} onClick={() => setTab('INCOME')}>
              수입 <span className="cnt">{counts.income}</span>
            </button>
          </div>
          <div className="cat-mgr__search">
            <Search size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="카테고리 검색" />
          </div>
        </div>

        <div className="cat-list">
          {isLoading ? (
            <div className="cat-list__empty"><span>불러오는 중…</span></div>
          ) : list.length === 0 ? (
            <div className="cat-list__empty"><span>카테고리가 없어요</span></div>
          ) : tree.length === 0 ? (
            <div className="cat-list__empty"><span>검색 결과가 없습니다.</span></div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(ev) => handleDragEnd(ev, tree.map(t => t.parent.rowId))}
            >
              <SortableContext
                items={tree.map(t => t.parent.rowId)}
                strategy={verticalListSortingStrategy}
              >
                {tree.map(({ parent, children }) => (
                  <ParentBlock
                    key={parent.rowId}
                    parent={parent}
                    children_={children}
                    mobile={mobile}
                    isCollapsed={collapsed.has(parent.rowId)}
                    onToggle={() => toggleCollapse(parent.rowId)}
                    onEdit={(c) => setEditing(c)}
                    onDelete={(c) => setConfirmDelete(c)}
                    onAddChild={() => setEditing({ kind: 'new', parentRowId: parent.rowId })}
                    onChildrenDragEnd={(ev) => handleDragEnd(ev, children.map(c => c.rowId))}
                    dndSensors={sensors}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {mobile && (
          <button className="cat-add-fab" onClick={() => setEditing({ kind: 'new' })}>
            <Plus size={20} strokeWidth={2.4} />
            <span>카테고리 추가</span>
          </button>
        )}
      </div>

      {editing && (
        <CategoryEditDialog
          cat={editing && 'rowId' in editing ? editing : null}
          defaultKind={tab}
          defaultParentRowId={editing && 'kind' in editing ? editing.parentRowId ?? null : null}
          onClose={() => setEditing(null)}
          onSave={onSave}
          onDelete={
            editing && 'rowId' in editing
              ? () => {
                  setConfirmDelete(editing)
                  setEditing(null)
                }
              : undefined
          }
          mobile={mobile}
          existing={list}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="카테고리 삭제"
          message={
            confirmDelete.hasChildren
              ? `"${confirmDelete.categoryName}" 카테고리에 하위 카테고리가 있어 삭제할 수 없어요. 먼저 하위 카테고리를 정리해 주세요.`
              : `"${confirmDelete.categoryName}" 카테고리를 삭제하시겠어요?`
          }
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => !confirmDelete.hasChildren && onDelete(confirmDelete)}
        />
      )}
    </>
  )
}

function ParentBlock({
  parent,
  children_,
  mobile,
  isCollapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onChildrenDragEnd,
  dndSensors,
}: {
  parent: ExpenseCategory
  children_: ExpenseCategory[]
  mobile: boolean
  isCollapsed: boolean
  onToggle: () => void
  onEdit: (c: ExpenseCategory) => void
  onDelete: (c: ExpenseCategory) => void
  onAddChild: () => void
  onChildrenDragEnd: (ev: DragEndEvent) => void
  dndSensors: ReturnType<typeof useSensors>
}) {
  return (
    <div>
      <SortableRow
        cat={parent}
        mobile={mobile}
        isParent
        hasChildren={children_.length > 0}
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        onEdit={() => onEdit(parent)}
        onDelete={() => onDelete(parent)}
        onAddChild={onAddChild}
      />
      {!isCollapsed && children_.length > 0 && (
        <div style={{ paddingLeft: 28 }}>
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragEnd={onChildrenDragEnd}
          >
            <SortableContext items={children_.map(c => c.rowId)} strategy={verticalListSortingStrategy}>
              {children_.map(c => (
                <SortableRow
                  key={c.rowId}
                  cat={c}
                  mobile={mobile}
                  onEdit={() => onEdit(c)}
                  onDelete={() => onDelete(c)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

function SortableRow({
  cat,
  mobile,
  isParent,
  hasChildren,
  isCollapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: {
  cat: ExpenseCategory
  mobile: boolean
  isParent?: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  onToggle?: () => void
  onEdit: () => void
  onDelete: () => void
  onAddChild?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.rowId,
  })
  const palette = getPaletteByColor(cat.color)
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="cat-row">
      <button
        type="button"
        className="cat-row__drag"
        aria-label="드래그로 순서 변경"
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        <GripVertical size={16} />
      </button>
      {isParent && hasChildren && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={isCollapsed ? '펼치기' : '접기'}
          style={{
            background: 'transparent',
            border: 0,
            padding: 2,
            cursor: 'pointer',
            color: 'var(--fg-secondary)',
            display: 'inline-flex',
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      <span
        className="cat-row__icon"
        style={{ background: palette.bg, color: palette.color }}
      >
        <Icon name={cat.icon ?? 'tag'} size={18} strokeWidth={1.9} />
      </span>
      <div className="cat-row__text">
        <div className="cat-row__label">{cat.categoryName}</div>
        <div className="cat-row__meta">
          {cat.expenseType === 'EXPENSE' ? '지출' : '수입'}
          {isParent && hasChildren && (
            <>
              <span className="dot-sep" />
              하위 카테고리 있음
            </>
          )}
        </div>
      </div>
      {!mobile ? (
        <div className="cat-row__actions">
          {isParent && onAddChild && (
            <Button variant="ghost" size="sm" onClick={onAddChild} title="하위 추가">
              <Plus size={13} />
              하위
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={13} />편집
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="cat-row__del"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ) : (
        <button className="cat-row__more" onClick={onEdit}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
