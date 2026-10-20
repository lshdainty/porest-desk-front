import { countableTx } from "@/entities/expense";
import type { Expense, ExpenseType } from "@/entities/expense";

/*
 * 고정 정리 대화상자가 거래를 묶는 규칙.
 *
 * 월세·통신비처럼 **매달 같은 이름으로 나가는 돈**이 고정의 전형이라, 거래를 한 줄씩 보여 주면
 * 열두 달치를 열두 번 눌러야 한다. 행에 보이는 이름(거래처 → 메모 → 카테고리)이 같으면 한 묶음으로
 * 보고, 묶음 하나를 고르면 그 안의 거래가 전부 대상이 된다.
 *
 * 합계에 안 잡히는 거래(환불 · 아직 안 온 것 · 카드 이월)는 처음부터 뺀다 — 통계에 나타나지 않는
 * 거래를 정리하라고 보여 줘 봐야 고쳐도 아무 숫자가 안 바뀐다. 서버 규칙을 그대로 미러한
 * `countableTx` 한 곳을 지난다.
 */

export interface TxGroup {
  /** 묶음 식별자 — 이름을 소문자·공백 정리한 값. 화면 목록의 key 로 쓴다. */
  key: string;
  /** 행에 보이는 이름 */
  name: string;
  /** 이 묶음에 든 거래 id — 고르면 전부 일괄 변경 대상이다 */
  ids: number[];
  count: number;
  /** 묶음 합계(금액은 늘 양수로 온다) */
  total: number;
  /** 그 가운데 이미 고정인 거래 수 — 0 이면 전부 변동, count 면 전부 고정 */
  fixedCount: number;
}

const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** 거래 한 건이 행에 내는 이름 — `ExpenseRow` 와 같은 우선순위다. */
export function txTitle(e: Expense, fallback: string): string {
  const raw =
    e.merchant?.trim() ||
    e.description?.trim() ||
    e.categoryName?.trim() ||
    fallback;
  return raw;
}

/**
 * 한 종류(지출 또는 수입)의 거래를 이름으로 묶는다.
 * 정렬은 건수 많은 순 → 합계 큰 순 — 매달 반복되는 것이 위로 온다.
 */
export function groupForFixed(
  expenses: Expense[],
  type: ExpenseType,
  fallbackName: string,
): TxGroup[] {
  const map = new Map<string, TxGroup>();
  for (const e of countableTx(expenses)) {
    if (e.expenseType !== type) continue;
    const name = txTitle(e, fallbackName);
    const key = normalize(name);
    let g = map.get(key);
    if (!g) {
      g = { key, name, ids: [], count: 0, total: 0, fixedCount: 0 };
      map.set(key, g);
    }
    g.ids.push(e.rowId);
    g.count += 1;
    g.total += Math.abs(e.amount);
    if (e.isFixed) g.fixedCount += 1;
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || b.total - a.total,
  );
}

/** 묶음의 선택 상태 — 체크박스의 세 모양. */
export type GroupCheck = boolean | "indeterminate";

/** 고른 id 집합 기준으로 묶음이 전부 / 일부 / 하나도 안 골라졌는지. */
export function groupCheck(
  g: TxGroup,
  picked: ReadonlySet<number>,
): GroupCheck {
  const n = g.ids.filter((id) => picked.has(id)).length;
  if (n === 0) return false;
  return n === g.ids.length ? true : "indeterminate";
}

/** 묶음을 켜거나 끈 새 집합 — 원래 집합은 건드리지 않는다. */
export function toggleGroup(
  g: TxGroup,
  picked: ReadonlySet<number>,
  on: boolean,
): Set<number> {
  const next = new Set(picked);
  for (const id of g.ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}
