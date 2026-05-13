"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
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
];

export function CategoryPills() {
  const [active, setActive] = useState("");
  const { setFilters, applyFilters } = useMarketplaceStore();

  const handleSelect = (slug: string) => {
    setActive(slug);
    setFilters({ category: slug || undefined });
    applyFilters();
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {QUICK_CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => handleSelect(cat.slug)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            active === cat.slug
              ? "bg-[var(--orange)] text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:border-[var(--orange)]/50 hover:text-[var(--orange)]"
          }`}
        >
          {cat.isAI && <Sparkles className="w-3.5 h-3.5" />}
          {cat.label}
        </button>
      ))}
    </div>
  );
}
