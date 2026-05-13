"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import type { UserType } from "@/lib/constants/user-types";

export default function AuthProfilePage() {
  const router = useRouter();
  const { setUserType, loading } = useAuthStore();
  const [selecting, setSelecting] = useState(false);

  const handleSelectRole = async (role: UserType) => {
    setSelecting(true);
    const success = await setUserType(role);
    if (success) {
      // Customers go straight to dashboard, artisans go to onboarding
      if (role === "customer") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
    setSelecting(false);
  };

  return (
    <main className="flex flex-col justify-center max-w-[702px] text-[#444]">
      {/* Welcome */}
      <h2 className="mb-[7px] text-6xl sm:text-7xl font-semibold leading-[123%] tracking-[-4px] md:tracking-[-5.73px]">
        Welcome
      </h2>

      {/* Subtitle */}
      <p className="text-xl sm:text-2xl font-medium leading-[123%] tracking-[-1px] mb-[54px]">
        Choose how you want to use Artivo. Are you a Customer or an Artisan?
      </p>

      {/* Role Selection Cards */}
      <div className="w-full space-y-4">
        {/* Customer Option */}
        <button
          onClick={() => handleSelectRole("customer")}
          disabled={selecting}
          className="group w-full flex items-center justify-between p-3.5 sm:p-[19px] bg-transparent rounded-2xl sm:rounded-[30px] text-left border border-[var(--orange)]/10 transition-all duration-200 hover:border-[var(--orange)]/30 hover:shadow-lg hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center space-x-5 sm:space-x-6">
            <div className="flex-shrink-0 p-3.5 sm:p-5 bg-[var(--orange)]/10 rounded-xl sm:rounded-[19px]">
              <Image
                src="/icons/profile-circle.svg"
                alt="Customer icon"
                width={40}
                height={40}
                className="max-sm:w-7 max-sm:h-7"
                priority
              />
            </div>
            <div className="space-y-[3px]">
              <h3 className="text-[22px] sm:text-[28px] font-semibold group-hover:text-[var(--orange)] tracking-[-1px] leading-[123%] transition-colors">
                I&apos;m a Customer
              </h3>
              <p className="text-sm sm:text-base leading-[140%]">
                I&apos;m looking to hire skilled artisans
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-5 sm:w-7 h-5 sm:h-7 text-[var(--orange)] group-hover:translate-x-1 transition-transform"
            strokeWidth={3.5}
          />
        </button>

        {/* Artisan Option */}
        <button
          onClick={() => handleSelectRole("worker")}
          disabled={selecting}
          className="group w-full flex items-center justify-between p-3.5 sm:p-[19px] bg-transparent rounded-2xl sm:rounded-[30px] text-left border border-[var(--orange)]/10 transition-all duration-200 hover:border-[var(--orange)]/30 hover:shadow-lg hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0 p-3.5 sm:p-5 bg-[var(--orange)]/10 rounded-xl sm:rounded-[19px]">
              <Image
                src="/icons/edit.svg"
                alt="Artisan icon"
                width={40}
                height={40}
                className="max-sm:w-7 max-sm:h-7"
                priority
              />
            </div>
            <div className="space-y-[3px]">
              <h3 className="text-[22px] sm:text-[28px] font-semibold group-hover:text-[var(--orange)] tracking-[-1px] leading-[123%] transition-colors">
                I&apos;m an Artisan
              </h3>
              <p className="text-sm sm:text-base leading-[140%]">
                I offer services and want to get hired
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-5 sm:w-7 h-5 sm:h-7 text-[var(--orange)] group-hover:translate-x-1 transition-transform"
            strokeWidth={3.5}
          />
        </button>
      </div>
    </main>
  );
}
