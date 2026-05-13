"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, ArrowRight } from "lucide-react";

export default function EmailOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Here we would verify the OTP with Supabase
      // For now, simulate the process
      setTimeout(() => {
        router.push("/dashboard/settings/email/success");
      }, 1000);
    } catch (err) {
      setError("Invalid verification code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(60);

    // Here you would implement the actual OTP resend logic
    // For now, we'll just simulate it
    try {
      // TODO: Call your OTP resend API
      // await resendOTP(email);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="max-w-2xl mx-auto md:mx-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/settings/email/change"
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Email</h1>
          <p className="text-gray-600">Enter the verification code</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Verification</h3>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="space-y-2">
            <label className="text-[16px] font-semibold text-gray-900">
              Verification Code
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    if (el) {
                      inputRefs.current[index] = el;
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:border-[#FF6200] focus:ring-0 disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="flex cursor-pointer w-full items-center text-lg justify-center space-x-2 rounded-lg bg-[#FF6200] py-3 sm:py-4 font-semibold text-white transition hover:bg-[#e65c00] focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{isLoading ? "Verifying..." : "Verify Email"}</span>
            {!isLoading && <ArrowRight className="h-5 w-5" />}
          </button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend}
              className="text-sm font-semibold text-[#FF6200] hover:text-[#e65c00] disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {canResend ? "Resend Code" : `Resend in ${countdown}s`}
            </button>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-lg">
        <p className="text-sm text-[#e65c00]">
          <strong>Check your spam folder</strong> if you don't see the email in
          your inbox.
        </p>
      </div>
    </div>
  );
}
