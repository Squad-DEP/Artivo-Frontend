"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { ChevronRight, Mail, Lock, Smartphone } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();

  const settingsItems = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Settings",
      description: "Manage your email address",
      value: user?.email || "Not set",
      href: "/dashboard/settings/email",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Account Password",
      description: "Change your account password",
      value: "••••••••",
      href: "/dashboard/settings/account-password",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Two-Factor Authentication",
      description: "Secure your account with 2FA",
      value: "Not enabled",
      href: "/dashboard/settings/2fa",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto md:mx-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and security preferences
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {settingsItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FF6200]/10 rounded-lg flex items-center justify-center text-[#FF6200]">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{item.value}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
