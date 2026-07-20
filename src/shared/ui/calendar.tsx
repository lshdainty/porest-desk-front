"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/shared/lib"
import { Button } from "@/shared/ui/button"
import { buttonVariants } from "@/shared/ui/button-variants"

/*
 * Porest Calendar — porest-design specs/components/calendar.md SoT 기반.
 * Phase 2 마이그레이션: react-day-picker v9 API(desk-front) 호환 보존 + porest 시각 토큰.
 *
 * Porest 시각:
 *   - day cell: rounded-full(원형 40×40, preview .cal-cell SoT, Toss 톤)
 *   - today: outline 2px primary(테두리만, fill 없음 — selected와 시각 분리,
 *     사용자가 오늘 보면서 다른 날 선택 가능)
 *   - selected: bg-primary fill + text-text-on-accent
 *   - weekday header: text-text-tertiary + caption 크기 + font-semibold + uppercase
 *   - month caption: text-title-sm + text-text-primary + font-medium
 *
 * 한글 locale은 호출처에서 locale prop으로 전달:
 *   import { ko } from "date-fns/locale"
 *   <Calendar locale={ko} ... />
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-bg-page group/calendar p-3 [--cell-size:--spacing(10)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size) text-title-sm font-medium text-text-primary",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-border-default shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute bg-surface-default inset-0 opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-title-sm text-text-primary"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-text-tertiary [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-text-tertiary flex-1 font-semibold text-caption uppercase tracking-wide select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-caption select-none text-text-tertiary",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day,
        ),
        // range 시각: porest-design spec 정합. 시작/끝은 셀의 좌/우 절반만 middle 톤 그라데이션 →
        // 그 위에 button 의 원형 primary fill. middle 은 셀 전체 옅은 톤 사각형 fill.
        range_start: cn(
          "rounded-none bg-[linear-gradient(to_right,transparent_50%,color-mix(in_srgb,var(--color-primary)_12%,transparent)_50%)]",
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          "rounded-none bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
          defaultClassNames.range_middle,
        ),
        range_end: cn(
          "rounded-none bg-[linear-gradient(to_left,transparent_50%,color-mix(in_srgb,var(--color-primary)_12%,transparent)_50%)]",
          defaultClassNames.range_end,
        ),
        today: cn(
          "outline outline-2 outline-primary outline-offset-[-2px] font-semibold rounded-full data-[selected=true]:outline-0 data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-text-tertiary aria-selected:text-text-tertiary",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-text-tertiary opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // base shape: rounded-full(원형 cell) — Porest preview .cal-cell SoT — 일반 day cell 의 hover/default 모양
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal rounded-full",
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        "dark:hover:text-text-primary",
        "[&>span]:text-xs [&>span]:opacity-70",
        // data variants 는 base 보다 후순 — cascade 에서 후순이 우선되어 base rounded-full 을 정확히 override.
        // single selection: bg-primary fill (preview .cal-cell--selected SoT)
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-text-on-accent data-[selected-single=true]:rounded-full",
        // range start/end: 셀 가운데 강한 primary 원 (셀 bg 는 td level 에서 좌/우 절반 그라데이션)
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-text-on-accent data-[range-start=true]:rounded-full",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-text-on-accent data-[range-end=true]:rounded-full",
        // range middle: button transparent + 사각형. 시각은 td level 의 cell bg(color-mix primary 12%) 가 담당.
        "data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-text-primary data-[range-middle=true]:rounded-none",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
