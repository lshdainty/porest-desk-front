import type { YNType } from "@/shared/types";
import type { TxKind } from "@/entities/expense";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurringTransaction {
  rowId: number;
  userRowId: number;
  categoryRowId: number | null;
  categoryName: string | null;
  assetRowId: number | null;
  assetName: string | null;
  /** 이체일 때 받는 자산. 지출·수입이면 null. */
  toAssetRowId: number | null;
  toAssetName: string | null;
  /** 이체 수수료. 지출·수입이면 null. */
  fee: number | null;
  /** 이체 이자 — 받는 자산이 대출일 때만 값이 있다. */
  interestAmount: number | null;
  sourceExpenseRowId: number | null;
  expenseType: TxKind;
  amount: number;
  description: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  frequency: RecurringFrequency;
  intervalValue: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  /** 'HH:mm:ss' — 실행분을 만들 시각 [userClock] */
  executionTime: string | null;
  startDate: string;
  endDate: string | null;
  maxOccurrences: number | null;
  executedCount: number;
  nextExecutionDate: string;
  lastExecutedAt: string | null;
  isActive: YNType;
  autoLog: boolean;
  notifyDayBefore: boolean;
  createAt: string;
  modifyAt: string;
}

export interface RecurringTransactionFormValues {
  categoryRowId?: number;
  /** 이체면 <b>보내는</b> 자산. */
  assetRowId?: number;
  /** 이체면 <b>받는</b> 자산 — 이체가 아닐 때는 싣지 않는다(서버가 거절한다). */
  toAssetRowId?: number;
  fee?: number;
  interestAmount?: number;
  sourceExpenseRowId?: number;
  expenseType: TxKind;
  amount: number;
  description?: string;
  merchant?: string;
  paymentMethod?: string;
  frequency: RecurringFrequency;
  intervalValue?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  /** 'HH:mm:ss' — 생략하면 서버가 09:00 을 쓴다 */
  executionTime?: string;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  autoLog?: boolean;
  notifyDayBefore?: boolean;
}
