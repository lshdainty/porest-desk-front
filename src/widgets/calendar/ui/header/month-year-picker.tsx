import { ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatYear, formatMonthShort } from "@/shared/lib/date";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib";

/** 연/월 선택 picker 내용 — Popover·Drawer 양쪽에서 재사용 */
const MonthYearPickerContent = ({
  selectedDate,
  onSelect,
  onToday,
  onClose,
  mobile = false,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onToday: () => void;
  onClose: () => void;
  /** 모바일(Drawer) 경로 — footer 액션을 풀폭 반반으로 나눈다. */
  mobile?: boolean;
}) => {
  const { t } = useTranslation("calendar");
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());

  return (
    <div className="min-w-[220px]">
      {/* Year navigation */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Button
          aria-label={t("common:prev")}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear((y) => y - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-t4 font-bold">{formatYear(pickerYear)}</span>
        <Button
          aria-label={t("common:next")}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear((y) => y + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Month grid — 4열 × 3행 */}
      <div className="grid grid-cols-4 gap-1 px-3 pb-3">
        {Array.from({ length: 12 }, (_, i) => {
          const isSelected =
            selectedDate.getFullYear() === pickerYear &&
            selectedDate.getMonth() === i;
          return (
            <button
              key={i}
              onClick={() => {
                onSelect(new Date(pickerYear, i, 1));
                onClose();
              }}
              className={cn(
                "rounded py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "bg-bg-brand-solid text-static-white hover:bg-bg-brand-solid-pressed"
                  : "hover:bg-accent text-foreground",
              )}
            >
              {formatMonthShort(i + 1)}
            </button>
          );
        })}
      </div>

      {/* Footer — 모바일은 풀폭 반반(spec drawer.md "flex:1 평등 분배"),
          데스크탑 Popover 는 좁은 카드라 양끝 정렬 유지. */}
      <div
        className={
          "flex items-center border-t px-3 py-2 " +
          (mobile
            ? "gap-2 [&>button]:flex-1 [&>button]:justify-center"
            : "justify-between")
        }
      >
        <button
          // 오늘로 = primary-light(다크에서 --fg-brand-strong→primary-light swap)로 가독성 확보.
          // primary(--color-primary)는 다크 배경에서 잘 안 보임. 선택 월 박스는 브랜드 채움(bg-bg-brand-solid).
          className="flex items-center gap-1 text-t4 font-medium text-fg-brand hover:opacity-80"
          onClick={() => {
            onToday();
            onClose();
          }}
        >
          <Navigation size={16} />
          {t("goToToday")}
        </button>
        <button
          className="text-t4 text-fg-neutral-muted hover:text-fg-neutral"
          onClick={onClose}
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
};

export { MonthYearPickerContent };
