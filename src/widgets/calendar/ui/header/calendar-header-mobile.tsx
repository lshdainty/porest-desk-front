import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useState } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { navigateDate } from "@/widgets/calendar/lib/helpers";
import { Button } from "@/shared/ds/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/shared/ui/drawer";
import { CalendarSourceToggle } from "@/widgets/calendar/ui/header/calendar-source-toggle";
import { MonthYearPickerContent } from "@/widgets/calendar/ui/header/month-year-picker";
import { useBackClose } from "@/shared/lib/groo/use-back-close";

/**
 * 폰 달 줄 (I-09 6) — 흰 면 맨 위, 높이 52 · 왼쪽 6 · 오른쪽 16.
 * ‹ › ghost 아이콘 버튼(보이는 40 · 누르는 44 · 아이콘 20) · 달 글 t6 700 + 꺾쇠 16(누르면 달 고르기) · 오른쪽 캘린더 고르기 칩.
 */
const CalendarHeaderMobile = () => {
  const { t, i18n } = useTranslation("calendar");
  const { selectedDate, setSelectedDate, view } = useCalendar();
  const [pickerOpen, setPickerOpen] = useState(false);
  // 날짜 선택 시트도 뒤로가기로 닫는다 — 안 걸면 캘린더를 떠난다(QA #129).
  useBackClose(() => setPickerOpen(false), pickerOpen);

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
    <div className="sticky top-0 z-30 flex h-x13 shrink-0 items-center bg-bg-layer-default pl-x1_5 pr-x4">
      <Button
        aria-label={t("header.prevMonth")}
        variant="ghost"
        size="medium"
        layout="iconOnly"
        className="[&_svg]:size-5"
        onClick={handlePrevious}
      >
        <ChevronLeft />
      </Button>

      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 items-center gap-x1 whitespace-nowrap rounded-r2 px-x1 text-t6 font-bold text-fg-neutral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring"
          >
            {formattedDate}
            <ChevronDown aria-hidden className="size-4 text-fg-neutral-muted" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex-1">{t("dateNavigation")}</DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label={t("close")}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-fg-neutral-subtle transition-colors hover:bg-bg-layer-default-pressed hover:text-fg-neutral"
              >
                <X size={18} />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <DrawerBody className="pb-6">
            <MonthYearPickerContent
              mobile
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onToday={handleTodayClick}
              onClose={() => setPickerOpen(false)}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Button
        aria-label={t("header.nextMonth")}
        variant="ghost"
        size="medium"
        layout="iconOnly"
        className="[&_svg]:size-5"
        onClick={handleNext}
      >
        <ChevronRight />
      </Button>
      <span className="min-w-x1 flex-1" />
      <CalendarSourceToggle />
    </div>
  );
};

export { CalendarHeaderMobile };
