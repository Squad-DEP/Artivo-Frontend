"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, UserCircle2, Building2 } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function WorkerJoinPage() {
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
          onClick={() => router.push("/onboarding/select-type")}
          className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 pt-8">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-foreground/30 uppercase tracking-widest mb-4">
            One quick question
          </p>
          <h1 className="text-[38px] sm:text-[52px] font-bold leading-[1.05] tracking-[-2px] sm:tracking-[-3px] text-foreground mb-4">
            Are you registered with<br className="hidden sm:block" /> an association?
          </h1>
          <p className="text-base text-foreground/50 max-w-sm mx-auto">
            Some artisans join through a cooperative, union, or business that enrolled them on Artivo.
          </p>
        </motion.div>

        {/* Option cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-xl grid sm:grid-cols-2 gap-4"
        >
          {/* Individual */}
          <button
            onClick={() => router.push("/onboarding/worker/phone")}
            className="group text-left rounded-2xl border-2 border-gray-100 bg-white p-7 hover:border-[var(--orange)] hover:shadow-xl hover:shadow-[var(--orange)]/10 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--orange)] transition-colors duration-300">
              <UserCircle2 className="w-6 h-6 text-[var(--orange)] group-hover:text-white transition-colors duration-300" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2">No, I&apos;m on my own</p>
            <p className="text-sm text-foreground/55 leading-relaxed mb-6">
              I&apos;m signing up as an individual artisan — I&apos;ll set up my own profile.
            </p>
            <div className="flex items-center gap-1.5 text-[var(--orange)] font-semibold text-sm">
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Organization member */}
          <button
            onClick={() => router.push("/onboarding/worker/organization")}
            className="group text-left rounded-2xl border-2 border-gray-100 bg-white p-7 hover:border-[var(--orange)] hover:shadow-xl hover:shadow-[var(--orange)]/10 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--orange)] transition-colors duration-300">
              <Building2 className="w-6 h-6 text-[var(--orange)] group-hover:text-white transition-colors duration-300" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2">Yes, through an org</p>
            <p className="text-sm text-foreground/55 leading-relaxed mb-6">
              My cooperative, union, or employer will upload my details — I just need to connect.
            </p>
            <div className="flex items-center gap-1.5 text-[var(--orange)] font-semibold text-sm">
              Connect my association
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 text-xs text-foreground/30 text-center"
        >
          You can always switch later from your account settings
        </motion.p>
      </main>
    </div>
  );
}
