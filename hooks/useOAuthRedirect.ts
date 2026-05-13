import { useEffect } from "react";

interface UseOAuthRedirectOptions {
  /** Whether to automatically redirect to callback page when OAuth tokens are detected */
  autoRedirect?: boolean;
  /** Whether this component should handle the OAuth redirect (like the callback page) */
  isCallbackHandler?: boolean;
  /** Custom callback when OAuth tokens are detected */
  onOAuthDetected?: (hashParams: URLSearchParams) => void;
}

/**
 * Custom hook to detect and handle OAuth redirects with hash fragments
 * Centralizes the logic for detecting OAuth tokens in URL hash fragments
 */
export const useOAuthRedirect = (options: UseOAuthRedirectOptions = {}) => {
  const {
    autoRedirect = true,
    isCallbackHandler = false,
    onOAuthDetected,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hashString = window.location.hash.substring(1);
    if (!hashString) return;

    const hashParams = new URLSearchParams(hashString);

    // Check if this looks like an OAuth callback
    const hasOAuthTokens =
      hashParams.has("access_token") ||
      hashParams.has("refresh_token") ||
      hashParams.has("provider_token");

    const hasOAuthError = hashParams.has("error");

    if (hasOAuthTokens || hasOAuthError) {
      // Call custom callback if provided
      onOAuthDetected?.(hashParams);

      // Auto-redirect to callback page if not already there and autoRedirect is enabled
      if (
        autoRedirect &&
        !isCallbackHandler &&
        !window.location.pathname.includes("/callback")
      ) {
        window.location.href = `/callback${window.location.hash}`;
        return;
      }

      // Clean up hash from URL for better UX (only if we're handling the callback)
      if (isCallbackHandler && (hasOAuthTokens || hasOAuthError)) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    }
  }, [autoRedirect, isCallbackHandler, onOAuthDetected]);

  // Utility function to check if current URL has OAuth tokens
  const hasOAuthTokensInHash = () => {
    if (typeof window === "undefined") return false;

    const hashString = window.location.hash.substring(1);
    if (!hashString) return false;

    const hashParams = new URLSearchParams(hashString);
    return (
      hashParams.has("access_token") ||
      hashParams.has("refresh_token") ||
      hashParams.has("provider_token")
    );
  };

  // Utility function to get OAuth params from hash
  const getOAuthParamsFromHash = () => {
    if (typeof window === "undefined") return null;

    const hashString = window.location.hash.substring(1);
    if (!hashString) return null;

    return new URLSearchParams(hashString);
  };

  return {
    hasOAuthTokensInHash,
    getOAuthParamsFromHash,
  };
};
