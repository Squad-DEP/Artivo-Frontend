"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useOAuthRedirect } from "../hooks/useOAuthRedirect";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialize = useAuthStore((state) => state.initialize);
  const cleanup = useAuthStore((state) => state.cleanup);

  // Handle OAuth redirects that might land on any page
  useOAuthRedirect({
    autoRedirect: true,
    isCallbackHandler: false,
  });

  useEffect(() => {
    initialize();

    // Cleanup function to run when component unmounts
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return <>{children}</>;
}
