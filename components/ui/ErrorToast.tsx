"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "network" | "error" | "success" | "info";

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  duration?: number;
  variant?: ToastVariant;
  /** Optional secondary line shown below the message (e.g. transaction ref) */
  detail?: string;
}

const variantStyles: Record<ToastVariant, string> = {
  network: "bg-gray-900 border-gray-700 text-white",
  error: "bg-red-600 border-red-500 text-white",
  success: "bg-emerald-600 border-emerald-500 text-white",
  info: "bg-blue-600 border-blue-500 text-white",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success")
    return <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />;
  if (variant === "info")
    return <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />;
  return <WifiOff className="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden="true" />;
}

export function ErrorToast({
  message,
  visible,
  onDismiss,
  onRetry,
  duration = 5000,
  variant = "network",
  detail,
}: ToastProps) {
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
              "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border",
              variantStyles[variant]
            )}
          >
            <ToastIcon variant={variant} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{message}</p>
              {detail && (
                <p className="text-xs opacity-80 mt-0.5 truncate">{detail}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
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

// Backwards-compatible alias
export { ErrorToast as Toast };

// ---- Hook ----------------------------------------------------------------

interface ToastState {
  message: string;
  visible: boolean;
  onRetry?: () => void;
  variant?: ToastVariant;
  detail?: string;
}

export function useErrorToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    visible: false,
  });

  const showToast = useCallback(
    (
      message: string,
      options?: {
        onRetry?: () => void;
        variant?: ToastVariant;
        detail?: string;
      }
    ) => {
      setToast({
        message,
        visible: true,
        onRetry: options?.onRetry,
        variant: options?.variant,
        detail: options?.detail,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}

// Convenience alias
export { useErrorToast as useToast };
