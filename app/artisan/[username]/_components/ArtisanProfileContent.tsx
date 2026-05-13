"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Briefcase,
  MessageCircle,
  Shield,
  TrendingUp,
  Image as ImageIcon,
  Zap,
  Award,
  Quote,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Phone,
  Mail,
  Calendar,
  ThumbsUp,
  ChevronDown,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import Link from "next/link";
import type { WorkerProfile, PortfolioItem } from "@/api/types/worker";
import type { Review } from "@/api/types/reputation";
import { VERIFICATION_STATUS } from "@/lib/constants/user-types";
import { HireMeButton } from "@/components/profile/HireMeButton";
import { ProfileShareButton } from "@/components/profile/ProfileShareButton";
import { HireDialog } from "@/components/marketplace/HireDialog";

interface ArtisanProfileContentProps {
  worker: WorkerProfile;
  reviews?: Review[];
}

// ─── Trust Score Ring ────────────────────────────────────────────────────────

function TrustScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 90) return "var(--artivo-secondary)";
    if (s >= 75) return "var(--artivo-trust)";
    if (s >= 60) return "var(--orange)";
    return "#6B7280";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getScoreColor(score)} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - progress }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{score}</span>
        <span className="text-[10px] text-gray-500 font-medium uppercase">Trust</span>
      </div>
    </div>
  );
}

// ─── Portfolio Modal ─────────────────────────────────────────────────────────

function PortfolioModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const images = (item.images && item.images.length > 0) ? item.images : [item.image_url].filter(Boolean) as string[];
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;

  const goNext = useCallback(() => { setActiveIndex((prev) => (prev + 1) % images.length); }, [images.length]);
  const goPrev = useCallback(() => { setActiveIndex((prev) => (prev - 1 + images.length) % images.length); }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose, hasMultiple, goNext, goPrev]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25 }} className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img key={activeIndex} src={images[activeIndex]} alt={`${item.title} - image ${activeIndex + 1}`} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </AnimatePresence>
          </div>
          {hasMultiple && (
            <>
              <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors" aria-label="Previous image"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors" aria-label="Next image"><ChevronRight className="w-5 h-5" /></button>
            </>
          )}
        </div>
        {hasMultiple && (
          <div className="flex justify-center gap-2 overflow-x-auto px-6 py-3 scrollbar-hide border-b border-gray-100">
            {images.map((url, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? "border-[var(--orange)] ring-1 ring-[var(--orange)]/30" : "border-transparent opacity-60 hover:opacity-100"}`} aria-label={`View image ${i + 1}`}>
                <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              {item.category && <span className="inline-block mt-2 px-2.5 py-1 bg-[var(--orange)]/10 text-[var(--orange)] rounded-lg text-xs font-medium">{item.category}</span>}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
          {item.description && <p className="mt-4 text-gray-600 leading-relaxed">{item.description}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Rating Distribution ─────────────────────────────────────────────────────

function RatingDistribution({ reviews, averageRating, totalReviews }: { reviews: Review[]; averageRating: number; totalReviews: number }) {
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="flex items-start gap-8">
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-900">{averageRating}</p>
        <div className="flex items-center gap-0.5 mt-1 justify-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? "text-[var(--orange)] fill-[var(--orange)]" : "text-gray-300"}`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
      </div>
      <div className="flex-1 space-y-2">
        {distribution.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-3">{rating}</span>
            <Star className="w-3.5 h-3.5 text-[var(--orange)] fill-[var(--orange)]" />
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--orange)] rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="text-sm text-gray-500 w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
            {review.reviewer_image ? (
              <img src={review.reviewer_image} alt={review.reviewer_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">{review.reviewer_name.split(" ").map((n) => n[0]).join("")}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{review.reviewer_name}</p>
            <p className="text-xs text-gray-500">{review.job_title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-[var(--orange)] fill-[var(--orange)]" : "text-gray-300"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>
      <p className="mt-3 text-gray-600 text-sm leading-relaxed">{review.comment}</p>
      {review.response && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Response from provider</p>
          <p className="text-sm text-gray-500 leading-relaxed">{review.response}</p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
        <ThumbsUp className="w-3.5 h-3.5" />
        <span>Helpful ({review.helpful_count})</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ArtisanProfileContent({ worker, reviews = [] }: ArtisanProfileContentProps) {
  const router = useRouter();
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "portfolio" | "reviews">("about");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);

  const verificationConfig = VERIFICATION_STATUS[worker.verification_status];
  const isVerified = worker.verification_status === "verified";
  const memberSince = new Date(worker.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const yearsExperience = worker.skills.length > 0 ? Math.max(...worker.skills.map((s) => s.years_experience ?? 0)) : 0;

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const tabs = [
    { id: "about" as const, label: "About" },
    { id: "portfolio" as const, label: "Portfolio" },
    { id: "reviews" as const, label: "Reviews" },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--orange)] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{BRAND.name}</span>
            </Link>
            <ProfileShareButton username={worker.username ?? ""} workerName={worker.display_name} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md">
                    {worker.profile_image_url ? (
                      <img src={worker.profile_image_url} alt={worker.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--orange)] to-[var(--orange)]/70 flex items-center justify-center text-white font-bold text-3xl">{worker.display_name.charAt(0)}</div>
                    )}
                  </div>
                  <div className={`absolute top-[110px] -right-1 w-5 h-5 rounded-full border-2 border-white ${worker.availability === "available" ? "bg-green-500" : worker.availability === "busy" ? "bg-yellow-500" : "bg-gray-400"}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{worker.display_name}</h1>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      worker.verification_status === "verified"
                        ? "bg-green-50 text-green-700"
                        : worker.verification_status === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : worker.verification_status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-50 text-gray-600"
                    }`}>
                      {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {verificationConfig.label}
                    </span>
                    {worker.trust_score >= 90 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--orange)]/10 text-[var(--orange)] rounded-full text-xs font-medium">
                        <Award className="w-3.5 h-3.5" /> Top Rated
                      </span>
                    )}
                  </div>
                  {worker.categories.length > 0 && (
                    <p className="text-base text-gray-600 font-medium mt-2">{worker.categories.map((c) => c.name).join(" & ")}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{worker.location.city}, {worker.location.state}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Member since {memberSince}</span>
                    {worker.response_time_hours && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Responds in ~{worker.response_time_hours}h</span>}
                  </div>
                  {worker.languages && worker.languages.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {worker.languages.map((lang) => (
                        <span key={lang} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{lang}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trust Score Ring */}
                <div className="flex-shrink-0 hidden sm:block">
                  <TrustScoreRing score={worker.trust_score} />
                </div>
              </div>

              {/* Mobile-only trust ring */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 sm:hidden">
                <TrustScoreRing score={worker.trust_score} size={50} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Trust Score</p>
                  <p className="text-xs text-gray-500">Verified on {BRAND.name}</p>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Star, value: worker.rating.toString(), label: "Rating", sub: `${worker.reviews_count} reviews` },
                { icon: Briefcase, value: worker.completed_jobs.toString(), label: "Jobs Completed", sub: `${worker.completion_rate ?? 0}% success` },
                { icon: Award, value: `${yearsExperience}+`, label: "Experience", sub: "Years" },
                { icon: Clock, value: `${worker.response_time_hours ?? 2}h`, label: "Avg. Response", sub: "Reply time" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <stat.icon className="w-5 h-5 text-[var(--orange)] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              ))}
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--orange)] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className={activeTab === "about" ? "" : "hidden"}>
              <div className="space-y-6">
                  {/* About */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
                    <p className="text-gray-600 leading-relaxed">{worker.bio}</p>

                    {worker.skills.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills & Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {worker.skills.map((skill) => (
                            <span key={skill.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${skill.verified ? "bg-[var(--orange)]/5 text-[var(--orange)] border-[var(--orange)]/20" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {skill.verified && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {skill.name}
                              {skill.years_experience != null && <span className="text-xs opacity-60">· {skill.years_experience}yr</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  {worker.experience && worker.experience.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[var(--orange)]" /> Experience
                      </h2>
                      <div className="relative pl-6 space-y-6">
                        <div className="absolute -left-[2px] top-1.5 h-full w-0.5 bg-gray-100"/>
                        {worker.experience.map((exp) => (
                          <div key={exp.id} className="relative">
                            <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[var(--orange)] border-2 border-white" />
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{exp.company}</p>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{exp.start_year} — {exp.end_year ?? "Present"}</span>
                            </div>
                            {exp.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education & Certifications */}
                  {((worker.education && worker.education.length > 0) || (worker.certifications && worker.certifications.length > 0)) && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {worker.education && worker.education.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-[var(--orange)]" /> Education
                          </h2>
                          <div className="space-y-4">
                            {worker.education.map((edu) => (
                              <div key={edu.id}>
                                <p className="font-medium text-gray-900 text-sm">{edu.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{edu.institution}</p>
                                <p className="text-xs text-gray-400">{edu.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {worker.certifications && worker.certifications.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[var(--orange)]" /> Certifications
                          </h2>
                          <div className="space-y-4">
                            {worker.certifications.map((cert) => (
                              <div key={cert.id}>
                                <p className="font-medium text-gray-900 text-sm">{cert.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>
                                <p className="text-xs text-gray-400">{cert.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            <div className={activeTab === "portfolio" ? "" : "hidden"}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
                      <span className="text-sm text-gray-400">{worker.portfolio.length} projects</span>
                    </div>
                    {worker.portfolio.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {worker.portfolio.map((item) => (
                          <div
                            key={item.id}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => setSelectedPortfolioItem(item)}
                          >
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
                            )}
                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            {/* Project details - visible by default, hidden on hover (desktop) */}
                            <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 transition-opacity duration-300 sm:group-hover:opacity-0">
                              <p className="font-semibold text-white text-xs sm:text-sm line-clamp-1">{item.title}</p>
                            </div>
                            {/* Desktop: hover overlay with view details button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
                              <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-900 shadow-lg">
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No portfolio items yet.</p>
                    )}
                  </div>
            </div>

            <div className={activeTab === "reviews" ? "" : "hidden"}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{reviews.length}</span>
                    </div>

                    {reviews.length > 0 ? (
                      <>
                        <RatingDistribution reviews={reviews} averageRating={worker.rating} totalReviews={worker.reviews_count} />
                        <div className="mt-6 divide-y divide-gray-100">
                          {visibleReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                          ))}
                        </div>
                        {reviews.length > 3 && !showAllReviews && (
                          <button onClick={() => setShowAllReviews(true)} className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                            Show More Reviews ({reviews.length - 3} remaining)
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">No reviews yet.</p>
                    )}
                  </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-6">
              {/* Pricing */}
              {worker.hourly_rate && (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">₦{worker.hourly_rate.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">/hour</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Starting price</p>
                  {worker.response_time_hours && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Responds ~{worker.response_time_hours} hours
                    </p>
                  )}
                </div>
              )}

              <hr className="border-gray-100" />

              {/* Project description input */}
              <div className="relative">
                <input type="text" placeholder="Describe your project..." className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]/30" readOnly />
                <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <HireMeButton workerUsername={worker.username ?? ""} workerName={worker.display_name.split(" ")[0]} workerUserId={worker.user_id} onHireClick={() => setIsHireDialogOpen(true)} />
                <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200" onClick={() => router.push("/register")}>
                  <Calendar className="w-4 h-4 mr-2" /> Schedule Consultation
                </Button>
              </div>

              <hr className="border-gray-100" />

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {worker.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{worker.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{worker.username ?? worker.display_name.toLowerCase().replace(/\s/g, ".")}@artivo.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{worker.location.city}, {worker.location.state}</span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Artivo Guarantee */}
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--orange)]" /> Artivo Guarantee
                </h3>
                <div className="space-y-2">
                  {["Identity verified", "Payment protection", "24/7 support"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Availability</h3>
                <div className="flex items-center gap-1.5">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < 6 ? "bg-[var(--orange)]/10 text-[var(--orange)]" : "bg-gray-100 text-gray-400"}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">8:00 AM - 6:00 PM WAT</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {selectedPortfolioItem && (
          <PortfolioModal item={selectedPortfolioItem} onClose={() => setSelectedPortfolioItem(null)} />
        )}
      </AnimatePresence>

      {/* Hire Dialog */}
      <HireDialog
        isOpen={isHireDialogOpen}
        onClose={() => setIsHireDialogOpen(false)}
        workerName={worker.display_name}
        workerId={worker.user_id}
        workerUsername={worker.username ?? ""}
      />
    </div>
  );
}
