"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type FormErrors = {
  email?: string;
  password?: string;
};

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const {
    signIn,
    loading,
    error,
    clearError,
  } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormErrors({});
    clearError();

    // Validate form data
    try {
      const validatedData = formSchema.parse({
        email: email.trim(),
        password: password.trim(),
      });

      const success = await signIn(validatedData.email, validatedData.password);
      if (success) {
        const { user, isOnboardingComplete } = useAuthStore.getState();
        const userType = user?.user_type || user?.user_metadata?.user_type;

        if (!userType) {
          // No role found, send to profile selection
          router.push("/register/profile");
        } else if (!isOnboardingComplete()) {
          // Role set but onboarding not done
          if (userType === "worker") {
            router.push("/onboarding/worker");
          } else {
            router.push("/onboarding/customer");
          }
        } else {
          router.push("/dashboard");
        }
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: FormErrors = {};
        validationError.errors.forEach((err) => {
          if (err.path[0] === "email") {
            errors.email = err.message;
          } else if (err.path[0] === "password") {
            errors.password = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center w-full">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#444] mb-6 sm:mb-8">
        Welcome
      </h2>

      <div className="w-full max-w-[496px] rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
              disabled={loading.signIn}
              id="email"
              type="email"
              placeholder="Enter email"
              required
              className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 disabled:opacity-50 disabled:pointer-events-none"
            />
            {true && (
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
              disabled={loading.signIn}
              id="password"
              type="password"
              placeholder="Enter password"
              required
              className="block w-full rounded-[19px] mt-2 border bg-accent/50 placeholder:text-foreground/30 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 disabled:opacity-50 disabled:pointer-events-none"
            />
            {formErrors.password && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center text-[16px]">
            <span className="text-[16px] text-foreground mr-1 font-semibold">
              Forgot password?
            </span>
            <Link
              href="/forgot-password"
              className="text-[var(--orange)] hover:underline font-bold"
            >
              Reset now
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading.signIn}
            className="flex cursor-pointer w-full items-center text-lg sm:text-xl justify-center space-x-[10px] rounded-lg bg-[var(--orange)] py-3 sm:py-4.5 active:scale-98 font-medium text-white transition hover:bg-[var(--orange-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--orange-focus)]/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>Login</span>
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

        <p className="mt-2 text-center text-sm text-gray-600"></p>
      </div>

      <div className="mt-4 sm:mt-6">
        <p className="text-center text-[16px] text-foreground font-semibold">
          Are you a new user?{" "}
          <Link
            href="/register"
            onClick={() => clearError()}
            className="text-[var(--orange)] hover:underline font-bold"
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}
