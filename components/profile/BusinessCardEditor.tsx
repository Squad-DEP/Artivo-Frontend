"use client";

import { useState, useRef, useCallback } from "react";
import { Copy, Check, Download, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/api/api-service";
import { useAuthStore } from "@/store/authStore";

/** Color theme presets for the business card */
const THEMES = {
  professional: {
    label: "Professional",
    bg: "bg-slate-900",
    text: "text-white",
    accent: "text-blue-400",
    border: "border-slate-700",
    secondaryText: "text-slate-300",
  },
  creative: {
    label: "Creative",
    bg: "bg-gradient-to-br from-purple-600 to-pink-500",
    text: "text-white",
    accent: "text-yellow-300",
    border: "border-purple-400",
    secondaryText: "text-purple-100",
  },
  minimal: {
    label: "Minimal",
    bg: "bg-white",
    text: "text-gray-900",
    accent: "text-emerald-600",
    border: "border-gray-200",
    secondaryText: "text-gray-500",
  },
  bold: {
    label: "Bold",
    bg: "bg-orange-500",
    text: "text-white",
    accent: "text-yellow-200",
    border: "border-orange-300",
    secondaryText: "text-orange-100",
  },
} as const;

type ThemeKey = keyof typeof THEMES;
type LayoutVariant = "horizontal" | "vertical";

interface BusinessCardEditorProps {
  name: string;
  primarySkill: string;
  rating: number;
  tagline?: string | null;
  phone?: string | null;
  location?: string | null;
  profileUrl: string;
  username: string;
}

/**
 * BusinessCardEditor — Customizable digital business card with theme and layout options.
 * Allows artisans to create, customize, share, and download their business card.
 *
 * Validates: Requirements 14.1, 14.2, 14.3
 */
export function BusinessCardEditor({
  name,
  primarySkill,
  rating,
  tagline,
  phone,
  location,
  profileUrl,
  username,
}: BusinessCardEditorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("professional");
  const [layout, setLayout] = useState<LayoutVariant>("horizontal");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[selectedTheme];

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [profileUrl]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const token = useAuthStore.getState().user?.access_token;

      const response = await fetch(`${baseUrl}/v1/artisan/identity-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          artisan_name: name,
          trade: primarySkill,
          location: location || "N/A",
          contact: phone || profileUrl,
          tagline: tagline || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${username}-business-card.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Business card download failed:", err);
      alert("Failed to download business card. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [username, name, primarySkill, tagline, phone, location, profileUrl]);

  const renderStars = (value: number) => {
    const fullStars = Math.floor(value);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < fullStars ? theme.accent : "text-gray-400/40"
          )}
          fill={i < fullStars ? "currentColor" : "none"}
        />
      );
    }
    return stars;
  };

  return (
    <div className="space-y-6 sm:flex gap-6">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className={cn(
          "max-sm:w-full aspect-[380/220] sm:w-[380px] rounded-xl border p-6 shadow-lg transition-all duration-300",
          theme.bg,
          theme.border,
          layout === "horizontal"
            ? "flex items-center gap-6"
            : "flex flex-col items-center text-center"
        )}
      >
        {/* Avatar placeholder */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-lg shrink-0",
            layout === "horizontal" ? "w-16 h-16" : "w-20 h-20",
            selectedTheme === "minimal"
              ? "bg-gray-100 text-gray-700"
              : "bg-white/20 text-white"
          )}
        >
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        {/* Card content */}
        <div
          className={cn(
            "flex flex-col gap-1",
            layout === "vertical" && "items-center mt-3"
          )}
        >
          <h3 className={cn("font-semibold text-lg", theme.text)}>{name}</h3>
          <p className={cn("text-sm font-medium", theme.accent)}>
            {primarySkill}
          </p>

          {tagline && (
            <p className={cn("text-xs italic mt-0.5", theme.secondaryText)}>
              "{tagline}"
            </p>
          )}

          <div className="flex items-center gap-1 mt-1">
            {renderStars(rating)}
            <span className={cn("text-xs ml-1", theme.secondaryText)}>
              {rating.toFixed(1)}
            </span>
          </div>

          <div className={cn("flex flex-col gap-0.5 mt-1.5 text-xs", theme.secondaryText)}>
            {phone && <span>📞 {phone}</span>}
            {location && <span>📍 {location}</span>}
            <span className="opacity-70">{profileUrl}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Color Theme
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedTheme(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                  selectedTheme === key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}
              >
                {THEMES[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Layout</label>
          <div className="flex gap-2">
            <button
              onClick={() => setLayout("horizontal")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                layout === "horizontal"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              Horizontal
            </button>
            {/* <button
              onClick={() => setLayout("vertical")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                layout === "vertical"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              Vertical
            </button> */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleShare} className="gap-2">
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Link Copied!" : "Share Link"}
          </Button>
          <Button variant="default" onClick={handleDownload} disabled={downloading} className="gap-2">
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? "Downloading..." : "Download Card"}
          </Button>
        </div>
      </div>
    </div>
  );
}
