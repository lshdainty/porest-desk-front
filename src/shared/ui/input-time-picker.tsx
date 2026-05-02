import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/shared/lib"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

const pad = (n: number) => String(n).padStart(2, "0")

const isValidTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

interface InputTimePickerProps {
  value?: string
  onValueChange?: (value: string) => void
  /** 분 step (기본 5분) */
  minuteStep?: number
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function InputTimePicker({
  value,
  onValueChange,
  minuteStep = 5,
  placeholder = "HH:MM",
  disabled = false,
  id,
}: InputTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const hourListRef = React.useRef<HTMLDivElement>(null)
  const minuteListRef = React.useRef<HTMLDivElement>(null)

  const [hh = "", mm = ""] = (value || ":").split(":")
  const currentHour = isValidTime(value || "") ? hh : ""
  const currentMin = isValidTime(value || "") ? mm : ""

  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => pad(i)),
    []
  )
  const minutes = React.useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
        pad(i * minuteStep)
      ),
    [minuteStep]
  )

  const setHour = (h: string) => {
    const next = `${h}:${currentMin || "00"}`
    onValueChange?.(next)
  }
  const setMinute = (m: string) => {
    const next = `${currentHour || "00"}:${m}`
    onValueChange?.(next)
    setOpen(false)
  }

  React.useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector<HTMLButtonElement>('[data-active="true"]')
        ?.scrollIntoView({ block: "center" })
      minuteListRef.current
        ?.querySelector<HTMLButtonElement>('[data-active="true"]')
        ?.scrollIntoView({ block: "center" })
    })
  }, [open])

  return (
    <div className="relative flex gap-2">
      <Input
        id={id}
        value={value || ""}
        placeholder={placeholder}
        className="bg-background pr-10 num"
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0 active:enabled:translate-y-[calc(-50%+0.5px)]"
          >
            <Clock className="size-3.5" />
            <span className="sr-only">시간 선택</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <div className="flex items-stretch gap-1">
            <TimeColumn
              ref={hourListRef}
              label="시"
              items={hours}
              active={currentHour}
              onSelect={setHour}
            />
            <div className="self-center text-sm text-muted-foreground">:</div>
            <TimeColumn
              ref={minuteListRef}
              label="분"
              items={minutes}
              active={currentMin}
              onSelect={setMinute}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface TimeColumnProps {
  label: string
  items: string[]
  active: string
  onSelect: (v: string) => void
}

const TimeColumn = React.forwardRef<HTMLDivElement, TimeColumnProps>(
  ({ label, items, active, onSelect }, ref) => (
    <div className="flex w-14 flex-col items-stretch">
      <div className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        ref={ref}
        className="h-52 overflow-y-auto rounded-md border bg-card p-1"
      >
        {items.map((it) => {
          const isActive = it === active
          return (
            <button
              key={it}
              type="button"
              data-active={isActive}
              onClick={() => onSelect(it)}
              className={cn(
                "block w-full rounded px-2 py-1 text-sm tabular-nums transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {it}
            </button>
          )
        })}
      </div>
    </div>
  )
)
TimeColumn.displayName = "TimeColumn"
