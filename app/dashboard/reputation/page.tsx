"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap,
  Target,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";
import { useReputationStore } from "@/store/reputationStore";
import { BadgeNotification } from "@/components/reputation/BadgeNotification";
import type { Badge } from "@/api/types/reputation";

// ─── Helper Components ───────────────────────────────────────────────────────

function TrustGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="80"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-gray-100"
        />
        <motion.circle
          cx="96"
          cy="96"
          r="80"
          stroke="url(#trustGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-gray-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          key={score}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-sm text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function TrendIndicator({ trend, change }: { trend: "up" | "down" | "stable"; change: number }) {
  if (trend === "up") {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        +{Math.abs(change)} pts last 30 days
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="text-xs text-red-600 flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        -{Math.abs(change)} pts last 30 days
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-500 flex items-center gap-1">
      <Minus className="w-3 h-3" />
      Stable last 30 days
    </span>
  );
}

function getTrustLevel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

function getTrustLevelColor(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 75) return "bg-blue-100 text-blue-700";
  if (score >= 60) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

// Badge icon mapping based on badge name
function getBadgeIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("verified")) return Shield;
  if (lower.includes("top rated")) return Star;
  if (lower.includes("fast")) return Zap;
  if (lower.includes("job") || lower.includes("100") || lower.includes("50") || lower.includes("250")) return Target;
  if (lower.includes("rising")) return TrendingUp;
  return Award;
}

function getBadgeColor(category: string): string {
  switch (category) {
    case "verification": return "bg-blue-100 text-blue-600";
    case "achievement": return "bg-yellow-100 text-yellow-600";
    case "milestone": return "bg-orange-100 text-orange-600";
    case "skill": return "bg-purple-100 text-purple-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

// ─── Component Labels ────────────────────────────────────────────────────────

const COMPONENT_LABELS: Record<string, { label: string; weight: number }> = {
  completion_rate: { label: "Job Completion", weight: 30 },
  response_time: { label: "Response Time", weight: 20 },
  customer_satisfaction: { label: "Customer Satisfaction", weight: 25 },
  verification_level: { label: "Verification", weight: 15 },
  tenure_months: { label: "Platform Tenure", weight: 10 },
};

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ReputationPage() {
  const {
    trustScore,
    reviewSummary,
    history,
    insights,
    isLoading,
    error,
    fetchReputation,
    fetchReviews,
  } = useReputationStore();

  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const previousBadgesRef = useRef<string[]>([]);
  const { toast, showToast, hideToast } = useErrorToast();

  // Fetch reputation data on mount
  useEffect(() => {
    fetchReputation();
    fetchReviews();
  }, [fetchReputation, fetchReviews]);

  // Detect new badges (real-time without page reload) — Requirement 6.5, 6.6
  useEffect(() => {
    if (trustScore?.badges) {
      const currentBadgeIds = trustScore.badges.map((b) => b.id);
      const prevIds = previousBadgesRef.current;

      if (prevIds.length > 0) {
        const newBadges = trustScore.badges.filter(
          (b) => !prevIds.includes(b.id)
        );
        if (newBadges.length > 0) {
          setNewBadge(newBadges[0]);
        }
      }

      previousBadgesRef.current = currentBadgeIds;
    }
  }, [trustScore?.badges]);

  // Subscribe to store changes for real-time updates — Requirement 6.6
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReputation().catch(() => {
        showToast("Connection timeout. Score may be outdated.", {
          onRetry: () => fetchReputation(),
          variant: "network",
        });
      });
    }, 30000); // Poll every 30 seconds for score updates

    return () => clearInterval(interval);
  }, [fetchReputation, showToast]);

  const handleDismissBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  if (isLoading && !trustScore) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !trustScore) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reputation</h1>
          <p className="text-gray-500 mt-1">
            Your trust score and how customers perceive you
          </p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Failed to load reputation data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button
            onClick={() => fetchReputation()}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const overallScore = trustScore?.overall ?? 0;
  const trend = trustScore?.trend ?? "stable";
  const trendChange = trustScore?.trend_change ?? 0;
  const badges = trustScore?.badges ?? [];
  const components = trustScore?.components;

  return (
    <div className="space-y-6">
      {/* Badge Notification Toast */}
      <BadgeNotification badge={newBadge} onDismiss={handleDismissBadge} />

      {/* Network Error Toast — Requirement 6.8 */}
      <ErrorToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        onRetry={toast.onRetry}
        variant={toast.variant}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reputation</h1>
        <p className="text-gray-500 mt-1">
          Your trust score and how customers perceive you
        </p>
      </div>

      {/* Error Banner — Requirement 6.8: retain previous score, show update pending */}
      {error && trustScore && !errorDismissed && (
        <ErrorBanner
          message="Score update pending"
          description="Unable to refresh your trust score. Displaying your previous score."
          variant="warning"
          onDismiss={() => setErrorDismissed(true)}
          onRetry={() => {
            setErrorDismissed(false);
            fetchReputation();
          }}
          retryLabel="Refresh"
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trust Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Trust Score</h2>
                <p className="text-sm text-gray-500">
                  Your overall reputation on the platform
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(overallScore)}`}
              >
                {getTrustLevel(overallScore)}
              </span>
            </div>

            <TrustGauge score={overallScore} />

            {/* Trend Indicator — Requirement 6.4 */}
            <div className="flex justify-center mt-4">
              <TrendIndicator trend={trend} change={trendChange} />
            </div>

            {/* Score History Chart — Requirement 6.4 */}
            {history.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Score History
                  </span>
                  <TrendIndicator trend={trend} change={trendChange} />
                </div>
                <div className="flex items-end justify-between h-16 gap-2">
                  {history.slice(-6).map((item, i) => {
                    const date = new Date(item.date);
                    const monthLabel = date.toLocaleString("default", { month: "short" });
                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1">
                        <motion.div
                          className="w-full bg-[var(--orange)]/20 rounded-t relative group"
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.trust_score / 100) * 48}px` }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round(item.trust_score)}
                          </div>
                        </motion.div>
                        <span className="text-xs text-gray-500 mt-1">{monthLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Score Breakdown — Requirement 6.3 */}
          {components && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Score Breakdown</h2>

              <div className="space-y-5">
                {Object.entries(COMPONENT_LABELS).map(([key, meta]) => {
                  const score = components[key as keyof typeof components] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({meta.weight}% weight)
                          </span>
                        </div>
                        <span className="text-sm font-semibold">{Math.round(score)}%</span>
                      </div>
                      <ScoreBar
                        score={score}
                        color={
                          score >= 90
                            ? "bg-green-500"
                            : score >= 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                      />
                    </div>
                  );
                })}
              </div>

              {/* Insights / Tips */}
              {insights.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {insights[0].title}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {insights[0].description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Review Summary — Requirements 6.6, 6.7 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Recent Reviews</h2>
                {reviewSummary && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {reviewSummary.total_reviews} reviews · {reviewSummary.average_rating.toFixed(1)} avg rating
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-[var(--orange)]">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Rating Distribution */}
            {reviewSummary && (
              <div className="mb-6 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((rating) => {
                  const count = reviewSummary.rating_distribution[rating];
                  const percentage =
                    reviewSummary.total_reviews > 0
                      ? (count / reviewSummary.total_reviews) * 100
                      : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{rating}</span>
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Reviews List */}
            <div className="space-y-4">
              {reviewSummary?.recent_reviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                        {review.reviewer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.reviewer_name}
                        </p>
                        <p className="text-xs text-gray-500">{review.job_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  {review.response && (
                    <div className="mt-2 pl-3 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-500">Your response:</p>
                      <p className="text-sm text-gray-600">{review.response}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}

              {(!reviewSummary || reviewSummary.recent_reviews.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No reviews yet</p>
                  <p className="text-xs mt-1">Complete jobs to receive reviews from customers</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Badges — Requirement 6.5 */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24"
          >
            <h2 className="text-lg font-semibold mb-4">Badges</h2>
            <p className="text-sm text-gray-500 mb-6">
              Earn badges to stand out and build trust with customers
            </p>

            <div className="space-y-4">
              {badges.length > 0 ? (
                badges.map((badge) => {
                  const Icon = getBadgeIcon(badge.name);
                  const colorClass = getBadgeColor(badge.category);

                  return (
                    <div
                      key={badge.id}
                      className="p-4 rounded-xl border border-gray-100 bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-green-600">
                              Earned{" "}
                              {new Date(badge.earned_at).toLocaleDateString("default", {
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No badges earned yet</p>
                  <p className="text-xs mt-1">
                    Complete jobs and maintain high ratings to earn badges
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-full bg-[var(--orange)]/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[var(--orange)]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {badges.length} badge{badges.length !== 1 ? "s" : ""} earned
                  </p>
                  <p className="text-gray-500">Keep going!</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
