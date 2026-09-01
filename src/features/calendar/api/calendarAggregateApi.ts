import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type { CalendarAggregateData } from "@/entities/calendar";
import { fromApiEvent } from "./calendarApi";

export const calendarAggregateApi = {
  getAggregateData: async (
    startDate: string,
    endDate: string,
  ): Promise<CalendarAggregateData> => {
    const resp: ApiResponse<CalendarAggregateData> = await apiClient.get(
      "/v1/calendar/aggregate",
      {
        params: { startDate, endDate },
      },
    );
    return {
      ...resp.data,
      // 서버는 isAllDay/isException 을 YNType("Y"/"N") 으로 준다 — 변환은
      // calendarApi 의 fromApiEvent 하나가 맡는다. 여기서 다시 풀어 쓰면
      // 필드가 늘 때 한쪽만 고쳐진다(그래서 any 로 새던 자리다).
      events: (resp.data.events as unknown as Record<string, unknown>[]).map(
        fromApiEvent,
      ),
    };
  },
};
