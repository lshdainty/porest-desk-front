export type TodoPriority = "HIGH" | "MEDIUM" | "LOW";
export type TodoStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TodoType = "TASK" | "NOTE";

export interface TodoTagInfo {
  rowId: number;
  tagName: string;
  color: string | null;
}

export interface Todo {
  rowId: number;
  title: string;
  content: string | null;
  priority: TodoPriority;
  category: string | null;
  status: TodoStatus;
  type: TodoType;
  isPinned: boolean;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  parentRowId: number | null;
  tags: TodoTagInfo[];
  subtaskCount: number;
  subtaskCompletedCount: number;
  createAt: string;
  modifyAt: string;
  /** 이번 상태 토글로 실제 적립된 별빛 — 토글 응답에만 실린다(그 외 0). 토스트 근거. */
  earnedStarlight?: number;
}

export interface TodoFormValues {
  title: string;
  content?: string;
  priority: TodoPriority;
  /**
   * 태그 이름. `null` 을 실으면 태그를 뗀다 — 서버가 `todo.category` 와 태그 매핑을
   * 함께 비운다(`TodoServiceImpl.syncCategoryBridge`).
   *
   * PUT 은 "키 없음=유지 · null=지움" 이라(`Patch`) 키를 빼면 옛 태그가 그대로 남는다.
   * 메모의 `MemoFormValues.tag` 와 같은 계약이다.
   */
  category?: string | null;
  /**
   * 마감일 "YYYY-MM-DD". `null` 을 실으면 마감일을 뗀다 — `category` 와 같은 계약이다
   * (키 없음=유지 · null=지움). 비운 칸을 키째 빼면 옛 마감일이 그대로 남는다(QA #111).
   */
  dueDate?: string | null;
  parentRowId?: number;
  tagIds?: number[];
  type?: TodoType;
}

export interface TodoStats {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  todayDueCount: number;
  overDueCount: number;
  noteCount: number;
}
