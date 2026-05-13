import Image from "next/image";
import { Bell, ChevronDown } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="hidden md:flex items-center justify-between mb-6">
      <div className="text-lg">
        Hi, <span className="font-semibold text-2xl">{userName || "User"}</span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-0.5">
          <div className="rounded-full overflow-hidden border-2 border-[var(--orange)]">
            <Image
              src="/icons/profile-circle.svg"
              alt="Profile"
              width={48}
              height={48}
            />
          </div>
          <button>
            <ChevronDown className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <button className="w-12 h-12 flex items-center justify-center rounded-full border border-black/10">
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
