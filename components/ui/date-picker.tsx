"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  disabledDates?: Date[];
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select",
  className,
  disabled = false,
  fromDate,
  toDate,
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Create disabled function for react-day-picker
  const isDateDisabled = (date: Date) => {
    if (
      disabledDates &&
      disabledDates.some((d) => d.toDateString() === date.toDateString())
    ) {
      return true;
    }
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-14 justify-start text-left font-normal rounded-[19px] border border-[#E4E4E4] bg-[#FBFBFB] px-4 sm:px-7 py-3 sm:py-4 text-[16px] focus:ring-0",
            "transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] placeholder:text-foreground/30",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {value ? (
            format(value, "PPP")
          ) : (
            <div className="w-full flex justify-between items-center">
              <span>{placeholder}</span>
              <ChevronDown />
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          fromDate={fromDate}
          toDate={toDate}
          disabled={isDateDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
