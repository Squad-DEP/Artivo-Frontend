"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangeAccountPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { user, error, clearError, updatePassword, loading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    try {
      const validatedData = passwordSchema.parse({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      const success = await updatePassword(
        validatedData.currentPassword,
        validatedData.newPassword
      );

      if (success) {
        router.push("/dashboard/settings/account-password/success");
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: FormErrors = {};
        validationError.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          errors[field] = err.message;
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
          href="/dashboard/settings/account-password"
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600">Update your account password</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Update Password</h3>
            <p className="text-sm text-gray-600">
              Enter your current password and choose a new one
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2 relative">
            <label
              htmlFor="currentPassword"
              className="text-[16px] font-semibold text-gray-900"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading.updatePassword}
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                required
                className="block w-full rounded-[19px] mt-2 border bg-gray-50 placeholder:text-gray-400 px-4 sm:px-6 py-3 sm:py-4 pr-12 text-[16px] focus:ring-0 focus:border-[#FF6200] disabled:opacity-50 disabled:pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formErrors.currentPassword && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.currentPassword}
              </p>
            )}
            <Link
              href="/dashboard/settings/account-password/forgot"
              className="text-sm text-[#FF6200] hover:text-[#e65c00] font-medium"
            >
              Forgot your current password?
            </Link>
          </div>

          {/* New Password */}
          <div className="space-y-2 relative">
            <label
              htmlFor="newPassword"
              className="text-[16px] font-semibold text-gray-900"
            >
              New Password
            </label>
            <div className="relative">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading.updatePassword}
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                required
                className="block w-full rounded-[19px] mt-2 border bg-gray-50 placeholder:text-gray-400 px-4 sm:px-6 py-3 sm:py-4 pr-12 text-[16px] focus:ring-0 focus:border-[#FF6200] disabled:opacity-50 disabled:pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formErrors.newPassword && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2 relative">
            <label
              htmlFor="confirmPassword"
              className="text-[16px] font-semibold text-gray-900"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading.updatePassword}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                className="block w-full rounded-[19px] mt-2 border bg-gray-50 placeholder:text-gray-400 px-4 sm:px-6 py-3 sm:py-4 pr-12 text-[16px] focus:ring-0 focus:border-[#FF6200] disabled:opacity-50 disabled:pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="absolute text-red-500 text-[13px] top-1 right-0">
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading.updatePassword}
            className="flex cursor-pointer w-full items-center text-lg justify-center space-x-2 rounded-lg bg-[#FF6200] py-3 sm:py-4 font-semibold text-white transition hover:bg-[#e65c00] focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>
              {loading.updatePassword ? "Updating..." : "Update Password"}
            </span>
            {!loading.updatePassword && <ArrowRight className="h-5 w-5" />}
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
    </div>
  );
}
