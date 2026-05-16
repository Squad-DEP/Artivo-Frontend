"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mic, Sparkles, ArrowRight, Wrench, Search, Building2 } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function SelectTypePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={36} height={36} />
          <span className="text-xl font-semibold text-[#444] tracking-tight">{BRAND.name}</span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-[var(--orange)] font-medium">Log in</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 pt-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--orange)]/20 bg-[var(--orange)]/5 mb-6"
        >
          <Mic className="w-3.5 h-3.5 text-[var(--orange)]" />
          <span className="text-sm font-medium text-[var(--orange)]">AI-powered · just speak naturally</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-center text-[42px] sm:text-[56px] lg:text-[68px] font-bold leading-[1.05] tracking-[-2.5px] sm:tracking-[-3.5px] text-foreground mb-4"
        >
          Who are you here as?
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-center text-base sm:text-lg text-foreground/50 max-w-md mb-12"
        >
          Pick your role and our AI will set up your profile in under a minute — no forms, just talk.
        </motion.p>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-2xl flex flex-col gap-4"
        >
          {/* Top row — two role cards side by side */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Artisan card */}
            <button
              onClick={() => router.push("/onboarding/worker/join")}
              className="group relative text-left rounded-2xl border-2 border-gray-100 bg-white p-7 hover:border-[var(--orange)] hover:shadow-xl hover:shadow-[var(--orange)]/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--orange)] transition-colors duration-300">
                <Wrench className="w-6 h-6 text-[var(--orange)] group-hover:text-white transition-colors duration-300" />
              </div>

              <div className="mb-1 leading-none">
                <span className="block text-xl font-bold text-foreground/30 mb-1">I</span>
                <span className="block text-[52px] sm:text-[60px] font-black tracking-[-3px] text-foreground leading-none">AM</span>
              </div>
              <p className="text-lg font-semibold text-foreground/70 mb-4">an Artisan</p>

              <p className="text-[15px] text-foreground/60 leading-relaxed mb-6">
                Barber, plumber, electrician, tailor — whatever you do, get found and get paid.
              </p>

              <div className="flex items-center gap-1.5 text-[var(--orange)] font-semibold text-sm">
                Set up my profile
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Customer card */}
            <button
              onClick={() => router.push("/onboarding/customer")}
              className="group relative text-left rounded-2xl border-2 border-gray-100 bg-white p-7 hover:border-[var(--orange)] hover:shadow-xl hover:shadow-[var(--orange)]/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--orange)] transition-colors duration-300">
                <Search className="w-6 h-6 text-[var(--orange)] group-hover:text-white transition-colors duration-300" />
              </div>

              <div className="mb-1 leading-none">
                <span className="block text-xl font-bold text-foreground/30 mb-1">I</span>
                <span className="block text-[60px] sm:text-[70px] font-black tracking-[-3px] text-foreground leading-none">NEED</span>
              </div>
              <p className="text-lg font-semibold text-foreground/70 mb-4">skilled help</p>

              <p className="text-[15px] text-foreground/60 leading-relaxed mb-6">
                Find trusted, vetted artisans near you — plumbers, cleaners, mechanics and more.
              </p>

              <div className="flex items-center gap-1.5 text-[var(--orange)] font-semibold text-sm">
                Find artisans
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Organization — full width below both cards */}
          <button
            onClick={() => router.push("/onboarding/worker/organization")}
            className="group flex items-center gap-5 px-7 py-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-[var(--orange)]/40 hover:bg-[var(--orange)]/5 transition-all duration-200 text-left w-full"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[var(--orange)]/10 transition-colors shrink-0">
              <Building2 className="w-6 h-6 text-foreground/40 group-hover:text-[var(--orange)] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground/60 group-hover:text-foreground transition-colors">
                I represent an Association
              </p>
              <p className="text-sm text-foreground/35 mt-1">Upload your artisan roster as CSV or JSON — we handle the rest</p>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground/20 group-hover:text-[var(--orange)] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-8 text-xs text-foreground/30 text-center"
        >
          No credit card required · Your credentials are saved automatically
        </motion.p>
      </main>
    </div>
  );
}
