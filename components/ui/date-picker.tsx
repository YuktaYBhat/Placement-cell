"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disableFuture?: boolean
  disablePast?: boolean
  fromYear?: number
  toYear?: number
  captionLayout?: "dropdown" | "label" | "dropdown-months" | "dropdown-years"
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  disableFuture = false,
  disablePast = false,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  captionLayout = "dropdown"
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start" sideOffset={4}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={(date) => {
            if (disableFuture && date > new Date()) return true
            if (disablePast && date < new Date()) return true
            return false
          }}
          captionLayout={captionLayout}
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={date}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface YearPickerProps {
  year?: number
  onSelect?: (year: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromYear?: number
  toYear?: number
}

export function YearPicker({
  year,
  onSelect,
  placeholder = "Select year",
  disabled = false,
  className,
  fromYear = 2000,
  toYear = new Date().getFullYear()
}: YearPickerProps) {
  const [open, setOpen] = React.useState(false)

  // Generate years array
  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => toYear - i
  )

  const handleYearSelect = (selectedYear: number) => {
    onSelect?.(selectedYear)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !year && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {year ? year.toString() : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="max-h-64 overflow-y-auto">
          {years.map((yearOption) => (
            <Button
              key={yearOption}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start font-normal",
                year === yearOption && "bg-accent"
              )}
              onClick={() => handleYearSelect(yearOption)}
            >
              {yearOption}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
