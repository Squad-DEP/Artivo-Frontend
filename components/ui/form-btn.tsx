import { ChevronRight } from "lucide-react";

import { Button } from "./button";
import { cn } from "@/lib/utils";
interface FormBtnProps {
  text: string;
  onClick: () => void;
  withIcon?: boolean;
  variant?: "default" | "outline";
}

export const FormBtn = ({
  text,
  onClick,
  withIcon = true,
  variant = "default",
}: FormBtnProps) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer h-14 sm:h-16 rounded-xl ml-auto items-center text-base sm:text-lg justify-center space-x-[3px] bg-orange !px-10 py-3 sm:py-4.5 active:scale-98 font-medium text-white transition-all duration-300 hover:bg-orange-hover focus:outline-none focus:ring-4 focus:ring-orange-focus/30",
        variant === "outline" &&
          "bg-transparent text-foreground hover:bg-orange/10 hover:text-foreground border border-foreground/20 hover:border-orange"
      )}
    >
      <span>{text}</span>
      {withIcon && <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />}
    </Button>
  );
};
