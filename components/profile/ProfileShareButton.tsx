"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileShareButtonProps {
  username: string;
  workerName: string;
  className?: string;
}

/**
 * ProfileShareButton — Copy profile URL and social share options.
 * Displays a dropdown with copy-link and social sharing buttons.
 *
 * Validates: Requirements 3.5
 */
export function ProfileShareButton({
  username,
  workerName,
  className,
}: ProfileShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/artisan/${username}`
      : `/artisan/${username}`;

  const shareText = `Check out ${workerName} on Artivo`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
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
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className ?? ""}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share profile"
        aria-expanded={isOpen}
      >
        <Share2 className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
            <span>{copied ? "Link copied!" : "Copy profile link"}</span>
          </button>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Twitter className="w-4 h-4 text-gray-400" />
            <span>Share on X</span>
          </button>

          <button
            onClick={handleShareFacebook}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-4 h-4 text-gray-400" />
            <span>Share on Facebook</span>
          </button>

          <button
            onClick={handleShareLinkedIn}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Linkedin className="w-4 h-4 text-gray-400" />
            <span>Share on LinkedIn</span>
          </button>
        </div>
      )}
    </div>
  );
}
