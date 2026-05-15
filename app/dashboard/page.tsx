"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useReputationStore } from "@/store/reputationStore";
import { useCreditStore } from "@/store/creditStore";
import { useJobStore } from "@/store/jobStore";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";
import { apiService } from "@/api/api-service";
import { motion } from "framer-motion";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Shield,
  Target,
  Loader2,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { user, getUserType } = useAuthStore();
  const router = useRouter();
  const userType = getUserType();

  useOAuthRedirect({
    autoRedirect: true,
    isCallbackHandler: false,
  });

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  if (userType === "worker") {
    return <WorkerDashboard userName={userName} />;
  }

  return <CustomerDashboard userName={userName} />;
}

// ─── Trust Score Gauge (compact) ─────────────────────────────────────────────

function TrustGaugeCompact({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100" />
        <motion.circle
          cx="48" cy="48" r="36"
          stroke="url(#trustGradientDash)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="trustGradientDash" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{Math.round(score)}</span>
        <span className="text-[10px] text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

// ─── Credit Score Gauge (compact) ────────────────────────────────────────────

function CreditGaugeCompact({ score }: { score: number }) {
  const min = 300;
  const max = 850;
  const circumference = 2 * Math.PI * 36;
  const percentage = ((score - min) / (max - min)) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 750) return { from: "#059669", to: "#10B981" };
    if (s >= 650) return { from: "#D97706", to: "#F59E0B" };
    if (s >= 550) return { from: "#EA580C", to: "#F97316" };
    return { from: "#DC2626", to: "#EF4444" };
  };
  const colors = getColor(score);

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100" />
        <motion.circle
          cx="48" cy="48" r="36"
          stroke={`url(#creditGradientDash)`}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="creditGradientDash" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{Math.round(score)}</span>
        <span className="text-[10px] text-gray-500">/ 850</span>
      </div>
    </div>
  );
}

// ─── Worker Dashboard ────────────────────────────────────────────────────────

function WorkerDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [pendingPayout, setPendingPayout] = useState(0);

  const {
    trustScore,
    reviewSummary,
    isLoading: repLoading,
    fetchReputation,
    fetchReviews,
  } = useReputationStore();

  const {
    creditScore,
    isLoading: creditLoading,
    fetchCreditProfile,
  } = useCreditStore();

  const {
    workerStats,
    isLoading: jobsLoading,
    fetchStats,
  } = useJobStore();

  useEffect(() => {
    fetchReputation();
    fetchReviews();
    fetchCreditProfile();
    fetchStats();
    apiService
      .get<{ summary: { failed_payout: number } }>("/worker/earnings")
      .then((d) => setPendingPayout(d.summary?.failed_payout ?? 0))
      .catch(() => {});
  }, [fetchReputation, fetchReviews, fetchCreditProfile, fetchStats]);

  const overallTrust = trustScore?.overall ?? 0;
  const trustTrend = trustScore?.trend ?? "stable";
  const trustChange = trustScore?.trend_change ?? 0;
  const credit = creditScore?.score ?? 0;
  const avgRating = reviewSummary?.average_rating ?? 0;
  const totalReviews = reviewSummary?.total_reviews ?? 0;
  const completionRate = trustScore?.components?.completion_rate ?? 0;
  const activeJobs = workerStats?.active_jobs ?? 0;
  const completedJobs = workerStats?.completed_jobs ?? 0;
  const totalEarned = workerStats?.total_earned ?? 0;

  const isLoading = repLoading && !trustScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s your reputation and work at a glance
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/jobs/feed")}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
        >
          <Search className="w-4 h-4 mr-2" />
          Find Jobs
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Active Jobs"
          value={activeJobs.toString()}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={completedJobs.toString()}
          color="green"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
          trend={totalReviews > 0 ? `${totalReviews} reviews` : undefined}
          color="orange"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Completion Rate"
          value={completionRate > 0 ? `${Math.round(completionRate)}%` : "—"}
          color="purple"
        />
      </div>

      {/* Payout attention banner */}
      {pendingPayout > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <Banknote className="w-5 h-5 text-orange-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">
              ₦{Number(pendingPayout).toLocaleString("en-NG")} waiting for you
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              A completed job payout is ready — add your bank account to receive it.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs"
            onClick={() => router.push("/dashboard/payments")}
          >
            Add bank account
          </Button>
        </div>
      )}

      {/* Reputation & Credit Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trust Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Trust Score
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Platform reputation</p>
            </div>
            {trustTrend === "up" && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />+{trustChange}
              </span>
            )}
            {trustTrend === "down" && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" />{trustChange}
              </span>
            )}
            {trustTrend === "stable" && (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                <Minus className="w-3 h-3" />Stable
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <TrustGaugeCompact score={overallTrust} />
              <div className="flex-1 space-y-3">
                {trustScore?.components && (
                  <>
                    <MiniBar label="Customer Satisfaction" value={trustScore.components.customer_satisfaction} />
                    <MiniBar label="Response Time" value={trustScore.components.response_time} />
                    <MiniBar label="Verification" value={trustScore.components.verification_level} />
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Credit Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Credit Score
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Alternative credit rating</p>
            </div>
          </div>

          {creditLoading && !creditScore ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : credit > 0 ? (
            <div className="flex items-center gap-6">
              <CreditGaugeCompact score={credit} />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-600">
                  Based on your job history, earnings consistency, and platform tenure.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    credit >= 750 ? "bg-green-100 text-green-700" :
                    credit >= 650 ? "bg-yellow-100 text-yellow-700" :
                    credit >= 550 ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {credit >= 750 ? "Excellent" : credit >= 650 ? "Good" : credit >= 550 ? "Fair" : "Building"}
                  </span>
                </div>
                {creditScore?.eligible_products && creditScore.eligible_products.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ {creditScore.eligible_products.length} financial product{creditScore.eligible_products.length > 1 ? "s" : ""} available
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <p className="text-sm text-gray-500">Complete jobs to build your credit score</p>
                <p className="text-xs text-gray-400 mt-1">Score updates after each completed job</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Reviews */}
      {reviewSummary && reviewSummary.recent_reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
            <Link
              href="/dashboard/reputation"
              className="text-sm text-[var(--orange)] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {reviewSummary.recent_reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="flex items-start gap-3 p-3 bg-gray-100 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 text-sm shrink-0">
                  {review.reviewer_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{review.reviewer_name}</p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Earnings + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[var(--orange)] to-[var(--orange)]/80 rounded-2xl p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold mb-4">
            ₦{totalEarned.toLocaleString()}
          </p>
          <Button
            size="sm"
            className="bg-white text-[var(--orange)] hover:bg-white/90"
            onClick={() => router.push("/dashboard/payments")}
          >
            View Payments
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionButton icon={<Search className="w-5 h-5" />} label="Job Feed" onClick={() => router.push("/dashboard/jobs/feed")} />
            <QuickActionButton icon={<Briefcase className="w-5 h-5" />} label="My Jobs" onClick={() => router.push("/dashboard/jobs")} />
            <QuickActionButton icon={<Star className="w-5 h-5" />} label="Marketplace" onClick={() => router.push("/marketplace")} />
            <QuickActionButton icon={<TrendingUp className="w-5 h-5" />} label="Payments" onClick={() => router.push("/dashboard/payments")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Customer Dashboard ──────────────────────────────────────────────────────

function CustomerDashboard({ userName }: { userName: string }) {
  const router = useRouter();

  const { customerStats, isLoading: jobsLoading, fetchStats } = useJobStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const activeJobs = customerStats?.active_jobs ?? 0;
  const completedJobs = customerStats?.completed_jobs ?? 0;
  const totalSpent = customerStats?.total_spent ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-500 mt-1">Find skilled artisans for any job</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/marketplace")}
            variant="outline"
          >
            <Search className="w-4 h-4 mr-2" />
            Find Artisans
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="w-5 h-5" />} label="Active Jobs" value={activeJobs.toString()} color="blue" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={completedJobs.toString()} color="green" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Total Spent" value={totalSpent > 0 ? `₦${(totalSpent / 1000).toFixed(0)}k` : "₦0"} color="orange" />
        <StatCard icon={<Star className="w-5 h-5" />} label="Jobs Posted" value={(activeJobs + completedJobs).toString()} color="purple" />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Hire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Get Started</h2>
          <p className="text-sm text-gray-500 mb-6">
            Post a job for artisans to apply, or browse the marketplace to hire directly.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
              onClick={() => router.push("/dashboard/jobs/new")}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push("/marketplace")}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Artisans
            </Button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
        >
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionButton icon={<Search className="w-5 h-5" />} label="Marketplace" onClick={() => router.push("/marketplace")} />
            <QuickActionButton icon={<Briefcase className="w-5 h-5" />} label="My Jobs" onClick={() => router.push("/dashboard/jobs")} />
            <QuickActionButton icon={<TrendingUp className="w-5 h-5" />} label="Payments" onClick={() => router.push("/dashboard/payments")} />
            <QuickActionButton icon={<Star className="w-5 h-5" />} label="Profile" onClick={() => router.push("/dashboard/profile")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-700">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-[var(--orange)]/15 text-[var(--orange)]",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-4xl sm:text-5xl font-bold text-gray-900 leading-none tracking-tight">{value}</p>
          <p className="text-sm text-gray-500 mt-2">{label}</p>
          {trend && <p className="text-xs text-gray-400 mt-0.5">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--orange)]/10 text-[var(--orange)] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}
