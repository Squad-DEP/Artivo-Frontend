import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "block w-full rounded-[12px] sm:rounded-[19px] border border-[#E4E4E4] bg-[#FBFBFB] placeholder:text-[#B4B4B4] px-4 sm:px-7 py-3 sm:py-4 text-[16px] focus:ring-0",
        "file:text-foreground selection:bg-primary selection:text-primary-foreground transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[#FF6200] focus-visible:ring-[#FF6200]/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
