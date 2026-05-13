"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string;
  description?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "error" | "warning";
  className?: string;
  autoDismiss?: number;
}

export function ErrorBanner({
  message,
  description,
  onDismiss,
  onRetry,
  retryLabel = "Retry",
  variant = "error",
  className,
  autoDismiss,
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const variantStyles = {
    error: {
      container: "bg-red-50 border-red-200",
      icon: "text-red-600",
      title: "text-red-900",
      description: "text-red-700",
    },
    warning: {
      container: "bg-amber-50 border-amber-200",
      icon: "text-amber-600",
      title: "text-amber-900",
      description: "text-amber-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
          className={cn(
            "rounded-xl border p-4",
            styles.container,
            className
          )}
        >
          <div className="flex gap-3">
            <AlertCircle
              className={cn("w-5 h-5 flex-shrink-0 mt-0.5", styles.icon)}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", styles.title)}>
                {message}
              </p>
              {description && (
                <p className={cn("text-sm mt-1", styles.description)}>
                  {description}
                </p>
              )}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium mt-2 px-3 py-1.5 rounded-md border transition-colors",
                    variant === "error"
                      ? "border-red-200 text-red-700 hover:bg-red-100"
                      : "border-amber-200 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {retryLabel}
                </button>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={cn(
                  "flex-shrink-0 p-1 rounded-md transition-colors",
                  variant === "error"
                    ? "text-red-500 hover:bg-red-100"
                    : "text-amber-500 hover:bg-amber-100"
                )}
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
