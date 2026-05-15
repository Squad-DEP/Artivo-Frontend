"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";
import Image from "next/image";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initialize, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Use the OAuth redirect hook to handle hash fragments
  useOAuthRedirect({
    isCallbackHandler: true,
    autoRedirect: false,
    onOAuthDetected: (hashParams) => {
      // Check for errors in hash params
      if (hashParams.has("error")) {
        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");
        setError(
          hashErrorDescription || hashError || "OAuth authentication failed"
        );
        setIsProcessing(false);
        timeoutRef.current = setTimeout(() => {
          router.push("/login?error=oauth_failed");
        }, 2000);
      }
    },
  });

  // Watch for user state changes and redirect when authenticated
  useEffect(() => {
    if (user && !error) {
      // User is authenticated, redirect to dashboard
      timeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        router.push("/dashboard");
      }, 500);
    }
  }, [user, error, router]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params first
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          setIsProcessing(false);
          timeoutRef.current = setTimeout(() => {
            router.push("/login?error=oauth_failed");
          }, 2000);
          return;
        }

        // Initialize auth store first
        initialize();

        // Get the current session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setIsProcessing(false);
          timeoutRef.current = setTimeout(() => {
            router.push("/login?error=session_error");
          }, 2000);
          return;
        }

        if (sessionData.session) {
          // Session exists - the auth store should update automatically via onAuthStateChange
          // The user effect above will handle the redirect once the store is updated
          if (searchParams.get("type") === "recovery") {
            timeoutRef.current = setTimeout(() => {
              setIsProcessing(false);
              router.push("/forgot-password?step=reset");
            }, 1000);
          }
          // For regular sign in, the user effect will handle the redirect when store updates
        } else {
          // No session found, wait for auth state change
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session) {
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
              // The auth store will update and trigger the user effect above
            } else if (event === "PASSWORD_RECOVERY" && session) {
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }

              timeoutRef.current = setTimeout(() => {
                setIsProcessing(false);
                router.push("/forgot-password?step=reset");
              }, 1000);
            } else if (event === "SIGNED_OUT") {
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
              setError("Authentication failed");
              setIsProcessing(false);
              timeoutRef.current = setTimeout(() => {
                router.push("/login?error=signed_out");
              }, 2000);
            }
          });

          subscriptionRef.current = subscription;

          // Set a timeout to prevent infinite waiting
          timeoutRef.current = setTimeout(() => {
            if (subscriptionRef.current) {
              subscriptionRef.current.unsubscribe();
              subscriptionRef.current = null;
            }
            if (isProcessing) {
              setError("Authentication timeout");
              setIsProcessing(false);
              setTimeout(() => {
                router.push("/login?error=timeout");
              }, 2000);
            }
          }, 10000);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError("An unexpected error occurred");
        setIsProcessing(false);
        timeoutRef.current = setTimeout(() => {
          router.push("/login?error=callback_error");
        }, 2000);
      }
    };

    handleAuthCallback();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [searchParams, router, initialize, isProcessing]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo_primary.svg"
            alt="Artivo"
            width={64}
            height={64}
            priority
          />
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the login page...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Authentication
            </h1>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--orange)]"></div>
            </div>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
