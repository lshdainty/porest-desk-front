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

/**
 * 일정 저장 본문 — 폼 상태이자 그대로 나가는 요청 본문이다.
 *
 * 수정(PUT)은 <b>세 갈래</b>다: 키 없음=유지 · `null`=지움 · 값=교체
 * (`CalendarEventApiDto.UpdateRequest` 의 `Optional<…>` → `Patch.orKeep`, QA #96).
 * 그래서 널 허용 칸은 `null` 을 실을 수 있어야 한다 — 비운 칸을 `undefined` 로 빼면
 * 서버가 "안 고쳤다" 로 읽어 옛 값이 그대로 남는다(QA #112).
 */
export interface CalendarEventFormValues {
  title: string;
  /** 비우면 `null` 을 싣는다 — 키를 빼면 옛 설명이 남는다(`Optional<String> description`). */
  description?: string | null;
  eventType: CalendarEventType;
  /**
   * 색. 화면에 고르는 칸이 있고 <b>비울 수가 없다</b>(팔레트에서 하나를 고르거나,
   * 캘린더·기본색이 시드한다). 그래서 늘 지금 값이 그대로 나간다 — 널 허용 칸이지만
   * (`Optional<String> color`) 이 화면에선 지울 일이 없다.
   */
  color: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  /** '라벨 없음' 을 고르면 `null` 을 싣는다 — 키를 빼면 옛 라벨이 붙어 있다(`Optional<Long> labelRowId`). */
  labelRowId?: number | null;
  /** 비우면 `null` 을 싣는다 — 키를 빼면 옛 장소가 남는다(`Optional<String> location`). */
  location?: string | null;
  /**
   * 반복 규칙. '반복 안 함' 을 고르면 `null` 을 싣는다 — 키를 빼면 반복이 안 풀린다
   * (`Optional<String> rrule`).
   */
  rrule?: string | null;
  /**
   * 알림 사전분 목록. 목록을 통째로 바꾸는 칸이라 계약이 다른 칸과 다르다 —
   * **미전달=미변경 · `[]`=전부 해제 · 리스트=교체**(`CalendarEventServiceImpl.syncReminders`).
   * 0 개일 때 키를 빼면 옛 알림이 그대로 남는다(QA #109).
   */
  reminderMinutes?: number[];
  /**
   * 옮길 캘린더. <b>혼자만 `Optional` 이 아니다</b> — 서버가 맨 `Long` 으로 받아
   * "null 이면 안 옮긴다" 로 읽으므로(`CalendarEventServiceImpl.updateEvent` 의
   * `if (command.calendarRowId() != null)`) 키를 빼든 `null` 을 싣든 결과가 같다.
   * 화면에도 '캘린더 없음' 이 없어 비울 수가 없다 — 그래서 미전달 그대로 둔다.
   */
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
