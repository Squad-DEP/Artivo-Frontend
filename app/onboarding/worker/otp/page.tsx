"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function WorkerOtpPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [resendCount, setResendCount] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("artivo_onboard_phone") || "";
    setPhone(stored);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (!val && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") verify();
  };

  const verify = async () => {
    const code = digits.join("");
    if (code.length < 6) return;
    setError(null);
    setVerifying(true);

    // Fake verification — any 6-digit code is accepted
    await new Promise((r) => setTimeout(r, 1000));

    setVerifying(false);
    router.push("/onboarding/worker");
  };

  const resend = () => {
    if (countdown > 0) return;
    setResendCount((c) => c + 1);
    setCountdown(30);
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4)
    : "your number";

  const filled = digits.every((d) => d !== "");

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={36} height={36} />
          <span className="text-xl font-semibold text-[#444] tracking-tight">{BRAND.name}</span>
        </div>
        <button
          onClick={() => router.push("/onboarding/worker/phone")}
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
          className="w-full max-w-md text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--orange)]/10 flex items-center justify-center mb-8 mx-auto">
            <ShieldCheck className="w-7 h-7 text-[var(--orange)]" />
          </div>

          <h1 className="text-[34px] sm:text-[42px] font-bold leading-[1.1] tracking-[-2px] text-foreground mb-3">
            Check your messages
          </h1>
          <p className="text-base text-foreground/50 mb-10 leading-relaxed">
            We sent a 6-digit code to <strong className="text-foreground/70">{maskedPhone}</strong>
          </p>

          {/* OTP inputs */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 rounded-xl border-2 border-gray-200 text-center text-xl font-bold text-foreground outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all caret-transparent"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {error}
            </p>
          )}

          <button
            onClick={verify}
            disabled={!filled || verifying}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--orange)] text-white font-bold text-base hover:bg-[var(--orange-hover)] shadow-lg shadow-[var(--orange)]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-6"
          >
            {verifying ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</>
            ) : (
              "Verify"
            )}
          </button>

          <div className="flex items-center justify-center gap-1 text-sm text-foreground/40">
            {countdown > 0 ? (
              <span>Resend code in {countdown}s</span>
            ) : (
              <button onClick={resend} className="text-[var(--orange)] font-semibold hover:underline">
                Resend code
              </button>
            )}
            {resendCount > 0 && <span className="ml-2 text-foreground/25">({resendCount} sent)</span>}
          </div>

          <p className="text-xs text-foreground/25 mt-4">
            Didn&apos;t get a code? Check the number is correct and try again.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
