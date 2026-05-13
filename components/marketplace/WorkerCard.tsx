"use client";

import Link from "next/link";
import { MapPin, Star, CheckCircle2, TrendingUp, Sparkles, Clock, Quote, ImageIcon } from "lucide-react";
import type { WorkerProfileSummary } from "@/api/types/worker";

export interface WorkerCardProps {
  worker: WorkerProfileSummary;
  badge?: "ai-pick" | "top-rated" | null;
  variant?: "default" | "featured";
}

export function WorkerCard({ worker, badge, variant = "default" }: WorkerCardProps) {
  const primarySkill = worker.skills[0] ?? "General";
  const profileUrl = worker.username
    ? `/artisan/${worker.username}`
    : `/artisan/${worker.id}`;

  const isAvailable = worker.availability === "available";

  const displayBadge =
    badge ?? (worker.trust_score >= 90 ? "ai-pick" : worker.rating >= 4.8 ? "top-rated" : null);

  const isFeatured = variant === "featured";

  return (
    <Link
      href={profileUrl}
      className={`relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group ${
        isFeatured ? "ring-1 ring-[var(--orange)]/20" : ""
      }`}
    >
      {/* Portfolio Preview Image — always rendered at fixed height */}
      <div className="relative h-36 w-full overflow-hidden bg-gray-100 flex-shrink-0">
        {worker.portfolio_preview ? (
          <>
            <img
              src={worker.portfolio_preview.image_url}
              alt={worker.portfolio_preview.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-2 left-3 text-xs text-white/90 font-medium">
              {worker.portfolio_preview.title}
            </span>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
            <span className="text-[10px] text-gray-400">No portfolio yet</span>
          </div>
        )}
        {/* Badge on image */}
        {displayBadge && (
          <div className="absolute top-2.5 right-2.5">
            {displayBadge === "ai-pick" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[var(--orange)] text-xs font-semibold shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI Pick
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-amber-700 text-xs font-semibold shadow-sm">
                <TrendingUp className="w-3 h-3" />
                Top Rated
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Body — flex-1 to fill remaining space */}
      <div className="flex flex-col flex-1 p-5">
        {/* Header: Avatar, Name, Skill, Location */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-[var(--orange)]/15 flex items-center justify-center text-[var(--orange)] font-bold text-base overflow-hidden">
              {worker.profile_image_url ? (
                <img
                  src={worker.profile_image_url}
                  alt={worker.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                worker.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isAvailable ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-[var(--orange)] transition-colors text-sm">
                {worker.display_name}
              </h3>
              {worker.verification_status === "verified" && (
                <CheckCircle2
                  className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
                  aria-label="Verified"
                />
              )}
            </div>
            <p className="text-xs text-[var(--orange)] font-medium mt-0.5">
              {primarySkill}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>
                {worker.location.city}, {worker.location.state}
              </span>
            </div>
          </div>
        </div>

        {/* Tagline / AI Match Explanation — fixed single line with ellipsis */}
        {worker.tagline ? (
          <p className="text-xs text-gray-600 mb-3 truncate h-4 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--orange)] flex-shrink-0" />
            <span className="italic truncate">{worker.tagline}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-3 truncate italic h-4">
            {`${primarySkill} professional`}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-gray-900">{worker.rating.toFixed(1)}</span>
            <span className="text-gray-400">({worker.reviews_count})</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="font-bold text-gray-900">{worker.completed_jobs}</span>
            <span className="text-gray-400">jobs</span>
          </div>
          {worker.response_time && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="font-medium text-gray-700">{worker.response_time}</span>
            </div>
          )}
        </div>

        {/* Social Proof - Featured Review — fixed height */}
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50/60 border border-amber-100 h-16 flex items-start">
          {worker.featured_review ? (
            <div className="flex items-start gap-1.5">
              <Quote className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                  &ldquo;{worker.featured_review.comment}&rdquo;
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  — {worker.featured_review.reviewer_name}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 h-full">
              <Quote className="w-3 h-3 text-amber-300 flex-shrink-0" />
              <p className="text-xs text-gray-400 italic">No reviews yet</p>
            </div>
          )}
        </div>

        {/* Footer — pushed to bottom with mt-auto */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <span
            className={`text-xs font-medium ${
              isAvailable ? "text-green-600" : "text-gray-400"
            }`}
          >
            {isAvailable ? "● Available now" : "● Unavailable"}
          </span>
          <span className="text-xs font-medium text-[var(--orange)] border border-[var(--orange)]/30 rounded-lg px-3 py-1.5 group-hover:bg-[var(--orange)]/5 transition-colors">
            View Profile
          </span>
        </div>
      </div>
    </Link>
  );
}
