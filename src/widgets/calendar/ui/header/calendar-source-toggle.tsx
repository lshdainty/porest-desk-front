import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ChevronRight, Flag } from "lucide-react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { Badge } from "@/shared/ds/badge";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
} from "@/shared/ds/bottom-sheet";
import { Chip } from "@/shared/ds/chip";
import {
  List,
  ListButtonItem,
  ListCheckGroup,
  ListCheckItem,
  ListHeader,
  ListItem,
} from "@/shared/ds/list";
import { useWideSurface } from "@/shared/ds/overlay";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ds/popover";
import { ProgressCircle } from "@/shared/ds/progress-circle";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";

import { isCalendarShown, type UserCalendar } from "@/entities/user-calendar";
import type { IBuiltinSource } from "@/widgets/calendar/model/types";

/*
 * 캘린더 고르기 (I-09 6 · 7) — 머리의 여는 칩(Chip · aria-haspopup="dialog")과 그것이 여는 표면.
 * 1280 이상은 머리 없는 Popover, 미만은 Bottom Sheet 고르기(제목 "캘린더"). 안은 List — 내 캘린더(체크 줄) · 기타 소스(공휴일) ·
 * "캘린더 관리 · 공유 설정"(화면을 옮기는 줄, 꺾쇠). 이름은 줄을 바꿔 다 보인다(말줄임 없음).
 */

/** 캘린더 이름 왼쪽의 색 점 — 줄마다 같은 자리에 같은 크기(10)로 둔다. */
const CalendarDot = ({ color }: { color: string }) => (
  <span
    aria-hidden
    className="size-2.5 shrink-0 rounded-full"
    style={{ backgroundColor: color }}
  />
);

/**
 * 기본 캘린더 행 — **표시 스위치를 두지 않는다.**
 *
 * 기본 캘린더는 서버가 자동으로 대입하는 자리라 숨기면 방금 만든 일정이 곧바로 안 보인다.
 * 서버도 이 캘린더의 표시 토글을 400 으로 막으므로 스위치를 남겨 두면 누르는 순간 에러만
 * 난다. 회색으로 잠근 스위치도 두지 않는다 — 누를 수 없는 컨트롤은 "왜 안 되지" 를 만든다.
 * 대신 늘 켜진 표식(체크 글리프)과 `기본` 배지를 둬서 이 행이 왜 다른지 그 자리에서 읽히게 한다.
 * 누르는 줄이 아니라 보기만 하는 줄(ListItem)이다.
 */
const DefaultCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { t } = useTranslation("calendar");
  const color = getPaletteByColor(calendar.color).color;

  return (
    <ListItem
      prefix={
        <span className="flex items-center gap-x3">
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center"
            style={{ color }}
          >
            <Check className="size-4" strokeWidth={2.5} />
          </span>
          <CalendarDot color={color} />
        </span>
      }
      title={
        <>
          {calendar.calendarName}{" "}
          <Badge title={t("cannotHideDefault")} className="align-[2px]">
            {t("default")}
          </Badge>
        </>
      }
    />
  );
};

const UserCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { toggleCalendarVisibility, pendingCalendarIds } = useCalendar();
  const pending = pendingCalendarIds.has(calendar.rowId);
  const color = getPaletteByColor(calendar.color).color;

  // 켜는 중 — 체크 자리에 ds 스피너, 줄은 잠근다(누르는 줄이 아니다)
  if (pending) {
    return (
      <ListItem
        aria-busy
        prefix={
          <span className="flex items-center gap-x3">
            <ProgressCircle size="24" aria-hidden className="shrink-0" />
            <CalendarDot color={color} />
          </span>
        }
        title={calendar.calendarName}
      />
    );
  }

  return (
    <ListCheckItem
      checked={calendar.isVisible}
      onCheckedChange={() => toggleCalendarVisibility(calendar.rowId)}
      prefix={<CalendarDot color={color} />}
      title={calendar.calendarName}
    />
  );
};

const BuiltinSourceItem = ({ source }: { source: IBuiltinSource }) => {
  const { t } = useTranslation("calendar");
  const { toggleBuiltinSource } = useCalendar();

  return (
    <ListCheckItem
      checked={source.enabled}
      onCheckedChange={() => toggleBuiltinSource(source.id)}
      prefix={
        <Flag
          aria-hidden
          className="size-4 shrink-0"
          style={{
            color: source.enabled
              ? getPaletteByColor(source.color).color
              : undefined,
          }}
        />
      }
      title={t(`source.${source.id}`)}
    />
  );
};

/** 캘린더 고르기 내용 — Popover · Bottom Sheet 양쪽에서 재사용 */
const CalendarSourceContent = ({ onManage }: { onManage: () => void }) => {
  const { t } = useTranslation("calendar");
  const { builtinSources, userCalendars } = useCalendar();
  const mineId = useId();
  const otherId = useId();

  return (
    <>
      <ListHeader as="h3" id={mineId}>
        {t("shareSection.myCalendars")}
      </ListHeader>
      <ListCheckGroup aria-labelledby={mineId}>
        {userCalendars.map((calendar) =>
          calendar.isDefault ? (
            <DefaultCalendarItem key={calendar.rowId} calendar={calendar} />
          ) : (
            <UserCalendarItem key={calendar.rowId} calendar={calendar} />
          ),
        )}
      </ListCheckGroup>

      {/* 기타 소스 — 공휴일만 (가계부/할일 제거).
          공휴일은 백엔드가 매일 동기화하므로 표시 토글만 두고 관리 진입점은 없다. */}
      <ListHeader as="h3" id={otherId}>
        {t("otherSources")}
      </ListHeader>
      <ListCheckGroup aria-labelledby={otherId}>
        {builtinSources
          .filter((source) => source.id === "holiday")
          .map((source) => (
            <BuiltinSourceItem key={source.id} source={source} />
          ))}
      </ListCheckGroup>

      {/* 캘린더 관리 · 공유 설정 링크 — 화면을 옮기는 줄이라 꺾쇠(18) */}
      <List className="pb-x2">
        <ListButtonItem
          title={t("manageShare")}
          suffix={
            <ChevronRight
              aria-hidden
              className="size-[18px] text-fg-neutral-subtle"
            />
          }
          onClick={onManage}
        />
      </List>
    </>
  );
};

const CalendarSourceToggle = () => {
  const { t } = useTranslation("calendar");
  const { builtinSources, userCalendars } = useCalendar();
  const wide = useWideSurface();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // 관리·공유는 설정의 "캘린더 관리·공유" 탭으로 이동 (별도 dialog 폐지)
  const goManageShare = () => {
    setOpen(false);
    navigate("/desk/settings?section=calendar-share");
  };

  // 칩 앞 점 — 보이는 캘린더 최대 3개 + builtin 소스 색상.
  // 드롭다운 항목(getPaletteByColor)과 동일하게 dark-aware 변환 — raw hex 직접 주입 시
  // 다크모드 light 변형 swap 이 안 돼 앱과 색이 어긋나던 버그 fix (앱 solidSwatchColor 정합).
  const dotColors = [
    ...userCalendars
      .filter((c) => isCalendarShown(c))
      .map((c) => getPaletteByColor(c.color).color),
    ...builtinSources
      .filter((s) => s.enabled)
      .map((s) => getPaletteByColor(s.color).color),
  ].slice(0, 3);

  const totalCount =
    userCalendars.filter((c) => isCalendarShown(c)).length +
    builtinSources.filter((s) => s.enabled).length;

  const chip = (
    <Chip
      variant="outlineWeak"
      size={wide ? "small" : "medium"}
      suffixIcon={<ChevronDown />}
      aria-haspopup="dialog"
      aria-label={t("sourceChipLabel", { count: totalCount })}
      onClick={wide ? undefined : () => setOpen(true)}
    >
      <span aria-hidden className="flex items-center">
        {dotColors.map((color, i) => (
          <span
            key={i}
            className={`size-2 shrink-0 rounded-full ${i > 0 ? "-ml-0.5" : ""}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span aria-hidden>{t("sourceCount", { count: totalCount })}</span>
    </Chip>
  );

  if (wide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent
          align="end"
          aria-label={t("title")}
          className="w-[320px]"
        >
          <div className="max-h-[inherit] overflow-y-auto overscroll-contain">
            <CalendarSourceContent onManage={goManageShare} />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {chip}
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent title={t("title")} aria-describedby={undefined}>
          <BottomSheetBody scrollFog>
            <div className="-mx-x6">
              <CalendarSourceContent onManage={goManageShare} />
            </div>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
};

export { CalendarSourceToggle };
