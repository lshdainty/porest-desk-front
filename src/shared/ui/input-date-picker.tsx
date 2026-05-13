import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Input } from "@/shared/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import { CalendarIcon } from "lucide-react"
import * as React from "react"

function formatDate(date: Date | undefined) {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined
  const date = new Date(dateString)
  return isValidDate(date) ? date : undefined
}

function isValidDate(date: Date | undefined) {
  if (!date) return false
  return !isNaN(date.getTime())
}

interface InputDatePickerProps {
  value?: string | Date
  onValueChange?: (value: string) => void
  onSelect?: (value: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  startMonth?: Date
  endMonth?: Date
}

const DEFAULT_START_MONTH = new Date(1900, 0, 1)
const DEFAULT_END_MONTH = new Date(new Date().getFullYear() + 100, 11, 31)

export function InputDatePicker({
  value,
  onValueChange,
  onSelect,
  placeholder = "yyyy-mm-dd",
  disabled = false,
  id,
  startMonth = DEFAULT_START_MONTH,
  endMonth = DEFAULT_END_MONTH,
}: InputDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const dateString = value instanceof Date ? formatDate(value) : (value || "")
  const date = React.useMemo(() => parseDate(dateString), [dateString])
  const [month, setMonth] = React.useState<Date | undefined>(date || new Date())

  React.useEffect(() => {
    if (date) {
      setMonth(date)
    }
  }, [dateString])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      if (onValueChange) {
        onValueChange(formatDate(selectedDate))
      }
      if (onSelect) {
        onSelect(selectedDate)
      }
    }
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (onValueChange) {
      onValueChange(inputValue)
    }

    const parsedDate = parseDate(inputValue)
    if (parsedDate) {
      setMonth(parsedDate)
      if (onSelect) {
        onSelect(parsedDate)
      }
    }
  }

  return (
    <div className="relative flex gap-2">
      <Input
        id={id}
        value={value instanceof Date ? formatDate(value) : (value || "")}
        placeholder={placeholder}
        className="pr-10"
        style={{ background: 'var(--bg-surface)' }}
        disabled={disabled}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0 active:enabled:translate-y-[calc(-50%+0.5px)]"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
          style={{
            background: 'var(--bg-surface)',
            // Calendar 내부 bg-surface-default / bg-bg-page / bg-border-default 클래스가 참조하는
            // CSS 변수를 흰색으로 강제 — 월/년 select dropdown 도 같이 적용됨.
            '--popover': 'var(--bg-surface)',
            '--background': 'var(--bg-surface)',
            '--input': 'var(--bg-surface)',
          } as React.CSSProperties}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleDateSelect}
            startMonth={startMonth}
            endMonth={endMonth}
            classNames={{
              // 월/년 dropdown 을 SelectTrigger 와 동일한 스타일로 (border + shadow + 패딩)
              dropdown_root:
                "relative flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs px-2 h-8 text-sm font-medium has-focus:border-[var(--border-brand)] has-focus:ring-2 has-focus:ring-[var(--border-brand)]/30",
              caption_label:
                "flex items-center gap-1 select-none [&>svg]:text-[var(--fg-tertiary)] [&>svg]:size-3.5",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
