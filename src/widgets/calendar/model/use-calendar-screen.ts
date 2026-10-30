import { isSameDay, parseISO } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { useDeleteEvent } from "@/widgets/calendar/model/useCalendarEvents";
import { eventsOnDay } from "@/widgets/calendar/lib/helpers";

import type { CalendarEvent } from "@/entities/calendar";
import type { IEvent } from "@/widgets/calendar/model/interfaces";

function iEventToCalendarEvent(event: IEvent): CalendarEvent {
  return {
    rowId: event.id,
    title: event.title,
    description: event.description || null,
    // 종류는 서버가 준 값 그대로다. 종전엔 여기서 "PERSONAL" 을 지어냈고 그 값이
    // 수정 PUT 에 실려 업무·생일 일정을 개인 일정으로 덮었다(QA #89).
    // 수정 폼이 열리는 건 일정(sourceType "calendar") 뿐이라 이 자리에 null 은 오지 않는다.
    eventType: event.eventType ?? "PERSONAL",
    color: event.color,
    startDate: event.startDate,
    endDate: event.endDate,
    isAllDay: event.isAllDay,
    labelRowId: event.labelRowId,
    labelName: event.labelName,
    labelColor: event.labelColor,
    location: event.location,
    rrule: event.rrule,
    recurrenceId: event.recurrenceId,
    isException: false,
    reminders: event.reminders,
    calendarRowId: event.calendarRowId,
    calendarName: event.calendarName,
    calendarColor: event.calendarColor,
    createAt: "",
    modifyAt: "",
  };
}

/**
 * 캘린더 화면이 폰 · 데스크톱/태블릿에서 함께 쓰는 상태 — 거르기(`filteredEvents`) · 그날 일정(`dayEvents`) ·
 * 상세 · 수정 · 삭제 · 일별 시트 상태와 그 동작. 화면 모양은 `CalendarMobile` · `CalendarDesktop` 이 맡는다.
 */
export function useCalendarScreen(events: IEvent[]) {
  const { selectedDate, view, isBuiltinSourceEnabled, isCalendarVisible } =
    useCalendar();
  // Event detail popover state
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Edit/Delete state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  // 모바일 월간뷰 일별 이벤트 시트 (앱 _DayEventsSheetBody 정합) + 시트의 [+] 생성 폼
  const [dayDate, setDayDate] = useState<Date | null>(null);
  const [creatingDate, setCreatingDate] = useState<Date | null>(null);

  const deleteEvent = useDeleteEvent();

  const handleEventClick = useCallback((event: IEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (anchorRef.current) {
      anchorRef.current.style.top = `${rect.top}px`;
      anchorRef.current.style.left = `${rect.left}px`;
      anchorRef.current.style.width = `${rect.width}px`;
      anchorRef.current.style.height = `${rect.height}px`;
    }
    setSelectedEvent(event);
  }, []);

  const handleClosePopover = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleEditEvent = useCallback(() => {
    if (!selectedEvent) return;
    setEditingEvent(iEventToCalendarEvent(selectedEvent));
    setSelectedEvent(null);
  }, [selectedEvent]);

  const handleDeleteEvent = useCallback(() => {
    if (!selectedEvent) return;
    setDeletingEventId(selectedEvent.id);
    setSelectedEvent(null);
  }, [selectedEvent]);

  const handleConfirmDelete = useCallback(() => {
    if (deletingEventId === null) return;
    deleteEvent.mutate(deletingEventId, {
      onSuccess: () => setDeletingEventId(null),
    });
  }, [deletingEventId, deleteEvent]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      // Source filtering
      if (event.sourceType === "holiday" && !isBuiltinSourceEnabled("holiday"))
        return false;
      if (event.sourceType === "expense" && !isBuiltinSourceEnabled("expense"))
        return false;
      if (event.sourceType === "todo" && !isBuiltinSourceEnabled("todo"))
        return false;
      if (
        event.sourceType === "calendar" &&
        event.calendarRowId &&
        !isCalendarVisible(event.calendarRowId)
      )
        return false;

      if (view === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(
          selectedDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999,
        );
        const isInSelectedYear =
          eventStartDate <= yearEnd && eventEndDate >= yearStart;
        return isInSelectedYear;
      }

      if (view === "month" || view === "agenda") {
        const monthStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        );
        const monthEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        const isInSelectedMonth =
          eventStartDate <= monthEnd && eventEndDate >= monthStart;
        return isInSelectedMonth;
      }

      if (view === "week") {
        const dayOfWeek = selectedDate.getDay();

        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const isInSelectedWeek =
          eventStartDate <= weekEnd && eventEndDate >= weekStart;
        return isInSelectedWeek;
      }

      if (view === "day") {
        const dayStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0,
          0,
          0,
        );
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59,
        );
        const isInSelectedDay =
          eventStartDate <= dayEnd && eventEndDate >= dayStart;
        return isInSelectedDay;
      }

      return true;
    });
  }, [selectedDate, events, view, isBuiltinSourceEnabled, isCalendarVisible]);

  // 모바일 일별 시트 이벤트 — 앱 _eventsOnDay 정합 (해당 일과 겹침 + 시작시각 정렬).
  // 캘린더 이벤트 + 공휴일만 (지출/할일 pseudo-event 제외). 공휴일은 읽기 전용 행.
  const dayEvents = useMemo(
    () => (dayDate ? eventsOnDay(filteredEvents, dayDate) : []),
    [dayDate, filteredEvents],
  );

  const singleDayEvents = filteredEvents.filter((event) => {
    if (event.isAllDay) return false;
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return isSameDay(startDate, endDate);
  });

  const multiDayEvents = filteredEvents.filter((event) => {
    if (event.isAllDay) return true;
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return !isSameDay(startDate, endDate);
  });

  const eventStartDates = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      endDate: event.startDate,
    }));
  }, [filteredEvents]);

  return {
    // 상세
    selectedEvent,
    setSelectedEvent,
    anchorRef,
    handleEventClick,
    handleClosePopover,
    handleEditEvent,
    handleDeleteEvent,
    // 수정 · 삭제 · 생성
    editingEvent,
    setEditingEvent,
    deletingEventId,
    setDeletingEventId,
    creatingDate,
    setCreatingDate,
    dayDate,
    setDayDate,
    deleteEvent,
    handleConfirmDelete,
    // 거른 일정
    filteredEvents,
    dayEvents,
    singleDayEvents,
    multiDayEvents,
    eventStartDates,
  };
}

export type CalendarScreen = ReturnType<typeof useCalendarScreen>;
