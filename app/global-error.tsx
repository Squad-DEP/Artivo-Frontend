"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production instead of console
  }, [error]);

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <section className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-red-600 mb-2">
              Application Error
            </h1>

            <div className="mb-6 text-gray-600">
              <p>We're sorry, but a critical error has occurred.</p>
              <p className="mt-2">
                The application can't continue functioning properly.
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

            <button
              onClick={reset}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </section>
      </body>
    </html>
  );
}
