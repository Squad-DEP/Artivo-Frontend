import { useState, useCallback, useEffect, useRef } from "react";

// UseMutation and UseQuery are helper functions to make it easier to use the api
interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export const useMutation = <T, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { onSuccess, onError, maxRetries = 3, retryDelay = 1000 } = options;

  const mutateWithRetry = useCallback(
    async (variables: V, currentRetry = 0): Promise<T> => {
      try {
        const response = await mutationFn(variables);
        setRetryCount(0); // Reset retry count on success
        return response;
      } catch (err) {
        if (currentRetry < maxRetries) {
          const delay = retryDelay * Math.pow(2, currentRetry); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          return mutateWithRetry(variables, currentRetry + 1);
        }
        throw err;
      }
    },
    [mutationFn, maxRetries, retryDelay]
  );

  const mutate = useCallback(
    async (variables: V) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setRetryCount(0);

        const response = await mutateWithRetry(variables);
        setData(response);
        setSuccess(true);
        onSuccess?.(response, variables);
        return response;
      } catch (err) {
        let errorMessage = "An error occurred";

        if (err instanceof Error) {
          errorMessage = err.message;

          // Handle specific authentication errors
          if (
            err.message.includes("Authentication failed") ||
            err.message.includes("Session expired") ||
            err.message.includes("Invalid token")
          ) {
            errorMessage = "Your session has expired. Please sign in again.";
          }
        }

        setError(errorMessage);
        setRetryCount(maxRetries);
        onError?.(err as Error, variables);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutateWithRetry, onSuccess, onError, maxRetries]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setSuccess(false);
    setRetryCount(0);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    success,
    retryCount,
    reset,
  };
};

interface UseQueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  staleTime?: number; // Time in ms before data is considered stale
}

export const useQuery = <T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseQueryOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const {
    enabled = true,
    onSuccess,
    onError,
    maxRetries = 3,
    retryDelay = 1000,
    staleTime = 5 * 60 * 1000, // 5 minutes default
  } = options;

  // Use ref to store the query function to avoid infinite re-renders
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetchWithRetry = useCallback(
    async (currentRetry = 0): Promise<T> => {
      try {
        const response = await queryFnRef.current();
        setRetryCount(0); // Reset retry count on success
        return response;
      } catch (err) {
        if (currentRetry < maxRetries) {
          const delay = retryDelay * Math.pow(2, currentRetry); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(currentRetry + 1);
        }
        throw err;
      }
    },
    [maxRetries, retryDelay]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check if data is still fresh
    const now = Date.now();
    if (data && now - lastFetchTime < staleTime) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithRetry();
      setData(response);
      setLastFetchTime(now);
      onSuccess?.(response);
    } catch (err) {
      let errorMessage = "An error occurred";

      if (err instanceof Error) {
        errorMessage = err.message;

        // Handle specific authentication errors
        if (
          err.message.includes("Authentication failed") ||
          err.message.includes("Session expired") ||
          err.message.includes("Invalid token")
        ) {
          errorMessage = "Your session has expired. Please sign in again.";
        }
      }

      setError(errorMessage);
      setRetryCount(maxRetries);
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    fetchWithRetry,
    onSuccess,
    onError,
    maxRetries,
    lastFetchTime,
    staleTime,
  ]);

  // Use a stable reference for dependencies to prevent infinite re-renders
  const depsRef = useRef(dependencies);
  const depsChanged =
    JSON.stringify(depsRef.current) !== JSON.stringify(dependencies);

  useEffect(() => {
    if (depsChanged) {
      depsRef.current = dependencies;
      setLastFetchTime(0); // Reset stale time when dependencies change
      fetchData();
    } else if (lastFetchTime === 0) {
      // Initial fetch
      fetchData();
    }
  }, [fetchData, depsChanged, lastFetchTime]);

  const refetch = useCallback(() => {
    setLastFetchTime(0); // Force refetch by resetting stale time
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    retryCount,
    refetch,
  };
};
