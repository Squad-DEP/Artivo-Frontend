"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Mail,
  Shield,
  Plus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function TwoFactorAuthPage() {
  const { user } = useAuthStore();
  const [twoFactorMethods] = useState({
    googleAuth: false,
    email: true, // Assuming email is always available
    passkey: false,
  });

  const methods = [
    {
      id: "googleAuth",
      icon: <Smartphone className="w-6 h-6" />,
      title: "Google Authenticator",
      description: "Use an authenticator app to generate verification codes",
      enabled: twoFactorMethods.googleAuth,
      recommended: true,
      href: "/dashboard/settings/2fa/google-auth",
    },
    {
      id: "email",
      icon: <Mail className="w-6 h-6" />,
      title: "Email Verification",
      description: "Receive verification codes via email",
      enabled: twoFactorMethods.email,
      recommended: false,
      href: "/dashboard/settings/2fa/email",
    },
    {
      id: "passkey",
      icon: <Shield className="w-6 h-6" />,
      title: "iOS Passkey",
      description: "Use Face ID or Touch ID for secure authentication",
      enabled: twoFactorMethods.passkey,
      recommended: true,
      href: "/dashboard/settings/2fa/passkey",
      badge: "iOS Only",
    },
  ];

  const enabledCount = Object.values(twoFactorMethods).filter(Boolean).length;

  return (
    <div className="md:mx-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600">Add extra security to your account</p>
        </div>
      </div>

      {/* Status Overview */}
      <div
        className={`rounded-2xl p-6 mb-6 ${
          enabledCount > 0
            ? "bg-green-50 border border-green-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              enabledCount > 0 ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            {enabledCount > 0 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div>
            <h3
              className={`font-semibold mb-1 ${
                enabledCount > 0 ? "text-green-800" : "text-amber-800"
              }`}
            >
              {enabledCount > 0
                ? `${enabledCount} 2FA Method${
                    enabledCount > 1 ? "s" : ""
                  } Enabled`
                : "2FA Not Enabled"}
            </h3>
            <p
              className={`text-sm ${
                enabledCount > 0 ? "text-green-700" : "text-amber-700"
              }`}
            >
              {enabledCount > 0
                ? "Your account has additional security protection enabled."
                : "Enable two-factor authentication to secure your account."}
            </p>
          </div>
        </div>
      </div>

      {/* 2FA Methods */}
      <div className="space-y-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
                  {method.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {method.title}
                    </h3>
                    {method.recommended && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                    {method.badge && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {method.enabled && (
                    <p className="text-sm text-green-600 mt-1">✓ Enabled</p>
                  )}
                </div>
              </div>

              <Link
                href={method.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  method.enabled
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-[#FF6200] text-white hover:bg-[#e65c00]"
                }`}
              >
                {method.enabled ? "Manage" : "Enable"}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Security Tips */}
      <div className="mt-8 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-[#FF6200]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-[#FF6200]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#FF6200] mb-2">
              2FA Security Best Practices
            </h3>
            <ul className="text-sm text-[#e65c00] space-y-1">
              <li>• Enable multiple 2FA methods for backup access</li>
              <li>• Use authenticator apps over SMS when possible</li>
              <li>• Keep backup codes in a secure location</li>
              <li>• Regularly review and update your 2FA settings</li>
              <li>• Never share your 2FA codes with anyone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
