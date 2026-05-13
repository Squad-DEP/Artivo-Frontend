"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production instead of console
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Something went wrong
          </h1>

          <div className="mb-6 text-gray-600">
            <p>
              We apologize for the inconvenience. An unexpected error has
              occurred.
            </p>
            {error.digest && (
              <p className="mt-2 text-sm text-gray-500">
                Error ID:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  {error.digest}
                </code>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
