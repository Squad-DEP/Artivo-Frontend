import { ReactNode } from "react";
import { BRAND } from "@/lib/constants";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--orange)]">
      <aside className="relative hidden w-5/12 flex-col items-center justify-center overflow-hidden bg-[var(--orange)] px-10 py-12 text-white lg:flex">
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 select-none opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        </div>

        {/* Foreground */}
        <div className="z-10 flex flex-col items-start space-y-6">
          <div className="w-24 h-24 2xl:w-32 2xl:h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-5xl 2xl:text-6xl">A</span>
          </div>
          <h1 className="font-semibold leading-none tracking-tight 2xl:text-[90px] text-6xl">
            {BRAND.name}
          </h1>
          <p className="max-w-xs text-lg leading-snug xl:text-2xl font-medium opacity-90">
            {BRAND.tagline}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-white/5" />
      </aside>

      <div className="w-full flex-1 flex-col lg:w-7/12 xl:w-1/2 py-8 sm:py-14 px-6 sm:px-12 bg-white overflow-y-scroll">
        <div className="flex items-center space-x-3 flex-1 mb-16 sm:mb-28">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[var(--orange)] flex items-center justify-center">
            <span className="text-white font-bold text-2xl sm:text-3xl">A</span>
          </div>
          <span className="text-[#444] text-3xl sm:text-4xl font-semibold tracking-[-0.03em]">
            {BRAND.name}
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
