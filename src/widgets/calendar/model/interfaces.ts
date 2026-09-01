import type { EventReminderInfo } from "@/entities/calendar";

export type TSourceType = "calendar" | "expense" | "todo" | "holiday";

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  color: string;
  isAllDay: boolean;
  sourceType: TSourceType;
  calendarRowId: number | null;
  calendarName: string | null;
  calendarColor: string | null;
  labelRowId: number | null;
  labelName: string | null;
  labelColor: string | null;
  location: string | null;
  rrule: string | null;
  recurrenceId: number | null;
  reminders: EventReminderInfo[];
  groupRowId: number | null;
  groupName: string | null;
  /**
   * expense 이벤트의 표시 부호 금액 — 지출 음수 / 수입·환불 양수.
   * 일별 합계는 이 값을 쓴다. title 에서 금액을 되파싱하면 en 로케일의
   * `-₩50,000`(부호와 숫자 사이 ₩)이나 숫자로 시작하는 카테고리명에서 깨진다.
   */
  expenseAmount?: number;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
