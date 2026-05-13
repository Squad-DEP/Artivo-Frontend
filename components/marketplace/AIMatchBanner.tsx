"use client";

import { Sparkles } from "lucide-react";

export function AIMatchBanner() {
  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 max-w-7xl xl:mx-auto mt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--orange)]/10 via-[var(--artivo-warm)] to-[var(--orange)]/10 border border-[var(--orange)]/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-[var(--orange)]/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--orange)]" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-sm sm:text-base">
              AI-Powered Matching
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              Let our AI find the perfect workers for your needs
            </p>
          </div>
        </div>

        <button className="relative z-10 px-4 py-2 rounded-full border border-[var(--orange)] text-[var(--orange)] text-sm font-medium hover:bg-[var(--orange)]/10 transition-colors whitespace-nowrap">
          Try AI Match
        </button>
      </div>
    </div>
  );
}
