import { useId } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Repeat, Bell, Tag, Check } from "lucide-react";
import { cn } from "@/shared/lib";
import { Form } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import { InputTimePicker } from "@/shared/ui/input-time-picker";
import { ModalShell } from "@/shared/ui/groo/dialogs";
import { ModalFooter } from "@/shared/ui/groo/modal-footer";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import { useIsMobile } from "@/shared/hooks";
import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";
import type { EventLabel } from "@/entities/event-label";
import {
  CONTENT_MAX,
  RECURRENCE_OPTIONS,
  REMINDER_OPTIONS,
  TITLE_MAX,
  useEventForm,
  type RecurrenceOption,
} from "@/widgets/calendar/model/use-event-form";

const NO_LABEL_VALUE = "__none__";

interface EventFormProps {
  event?: CalendarEvent | null;
  selectedDate?: Date;
  selectedEndDate?: Date;
  labels?: EventLabel[];
  onSubmit: (data: CalendarEventFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
  /** 수정 모드 삭제 — 제공 시 footer 좌측 danger 버튼 노출(앱 PSheetFooter 미러). */
  onDelete?: () => void;
}

export const EventForm = ({
  event,
  selectedDate,
  selectedEndDate,
  labels = [],
  onSubmit,
  onClose,
  isLoading,
  onDelete,
}: EventFormProps) => {
  const uid = useId(); // 선택 칸 이름 잇기 — 보이는 라벨 + 값을 aria-labelledby 로
  const { t } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const isMobile = useIsMobile();
  const {
    form,
    handleSubmit,
    onFormSubmit,
    selectableCalendars,
    recurrence,
    selectedReminders,
    handleRecurrenceChange,
    handleRemindersChange,
    handleCalendarChange,
    handleAllDayChange,
    setStartDay,
    setStartTime,
    setEndDay,
    setEndTime,
    startDate,
    endDate,
    isAllDay,
    dateRangeInvalid,
    selectedLabelRowId,
    selectedCalendarRowId,
  } = useEventForm({ event, selectedDate, selectedEndDate, onSubmit });
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  const getReminderLabel = (minutes: number): string => {
    if (minutes < 60) return t(`reminder.${minutes}min`);
    if (minutes === 60) return t("reminder.1hour");
    if (minutes === 1440) return t("reminder.1day");
    return `${minutes}min`;
  };

  const Footer = (
    <ModalFooter
      onSave={handleSubmit(onFormSubmit)}
      saveLabel={tc("save")}
      saving={isLoading}
      saveDisabled={dateRangeInvalid}
      onDelete={event && onDelete ? onDelete : undefined}
      deleteLabel={tc("delete")}
    />
  );

  return (
    <ModalShell
      title={event ? t("editEvent") : t("addEvent")}
      onClose={onClose}
      mobile={isMobile}
      size="sm"
      footer={Footer}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label>{t("form.title")}</Label>
            <Input
              {...register("title", {
                required: t("form.titleRequired"),
                maxLength: TITLE_MAX,
              })}
              className={cn(errors.title && "border-stroke-critical-solid")}
              placeholder={t("form.titlePlaceholder")}
              maxLength={TITLE_MAX}
            />
            {errors.title && (
              <p className="text-xs text-fg-critical">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("form.description")}</Label>
            <Textarea
              {...register("description", { maxLength: CONTENT_MAX })}
              rows={2}
              className="resize-none"
              placeholder={t("form.descriptionPlaceholder")}
              maxLength={CONTENT_MAX}
            />
          </div>

          {/* Calendar selector */}
          {selectableCalendars.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label id={`${uid}cal-label`}>{t("form.calendar")}</Label>
              <Select
                value={
                  selectedCalendarRowId
                    ? String(selectedCalendarRowId)
                    : undefined
                }
                onValueChange={(v) => handleCalendarChange(Number(v))}
              >
                <SelectTrigger
                  id={`${uid}cal`}
                  aria-labelledby={`${uid}cal-label ${uid}cal`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableCalendars.map((cal) => (
                    <SelectItem key={cal.rowId} value={String(cal.rowId)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getPaletteByColor(cal.color).color,
                          }}
                        />
                        {cal.calendarName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Label selector */}
          {labels.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label id={`${uid}lbl-label`}>
                <Tag size={14} className="inline mr-1" />
                {t("form.label")}
              </Label>
              <Select
                value={
                  selectedLabelRowId
                    ? String(selectedLabelRowId)
                    : NO_LABEL_VALUE
                }
                onValueChange={(v) =>
                  setValue(
                    "labelRowId",
                    v === NO_LABEL_VALUE ? undefined : Number(v),
                    {
                      shouldDirty: true,
                    },
                  )
                }
              >
                <SelectTrigger
                  id={`${uid}lbl`}
                  aria-labelledby={`${uid}lbl-label ${uid}lbl`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LABEL_VALUE}>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                      {t("noLabels")}
                    </span>
                  </SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label.rowId} value={String(label.rowId)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getPaletteByColor(label.color)
                              .color,
                          }}
                        />
                        {label.labelName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 일정마다 고르는 색 칸은 두지 않는다(사용자 결정 2026-09-25) — 화면은 라벨·캘린더
              색으로 칠해서 고른 색이 한 번도 보이지 않았다(QA 30 12). 저장값은 캘린더를 고를 때
              그 캘린더 색으로 채운 그대로다. */}
          {/* All-day switch */}
          <div className="flex items-center gap-2">
            <Switch
              checked={isAllDay}
              onCheckedChange={handleAllDayChange}
              id="event-all-day"
            />
            <Label
              htmlFor="event-all-day"
              className="font-normal cursor-pointer"
            >
              {t("form.allDay")}
            </Label>
          </div>

          {/* allDay=true 는 시작/종료 같은 row, false 는 row stack — date input width 확보 */}
          {/* 날짜·시각 칸은 다 친 값만 받는다(commitOnComplete). 받은 값에 시각을 이어 붙이고
              종료를 보정하는데, 키를 누를 때마다 미완성 값이 들어오면 `2T10:00` 이 칸에 되써져
              입력이 깨지고 종료는 NaN 이 됐다(2026-09-28 QA). */}
          <div className={isAllDay ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            <div className="flex flex-col gap-2">
              <Label>{t("form.startDate")}</Label>
              {isAllDay ? (
                <InputDatePicker
                  commitOnComplete
                  value={startDate}
                  onValueChange={setStartDay}
                />
              ) : (
                <div className="grid grid-cols-[1fr_116px] gap-2">
                  <InputDatePicker
                    commitOnComplete
                    value={startDate.substring(0, 10)}
                    onValueChange={setStartDay}
                  />
                  <InputTimePicker
                    commitOnComplete
                    value={startDate.substring(11, 16)}
                    onValueChange={setStartTime}
                    minuteStep={5}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("form.endDate")}</Label>
              {isAllDay ? (
                <InputDatePicker
                  commitOnComplete
                  value={endDate}
                  onValueChange={setEndDay}
                />
              ) : (
                <div className="grid grid-cols-[1fr_116px] gap-2">
                  <InputDatePicker
                    commitOnComplete
                    value={endDate.substring(0, 10)}
                    onValueChange={setEndDay}
                  />
                  <InputTimePicker
                    commitOnComplete
                    value={endDate.substring(11, 16)}
                    onValueChange={setEndTime}
                    minuteStep={5}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <Label>
              <MapPin size={14} className="inline mr-1" />
              {t("form.location")}
            </Label>
            <Input
              {...register("location")}
              placeholder={t("form.locationPlaceholder")}
            />
          </div>

          {/* Recurrence — single select */}
          <div className="flex flex-col gap-2">
            <Label>
              <Repeat size={14} className="inline mr-1" />
              {t("form.recurrence")}
            </Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={recurrence}
              onValueChange={(v) =>
                v && handleRecurrenceChange(v as RecurrenceOption)
              }
              className="justify-start flex-wrap"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <ToggleGroupItem key={option} value={option}>
                  {t(`recurrence.${option}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reminder — multi select */}
          <div className="flex flex-col gap-2">
            <Label>
              <Bell size={14} className="inline mr-1" />
              {t("form.reminder")}
            </Label>
            <ToggleGroup
              type="multiple"
              size="sm"
              value={selectedReminders.map(String)}
              onValueChange={(v) => handleRemindersChange(v.map(Number))}
              className="justify-start flex-wrap"
            >
              {REMINDER_OPTIONS.map((minutes) => (
                <ToggleGroupItem key={minutes} value={String(minutes)}>
                  {selectedReminders.includes(minutes) && (
                    <Check size={12} className="inline mr-1" />
                  )}
                  {getReminderLabel(minutes)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {dateRangeInvalid && (
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-caption)",
                color: "var(--color-fg-critical)",
              }}
            >
              {t("form.endBeforeStart")}
            </p>
          )}
        </form>
      </Form>
    </ModalShell>
  );
};
