import {
  CalendarRange,
  Columns,
  Grid2x2,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useMemo, useState } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import {
  getEventsCount,
  navigateDate,
  rangeText,
} from "@/widgets/calendar/lib/helpers";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { CalendarSourceToggle } from "@/widgets/calendar/ui/header/calendar-source-toggle";
import { MonthYearPickerContent } from "@/widgets/calendar/ui/header/month-year-picker";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

interface IProps {
  events: IEvent[];
}

/** 데스크톱 · 태블릿 머리 — 오늘 · 달 이동 · 날짜 텍스트(Popover picker) · 캘린더 고르기 · 보기 */
const CalendarHeaderDesktop = ({ events }: IProps) => {
  const { t, i18n } = useTranslation("calendar");
  const { selectedDate, setSelectedDate, view, setView } = useCalendar();
  const [pickerOpen, setPickerOpen] = useState(false);

  const locale = i18n.language.startsWith("ko") ? ko : enUS;
  const dateFormat = i18n.language.startsWith("ko")
    ? "yyyy년 M월"
    : "MMMM yyyy";
  const formattedDate = format(selectedDate, dateFormat, { locale });

  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view],
  );

  const handlePrevious = () =>
    setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () =>
    setSelectedDate(navigateDate(selectedDate, view, "next"));
  const handleTodayClick = () => setSelectedDate(new Date());

  return (
    <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {/* Today 날짜 버튼 */}
        <button
          className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring"
          onClick={handleTodayClick}
        >
          <p className="flex h-6 w-full items-center justify-center bg-bg-brand-solid text-center text-xs font-semibold text-static-white">
            {format(
              new Date(),
              i18n.language.startsWith("ko") ? "M월" : "MMM",
              { locale },
            ).toUpperCase()}
          </p>
          <p className="flex w-full items-center justify-center text-lg font-bold">
            {new Date().getDate()}
          </p>
        </button>

        {/* Date navigator */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {/* 날짜 텍스트 → Popover picker 트리거 */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-lg font-semibold hover:opacity-80 focus-visible:outline-none">
                  {formattedDate}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <MonthYearPickerContent
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onToday={handleTodayClick}
                  onClose={() => setPickerOpen(false)}
                />
              </PopoverContent>
            </Popover>
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium">
              {t("header.eventCount", { count: eventCount })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label={t("common:prev")}
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </Button>
            <p className="text-sm text-muted-foreground">
              {rangeText(view, selectedDate, locale)}
            </p>
            <Button
              aria-label={t("common:next")}
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handleNext}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <CalendarSourceToggle />
        <div className="hidden h-6 w-px bg-border md:block" />

        <div className="inline-flex">
          <Button
            aria-label={t("header.viewDay")}
            size="icon"
            variant={view === "day" ? "default" : "outline"}
            className="rounded-r-none"
            onClick={() => setView("day")}
          >
            <List strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t("header.viewWeek")}
            size="icon"
            variant={view === "week" ? "default" : "outline"}
            className="-ml-px rounded-none"
            onClick={() => setView("week")}
          >
            <Columns strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t("header.viewMonth")}
            size="icon"
            variant={view === "month" ? "default" : "outline"}
            className="-ml-px rounded-none"
            onClick={() => setView("month")}
          >
            <Grid2x2 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t("header.viewYear")}
            size="icon"
            variant={view === "year" ? "default" : "outline"}
            className="-ml-px rounded-none"
            onClick={() => setView("year")}
          >
            <Grid3x3 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t("header.viewAgenda")}
            size="icon"
            variant={view === "agenda" ? "default" : "outline"}
            className="-ml-px rounded-l-none"
            onClick={() => setView("agenda")}
          >
            <CalendarRange strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { CalendarHeaderDesktop };
