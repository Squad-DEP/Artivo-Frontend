"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, ArrowRight } from "lucide-react";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().min(5, "Email required").email("Invalid email address"),
});

export default function ChangeEmailPage() {
  const [email, setEmail] = useState("");
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});
  const { user, error, clearError, updateEmail, loading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    try {
      const validatedData = emailSchema.parse({ email: email.trim() });

      const onSuccess = () => {
        router.push(
          `/dashboard/settings/email/otp?email=${encodeURIComponent(
            validatedData.email
          )}`
        );
      };

      await updateEmail(validatedData.email);
      onSuccess();
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: { email?: string } = {};
        validationError.errors.forEach((err) => {
          if (err.path[0] === "email") {
            errors.email = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto md:mx-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/settings/email"
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Email</h1>
          <p className="text-gray-600">Enter your new email address</p>
        </div>
      </div>

      {/* Current Email Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">Current email address:</p>
        <p className="font-medium text-gray-900">{user?.email}</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">New Email Address</h3>
            <p className="text-sm text-gray-600">
              We'll send a verification code to this email
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 relative">
            <label
              htmlFor="email"
              className="text-[16px] font-semibold text-gray-900"
            >
              New Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading.updateEmail}
              id="email"
              type="email"
              placeholder="Enter new email address"
              required
              className="block w-full rounded-[19px] mt-2 border bg-gray-50 placeholder:text-gray-400 px-4 sm:px-6 py-3 sm:py-4 text-[16px] focus:ring-0 focus:border-[#FF6200] disabled:opacity-50 disabled:pointer-events-none"
            />
            {formErrors.email && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading.updateEmail}
            className="flex cursor-pointer w-full items-center text-lg justify-center space-x-2 rounded-lg bg-[#FF6200] py-3 sm:py-4 font-semibold text-white transition hover:bg-[#e65c00] focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>
              {loading.updateEmail ? "Sending..." : "Send Verification Code"}
            </span>
            {!loading.updateEmail && <ArrowRight className="h-5 w-5" />}
          </button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
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

      {/* Info */}
      <div className="mt-6 p-4 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-lg">
        <p className="text-sm text-[#e65c00]">
          <strong>Note:</strong> After changing your email, you'll need to
          verify the new address before you can use it to sign in.
        </p>
      </div>
    </div>
  );
}
