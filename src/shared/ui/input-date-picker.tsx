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
        className="bg-background pr-10"
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
            disabled={disabled}
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
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
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
