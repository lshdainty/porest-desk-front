import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarKeys, invalidateFor } from "@/shared/config";
import { calendarApi } from "../api/calendarApi";
import type { CalendarEventFormValues } from "@/entities/calendar";

export const useCalendarEvents = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: calendarKeys.events({ startDate, endDate }),
    queryFn: () => calendarApi.getEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      silent,
    }: {
      data: CalendarEventFormValues;
      /** 실패를 호출처가 자기 자리에서 알리면 true — 기본(생략)은 전역 오류 토스트 */
      silent?: boolean;
    }) => calendarApi.createEvent(data, { silent }),
    onSuccess: () => invalidateFor(queryClient, "calendar-event"),
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      silent,
    }: {
      id: number;
      data: CalendarEventFormValues;
      /** 실패를 호출처가 자기 자리에서 알리면 true — 기본(생략)은 전역 오류 토스트 */
      silent?: boolean;
    }) => calendarApi.updateEvent(id, data, { silent }),
    onSuccess: () => invalidateFor(queryClient, "calendar-event"),
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => calendarApi.deleteEvent(id),
    onSuccess: () => invalidateFor(queryClient, "calendar-event"),
  });
};
