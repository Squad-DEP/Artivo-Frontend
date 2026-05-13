"use client";

import React, { useState } from "react";
import { MapPin, Banknote, Shield, Sparkles, SlidersHorizontal, X } from "lucide-react";
import {
  type VerificationStatus,
} from "@/lib/constants/user-types";
import { useMarketplaceStore } from "@/store/marketplaceStore";

const QUICK_CATEGORIES = [
  { label: "AI Recommended", slug: "", isAI: true },
  { label: "Electricians", slug: "electrician" },
  { label: "Plumbers", slug: "plumber" },
  { label: "Carpenters", slug: "carpenter" },
  { label: "Mechanics", slug: "mechanic" },
  { label: "Tailors", slug: "tailor" },
  { label: "Barbers", slug: "barber" },
  { label: "Painters", slug: "painter" },
  { label: "Photographers", slug: "photographer" },
  { label: "Hairstylists", slug: "hairstylist" },
];

const LOCATIONS = [
  { label: "Lagos", value: "Lagos" },
  { label: "Abuja", value: "Abuja" },
  { label: "Kano", value: "Kano" },
  { label: "Rivers", value: "Rivers" },
  { label: "Accra", value: "Accra" },
  { label: "Nairobi", value: "Nairobi" },
];

const PRICE_RANGES = [
  { label: "Under ₦2k/hr", value: 2000 },
  { label: "Under ₦5k/hr", value: 5000 },
  { label: "Under ₦10k/hr", value: 10000 },
  { label: "Under ₦20k/hr", value: 20000 },
];

const TRUST_LEVELS = [
  { label: "Verified", value: "verified" as VerificationStatus },
  { label: "Any Level", value: "" },
];

export function MarketplaceFilters() {
  const { filters, setFilters, applyFilters } = useMarketplaceStore();
  const [activeCategory, setActiveCategory] = useState("");
  const [showRefine, setShowRefine] = useState(false);

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    setFilters({ category: slug || undefined });
    applyFilters();
  };

  const handleLocationSelect = (state: string) => {
    const current = filters.location?.state;
    const next = current === state ? undefined : state;
    setFilters({ location: { ...filters.location, state: next } });
    applyFilters();
  };

  const handlePriceSelect = (value: number) => {
    const next = filters.maxHourlyRate === value ? undefined : value;
    setFilters({ maxHourlyRate: next });
    applyFilters();
  };

  const handleTrustSelect = (value: string) => {
    const next = (filters.verificationStatus === value ? undefined : value || undefined) as VerificationStatus | undefined;
    setFilters({ verificationStatus: next });
    applyFilters();
  };

  const activeFilterCount = [
    filters.location?.state,
    filters.maxHourlyRate,
    filters.verificationStatus,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilters({ location: undefined, maxHourlyRate: undefined, verificationStatus: undefined });
    applyFilters();
  };

  return (
    <div className="space-y-4">
      {/* Primary Row: Category pills + Refine toggle */}
      <div className="flex items-center gap-3">
        {/* Scrollable category pills */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.slug
                  ? "bg-[var(--orange)] text-white shadow-sm shadow-[var(--orange)]/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--orange)]/40 hover:text-gray-900"
              }`}
            >
              {cat.isAI && <Sparkles className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Refine button */}
        <button
          onClick={() => setShowRefine(!showRefine)}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            showRefine || activeFilterCount > 0
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Refine
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--orange)] text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Refine Panel */}
      {showRefine && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Refine results</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Location */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => handleLocationSelect(loc.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filters.location?.state === loc.value
                        ? "bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/30"
                        : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Banknote className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((price) => (
                  <button
                    key={price.value}
                    onClick={() => handlePriceSelect(price.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filters.maxHourlyRate === price.value
                        ? "bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/30"
                        : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {price.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trust</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRUST_LEVELS.map((trust) => (
                  <button
                    key={trust.label}
                    onClick={() => handleTrustSelect(trust.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      (trust.value === "" && !filters.verificationStatus) ||
                      filters.verificationStatus === trust.value
                        ? "bg-[var(--orange)]/10 text-[var(--orange)] border border-[var(--orange)]/30"
                        : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {trust.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
