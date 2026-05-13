"use client";

import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/constants/categories";

interface CategorySelectorProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  maxCategories?: number;
  disabled?: boolean;
}

const MAX_CATEGORIES_DEFAULT = 5;

export function CategorySelector({
  selected,
  onChange,
  maxCategories = MAX_CATEGORIES_DEFAULT,
  disabled = false,
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return SERVICE_CATEGORIES.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.description.toLowerCase().includes(query) ||
        cat.subcategories.some((sub) => sub.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const isAtLimit = selected.length >= maxCategories;

  const toggleCategory = (categoryId: string) => {
    if (disabled) return;

    if (selected.includes(categoryId)) {
      onChange(selected.filter((id) => id !== categoryId));
    } else if (!isAtLimit) {
      onChange([...selected, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    if (disabled) return;
    onChange(selected.filter((id) => id !== categoryId));
  };

  const getCategoryName = (categoryId: string): string => {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.name ?? categoryId;
  };

  return (
    <div className="w-full space-y-3">
      {/* Selected categories chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((categoryId) => (
            <span
              key={categoryId}
              className="inline-flex items-center gap-1 rounded-full bg-[#FF6200]/10 px-3 py-1.5 text-sm font-medium text-[#FF6200]"
            >
              {getCategoryName(categoryId)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeCategory(categoryId)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-[#FF6200]/20 transition-colors"
                  aria-label={`Remove ${getCategoryName(categoryId)}`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Selection count */}
      <p className="text-sm text-gray-500">
        {selected.length} of {maxCategories} categories selected
      </p>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-[#E4E4E4] bg-[#FBFBFB] py-3 pl-10 pr-4 text-sm placeholder:text-[#B4B4B4] outline-none transition-all",
            "focus:border-[#FF6200] focus:ring-[3px] focus:ring-[#FF6200]/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Search service categories"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category list */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-[#E4E4E4] bg-white">
        {filteredCategories.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">
            No categories found for &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          <ul role="listbox" aria-label="Service categories" className="divide-y divide-gray-100">
            {filteredCategories.map((category) => {
              const isSelected = selected.includes(category.id);
              const isDisabledItem = !isSelected && isAtLimit;

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={disabled || isDisabledItem}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-[#FF6200]/5"
                        : "hover:bg-gray-50",
                      (disabled || isDisabledItem) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-[#FF6200] bg-[#FF6200] text-white"
                          : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{category.name}</p>
                      <p className="truncate text-xs text-gray-500">{category.description}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <p className="text-xs text-amber-600" role="alert">
          Maximum of {maxCategories} categories reached. Remove one to add another.
        </p>
      )}
    </div>
  );
}
