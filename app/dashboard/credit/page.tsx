"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Shield,
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";
import { getCreditScoreLabel } from "@/lib/constants";
import { useCreditStore } from "@/store/creditStore";
import { CreditConsentToggle } from "@/components/credit/CreditConsentToggle";
import { CREDIT_SCORE_MIN, CREDIT_SCORE_MAX } from "@/lib/score-utils";
import type { CreditScoreComponents } from "@/api/types/reputation";

// Factor display configuration
const FACTOR_CONFIG: Record<
  keyof CreditScoreComponents,
  { label: string; icon: typeof Briefcase; weight: number }
> = {
  job_completion: { label: "Job Completion", icon: Briefcase, weight: 25 },
  earnings_consistency: { label: "Earnings Consistency", icon: TrendingUp, weight: 25 },
  tenure: { label: "Platform Tenure", icon: Clock, weight: 15 },
  verification_level: { label: "Verification Level", icon: Shield, weight: 15 },
  payment_history: { label: "Payment History", icon: CreditCard, weight: 20 },
};

function getFactorStatus(score: number): "positive" | "neutral" | "negative" {
  if (score >= 75) return "positive";
  if (score >= 50) return "neutral";
  return "negative";
}

function getFactorImpact(weight: number): "high" | "medium" | "low" {
  if (weight >= 25) return "high";
  if (weight >= 15) return "medium";
  return "low";
}

function CreditGauge({ score, maxScore }: { score: number; maxScore: number }) {
  const percentage = ((score - CREDIT_SCORE_MIN) / (maxScore - CREDIT_SCORE_MIN)) * 100;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 750) return { from: "#059669", to: "#10B981" };
    if (score >= 650) return { from: "#D97706", to: "#F59E0B" };
    if (score >= 550) return { from: "#EA580C", to: "#F97316" };
    return { from: "#DC2626", to: "#EF4444" };
  };

  const colors = getColor(score);
  const range = getCreditScoreLabel(score);

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
          stroke={`url(#creditGradient-${score})`}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient
            id={`creditGradient-${score}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-gray-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-sm font-medium" style={{ color: colors.from }}>
          {range.label}
        </span>
      </div>
    </div>
  );
}

function TrendBadge({
  trend,
  change,
}: {
  trend: "up" | "down" | "stable";
  change: number;
}) {
  if (trend === "up") {
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
        <TrendingUp className="w-4 h-4" />+{change} pts
      </div>
    );
  }
  if (trend === "down") {
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        <TrendingDown className="w-4 h-4" />
        {change} pts
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
      <Minus className="w-4 h-4" />
      Stable
    </div>
  );
}

export default function CreditPage() {
  const {
    creditScore,
    history,
    insights,
    financialSummary,
    isLoading,
    error,
    fetchCreditProfile,
  } = useCreditStore();
  const { toast, showToast, hideToast } = useErrorToast();

  useEffect(() => {
    fetchCreditProfile().catch(() => {
      showToast("Connection lost. Unable to refresh credit score.", {
        onRetry: () => fetchCreditProfile(),
        variant: "network",
      });
    });
  }, [fetchCreditProfile, showToast]);

  if (isLoading && !creditScore) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !creditScore) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Score</h1>
          <p className="text-gray-500 mt-1">
            Your alternative credit score based on your work history
          </p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Unable to load credit score
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => fetchCreditProfile()}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derive display values from store data
  const score = creditScore?.score ?? CREDIT_SCORE_MIN;
  const trend = creditScore?.trend ?? "stable";
  const trendChange = creditScore?.trend_change ?? 0;
  const components = creditScore?.components;
  const eligibleProducts = creditScore?.eligible_products ?? [];
  const lastUpdated = creditScore?.last_updated
    ? new Date(creditScore.last_updated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credit Score</h1>
        <p className="text-gray-500 mt-1">
          Your alternative credit score based on your work history
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-100 rounded-xl p-4"
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>What is Alternative Credit Scoring?</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Unlike traditional credit scores that require bank accounts and credit
              history, your Artivo Credit Score is built from your job history,
              earnings, and platform reputation. This helps you access financial
              services without traditional credit requirements.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Banner — Requirement 7.7: retain previous score, show update pending */}
      {error && creditScore && (
        <ErrorBanner
          message="Credit score update pending"
          description="Unable to refresh your credit score. Displaying your previous score."
          variant="warning"
          onDismiss={() => {}}
          onRetry={() => fetchCreditProfile()}
          retryLabel="Refresh"
        />
      )}

      {/* Network Error Toast */}
      <ErrorToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        onRetry={toast.onRetry}
        variant={toast.variant}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credit Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Your Credit Score</h2>
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdated}
                </p>
              </div>
              <TrendBadge trend={trend} change={trendChange} />
            </div>

            <CreditGauge score={score} maxScore={CREDIT_SCORE_MAX} />

            {/* Score Range */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>300</span>
                <span>550</span>
                <span>650</span>
                <span>750</span>
                <span>850</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="w-[20%] bg-red-400" />
                <div className="w-[20%] bg-orange-400" />
                <div className="w-[20%] bg-amber-400" />
                <div className="w-[20%] bg-green-400" />
                <div className="w-[20%] bg-emerald-500" />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-red-600">Poor</span>
                <span className="text-orange-600">Fair</span>
                <span className="text-amber-600">Good</span>
                <span className="text-green-600">Very Good</span>
                <span className="text-emerald-600">Excellent</span>
              </div>
            </div>

            {/* Score History Chart */}
            {history.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Score History (6 months)
                </h3>
                <div className="flex items-end justify-between h-24 gap-2">
                  {history.slice(-6).map((item, i) => {
                    const minDisplay = Math.max(
                      CREDIT_SCORE_MIN,
                      Math.min(...history.slice(-6).map((h) => h.score)) - 50
                    );
                    const maxDisplay = CREDIT_SCORE_MAX;
                    const height =
                      ((item.score - minDisplay) / (maxDisplay - minDisplay)) * 80;
                    const monthLabel = new Date(item.date).toLocaleDateString(
                      "en-US",
                      { month: "short" }
                    );
                    return (
                      <div
                        key={item.date}
                        className="flex flex-col items-center flex-1"
                      >
                        <span className="text-xs text-gray-700 font-medium mb-1">
                          {Math.round(item.score)}
                        </span>
                        <motion.div
                          className="w-full bg-gradient-to-t from-[var(--orange)] to-amber-400 rounded-t"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(4, height)}px` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Score Factors Breakdown */}
          {components && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold mb-6">
                What&apos;s Affecting Your Score
              </h2>

              <div className="space-y-4">
                {(
                  Object.entries(components) as [
                    keyof CreditScoreComponents,
                    number,
                  ][]
                ).map(([key, value]) => {
                  const config = FACTOR_CONFIG[key];
                  if (!config) return null;
                  const Icon = config.icon;
                  const status = getFactorStatus(value);
                  const impact = getFactorImpact(config.weight);

                  return (
                    <div
                      key={key}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          status === "positive"
                            ? "bg-green-100 text-green-600"
                            : status === "neutral"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {config.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                impact === "high"
                                  ? "bg-purple-100 text-purple-700"
                                  : impact === "medium"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {impact} impact ({config.weight}%)
                            </span>
                            {status === "positive" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : status === "neutral" ? (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                status === "positive"
                                  ? "bg-green-500"
                                  : status === "neutral"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                            {Math.round(value)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Eligible Financial Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Available Products</h2>
                <p className="text-sm text-gray-500">
                  Financial services you qualify for based on your credit score
                </p>
              </div>
            </div>

            {eligibleProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  No products available yet. Keep building your credit score to
                  unlock financial products.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {eligibleProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl border border-green-200 bg-green-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Eligible
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{product.provider}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
                      >
                        Apply
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {product.description}
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200/50">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium capitalize">
                          {product.type.replace("_", " ")}
                        </p>
                      </div>
                      {product.max_amount && (
                        <div>
                          <p className="text-xs text-gray-500">Max Amount</p>
                          <p className="text-sm font-medium">
                            ₦{product.max_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {product.interest_rate !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">Rate</p>
                          <p className="text-sm font-medium">
                            {product.interest_rate}% monthly
                          </p>
                        </div>
                      )}
                      {product.terms && (
                        <div>
                          <p className="text-xs text-gray-500">Terms</p>
                          <p className="text-sm font-medium">{product.terms}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Insights */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[var(--orange)]" />
                <h2 className="text-lg font-semibold">Improve Your Score</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Take these actions to boost your credit score
              </p>

              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          insight.type === "positive"
                            ? "bg-green-100"
                            : insight.type === "negative"
                            ? "bg-red-100"
                            : "bg-[var(--orange)]/10"
                        }`}
                      >
                        {insight.type === "positive" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : insight.type === "negative" ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Lightbulb className="w-4 h-4 text-[var(--orange)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {insight.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {insight.description}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {insight.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Stats & Consent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24"
          >
            {/* Financial Summary */}
            {financialSummary && (
              <>
                <h3 className="font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{Math.round(financialSummary.total_earnings / 1000)}k
                    </p>
                    <p className="text-xs text-gray-500">Total Earned</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{Math.round(financialSummary.average_monthly_earnings / 1000)}k
                    </p>
                    <p className="text-xs text-gray-500">Monthly Avg</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(financialSummary.on_time_payment_rate)}%
                    </p>
                    <p className="text-xs text-gray-500">On-Time Payments</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1">
                      {financialSummary.earnings_trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : financialSummary.earnings_trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {financialSummary.earnings_trend}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">Earnings Trend</p>
                  </div>
                </div>
              </>
            )}

            {/* Credit Consent Toggle */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Data Sharing</h3>
              <CreditConsentToggle />
            </div>

            <hr className="my-6" />

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Need help understanding your score?
              </p>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
