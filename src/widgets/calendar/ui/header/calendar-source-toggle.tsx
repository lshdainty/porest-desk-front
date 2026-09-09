import { useNavigate } from "react-router-dom";
import { Spinner } from "@/shared/ui/spinner";
import { useTranslation } from "react-i18next";
import {
  Receipt,
  ListTodo,
  Flag,
  Settings2,
  ChevronDown,
  X,
} from "lucide-react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/shared/ui/drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib";
import { getPaletteByColor } from "@/shared/lib/porest/chart-palette";
import { useIsMobile } from "@/shared/hooks";

import type {
  IBuiltinSource,
  TCalendarSourceType,
} from "@/widgets/calendar/model/types";
import { isCalendarShown, type UserCalendar } from "@/entities/user-calendar";

const SOURCE_ICONS: Record<TCalendarSourceType, React.ElementType> = {
  holiday: Flag,
  expense: Receipt,
  todo: ListTodo,
};

const CheckMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path
      d="M8.5 2.5L3.5 7.5L1.5 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckboxIndicator = ({
  checked,
  color,
}: {
  checked: boolean;
  color: string;
}) => (
  <span
    className={cn(
      "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
    )}
    style={{
      borderColor: color,
      backgroundColor: checked ? color : "transparent",
    }}
  >
    {checked && (
      <span style={{ color: "var(--swatch-check)", display: "inline-flex" }}>
        <CheckMark />
      </span>
    )}
  </span>
);

/** 끌 수 없는 캘린더의 표식 — 네모(체크박스) 없이 체크만. 누르는 자리가 아니다. */
const AlwaysShownMark = ({ color }: { color: string }) => (
  <span
    className="flex size-4 shrink-0 items-center justify-center"
    style={{ color }}
  >
    <CheckMark />
  </span>
);

/** 캘린더 이름 왼쪽의 색 점 — 두 행이 같은 자리에 같은 크기로 둔다. */
const CalendarDot = ({ color }: { color: string }) => (
  <span
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
 * 대신 늘 켜진 표식과 `기본` 표를 둬서 이 행이 왜 다른지 그 자리에서 읽히게 한다.
 */
const DefaultCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { t } = useTranslation("calendar");
  const color = getPaletteByColor(calendar.color).color;

  return (
    <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm">
      <AlwaysShownMark color={color} />
      <CalendarDot color={color} />
      <span className="truncate">{calendar.calendarName}</span>
      <Badge
        variant="secondary"
        className="ml-auto shrink-0 font-bold"
        title={t("cannotHideDefault")}
      >
        {t("default")}
      </Badge>
    </div>
  );
};

const UserCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { toggleCalendarVisibility, pendingCalendarIds } = useCalendar();
  const pending = pendingCalendarIds.has(calendar.rowId);

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => toggleCalendarVisibility(calendar.rowId)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        !calendar.isVisible && "opacity-50",
      )}
    >
      {pending ? (
        <Spinner size="sm" />
      ) : (
        <CheckboxIndicator
          checked={calendar.isVisible}
          color={getPaletteByColor(calendar.color).color}
        />
      )}
      <CalendarDot color={getPaletteByColor(calendar.color).color} />
      <span className="truncate">{calendar.calendarName}</span>
    </button>
  );
};

const BuiltinSourceItem = ({ source }: { source: IBuiltinSource }) => {
  const { t } = useTranslation("calendar");
  const { toggleBuiltinSource } = useCalendar();

  const Icon = SOURCE_ICONS[source.id];

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => toggleBuiltinSource(source.id)}
        className={cn(
          "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !source.enabled && "opacity-50",
        )}
      >
        <CheckboxIndicator
          checked={source.enabled}
          color={getPaletteByColor(source.color).color}
        />
        <Icon
          className="size-4 shrink-0"
          style={{
            color: source.enabled
              ? getPaletteByColor(source.color).color
              : undefined,
          }}
        />
        <span className="truncate">{t(`source.${source.id}`)}</span>
      </button>
    </div>
  );
};

/** 캘린더 필터 내용 — Popover·Drawer 양쪽에서 재사용 */
const CalendarSourceContent = ({ onManage }: { onManage: () => void }) => {
  const { t } = useTranslation("calendar");
  const { builtinSources, userCalendars } = useCalendar();

  return (
    <>
      {/* Section 1: User Calendars (앱 정합 — 헤더 gear/+추가 제거, 하단 관리 링크로 통합) */}
      <div className="p-3 pb-2">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("title")}
        </span>
        <div className="space-y-0.5">
          {userCalendars.map((calendar) =>
            calendar.isDefault ? (
              <DefaultCalendarItem key={calendar.rowId} calendar={calendar} />
            ) : (
              <UserCalendarItem key={calendar.rowId} calendar={calendar} />
            ),
          )}
          {userCalendars.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">-</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Section 2: 기타 소스 — 공휴일만 (가계부/할일 제거).
          공휴일은 백엔드가 매일 자동 동기화하므로 표시 토글만 두고 관리 진입점은 없다. */}
      <div className="p-3 py-2">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("otherSources")}
        </span>
        <div className="space-y-0.5">
          {builtinSources
            .filter((source) => source.id === "holiday")
            .map((source) => (
              <BuiltinSourceItem key={source.id} source={source} />
            ))}
        </div>
      </div>

      <Separator />

      {/* Section 3: 캘린더 관리 · 공유 설정 링크 (앱 정합) */}
      <button
        type="button"
        onClick={onManage}
        className="flex w-full items-center gap-2 p-3 text-sm font-semibold text-[var(--fg-brand)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Settings2 size={15} />
        {t("manageShare")}
      </button>
    </>
  );
};

const CalendarSourceToggle = () => {
  const { t } = useTranslation("calendar");
  const { builtinSources, userCalendars } = useCalendar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  // 관리·공유는 설정의 "캘린더 관리·공유" 탭으로 이동 (별도 dialog 폐지)
  const goManageShare = () => navigate("/desk/settings?section=calendar-share");

  // 필터 칩 도트 — visible 캘린더 최대 3개 + builtin 소스 색상.
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

  const triggerButton = (
    <Button variant="outline" size="sm" className="gap-1 h-7 px-2 rounded-full">
      <span className="flex items-center gap-0.5">
        {dotColors.map((color, i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="text-xs font-medium">
        {t("sourceCount", { count: totalCount })}
      </span>
      <ChevronDown size={11} className="text-muted-foreground" />
    </Button>
  );

  return (
    <>
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex-1">{t("title")}</DrawerTitle>
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
              <CalendarSourceContent onManage={goManageShare} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {t("title")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0">
            <CalendarSourceContent onManage={goManageShare} />
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};

export { CalendarSourceToggle };
