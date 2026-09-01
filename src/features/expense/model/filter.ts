import type { ExpenseType } from "@/entities/expense";

/*
 * 거래 필터의 모양과 초기값 — 다이얼로그와 목록 화면이 함께 쓴다.
 *
 * 다이얼로그 파일에 두면 컴포넌트 아닌 것을 export 하게 되어 Fast Refresh 가
 * 그 파일의 상태를 매번 버린다(react-refresh/only-export-components).
 */

export type FilterPeriod = "week" | "month" | "3m" | "custom";

export interface FilterValue {
  period: FilterPeriod;
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  startDate: string;
  /** period === 'custom' 일 때만 사용 — "YYYY-MM-DD" */
  endDate: string;
  types: ExpenseType[];
  categoryIds: number[];
  assetIds: number[];
  min: string;
  max: string;
}

export const DEFAULT_FILTER: FilterValue = {
  period: "custom",
  startDate: "",
  endDate: "",
  types: ["EXPENSE", "INCOME"],
  categoryIds: [],
  assetIds: [],
  min: "",
  max: "",
};
