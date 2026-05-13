"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  // Skip auth guard entirely in mock mode
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    return <>{children}</>;
  }

  return <AuthGuardInner>{children}</AuthGuardInner>;
};

const AuthGuardInner = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const { user, refreshToken, initialized } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);

  // Handle OAuth redirects that might land on protected pages
  useOAuthRedirect({
    autoRedirect: true,
    isCallbackHandler: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth store to be initialized
      if (!initialized) {
        return;
      }

      // If we already checked successfully, don't check again
      if (hasCheckedRef.current && user) {
        setIsChecking(false);
        return;
      }

      // If we have a user, validate the token
      if (user) {
        try {
          if (user.access_token) {
            const payload = JSON.parse(atob(user.access_token.split(".")[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = payload.exp - currentTime;

            // Only refresh if token expires in less than 5 minutes (300 seconds)
            if (timeUntilExpiry < 300) {
              const refreshSuccess = await refreshToken();
              if (!refreshSuccess) {
                router.push("/login?error=session_expired");
                return;
              }
            }
          }

          // Authentication successful
          hasCheckedRef.current = true;
          setIsChecking(false);
        } catch (error) {
          // Token parsing failed, try to refresh
          try {
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
              router.push("/login?error=session_expired");
              return;
            }
            hasCheckedRef.current = true;
            setIsChecking(false);
          } catch (refreshError) {
            router.push("/login?error=auth_error");
          }
        }
      } else {
        // No user found - only redirect after a reasonable wait
        // Give time for OAuth flows to complete
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            router.push("/login?error=session_expired");
          }
        }, 2000); // Wait 2 seconds before giving up
      }
    };

    checkAuth();
  }, [initialized, user, refreshToken, router]);

  // Reset check status when user changes (for re-authentication scenarios)
  useEffect(() => {
    if (user && !hasCheckedRef.current) {
      setIsChecking(true);
    }
  }, [user]);

  if (!initialized || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
