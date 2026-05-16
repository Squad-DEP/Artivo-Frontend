"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { z } from "zod";
import type { UserType } from "@/lib/constants/user-types";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
    role: z.enum(["worker", "customer"], {
      required_error: "Please select a role",
      message: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function AuthRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserType | "">("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    signUp,
    loading,
    error,
    clearError,
  } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    const formData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
    };

    const validation = formSchema.safeParse(formData);

    if (!validation.success) {
      const formatted = validation.error.format();
      console.log(formatted)
      setFormErrors({
        firstName: formatted.firstName?._errors?.[0] || "",
        lastName: formatted.lastName?._errors?.[0] || "",
        email: formatted.email?._errors?.[0] || "",
        password: formatted.password?._errors?.[0] || "",
        confirmPassword: formatted.confirmPassword?._errors?.[0] || "",
        role: formatted.role?._errors?.[0] || "",
      });
      return;
    }

    const success = await signUp(email, password, {
      firstName,
      lastName,
      role: role as string,
    });
    if (success) {
      if (role === "worker") {
        router.push("/onboarding/worker/join");
      } else {
        router.push("/onboarding/customer");
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center w-full">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#444] mb-6 sm:mb-8">
        Get Started
      </h2>

      <div className="w-full max-w-[496px] rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Role Selection */}
          <div className="space-y-[10px] relative">
            <label className="text-[16px] font-semibold text-foreground">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                disabled={loading.signUp}
                className={`flex flex-col items-center justify-center rounded-xl border-2 py-4 px-3 text-center transition-all ${
                  role === "customer"
                    ? "border-[var(--orange)] bg-[var(--orange)]/5 text-[var(--orange)]"
                    : "border-gray-200 hover:border-gray-300 text-foreground"
                }`}
              >
                <span className="text-2xl mb-1">👤</span>
                <span className="text-sm font-semibold">Customer</span>
                <span className="text-xs text-foreground/60 mt-0.5">
                  I want to hire
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("worker")}
                disabled={loading.signUp}
                className={`flex flex-col items-center justify-center rounded-xl border-2 py-4 px-3 text-center transition-all ${
                  role === "worker"
                    ? "border-[var(--orange)] bg-[var(--orange)]/5 text-[var(--orange)]"
                    : "border-gray-200 hover:border-gray-300 text-foreground"
                }`}
              >
                <span className="text-2xl mb-1">🔧</span>
                <span className="text-sm font-semibold">Artisan</span>
                <span className="text-xs text-foreground/60 mt-0.5">
                  I offer services
                </span>
              </button>
            </div>
            {formErrors.role && (
              <p className="text-red-500 text-[13px]">{formErrors.role}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-[10px] relative">
              <label
                htmlFor="firstName"
                className="text-[16px] font-semibold text-foreground"
              >
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading.signUp}
                id="firstName"
                type="text"
                placeholder="Enter first name"
                required
                className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0"
              />
              {formErrors.firstName && (
                <p className="absolute text-red-500 text-[13px] top-1 right-0">
                  {formErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-[10px] relative">
              <label
                htmlFor="lastName"
                className="text-[16px] font-semibold text-foreground"
              >
                Last Name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading.signUp}
                id="lastName"
                type="text"
                placeholder="Enter last name"
                className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0"
              />
              {formErrors.lastName && (
                <p className="absolute text-red-500 text-[13px] top-1 right-0">
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

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
              disabled={loading.signUp}
              id="email"
              type="email"
              placeholder="Enter email"
              required
              className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0"
            />
            {formErrors.email && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-[10px] relative">
            <label
              htmlFor="password"
              className="text-[16px] font-semibold text-foreground"
            >
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading.signUp}
              id="password"
              type="password"
              placeholder="Create password"
              required
              className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0"
            />
            {formErrors.password && (
              <p className="sm:absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-[10px] relative">
            <label
              htmlFor="confirmPassword"
              className="text-[16px] font-semibold text-foreground"
            >
              Confirm Password
            </label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading.signUp}
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              required
              className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0"
            />
            {formErrors.confirmPassword && (
              <p className="sm:absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-start space-x-3 text-[14px] sm:text-[16px]">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--orange)] !checked:bg-[var(--orange)] !checked:border-[var(--orange)] focus:ring-[var(--orange-focus)]/30"
            />
            <label htmlFor="terms" className="text-foreground">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-[var(--orange)] hover:underline font-bold"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[var(--orange)] hover:underline font-bold"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading.signUp}
            className="flex cursor-pointer w-full items-center text-lg sm:text-xl justify-center space-x-[10px] rounded-lg bg-[var(--orange)] py-3 sm:py-4.5 active:scale-98 font-medium text-white transition hover:bg-[var(--orange-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--orange-focus)]/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>Create Account</span>
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
      </div>

      <div className="mt-4 sm:mt-6">
        <p className="text-center text-[16px] text-foreground font-semibold">
          Already have an account?{" "}
          <Link
            href="/login"
            onClick={() => clearError()}
            className="text-[var(--orange)] hover:underline font-bold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
