"use client";

import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

interface HireMeButtonProps {
  workerUsername: string;
  workerName: string;
  /** The worker's user ID (from their profile) */
  workerUserId?: string;
  className?: string;
}

/**
 * HireMeButton — CTA on public profiles that routes based on auth state:
 * - Authenticated customers: links to job creation
 * - Workers viewing their own profile: hidden
 * - Unauthenticated visitors: redirects to login
 *
 * Validates: Requirements 3.5
 */
export function HireMeButton({
  workerUsername,
  workerName,
  workerUserId,
  className,
}: HireMeButtonProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const isAuthenticated = !!user;
  const userType = user?.user_metadata?.user_type ?? user?.user_type;
  const isCustomer = userType === "customer";
  const isWorker = userType === "worker";

  // Hidden for workers viewing their own profile
  const isOwnProfile =
    isWorker &&
    (user?.user_metadata?.worker_profile_id === workerUserId ||
      user?.id === workerUserId);

  if (isOwnProfile) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      // Redirect unauthenticated visitors to login
      router.push(`/login?redirect=/artisan/${workerUsername}`);
      return;
    }

    if (isCustomer) {
      // Authenticated customers go to job creation
      router.push(`/dashboard/jobs/new?worker=${workerUsername}`);
    }
  };

  // Only show for unauthenticated visitors or authenticated customers
  if (isAuthenticated && !isCustomer) {
    return null;
  }

  return (
    <Button
      className={`w-full h-12 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white ${className ?? ""}`}
      onClick={handleClick}
    >
      <Briefcase className="w-4 h-4 mr-2" />
      Hire {workerName}
    </Button>
  );
}
