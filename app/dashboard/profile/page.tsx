"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { BusinessCardEditor } from "@/components/profile/BusinessCardEditor";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { CertificatesSection } from "@/components/profile/CertificatesSection";
import { BRAND } from "@/lib/constants";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { apiService } from "@/api/api-service";

interface WorkerProfileMe {
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  tagline: string | null;
  skills: string[];
  location: string | null;
  share_slug: string;
  phone: string | null;
  email: string | null;
  average_rating: number;
}

export default function ProfilePage() {
  const { user, getUserType } = useAuthStore();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileMe | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Artisan";

  const userType = getUserType();
  const isWorker = userType === "worker";

  const usernameSlug =
    workerProfile?.share_slug ||
    user?.user_metadata?.worker_profile_id ||
    user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "-") ||
    "profile";

  const profileUrl = `${BRAND.website}/artisan/${usernameSlug}`;

  useEffect(() => {
    if (!isWorker) return;
    apiService
      .get<WorkerProfileMe>("/worker/profile/me")
      .then((p) => {
        setWorkerProfile(p);
        setPhotoUrl(p.photo_url);
      })
      .catch(() => {
        // No profile yet — photo stays null, upload option is shown
      });
  }, [isWorker]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your profile and credentials</p>
        </div>
        {isWorker && (
          <Link
            href={`/artisan/${usernameSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--orange)] hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Profile
          </Link>
        )}
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex items-center gap-4">
          {isWorker ? (
            <ProfilePhotoUpload
              photoUrl={photoUrl}
              name={userName}
              onUploaded={setPhotoUrl}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--orange)]/10 flex items-center justify-center text-2xl font-bold text-[var(--orange)] shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
              {userType || "User"}
            </span>
            {isWorker && (
              <p className="text-xs text-gray-400 mt-1.5">
                {photoUrl ? "Click the pencil to change your photo" : "Click the camera to add a photo"}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Credentials — workers only */}
      {isWorker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-[var(--orange)]" />
            <h2 className="text-lg font-semibold text-gray-900">Credentials</h2>
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
            <h2 className="text-lg font-semibold text-gray-900">Digital Business Card</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Customize and share your digital business card. Choose a theme and layout, then share the link or download as an image.
          </p>
          <BusinessCardEditor
            name={workerProfile?.display_name || userName}
            primarySkill={workerProfile?.skills?.[0] || "Skilled Artisan"}
            rating={workerProfile?.average_rating || 0}
            tagline={workerProfile?.tagline}
            phone={workerProfile?.phone || null}
            location={workerProfile?.location}
            profileUrl={profileUrl}
            username={usernameSlug}
          />
        </motion.div>
      )}
    </div>
  );
}
