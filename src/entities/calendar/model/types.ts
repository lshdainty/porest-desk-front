import type { Todo } from "@/entities/todo";
import type { Expense } from "@/entities/expense";
export type CalendarEventType = "PERSONAL" | "WORK" | "BIRTHDAY" | "HOLIDAY";

export interface EventReminderInfo {
  rowId: number;
  eventRowId: number;
  reminderType: string;
  minutesBefore: number;
  isSent: boolean;
}

export interface CalendarEvent {
  rowId: number;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  color: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  labelRowId: number | null;
  labelName: string | null;
  labelColor: string | null;
  location: string | null;
  rrule: string | null;
  recurrenceId: number | null;
  isException: boolean;
  reminders: EventReminderInfo[];
  calendarRowId: number | null;
  calendarName: string | null;
  calendarColor: string | null;
  createAt: string;
  modifyAt: string;
}

export interface CalendarEventFormValues {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  color: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  labelRowId?: number;
  location?: string;
  rrule?: string;
  /**
   * 알림 사전분 목록. 목록을 통째로 바꾸는 칸이라 계약이 다른 칸과 다르다 —
   * **미전달=미변경 · `[]`=전부 해제 · 리스트=교체**(`CalendarEventServiceImpl.syncReminders`).
   * 0 개일 때 키를 빼면 옛 알림이 그대로 남는다(QA #109).
   */
  reminderMinutes?: number[];
  calendarRowId?: number;
}

export interface CalendarAggregateData {
  events: CalendarEvent[];
  todos: Todo[];
  expenses: Expense[];
}

export type HolidayType = "PUBLIC" | "SUBSTITUTE" | "CUSTOM";

export interface Holiday {
  rowId: number;
  holidayDate: string; // 'yyyy-MM-dd'
  holidayName: string;
  holidayType: HolidayType;
}
