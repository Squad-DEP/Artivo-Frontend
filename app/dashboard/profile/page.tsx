"use client";

import { useAuthStore } from "@/store/authStore";
import { BusinessCardEditor } from "@/components/profile/BusinessCardEditor";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { CertificatesSection } from "@/components/profile/CertificatesSection";
import { BRAND } from "@/lib/constants";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiService } from "@/api/api-service";

export default function ProfilePage() {
  const { user, getUserType } = useAuthStore();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    user?.user_metadata?.avatar_url
  );

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Artisan";

  const userType = getUserType();
  const isWorker = userType === "worker";

  const primarySkill = isWorker ? "Skilled Artisan" : "Customer";
  const rating = 4.5;
  const contactInfo = user?.email || "";

  const usernameSlug =
    user?.user_metadata?.worker_profile_id ||
    user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "-") ||
    "profile";

  const profileUrl = `${BRAND.website}/artisan/${usernameSlug}`;

  async function handlePhotoUploaded(url: string) {
    setPhotoUrl(url);
    // Persist to worker profile so the public page shows the new photo
    try {
      await apiService.patch("/worker/profile/photo", {
        body: { photo_url: url },
      });
    } catch {
      // Non-critical — file is uploaded, link update can be retried later
    }
  }

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

      {/* Profile Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-[var(--orange)]" />
          <h2 className="text-lg font-semibold text-gray-900">Profile Info</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--orange)]/10 overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-[var(--orange)]" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{userName}</h3>
            <p className="text-sm text-gray-500">{contactInfo}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
              {userType || "User"}
            </span>
          </div>
        </div>

        {isWorker && (
          <ProfilePhotoUpload
            currentPhotoUrl={photoUrl}
            onUploaded={handlePhotoUploaded}
          />
        )}
      </motion.div>

      {/* Certificates — workers only */}
      {isWorker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-[var(--orange)]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Credentials
            </h2>
          </div>
          <CertificatesSection />
        </motion.div>
      )}

      {/* Business Card — workers only */}
      {isWorker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
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
