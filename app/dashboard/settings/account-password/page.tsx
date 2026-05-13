"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { ArrowLeft, Lock, Shield, Edit3, RefreshCw } from "lucide-react";

export default function AccountPasswordPage() {
  const { user } = useAuthStore();

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
          <h1 className="text-3xl font-bold text-gray-900">Account Password</h1>
          <p className="text-gray-600">Manage your account security</p>
        </div>
      </div>

      {/* Current Password Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Current Password</h3>
            <p className="text-sm text-gray-600">
              Your account is secured with a password
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Password Status</p>
              <p className="text-sm text-green-600 mt-1">✓ Active and secure</p>
            </div>
            <div className="text-2xl text-gray-400">••••••••</div>
          </div>
        </div>

        <Link
          href="/dashboard/settings/account-password/change"
          className="flex items-center justify-center gap-2 w-full bg-[#FF6200] hover:bg-[#e65c00] text-white py-3 px-4 rounded-lg font-semibold transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Change Password
        </Link>
      </div>

      {/* Password Security Tips */}
      <div className="bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-[#FF6200]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-[#FF6200]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#FF6200] mb-2">
              Password Security Tips
            </h3>
            <ul className="text-sm text-[#e65c00] space-y-1">
              <li>• Use at least 8 characters</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Add numbers and special characters</li>
              <li>• Don't use personal information</li>
              <li>• Update regularly for better security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
