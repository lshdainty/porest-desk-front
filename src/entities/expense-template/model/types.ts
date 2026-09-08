import type { ExpenseType } from "@/entities/expense";
import type { YNType } from "@/shared/types";

export interface ExpenseTemplate {
  rowId: number;
  userRowId: number;
  templateName: string;
  categoryRowId: number | null;
  categoryName: string | null;
  assetRowId: number | null;
  assetName: string | null;
  expenseType: ExpenseType;
  amount: number | null;
  description: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  useCount: number;
  sortOrder: number;
  /** 'Y' = 고정 금액 사용, 'N' = 불러올 때 금액 비움 */
  lockAmount: YNType;
  /** 마지막 사용 시각 (ISO). 한 번도 안 썼으면 null */
  lastUsedAt: string | null;
  createAt: string;
  modifyAt: string;
}

/**
 * 프리셋 생성·수정 본문.
 *
 * PUT 은 세 갈래다 — **키 없음=유지 · `null`=지움 · 값=교체**(`Patch`, QA #96·#325).
 * 그래서 화면이 그리는 칸은 비었을 때 `null` 을 실어야 지워지고(`undefined` 는 키를
 * 빼는 것이라 옛 값이 남는다), 화면에 없는 칸은 아예 안 실어야 남의 값을 안 덮는다.
 * `?: T | null` 로 적힌 칸이 "지울 수 있는 칸" 이다(자산 · 거래와 같은 계약).
 */
export interface ExpenseTemplateFormValues {
  templateName: string;
  categoryRowId: number | null;
  /** 결제 계좌·카드. `null` = 연결 해제('선택 안 함'). */
  assetRowId?: number | null;
  expenseType: ExpenseType;
  /**
   * 고정 금액. `lockAmount` 와 **한 쌍**이라 다른 칸과 계약이 다르다 — 서버가 둘을 함께
   * 보고 `lockAmount !== 'Y'` 면 실린 금액을 버린다(`ExpenseTemplateServiceImpl.resolveAmount`:
   * "고정을 끈 채로 들어온 금액은 버린다"). 그래서 고정을 껐을 때는 키를 빼도 금액이 남지
   * 않는다 — 금액칸 자체가 고정을 켰을 때만 그려지므로 "화면이 가진 칸만 싣는다" 와도 맞다.
   */
  amount?: number | null;
  /**
   * 기본 설명. **웹 편집 화면에는 이 칸이 없다** — 거래에서 '프리셋으로 저장' 할 때
   * 시드로 한 번 들어갈 뿐이다. 편집 본문에서는 **키를 빼라.** 고를 자리가 없는 값을
   * 만들어 보내면(빈 문자열이든 `null` 이든) 그때 적힌 설명이 편집 한 번에 사라진다 —
   * 서버를 `Optional` 로 옮긴(#325) 계기가 바로 이 칸이다.
   */
  description?: string;
  /** `null` = 기본 내역(거래처) 지움. */
  merchant?: string | null;
  /** `null` = 결제수단 지움('선택 안 함'). */
  paymentMethod?: string | null;
  sortOrder?: number;
  lockAmount: YNType;
}
