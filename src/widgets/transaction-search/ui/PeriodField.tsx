import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import {
  DATE_PICKER_TWO_MONTHS_POPOVER,
  DATE_PRESETS,
  DatePicker,
  dayKey,
  formatRangeValue,
  parseDayKey,
  type DateRange,
} from "@/shared/ds/date-picker";
import { Field } from "@/shared/ds/field";
import { InputButton, useInputButtonSurface } from "@/shared/ds/input-button";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
} from "@/shared/ds/popover";

// 빠른 기간 — 스펙 예시 다섯(date-picker.md "빠른 기간")
const PRESETS = DATE_PRESETS.filter((n) =>
  ["thisWeek", "thisMonth", "lastMonth", "last3Months", "thisYear"].includes(n),
);

// 값이 한 줄 말줄임(truncate)이 아니라 keep-all 줄바꿈이 되고 상자(min-h)가 글을 따라 커진다. 5열 상자 안(글 자리 20 ~ 35px)에서는 달력 아이콘이 글과 겹쳐 grow 일 때는 아이콘을 뺀다
const GROW =
  "[&_[data-slot=input-button-value]]:overflow-visible [&_[data-slot=input-button-value]]:text-clip [&_[data-slot=input-button-value]]:whitespace-normal [&_[data-slot=input-button-value]]:break-keep [&_[data-slot=input-button-value]]:[overflow-wrap:normal] [&_[data-slot=input-button-content]]:py-x2";

/**
 * 고급 필터의 기간 칸 — 칸 하나(Input Button)를 누르면 Date Picker 기간 고르기가 열린다(top-navigation.md 거래 검색
 * "기간 — Input Button 으로 여는 Date Picker 기간 고르기, 브라우저 날짜 칸을 쓰지 않는다", I-01 결과 확인 고치기 W2).
 * 1280 미만은 시트 위 시트(이어지는 달 + 빠른 기간), 이상은 팝오버 두 달. 고르는 동안 칸 값은 그대로, "완료" 에서 넣는다.
 * 값은 "YYYY-MM-DD" 두 개(from · to — 검색 조건과 같은 꼴)다.
 */
export function PeriodField({
  from,
  to,
  onChange,
  label: fieldLabel,
  invalid,
  errorMessage,
  grow = false,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  /** 칸 이름 — 기본 "기간" (검색). 다른 화면이 쓸 때만 */
  label?: string;
  /** 오류 — 기간이 비었을 때 같은 칸 아래 글(R19) */
  invalid?: boolean;
  errorMessage?: string;
  /** 좁은 자리(펼침 안 · 5열 상자)에서 값을 말줄임하지 않고 단어 단위(keep-all)로 줄을 바꿔 칸이 글을 따라 커진다 */
  grow?: boolean;
}) {
  const { t } = useTranslation("common");
  const surface = useInputButtonSurface();
  const [open, setOpen] = useState(false);
  const start = parseDayKey(from);
  const current: DateRange | undefined = start
    ? { start, end: parseDayKey(to) }
    : undefined;
  const [draft, setDraft] = useState<DateRange | undefined>(current);
  const label = t("searchPeriodPick");
  const trigger = (
    <InputButton
      placeholder={label}
      value={formatRangeValue(current, new Date())}
      suffixIcon={grow ? undefined : <CalendarDays />}
      rootClassName={grow ? GROW : undefined}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setDraft(current);
        setOpen(true);
      }}
    />
  );
  const sheet = surface === "sheet";
  const picker = (
    <DatePicker
      selection="range"
      visibleRange={sheet ? "continuous" : "twoMonths"}
      presets={PRESETS}
      aria-label={label}
      value={draft}
      onValueChange={setDraft}
      autoFocus
    />
  );
  const footer = (
    <>
      <Button variant="neutralWeak" onClick={() => setDraft(undefined)}>
        {t("searchReset")}
      </Button>
      <Button
        disabled={!!draft?.start && !draft.end}
        onClick={() => {
          onChange({
            from: draft?.start ? dayKey(draft.start) : "",
            to: draft?.end ? dayKey(draft.end) : "",
          });
          setOpen(false);
        }}
      >
        {t("searchDone")}
      </Button>
    </>
  );
  return (
    <Field
      label={fieldLabel ?? t("searchPeriod")}
      invalid={invalid}
      errorMessage={errorMessage}
    >
      {sheet ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          {trigger}
          <BottomSheetContent title={label} className="h-[90dvh]">
            <BottomSheetBody className="overflow-hidden">
              {picker}
            </BottomSheetBody>
            <BottomSheetFooter>{footer}</BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            aria-label={label}
            align="start"
            className={DATE_PICKER_TWO_MONTHS_POPOVER}
          >
            <PopoverBody>{picker}</PopoverBody>
            <PopoverFooter>{footer}</PopoverFooter>
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}
