import { ReactNode } from "react";

interface DashboardSectionProps {
  title: string;
  count?: number;
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  count,
  showSeeAll = false,
  onSeeAllClick,
  children,
  className = "",
}: DashboardSectionProps) {
  return (
    <section
      className={`border border-[#EBEBEB] rounded-2xl p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[22px] sm:text-[28px] font-bold tracking-[-1px] leading-[140%]">
          {title} {count !== undefined && `(${count})`}
        </h2>
        {showSeeAll && (
          <button
            onClick={onSeeAllClick}
            className="text-[#FF6200] cursor-pointer text-xs font-medium underline tracking-[0px] leading-[140%] hover:text-[#FF6200]/80 transition-colors"
          >
            SEE ALL
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2.5 sm:gap-3">{children}</div>
    </section>
  );
}
