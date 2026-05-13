"use client";

import { useAuthStore } from "@/store/authStore";
import { BusinessCardEditor } from "@/components/profile/BusinessCardEditor";
import { BRAND } from "@/lib/constants";
import { motion } from "framer-motion";
import { User, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, getUserType } = useAuthStore();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Artisan";

  const userType = getUserType();
  const isWorker = userType === "worker";

  // Derive profile data from auth user
  const primarySkill = isWorker ? "Skilled Artisan" : "Customer";
  const rating = 4.5; // Default rating - in production this comes from reputation store
  const contactInfo = user?.email || "";

  // Build the username slug for the profile URL
  const usernameSlug =
    user?.user_metadata?.worker_profile_id ||
    user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "-") ||
    "profile";

  const profileUrl = `${BRAND.website}/artisan/${usernameSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Profile
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your profile and business card
          </p>
        </div>
        {isWorker && usernameSlug && (
          <Link
            href={`/artisan/${usernameSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--orange)] hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Profile
          </Link>
        )}
      </div>

      {/* Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--orange)]/20 flex items-center justify-center">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-[var(--orange)]" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
            <p className="text-sm text-gray-500">{contactInfo}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
              {userType || "User"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Business Card Section - shown for workers */}
      {isWorker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-[var(--orange)]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Digital Business Card
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Customize and share your digital business card. Choose a theme and
            layout, then share the link or download as an image.
          </p>
          <BusinessCardEditor
            name={userName}
            primarySkill={primarySkill}
            rating={rating}
            contactInfo={contactInfo}
            profileUrl={profileUrl}
            username={usernameSlug}
          />
        </motion.div>
      )}
    </div>
  );
}
