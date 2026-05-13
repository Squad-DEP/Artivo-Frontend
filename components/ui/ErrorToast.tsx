"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorToastProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  duration?: number;
  variant?: "network" | "error";
}

export function ErrorToast({
  message,
  visible,
  onDismiss,
  onRetry,
  duration = 5000,
  variant = "network",
}: ErrorToastProps) {
  useEffect(() => {
    if (visible && duration > 0 && !onRetry) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss, onRetry]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
        >
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border",
              variant === "network"
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-red-600 border-red-500 text-white"
            )}
          >
            <WifiOff className="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden="true" />
            <p className="text-sm flex-1">{message}</p>
            <div className="flex items-center gap-1">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing toast state
export function useErrorToast() {
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    onRetry?: () => void;
    variant?: "network" | "error";
  }>({ message: "", visible: false });

  const showToast = useCallback(
    (
      message: string,
      options?: { onRetry?: () => void; variant?: "network" | "error" }
    ) => {
      setToast({
        message,
        visible: true,
        onRetry: options?.onRetry,
        variant: options?.variant,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
