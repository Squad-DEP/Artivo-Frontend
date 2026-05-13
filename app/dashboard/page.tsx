"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";
import { motion } from "framer-motion";
import {
  Briefcase,
  TrendingUp,
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
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

function WorkerDashboard({ userName }: { userName: string }) {
  const router = useRouter();

  // Mock data - in production, this would come from API hooks
  const stats = {
    activeJobs: 3,
    completedJobs: 47,
    totalEarnings: 2450000,
    pendingEarnings: 180000,
    trustScore: 87,
    creditScore: 720,
  };

  const recentJobs = [
    {
      id: "1",
      title: "Kitchen Plumbing Repair",
      customer: "Adaobi N.",
      status: "in_progress",
      amount: 45000,
      dueDate: "2025-05-15",
    },
    {
      id: "2",
      title: "Electrical Wiring Installation",
      customer: "Emeka O.",
      status: "in_progress",
      amount: 120000,
      dueDate: "2025-05-18",
    },
    {
      id: "3",
      title: "AC Maintenance",
      customer: "Funke A.",
      status: "pending",
      amount: 25000,
      dueDate: "2025-05-20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your work
          </p>
        </div>
        <Button
          onClick={() => router.push("/marketplace")}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
        >
          <Search className="w-4 h-4 mr-2" />
          Find Jobs
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Active Jobs"
          value={stats.activeJobs.toString()}
          trend="+2 this week"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed Jobs"
          value={stats.completedJobs.toString()}
          trend="All time"
          color="green"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Trust Score"
          value={stats.trustScore.toString()}
          trend="Top 15%"
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Credit Score"
          value={stats.creditScore.toString()}
          trend="Good"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Active Jobs</h2>
            <Link
              href="/dashboard/jobs"
              className="text-sm text-[var(--orange)] hover:underline flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{job.title}</h3>
                  <p className="text-xs text-gray-500">{job.customer}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-sm">
                    ₦{job.amount.toLocaleString()}
                  </p>
                  <JobStatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>

          {recentJobs.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active jobs</p>
              <Button
                variant="link"
                className="text-[var(--orange)]"
                onClick={() => router.push("/marketplace")}
              >
                Browse available jobs
              </Button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions & Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Earnings Summary */}
          <div className="bg-gradient-to-br from-[var(--orange)] to-[var(--orange)]/80 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-2">
              Total Earnings
            </h3>
            <p className="text-3xl font-bold mb-4">
              ₦{stats.totalEarnings.toLocaleString()}
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                className="bg-white text-[var(--orange)] hover:bg-white/90"
                onClick={() => router.push("/dashboard/reputation")}
              >
                View Reputation
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/credit")}
              >
                Credit Score
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                icon={<Search className="w-5 h-5" />}
                label="Find Jobs"
                onClick={() => router.push("/marketplace")}
              />
              <QuickActionButton
                icon={<Star className="w-5 h-5" />}
                label="View Reputation"
                onClick={() => router.push("/dashboard/reputation")}
              />
              <QuickActionButton
                icon={<TrendingUp className="w-5 h-5" />}
                label="Credit Score"
                onClick={() => router.push("/dashboard/credit")}
              />
              <QuickActionButton
                icon={<Briefcase className="w-5 h-5" />}
                label="My Jobs"
                onClick={() => router.push("/dashboard/jobs")}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CustomerDashboard({ userName }: { userName: string }) {
  const router = useRouter();

  // Mock data
  const stats = {
    activeJobs: 2,
    completedJobs: 15,
    totalSpent: 850000,
    savedArtisans: 8,
  };

  const recentJobs = [
    {
      id: "1",
      title: "Home Painting",
      worker: "Chidi E.",
      status: "in_progress",
      amount: 150000,
    },
    {
      id: "2",
      title: "Generator Servicing",
      worker: "Pending",
      status: "open",
      amount: 35000,
    },
  ];

  const recommendedArtisans = [
    {
      id: "1",
      name: "Adebayo O.",
      skill: "Electrician",
      rating: 4.9,
      jobs: 124,
    },
    { id: "2", name: "Grace M.", skill: "Tailor", rating: 4.8, jobs: 89 },
    { id: "3", name: "Uche N.", skill: "Plumber", rating: 4.7, jobs: 156 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Find skilled artisans for any job
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/jobs/new")}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post a Job
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Active Jobs"
          value={stats.activeJobs.toString()}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={stats.completedJobs.toString()}
          color="green"
        />
        <StatCard
          icon={<Search className="w-5 h-5" />}
          label="Total Spent"
          value={`₦${(stats.totalSpent / 1000).toFixed(0)}k`}
          color="orange"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Saved Artisans"
          value={stats.savedArtisans.toString()}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">My Jobs</h2>
            <Link
              href="/dashboard/jobs"
              className="text-sm text-[var(--orange)] hover:underline flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{job.title}</h3>
                  <p className="text-xs text-gray-500">Worker: {job.worker}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-sm">
                    ₦{job.amount.toLocaleString()}
                  </p>
                  <JobStatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push("/dashboard/jobs/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </motion.div>

        {/* Recommended Artisans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recommended Artisans</h2>
            <Link
              href="/marketplace"
              className="text-sm text-[var(--orange)] hover:underline flex items-center gap-1"
            >
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recommendedArtisans.map((artisan) => (
              <div
                key={artisan.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/artisan/${artisan.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--orange)]/20 flex items-center justify-center text-[var(--orange)] font-semibold">
                  {artisan.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{artisan.name}</h3>
                  <p className="text-xs text-gray-500">{artisan.skill}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{artisan.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">{artisan.jobs} jobs</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
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
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-[var(--orange)]/10 text-[var(--orange)]",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"
    >
      <div
        className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
    </motion.div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    open: {
      label: "Open",
      className: "bg-blue-100 text-blue-700",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-yellow-100 text-yellow-700",
      icon: <Clock className="w-3 h-3" />,
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    pending: {
      label: "Pending",
      className: "bg-gray-100 text-gray-700",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
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
