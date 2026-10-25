import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useState } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { navigateDate } from "@/widgets/calendar/lib/helpers";
import type { TCalendarView } from "@/widgets/calendar/model/types";
import { Button } from "@/shared/ds/button";
import { ChipRadio, ChipRadioGroup } from "@/shared/ds/chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { CalendarSourceToggle } from "@/widgets/calendar/ui/header/calendar-source-toggle";
import { MonthYearPickerContent } from "@/widgets/calendar/ui/header/month-year-picker";

/** 보기 고르기 차례 — 월 · 주 · 일 · 연 · 목록(I-09 15) */
const VIEWS: { value: TCalendarView; key: string }[] = [
  { value: "month", key: "view.month" },
  { value: "week", key: "view.week" },
  { value: "day", key: "view.day" },
  { value: "year", key: "view.year" },
  { value: "agenda", key: "view.agenda" },
];

/**
 * 데스크톱 · 태블릿 도구 줄 (I-09 14 · 15) — 제목 줄 아래 16, 카드 밖 회색 바닥 위 한 줄.
 * 왼쪽: ‹ › (Button small outline 아이콘 36) · 달 글 t7 700 + 꺾쇠(누르면 달 고르기 팝오버) · "오늘".
 * 오른쪽: 캘린더 고르기 칩 · 보기 고르기(Chip 하나 고르기 — 이름이 보이는 글). 좁으면 오른쪽 묶음이 다음 줄로.
 */
const CalendarHeaderDesktop = () => {
  const { t, i18n } = useTranslation("calendar");
  const { selectedDate, setSelectedDate, view, setView } = useCalendar();
  const [pickerOpen, setPickerOpen] = useState(false);

  const locale = i18n.language.startsWith("ko") ? ko : enUS;
  const dateFormat = i18n.language.startsWith("ko")
    ? "yyyy년 M월"
    : "MMMM yyyy";
  const formattedDate = format(selectedDate, dateFormat, { locale });

  const handlePrevious = () =>
    setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () =>
    setSelectedDate(navigateDate(selectedDate, view, "next"));
  const handleTodayClick = () => setSelectedDate(new Date());

  return (
    <div className="flex flex-wrap items-center justify-between gap-x3">
      <div className="flex items-center gap-x1">
        <Button
          aria-label={t("header.prevMonth")}
          variant="neutralOutline"
          size="small"
          layout="iconOnly"
          className="[&_svg]:size-4"
          onClick={handlePrevious}
        >
          <ChevronLeft />
        </Button>
        <Button
          aria-label={t("header.nextMonth")}
          variant="neutralOutline"
          size="small"
          layout="iconOnly"
          className="[&_svg]:size-4"
          onClick={handleNext}
        >
          <ChevronRight />
        </Button>
        {/* 날짜 텍스트 → Popover picker 트리거 */}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mx-x2 flex items-center gap-x1 whitespace-nowrap rounded-r2 text-t7 font-bold text-fg-neutral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring"
            >
              {formattedDate}
              <ChevronDown
                aria-hidden
                className="size-4 text-fg-neutral-muted"
              />
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
        <Button
          variant="neutralOutline"
          size="small"
          onClick={handleTodayClick}
        >
          {t("today")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x2">
        <CalendarSourceToggle />
        <ChipRadioGroup
          aria-label={t("view.label")}
          value={view}
          onValueChange={(v) => setView(v as TCalendarView)}
        >
          {VIEWS.map(({ value, key }) => (
            <ChipRadio
              key={value}
              value={value}
              variant="outlineStrong"
              size="small"
            >
              {t(key)}
            </ChipRadio>
          ))}
        </ChipRadioGroup>
      </div>
    </div>
  );
};

export { CalendarHeaderDesktop };
