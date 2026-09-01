import { createContext, useContext } from "react";
import type {
  TCalendarView,
  TBadgeVariant,
  TWorkingHours,
  TVisibleHours,
  TCalendarSourceType,
  IBuiltinSource,
} from "./types";
import type { IEvent } from "./interfaces";
import type { UserCalendar } from "@/entities/user-calendar";

/*
 * 캘린더 컨텍스트와 훅 — 프로바이더 컴포넌트(`calendar-provider.tsx`)와 갈라 둔다.
 * 한 파일이 컴포넌트와 그 밖의 것을 함께 export 하면 Fast Refresh 가 그 파일의 상태를
 * 매번 버린다(react-refresh/only-export-components).
 */

export interface CalendarContextValue {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  workingHours: TWorkingHours;
  setWorkingHours: (hours: TWorkingHours) => void;
  visibleHours: TVisibleHours;
  setVisibleHours: (hours: TVisibleHours) => void;
  events: IEvent[];
  setLocalEvents: (events: IEvent[]) => void;
  builtinSources: IBuiltinSource[];
  toggleBuiltinSource: (sourceId: TCalendarSourceType) => void;
  isBuiltinSourceEnabled: (sourceId: TCalendarSourceType) => boolean;
  userCalendars: UserCalendar[];
  isCalendarVisible: (calendarRowId: number) => boolean;
  toggleCalendarVisibility: (calendarRowId: number) => void;
}

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export const useCalendarContext = (): CalendarContextValue => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider",
    );
  }
  return context;
};

export const useCalendar = useCalendarContext;
