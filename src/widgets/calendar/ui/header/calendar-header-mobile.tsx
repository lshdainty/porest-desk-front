import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useState } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { navigateDate } from "@/widgets/calendar/lib/helpers";
import { Button } from "@/shared/ui/button";
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

/** 폰 머리 — < 2026년 N월 > 네비 (날짜 텍스트 → Drawer picker) + 필터 칩 */
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
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-1">
        <Button
          aria-label={t("common:prev")}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
        >
          <ChevronLeft className="size-5" />
        </Button>

        <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
          <DrawerTrigger asChild>
            <button className="flex items-center gap-0.5 text-sm font-semibold focus-visible:outline-none">
              {formattedDate}
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex-1">
                {t("dateNavigation")}
              </DrawerTitle>
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
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
          aria-label={t("common:next")}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <CalendarSourceToggle />
    </div>
  );
};

export { CalendarHeaderMobile };
