"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Lock, ArrowRight } from "lucide-react";

export default function AccountPasswordSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard/settings");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto md:mx-0">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Password Updated Successfully!
        </h1>

        {/* Description */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg">
            <Lock className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              Your account password has been successfully updated
            </p>
          </div>

          <p className="text-gray-600">
            Your account is now secured with your new password. Make sure to use
            this new password for future sign-ins.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center gap-2 w-full bg-[#FF6200] hover:bg-[#e65c00] text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Back to Settings
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard"
            className="block w-full text-gray-600 hover:text-gray-800 py-2 font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-sm text-gray-500 mt-6">
          You'll be automatically redirected to settings in a few seconds...
        </p>
      </div>
    </div>
  );
}
