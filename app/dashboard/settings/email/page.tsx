"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Edit3 } from "lucide-react";

export default function EmailSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto md:mx-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
          <p className="text-gray-600">Manage your email address</p>
        </div>
      </div>

      {/* Current Email */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Current Email</h3>
            <p className="text-sm text-gray-600">
              This is the email address associated with your account
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="font-medium text-gray-900">
            {user?.email || "Not set"}
          </p>
          {user?.email_confirmed_at ? (
            <p className="text-sm text-green-600 mt-1">✓ Verified</p>
          ) : (
            <p className="text-sm text-amber-600 mt-1">⚠ Not verified</p>
          )}
        </div>

        <Link
          href="/dashboard/settings/email/change"
          className="flex items-center justify-center gap-2 w-full bg-[#FF6200] hover:bg-[#e65c00] text-white py-3 px-4 rounded-lg font-semibold transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Change Email Address
        </Link>
      </div>

      {/* Email Verification */}
      {!user?.email_confirmed_at && (
        <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FF6200]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#FF6200] text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="font-semibold text-[#FF6200] mb-1">
                Email Not Verified
              </h3>
              <p className="text-sm text-[#e65c00] mb-3">
                Please verify your email address to secure your account and
                receive important notifications.
              </p>
              <button className="text-sm font-semibold text-[#FF6200] hover:text-[#e65c00] underline">
                Resend verification email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
