"use client";

import Link from "next/link";
import { MapPin, Star, Sparkles, ImageIcon, ArrowRight } from "lucide-react";
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

  const displayBadge =
    badge ?? (worker.trust_score >= 90 ? "ai-pick" : worker.rating >= 4.8 ? "top-rated" : null);

  return (
    <Link
      href={profileUrl}
      className="relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
    >
      {/* Photo Grid */}
      <div className="relative h-36 w-full overflow-hidden bg-gray-100 flex-shrink-0">
        {worker.portfolio_preview ? (
          <div className="grid grid-cols-3 grid-rows-2 gap-0.5 h-full w-full">
            {/* Main large image — spans 2 rows, 2 cols */}
            <div className="col-span-2 row-span-2 relative overflow-hidden">
              <img
                src={worker.portfolio_preview.image_url}
                alt={worker.portfolio_preview.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Placeholder thumbnails on the right */}
            <div className="relative overflow-hidden bg-gray-200">
              <img
                src={worker.portfolio_preview.image_url}
                alt=""
                className="w-full h-full object-cover opacity-80 scale-150 translate-x-4"
              />
            </div>
            <div className="relative overflow-hidden bg-gray-200">
              <img
                src={worker.portfolio_preview.image_url}
                alt=""
                className="w-full h-full object-cover opacity-70 scale-125 -translate-y-2"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">+2more</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
            <span className="text-[10px] text-gray-400">No portfolio yet</span>
          </div>
        )}

        {/* Badge */}
        {displayBadge && (
          <div className="absolute top-2.5 right-2.5">
            {displayBadge === "ai-pick" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--orange)] text-white text-xs font-semibold shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI Pick
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--orange)] text-white text-xs font-semibold shadow-sm">
                <Star className="w-3 h-3 fill-white" />
                Top rated
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 px-4 pt-4 pb-3">
        {/* Profile row: avatar + name + rating */}
        <div className="flex items-start gap-3 mb-1">
          {/* Avatar overlapping the photo grid */}
          <div className="relative flex-shrink-0 -mt-8">
            <div className="w-11 h-11 rounded-full bg-[var(--orange)]/15 flex items-center justify-center text-[var(--orange)] font-bold text-base overflow-hidden border-2 border-white shadow-sm">
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
          </div>

          {/* Name + rating */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 truncate text-sm group-hover:text-[var(--orange)] transition-colors">
              {worker.display_name}
            </h3>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3 h-3 text-[var(--orange)] fill-[var(--orange)]" />
              <span className="text-xs font-semibold text-gray-900">{worker.rating.toFixed(2)}</span>
            </div>
          </div>

          {/* Price */}
          {worker.hourly_rate ? (
            <div className="flex-shrink-0 text-right">
              <span className="text-sm font-bold text-gray-900">₦{formatRate(worker.hourly_rate)}</span>
              <p className="text-[10px] text-gray-400">per session</p>
            </div>
          ) : (
            <div className="flex-shrink-0 text-right">
              <span className="text-sm font-medium text-gray-400 italic">—</span>
            </div>
          )}
        </div>

        {/* Profession / tagline */}
        <p className="text-xs text-gray-500 pl-14 -mt-0.5 mb-3 capitalize">
          {worker.tagline || primarySkill}
        </p>

        {/* Footer: location + view profile */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{worker.location.city}</span>
          </div>
          <span className="text-xs font-medium text-[var(--orange)] flex items-center gap-1 group-hover:gap-1.5 transition-all">
            View profile <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatRate(rate: number): string {
  if (rate >= 1000) {
    const k = rate / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return rate.toLocaleString();
}
