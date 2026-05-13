import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

const currencies = [
  { value: "NGN", label: "NGN", symbol: "₦" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "GHS", label: "GHS", symbol: "₵" },
  { value: "KES", label: "KES", symbol: "KSh" },
];

export const CurrencySelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  CurrencySelectProps
>(({ value, onValueChange, ...props }, ref) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        ref={ref}
        className="min-w-16 min-h-14 bg-accent/50 rounded-[19px] cursor-pointer"
        {...props}
      >
        <SelectValue placeholder="NGN" />
      </SelectTrigger>

      <SelectContent className="space-y-2 gap-2">
        {currencies.map((currency) => (
          <SelectItem 
            className={cn(
              "cursor-pointer",
              value === currency.value && "bg-accent !text-foreground hover:!text-foreground"
            )} 
            key={currency.value} value={currency.value}
          >
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

CurrencySelect.displayName = "CurrencySelect";
