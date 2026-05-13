import Link from "next/link";

export default function ArtisanNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Profile Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The artisan profile you&apos;re looking for doesn&apos;t exist. The
          username may have been changed or the profile may have been removed.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Please check the URL and try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/marketplace"
            className="px-5 py-2.5 rounded-lg bg-[var(--orange)] text-white font-medium hover:bg-[var(--orange)]/90 transition-colors"
          >
            Browse Artisans
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
