import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const useLogin = () => {
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "session_expired":
          setUrlError("Your session has expired. Please sign in again.");
          break;
        case "auth_error":
          setUrlError(
            "An authentication error occurred. Please sign in again."
          );
          break;
        case "oauth_failed":
          setUrlError("OAuth authentication failed. Please try again.");
          break;
        case "session_error":
          setUrlError("Session error occurred. Please sign in again.");
          break;
        case "signed_out":
          setUrlError("You have been signed out. Please sign in again.");
          break;
        case "timeout":
          setUrlError("Authentication timeout. Please try signing in again.");
          break;
        default:
          setUrlError("Please sign in to continue.");
      }
    }
  }, [searchParams]);
};
