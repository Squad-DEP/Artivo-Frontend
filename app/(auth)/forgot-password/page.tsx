"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const emailSchema = z.object({
  email: z.string().min(5, "Email required").email("Invalid email"),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step");
  const isResetStep = step === "reset";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  const { sendPasswordReset, resetPassword, loading, error, clearError } =
    useAuthStore();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    try {
      const validatedData = emailSchema.parse({ email: email.trim() });
      await sendPasswordReset(validatedData.email);
      setEmailSent(true);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: FormErrors = {};
        validationError.errors.forEach((err) => {
          if (err.path[0] === "email") {
            errors.email = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    try {
      const validatedData = passwordSchema.parse({
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      // In standard Supabase flow, we don't need email and OTP for password reset
      // The user is already authenticated after clicking the email link
      await resetPassword(validatedData.password);
      router.push("/dashboard");
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: FormErrors = {};
        validationError.errors.forEach((err) => {
          if (err.path[0] === "password") {
            errors.password = err.message;
          } else if (err.path[0] === "confirmPassword") {
            errors.confirmPassword = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const getTitle = () => {
    if (isResetStep) return "Set New Password";
    if (emailSent) return "Check Your Email";
    return "Reset Password";
  };

  const getSubtitle = () => {
    if (isResetStep) return "Enter your new password below.";
    if (emailSent)
      return `We've sent a password reset link to ${email}. Please check your email and click the link to reset your password.`;
    return "Enter your email address and we'll send you a link to reset your password.";
  };

  return (
    <main className="flex flex-col items-center justify-center">
      <h2 className="mt-4 sm:mt-8 text-5xl sm:text-6xl lg:text-7xl font-bold text-[#444] lg:mt-0">
        {getTitle()}
      </h2>

      <div className="mt-6 sm:mt-10 w-full max-w-[496px] rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <div className="mb-6">
          <p className="text-[16px] text-foreground/70 text-center">
            {getSubtitle()}
          </p>
        </div>

        {!isResetStep && !emailSent && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-[10px] relative">
              <label
                htmlFor="email"
                className="text-[16px] font-semibold text-foreground"
              >
                Email address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading.sendPasswordReset}
                id="email"
                type="email"
                placeholder="Enter email"
                required
                className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 disabled:opacity-50 disabled:pointer-events-none"
              />
              {formErrors.email && (
                <p className="absolute text-red-500 text-[13px] top-1 right-0">
                  {formErrors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading.sendPasswordReset}
              className="flex cursor-pointer w-full items-center text-lg sm:text-xl justify-center space-x-[10px] rounded-lg bg-[#FF6200] py-3 sm:py-4.5 active:scale-98 font-medium text-white transition hover:bg-[#e65c00] focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Send Reset Link</span>
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                <button
                  type="button"
                  onClick={clearError}
                  className="float-right text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </form>
        )}

        {!isResetStep && emailSent && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Password reset link sent successfully! Please check your email
              (including spam folder).
            </div>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
                clearError();
              }}
              className="text-[#ff6600] hover:underline font-bold"
            >
              Send another email
            </button>
          </div>
        )}

        {isResetStep && (
          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-[10px] relative">
              <label
                htmlFor="password"
                className="text-[16px] font-semibold text-foreground"
              >
                New Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading.resetPassword}
                id="password"
                type="password"
                placeholder="Enter new password"
                required
                className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 disabled:opacity-50 disabled:pointer-events-none"
              />
              {formErrors.password && (
                <p className="absolute text-red-500 text-[13px] top-1 right-0">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-[10px] relative">
              <label
                htmlFor="confirmPassword"
                className="text-[16px] font-semibold text-foreground"
              >
                Confirm New Password
              </label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading.resetPassword}
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 disabled:opacity-50 disabled:pointer-events-none"
              />
              {formErrors.confirmPassword && (
                <p className="absolute text-red-500 text-[13px] top-1 right-0">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading.resetPassword}
              className="flex cursor-pointer w-full items-center text-lg sm:text-xl justify-center space-x-[10px] rounded-lg bg-[#FF6200] py-3 sm:py-4.5 active:scale-98 font-medium text-white transition hover:bg-[#e65c00] focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Update Password</span>
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                <button
                  type="button"
                  onClick={clearError}
                  className="float-right text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <span className="text-[16px] text-foreground mr-1 font-semibold">
            Remember your password?
          </span>
          <Link
            href="/login"
            className="text-[#ff6600] hover:underline font-bold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
