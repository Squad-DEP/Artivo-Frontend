"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { useMarketplaceStore } from "@/store/marketplaceStore";

interface SearchBarProps {
  debounceMs?: number;
  placeholder?: string;
}

export function SearchBar({
  debounceMs = 400,
  placeholder = "Search for electricians, plumbers, carpenters...",
}: SearchBarProps) {
  const { search, searchQuery, isLoading } = useMarketplaceStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        search(query);
      }, debounceMs);
    },
    [search, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setInputValue("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    search("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    search(inputValue);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search marketplace"
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-24 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--orange)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/20 shadow-sm"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--orange)] text-white text-sm font-medium hover:bg-[var(--orange-hover)] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Find
        </button>
      </div>
      {isLoading && (
        <div className="absolute left-12 top-1/2 -translate-y-1/2">
          <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--orange)]" />
        </div>
      )}
    </form>
  );
}
