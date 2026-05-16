"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function WorkerPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const handleContinue = () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    // Store phone in sessionStorage so OTP and AI pages can access it
    sessionStorage.setItem("artivo_onboard_phone", trimmed.startsWith("+") ? trimmed : `+234${trimmed}`);
    router.push("/onboarding/worker/otp");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={36} height={36} />
          <span className="text-xl font-semibold text-[#444] tracking-tight">{BRAND.name}</span>
        </div>
        <button
          onClick={() => router.push("/onboarding/worker/join")}
          className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--orange)]/10 flex items-center justify-center mb-8 mx-auto">
            <Phone className="w-7 h-7 text-[var(--orange)]" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-[-2px] text-foreground mb-3">
              What&apos;s your phone number?
            </h1>
            <p className="text-base text-foreground/50 leading-relaxed">
              We&apos;ll send a verification code. This is how customers and Artivo reach you.
            </p>
          </div>

          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-medium text-[15px] select-none pointer-events-none">
              +234
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="801 234 5678"
              className="w-full pl-16 pr-5 py-4 rounded-xl border-2 border-gray-200 text-[16px] font-medium text-foreground placeholder:text-foreground/25 outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all"
              autoFocus
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!phone.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--orange)] text-white font-bold text-base hover:bg-[var(--orange-hover)] shadow-lg shadow-[var(--orange)]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send code <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-foreground/25 mt-6">
            By continuing you agree to receive an SMS. Standard rates may apply.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
